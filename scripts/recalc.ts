import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { BASELINE_SCENARIO } from '../src/store/useStore.ts';
import { generateProjection, getCumulativeDeployed, getDeploymentSchedule, calculateVadRevenueIT, calculateVadRevenueMeters } from '../src/BUSINESS_LOGIC.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const scenario = JSON.parse(JSON.stringify(BASELINE_SCENARIO));
scenario.global.analysisHorizonYears = 10;
scenario.global.deploymentCurve = 'linear';

const horizon = scenario.global.analysisHorizonYears;
const global = scenario.global;
const capex = scenario.capex;
const opex = scenario.opex;
const benefits = scenario.benefits;

const schedule = getDeploymentSchedule(scenario);
const cumulative = getCumulativeDeployed(scenario);
const projection = generateProjection(scenario);

const fmt = (v: number) => Math.round(v);

let csv = "Año;SM Instalados;SM Acumulados;Avance %;";
csv += "CAPEX IT y PM;CAPEX Hardware (Medidor+Comms);CAPEX Instalacion y Logistica;CAPEX Infraestructura (Nodos);CAPEX TOTAL;";
csv += "OPEX Mantenimiento IT;OPEX Licencias SaaS;OPEX Soporte/Admin;OPEX Telecomunicaciones;OPEX Cloud;OPEX TOTAL;";
csv += "BENEFICIO Lecturas Evitadas;BENEFICIO Cortes y Reposiciones;BENEFICIO Visitas Improductivas;BENEFICIO Multas SAIDI;BENEFICIO Multas por Estimacion;BENEFICIO Multas Apartamiento y Calidad;BENEFICIO Resarcimiento Artefactos;BENEFICIO Call Center/Comercial;BENEFICIO Recupero Fraude;BENEFICIOS TOTALES;";
csv += "INGRESOS VAD (Tarifa);FLUJO DE CAJA NETO\n";

const wiSunPct = global.wiSunPct;
const plcPct = global.plcPct;
const p2pPct = Math.max(0, 100 - wiSunPct - plcPct);

const t2t3Pct = global.t2t3Pct ?? 0;
const t1Pct = Math.max(0, 100 - t2t3Pct);
const weightedMeterCost = (t1Pct / 100) * capex.meterCostT1 + (t2t3Pct / 100) * capex.meterCostT2T3;
const weightedCommsCost = (wiSunPct / 100) * capex.commsCostWiSun + (plcPct / 100) * capex.commsCostPLC + (p2pPct / 100) * capex.commsCostP2P;
const hwCostPerMeter = weightedMeterCost + weightedCommsCost;
const installLogisticsCostPerMeter = capex.installCost + (capex.logisticsCostPerEndpoint ?? 0);

