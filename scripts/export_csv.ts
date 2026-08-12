import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { BASELINE_SCENARIO } from '../src/store/useStore.ts';
import { getCumulativeDeployed, getDeploymentSchedule } from '../src/BUSINESS_LOGIC.ts';

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

// Helper para redondear a entero
const fmt = (v: number) => Math.round(v);

let csv = "Año;SM Instalados;SM Acumulados;Avance %;";
csv += "CAPEX IT y PM;CAPEX Hardware (Medidor+Comms);CAPEX Instalacion y Logistica;CAPEX Infraestructura (Nodos);CAPEX TOTAL;";
csv += "OPEX Mantenimiento IT;OPEX Licencias SaaS;OPEX Soporte/Admin;OPEX Telecomunicaciones;OPEX Cloud;OPEX TOTAL;";
csv += "BENEFICIO Lecturas Evitadas;BENEFICIO Cortes y Reposiciones;BENEFICIO Visitas Improductivas;BENEFICIO Multas SAIDI;BENEFICIO Multas Apartamiento;BENEFICIO Call Center/Comercial;BENEFICIO Recupero Fraude;BENEFICIOS TOTALES;";
csv += "FLUJO DE CAJA NETO\n";

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
  const totalCapex = capexIT + capexHW + capexInstall + capexInfra;

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
  const totalOpex = opexMaint + opexSaaS + opexAdmin + opexTelecom + opexCloud;

  // BENEFITS
  let benLecturas = 0, benCortes = 0, benVisitas = 0, benSaidi = 0, benApartamiento = 0, benCallCenter = 0, benFraude = 0;
  if (y >= 1) {
    benLecturas = benefits.manualReadsVolume * benefits.manualReadUnitCost * progress;
    benCortes = (benefits.annualCutsVolume + benefits.annualReposVolume) * benefits.dispatchCost * progress;
    benVisitas = (benefits.unproductiveVisitsAvoided + benefits.reiterativeVisitsAvoided + benefits.qualityVisitsAvoided) * benefits.guardDispatchCost * progress;
    benSaidi = benefits.saidiHistoricalMinutes * (benefits.saidiTargetReduction / 100) * benefits.finePerMinute * progress + (benefits.estFinesAnnual * (benefits.saidiTargetReduction / 100) * progress);
    benApartamiento = benefits.apartamientoFineAnnual * (benefits.apartamientoFineImprovement / 100) * progress;
    benCallCenter = (benefits.inboundCallVolume + benefits.billingClaimsVolume) * benefits.callCenterUnitCost * progress;
    benFraude = benefits.nonTechLossesGwh * (benefits.recoveryRateTarget / 100) * benefits.energyWholesaleCost * progress;
  }
  const totalBenefits = benLecturas + benCortes + benVisitas + benSaidi + benApartamiento + benCallCenter + benFraude;

  // CASHFLOW
  const netCashFlow = totalBenefits - totalCapex - totalOpex;

  // Write Row
  csv += `${y};${fmt(metersThisYear)};${fmt(activeMeters)};${(progress*100).toFixed(1)}%;`;
  csv += `${fmt(capexIT)};${fmt(capexHW)};${fmt(capexInstall)};${fmt(capexInfra)};${fmt(totalCapex)};`;
  csv += `${fmt(opexMaint)};${fmt(opexSaaS)};${fmt(opexAdmin)};${fmt(opexTelecom)};${fmt(opexCloud)};${fmt(totalOpex)};`;
  csv += `${fmt(benLecturas)};${fmt(benCortes)};${fmt(benVisitas)};${fmt(benSaidi)};${fmt(benApartamiento)};${fmt(benCallCenter)};${fmt(benFraude)};${fmt(totalBenefits)};`;
  csv += `${fmt(netCashFlow)}\n`;
}

const csvPath = 'C:\\Users\\florg\\Desktop\\Antigravity\\SmartMeter\\ami-simulator\\Flujo_Caja_Baseline_Desagregado_10A.csv';
fs.writeFileSync(csvPath, csv, 'utf8');
console.log('CSV generado en: ' + csvPath);
