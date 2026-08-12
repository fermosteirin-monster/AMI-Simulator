import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { Scenario } from '../DATA_MODEL';
import { getDeploymentSchedule, getCumulativeDeployed, deriveP2pPct, generateProjection } from '../BUSINESS_LOGIC';

export async function exportFlujoFondosExcel(scenario: Scenario) {
  const { global, capex, opex, benefits } = scenario;
  const horizon = global.analysisHorizonYears;
  const deployHorizon = global.deploymentHorizonYears ?? 10;
  const schedule = getDeploymentSchedule(scenario);
  const cumulative = getCumulativeDeployed(scenario);
  const projection = generateProjection(scenario);

  const { wiSunPct, plcPct, t2t3Pct = 0 } = global;
  const p2pPct = deriveP2pPct(wiSunPct, plcPct);
  const t1Pct = Math.max(0, 100 - t2t3Pct);

  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('Flujo de Fondos');

  // Definir columnas
  ws.columns = [
    { header: 'Año', key: 'year', width: 8 },
    { header: 'SM Instalados', key: 'smInstalled', width: 15 },
    { header: 'SM Acumulados', key: 'smCumulative', width: 15 },
    { header: 'Avance %', key: 'progress', width: 12 },
    { header: 'CAPEX IT y PM', key: 'capexITPM', width: 18 },
    { header: 'CAPEX Hardware (Medidor+Comms)', key: 'capexHW', width: 32 },
    { header: 'CAPEX Instalacion y Logistica', key: 'capexInstall', width: 30 },
    { header: 'CAPEX Infraestructura (Nodos)', key: 'capexInfra', width: 30 },
    { header: 'CAPEX TOTAL', key: 'capexTotal', width: 18 },
    { header: 'OPEX Project Management', key: 'opexPM', width: 25 },
    { header: 'OPEX Mantenimiento Red', key: 'opexMaint', width: 25 },
    { header: 'OPEX Licencias SaaS', key: 'opexSaas', width: 22 },
    { header: 'OPEX Soporte/Admin', key: 'opexAdmin', width: 22 },
    { header: 'OPEX Telecomunicaciones', key: 'opexTelecom', width: 25 },
    { header: 'OPEX Cloud', key: 'opexCloud', width: 15 },
    { header: 'OPEX TOTAL', key: 'opexTotal', width: 15 },
    { header: 'BENEFICIO Lecturas Evitadas', key: 'benReads', width: 28 },
    { header: 'BENEFICIO Cortes y Reposiciones', key: 'benCuts', width: 32 },
    { header: 'BENEFICIO Visitas Improductivas', key: 'benGuard', width: 32 },
    { header: 'BENEFICIO Multas SAIDI', key: 'benSaidi', width: 25 },
    { header: 'BENEFICIO Multas por Estimacion', key: 'benEstFines', width: 30 },
    { header: 'BENEFICIO Multas Apartamiento y Calidad', key: 'benApart', width: 38 },
    { header: 'BENEFICIO Multas Incumplimiento', key: 'benNonComp', width: 35 },
    { header: 'BENEFICIO Recupero Fraude', key: 'benFraud', width: 28 },
    { header: 'BENEFICIOS TOTALES', key: 'benTotal', width: 22 },
    { header: 'INGRESOS VAD (Tarifa)', key: 'vad', width: 25 },
    { header: 'BASE IMPONIBLE', key: 'taxableBase', width: 22 },
    { header: 'IMPUESTO A LAS GANANCIAS', key: 'incomeTax', width: 25 },
    { header: 'FLUJO DE CAJA NETO', key: 'fcf', width: 22 }
  ];

  // Estilo cabecera
  ws.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
  ws.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F2937' } };
  ws.getRow(1).alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };

  for (let year = 0; year <= horizon; year++) {
    const metersThisYear = schedule[year] || 0;
    const cumMeters = cumulative[year] || 0;
    const progress = global.totalEndpoints > 0 ? cumMeters / global.totalEndpoints : 0;
    
    // --- CAPEX ---
    let capexIT = 0;
    if (year >= 0 && year <= 5) {
      const itSchedule = [capex.itScheduleY0 ?? 100, capex.itScheduleY1 ?? 0, capex.itScheduleY2 ?? 0, capex.itScheduleY3 ?? 0, capex.itScheduleY4 ?? 0, capex.itScheduleY5 ?? 0];
      const pct = itSchedule[year] ?? 0;
      capexIT = (pct / 100) * capex.itIntegrationCost;
    }

    let capexHW = 0;
    let capexInstall = 0;
    let capexInfra = 0;
    if (metersThisYear > 0) {
      const wMeterCost = (t1Pct / 100) * capex.meterCostT1 + (t2t3Pct / 100) * capex.meterCostT2T3;
      const wCommsCost = (wiSunPct / 100) * capex.commsCostWiSun + (plcPct / 100) * capex.commsCostPLC + (p2pPct / 100) * capex.commsCostP2P;
      capexHW = metersThisYear * (wMeterCost + wCommsCost);
      capexInstall = metersThisYear * capex.installCost;
      
      const plcMeters = metersThisYear * (plcPct / 100);
      capexInfra += (plcMeters / 250) * capex.concentratorCostPLC;
      
      const wiSunMeters = metersThisYear * (wiSunPct / 100);
      capexInfra += (wiSunMeters / 5000) * capex.focalPointCostWiSun;
    }

    const capexTotal = capexIT + capexHW + capexInstall + capexInfra;

    // --- OPEX ---
    const pmPerYear = (opex.pmCost ?? 0) > 0 && deployHorizon > 0 ? (opex.pmCost ?? 0) / deployHorizon : 0;
    const opexPM = (pmPerYear > 0 && year < deployHorizon) ? pmPerYear : 0;

    let opexMaint = 0, opexSaas = 0, opexAdmin = 0, opexTelecom = 0, opexCloud = 0;
    if (year > 0) {
      const p2pMetersCumulative = cumMeters * (p2pPct / 100);
      opexTelecom = p2pMetersCumulative * opex.telecomMonthly * 12;
      opexSaas = opex.saasAnnual * (year / horizon);
      opexMaint = opex.maintenanceAnnual * progress;
      opexCloud = opex.cloudMonthly * 12 * progress;
      opexAdmin = opex.adminAnnual * progress;
    }
    const opexTotal = opexPM + opexMaint + opexSaas + opexAdmin + opexTelecom + opexCloud;

    // --- BENEFICIOS ---
    let benReads = 0, benCuts = 0, benGuard = 0, benSaidi = 0, benEstFines = 0, benApart = 0, benNonComp = 0, benFraud = 0;
    if (year > 0) {
      benReads = (benefits.manualReadsVolume * benefits.manualReadUnitCost) * progress;
      benCuts = (benefits.annualCutsVolume * benefits.dispatchCost) * progress;
      benGuard = (benefits.annualReposVolume * benefits.guardDispatchCost) * progress;
      benSaidi = (benefits.saidiHistoricalMinutes * (benefits.saidiTargetReduction / 100) * benefits.finePerMinute) * progress;
      benEstFines = benefits.estFinesAnnual * progress;
      benApart = benefits.apartamientoFineAnnual * (benefits.apartamientoFineImprovement / 100) * progress;
      benNonComp = benefits.nonComplianceFineAnnual * (benefits.nonComplianceFineImprovement / 100) * progress;
      benFraud = (benefits.nonTechLossesGwh * (benefits.recoveryRateTarget / 100) * (benefits.currentTariff - benefits.energyWholesaleCost)) * progress;
    }
    const benTotal = benReads + benCuts + benGuard + benSaidi + benEstFines + benApart + benNonComp + benFraud;

    // --- RESULTADOS ---
    const projYear = projection.find(p => p.year === year);
    const vad = projYear?.vadRevenue || 0;
    const taxableBase = projYear?.taxableBase || 0;
    const incomeTax = projYear?.incomeTax || 0;
    const fcf = projYear?.netCashFlow || 0;

    ws.addRow({
      year,
      smInstalled: metersThisYear,
      smCumulative: cumMeters,
      progress: progress,
      capexITPM: capexIT,
      capexHW,
      capexInstall,
      capexInfra,
      capexTotal,
      opexPM,
      opexMaint,
      opexSaas,
      opexAdmin,
      opexTelecom,
      opexCloud,
      opexTotal,
      benReads,
      benCuts,
      benGuard,
      benSaidi,
      benEstFines,
      benApart,
      benNonComp,
      benFraud,
      benTotal,
      vad,
      taxableBase,
      incomeTax,
      fcf
    });
  }

  // Formatear numeros
  ws.eachRow((row, rowNumber) => {
    if (rowNumber > 1) {
      row.getCell('progress').numFmt = '0.0%';
      row.eachCell((cell, colNumber) => {
        if (colNumber > 4 && colNumber !== 4) { // Todo menos año, instalados, acum, avance
          cell.numFmt = '#,##0.00';
        } else if (colNumber === 2 || colNumber === 3) {
          cell.numFmt = '#,##0'; // Enteros
        }
      });
    }
  });

  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  saveAs(blob, `Flujo_Fondos_AMI_${scenario.id}.xlsx`);
}