for (let y = 0; y <= horizon; y++) {
  const metersThisYear = schedule[y] || 0;
  const activeMeters = cumulative[y] || 0;
  const progress = global.totalEndpoints > 0 ? Math.min(1, activeMeters / global.totalEndpoints) : 0;

  // CAPEX
  const itSchedulePcts = [capex.itScheduleY0 ?? 100, capex.itScheduleY1 ?? 0, capex.itScheduleY2 ?? 0, capex.itScheduleY3 ?? 0, capex.itScheduleY4 ?? 0, capex.itScheduleY5 ?? 0];
  const itCostThisYear = (y >= 0 && y <= 5) ? ((itSchedulePcts[y] ?? 0) / 100) * capex.itIntegrationCost : 0;
  const capexIT = itCostThisYear + (y === 0 ? capex.pmCost : 0);
  
  const capexHW = metersThisYear * hwCostPerMeter;
  const capexInstall = metersThisYear * installLogisticsCostPerMeter;
  const plcMeters = metersThisYear * (plcPct / 100);
  const wiSunMeters = metersThisYear * (wiSunPct / 100);
  const capexInfra = (plcMeters / 250) * capex.concentratorCostPLC + (wiSunMeters / 5000) * capex.focalPointCostWiSun;
  const totalCapex = projection[y].capex; // using exact from logic

  // OPEX
  let opexMaint = 0, opexSaaS = 0, opexAdmin = 0, opexTelecom = 0, opexCloud = 0;
  if (y >= 1) {
    opexMaint = opex.maintenanceAnnual;
    opexSaaS = opex.saasAnnual;
    opexAdmin = opex.adminAnnual;
    const p2pActiveMeters = activeMeters * (p2pPct / 100);
    opexTelecom = p2pActiveMeters * opex.telecomMonthly * 12;
    opexCloud = opex.cloudMonthly * 12; // Base cloud
  }
  const totalOpex = projection[y].opex; // exact from logic

  // BENEFITS
  let benLecturas = 0, benCortes = 0, benVisitas = 0, benSaidi = 0, benEstimacion = 0, benCalidad = 0, benArtefactos = 0, benCallCenter = 0, benFraude = 0;
  if (y >= 1) {
    benLecturas = benefits.manualReadsVolume * benefits.manualReadUnitCost * progress;
    benCortes = (benefits.annualCutsVolume + benefits.annualReposVolume) * benefits.dispatchCost * progress;
    benVisitas = (benefits.unproductiveVisitsAvoided + benefits.reiterativeVisitsAvoided + benefits.qualityVisitsAvoided) * benefits.guardDispatchCost * progress;
    benSaidi = benefits.saidiHistoricalMinutes * (benefits.saidiTargetReduction / 100) * benefits.finePerMinute * progress;
    benEstimacion = benefits.estFinesAnnual * progress;
    benCalidad = (benefits.apartamientoFineAnnual * (benefits.apartamientoFineImprovement / 100) + benefits.nonComplianceFineAnnual * (benefits.nonComplianceFineImprovement / 100)) * progress;
    benArtefactos = (benefits.deviceDamageClaims * (benefits.deviceDamageAvoidance / 100)) * progress;
    benCallCenter = (benefits.inboundCallVolume + benefits.billingClaimsVolume) * benefits.callCenterUnitCost * progress;
    const revenuePerGwh = benefits.currentTariff - benefits.energyWholesaleCost;
    benFraude = benefits.nonTechLossesGwh * (benefits.recoveryRateTarget / 100) * Math.max(0, revenuePerGwh) * progress;
  }
  const totalBenefits = projection[y].benefits; // exact from logic

  // VAD
  const vadRevenue = projection[y].vadRevenue; // exact from logic

  // CASHFLOW
  const netCashFlow = projection[y].netCashFlow; // exact from logic

  // Write Row
  csv += `${y};${fmt(metersThisYear)};${fmt(activeMeters)};${(progress*100).toFixed(1)}%;`;
  csv += `${fmt(capexIT)};${fmt(capexHW)};${fmt(capexInstall)};${fmt(capexInfra)};${fmt(totalCapex)};`;
  csv += `${fmt(opexMaint)};${fmt(opexSaaS)};${fmt(opexAdmin)};${fmt(opexTelecom)};${fmt(opexCloud)};${fmt(totalOpex)};`;
  csv += `${fmt(benLecturas)};${fmt(benCortes)};${fmt(benVisitas)};${fmt(benSaidi)};${fmt(benEstimacion)};${fmt(benCalidad)};${fmt(benArtefactos)};${fmt(benCallCenter)};${fmt(benFraude)};${fmt(totalBenefits)};`;
  csv += `${fmt(vadRevenue)};${fmt(netCashFlow)}\n`;
}

const csvPath = 'C:\\Users\\florg\\Desktop\\Antigravity\\SmartMeter\\ami-simulator\\Flujo_Caja_Baseline_Desagregado_10A.csv';
fs.writeFileSync(csvPath, csv, 'utf8');
console.log('CSV generado.');

// ---- UPDATE MARKDOWN ----

let md = '## 6. Proyección de Flujos de Caja a 10 Años (Despliegue Lineal)\n\n';
md += 'A continuación se presenta el flujo de caja anualizado asumiendo un despliegue puramente lineal durante todo el horizonte de 10 años. Las cantidades acumuladas de medidores (SM) determinan el impacto en el CAPEX, OPEX, Beneficios e Ingresos por VAD año a año.\n\n';
md += '| Año | SM Instalados Año | SM Acumulados | Avance (%) | CAPEX Total | OPEX Total | Beneficios Totales | Ingresos VAD | Flujo Neto (Flujo de Caja) | VPN Acumulado |\n';
md += '|:---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|\n';

const fmtMd = (v: number) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(v);
const fmtNumMd = (v: number) => new Intl.NumberFormat('es-AR', { maximumFractionDigits: 0 }).format(v);
const fmtPctMd = (v: number) => (v * 100).toFixed(1) + '%';

projection.forEach(p => {
  md += `| ${p.year} | ${fmtNumMd(p.installations || 0)} | ${fmtNumMd(p.cumulative || 0)} | ${fmtPctMd(p.progress || 0)} | ${fmtMd(p.capex)} | ${fmtMd(p.opex)} | ${fmtMd(p.benefits)} | ${fmtMd(p.vadRevenue)} | ${fmtMd(p.netCashFlow)} | ${fmtMd(p.cumulativeNPV)} |\n`;
});

const mdPath = 'C:\\Users\\florg\\.gemini\\antigravity\\brain\\c7b18535-dbb0-4187-92a5-c32a34a9e77e\\memoria_calculo_baseline.md';
let fileContent = fs.readFileSync(mdPath, 'utf8');
fileContent = fileContent.replace(/## 6\. Proyección de Flujos de Caja a 10 Años \(Despliegue Lineal\)[\s\S]*$/, md);
fs.writeFileSync(mdPath, fileContent);
console.log('Markdown actualizado.');
