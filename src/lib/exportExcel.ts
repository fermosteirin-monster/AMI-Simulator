import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { Scenario } from '../DATA_MODEL';
import { MtSensorParams } from '../MT_DATA_MODEL';
import { getDeploymentSchedule, getCumulativeDeployed, deriveP2pPct, generateProjection } from '../BUSINESS_LOGIC';
import { generateMtProjection } from '../MT_BUSINESS_LOGIC';

export async function exportFlujoFondosExcel(scenario: Scenario, mtParams: MtSensorParams) {
  const { global, capex, opex, benefits } = scenario;
  const horizon = global.analysisHorizonYears;
  const deployHorizon = global.deploymentHorizonYears ?? 10;
  const schedule = getDeploymentSchedule(scenario);
  const cumulative = getCumulativeDeployed(scenario);
  const projection = generateProjection(scenario);
  
  const { projection: mtProjection } = generateMtProjection(mtParams);

  const { wiSunPct, plcPct, t2t3Pct = 0 } = global;
  const p2pPct = deriveP2pPct(wiSunPct, plcPct);
  const t1Pct = Math.max(0, 100 - t2t3Pct);

  const wb = new ExcelJS.Workbook();
  
  // ── HOJA 1: AMI ─────────────────────────────────────────────────────────────
  const wsAmi = wb.addWorksheet('AMI');
  wsAmi.columns = [
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
    { header: 'BENEFICIO Back-Office', key: 'benBackOffice', width: 28 },
    { header: 'BENEFICIO Call Center', key: 'benCallCenter', width: 28 },
    { header: 'BENEFICIO Daño Equipos', key: 'benDeviceDamage', width: 28 },
    { header: 'BENEFICIO Multas CosFi', key: 'benCosFi', width: 28 },
    { header: 'BENEFICIOS TOTALES', key: 'benTotal', width: 22 },
    { header: 'INGRESOS VAD (Tarifa)', key: 'vad', width: 25 },
    { header: 'BASE IMPONIBLE', key: 'taxableBase', width: 22 },
    { header: 'IMPUESTO A LAS GANANCIAS', key: 'incomeTax', width: 25 },
    { header: 'FLUJO DE CAJA NETO', key: 'fcf', width: 22 }
  ];

  wsAmi.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
  wsAmi.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F2937' } };
  wsAmi.getRow(1).alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };

  for (let year = 0; year <= horizon; year++) {
    const metersThisYear = schedule[year] || 0;
    const cumMeters = cumulative[year] || 0;
    const progress = global.totalEndpoints > 0 ? cumMeters / global.totalEndpoints : 0;
    
    // CAPEX
    let capexIT = 0, capexHW = 0, capexInstall = 0, capexInfra = 0;
    if (year >= 0 && year <= 5) {
      const itSchedule = [capex.itScheduleY0 ?? 100, capex.itScheduleY1 ?? 0, capex.itScheduleY2 ?? 0, capex.itScheduleY3 ?? 0, capex.itScheduleY4 ?? 0, capex.itScheduleY5 ?? 0];
      capexIT = ((itSchedule[year] ?? 0) / 100) * capex.itIntegrationCost;
    }
    if (metersThisYear > 0) {
      const wMeterCost = (t1Pct / 100) * capex.meterCostT1 + (t2t3Pct / 100) * capex.meterCostT2T3;
      const wCommsCost = (wiSunPct / 100) * capex.commsCostWiSun + (plcPct / 100) * capex.commsCostPLC + (p2pPct / 100) * capex.commsCostP2P;
      capexHW = metersThisYear * (wMeterCost + wCommsCost);
      capexInstall = metersThisYear * capex.installCost;
      capexInfra += (metersThisYear * (plcPct / 100) / 250) * capex.concentratorCostPLC;
      capexInfra += (metersThisYear * (wiSunPct / 100) / 5000) * capex.focalPointCostWiSun;
    }
    const capexTotal = capexIT + capexHW + capexInstall + capexInfra;

    // OPEX
    const pmPerYear = (opex.pmCost ?? 0) > 0 && deployHorizon > 0 ? (opex.pmCost ?? 0) / deployHorizon : 0;
    const opexPM = (pmPerYear > 0 && year < deployHorizon) ? pmPerYear : 0;
    let opexMaint = 0, opexSaas = 0, opexAdmin = 0, opexTelecom = 0, opexCloud = 0;
    if (year > 0) {
      opexTelecom = cumMeters * (p2pPct / 100) * opex.telecomMonthly * 12;
      opexSaas = opex.saasAnnual * (year / horizon);
      opexMaint = opex.maintenanceAnnual * progress;
      opexCloud = cumMeters * opex.cloudAnnualPerNode;
      opexAdmin = opex.adminAnnual * progress;
    }
    const opexTotal = opexPM + opexMaint + opexSaas + opexAdmin + opexTelecom + opexCloud;

    // BENEFICIOS
    let benReads = 0, benCuts = 0, benGuard = 0, benSaidi = 0, benEstFines = 0, benApart = 0, benNonComp = 0, benFraud = 0, benBackOffice = 0, benCallCenter = 0, benDeviceDamage = 0, benCosFi = 0;
    if (year > 0) {
      benReads = (benefits.manualReadsVolume * benefits.manualReadUnitCost) * progress;
      benCuts = (benefits.annualCutsVolume * benefits.dispatchCost) * progress;
      benGuard = (benefits.annualReposVolume * benefits.guardDispatchCost) * progress;
      benSaidi = (benefits.saidiHistoricalMinutes * (benefits.saidiTargetReduction / 100) * benefits.finePerMinute) * progress;
      benEstFines = benefits.estFinesAnnual * progress;
      benApart = benefits.apartamientoFineAnnual * (benefits.apartamientoFineImprovement / 100) * progress;
      benNonComp = benefits.nonComplianceFineAnnual * (benefits.nonComplianceFineImprovement / 100) * progress;
      benFraud = (benefits.nonTechLossesGwh * (benefits.recoveryRateTarget / 100) * (benefits.currentTariff - benefits.energyWholesaleCost)) * progress;
      benBackOffice = (benefits.backOfficeTxCost ?? 0) * progress;
      benCallCenter = ((benefits.inboundCallVolume ?? 0) * (benefits.callCenterUnitCost ?? 0)) * progress;
      benDeviceDamage = ((benefits.deviceDamageClaims ?? 0) * ((benefits.deviceDamageAvoidance ?? 0) / 100)) * progress;
      benCosFi = (cumMeters * ((benefits.cosFiPenaltyPct ?? 0) / 100)) * (benefits.cosFiPenaltyValue ?? 0);
    }
    const benTotal = benReads + benCuts + benGuard + benSaidi + benEstFines + benApart + benNonComp + benFraud + benBackOffice + benCallCenter + benDeviceDamage + benCosFi;

    const projYear = projection.find(p => p.year === year);
    wsAmi.addRow({
      year, smInstalled: metersThisYear, smCumulative: cumMeters, progress,
      capexITPM: capexIT, capexHW, capexInstall, capexInfra, capexTotal,
      opexPM, opexMaint, opexSaas, opexAdmin, opexTelecom, opexCloud, opexTotal,
      benReads, benCuts, benGuard, benSaidi, benEstFines, benApart, benNonComp, benFraud, benBackOffice, benCallCenter, benDeviceDamage, benCosFi, benTotal,
      vad: projYear?.vadRevenue || 0,
      taxableBase: projYear?.taxableBase || 0,
      incomeTax: projYear?.incomeTax || 0,
      fcf: projYear?.netCashFlow || 0
    });
  }

  // ── HOJA 2: MT SENSORS ────────────────────────────────────────────────────────
  const wsMt = wb.addWorksheet('MT Sensors');
  wsMt.columns = [
    { header: 'Año', key: 'year', width: 8 },
    { header: 'Trafos Acumulados', key: 'accumulatedTransformers', width: 22 },
    { header: 'Avance %', key: 'progress', width: 12 },
    { header: 'CAPEX (Sensores, P2P, Inst)', key: 'capex', width: 30 },
    { header: 'Ahorro Mantenimiento (Trafos Salvados)', key: 'maintenanceSavings', width: 38 },
    { header: 'Ahorro Multas SAIDI MT', key: 'saidiSavings', width: 28 },
    { header: 'BASE IMPONIBLE', key: 'taxableBase', width: 22 },
    { header: 'IMPUESTO A LAS GANANCIAS', key: 'incomeTax', width: 25 },
    { header: 'FLUJO DE CAJA NETO', key: 'netCashFlow', width: 22 }
  ];

  wsMt.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
  wsMt.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF059669' } };
  wsMt.getRow(1).alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };

  mtProjection.forEach(p => {
    wsMt.addRow({
      year: p.year,
      accumulatedTransformers: p.accumulatedTransformers,
      progress: p.progress,
      capex: p.capex,
      maintenanceSavings: p.maintenanceSavings,
      saidiSavings: p.saidiSavings,
      taxableBase: p.taxableBase,
      incomeTax: p.incomeTax,
      netCashFlow: p.netCashFlow
    });
  });

  // ── HOJA 3: COMBINADA (AMI + MT) ───────────────────────────────────────────
  const wsComb = wb.addWorksheet('Combinada');
  wsComb.columns = [
    { header: 'Año', key: 'year', width: 8 },
    { header: 'CAPEX AMI', key: 'amiCapex', width: 20 },
    { header: 'CAPEX MT', key: 'mtCapex', width: 20 },
    { header: 'CAPEX TOTAL', key: 'totalCapex', width: 20 },
    { header: 'OPEX TOTAL (AMI)', key: 'opexTotal', width: 22 },
    { header: 'BENEFICIOS AMI', key: 'amiBen', width: 20 },
    { header: 'BENEFICIOS MT', key: 'mtBen', width: 20 },
    { header: 'BENEFICIOS TOTALES', key: 'totalBen', width: 22 },
    { header: 'INGRESOS VAD (AMI)', key: 'vad', width: 22 },
    { header: 'BASE IMPONIBLE', key: 'taxableBase', width: 22 },
    { header: 'IMPUESTO A LAS GANANCIAS', key: 'incomeTax', width: 25 },
    { header: 'FLUJO DE CAJA NETO', key: 'fcf', width: 22 }
  ];

  wsComb.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
  wsComb.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF6366F1' } };
  wsComb.getRow(1).alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };

  for (let year = 0; year <= horizon; year++) {
    const pAmi = projection.find(p => p.year === year);
    const pMt = mtProjection.find(p => p.year === year);
    
    // Obtener valores de la fila calculada anteriormente para AMI
    const amiRow = wsAmi.getRow(year + 2); // year 0 is row 2
    const capexAmi = (amiRow.getCell('capexTotal').value as number) || 0;
    const opexAmi = (amiRow.getCell('opexTotal').value as number) || 0;
    const benAmi = (amiRow.getCell('benTotal').value as number) || 0;
    const vadAmi = pAmi?.vadRevenue || 0;

    const capexMt = pMt?.capex || 0;
    const benMt = (pMt?.maintenanceSavings || 0) + (pMt?.saidiSavings || 0);

    const totalCapex = capexAmi + capexMt;
    const totalBen = benAmi + benMt;

    const taxableBase = (pAmi?.taxableBase || 0) + (pMt?.taxableBase || 0);
    const incomeTax = (pAmi?.incomeTax || 0) + (pMt?.incomeTax || 0);
    const netCashFlow = (pAmi?.netCashFlow || 0) + (pMt?.netCashFlow || 0);

    wsComb.addRow({
      year,
      amiCapex: capexAmi,
      mtCapex: capexMt,
      totalCapex,
      opexTotal: opexAmi,
      amiBen: benAmi,
      mtBen: benMt,
      totalBen,
      vad: vadAmi,
      taxableBase,
      incomeTax,
      fcf: netCashFlow
    });
  }

  // ── Formatear todas las hojas ───────────────────────────────────────────────
  const formatSheet = (sheet: ExcelJS.Worksheet) => {
    sheet.eachRow((row, rowNumber) => {
      if (rowNumber > 1) {
        if (sheet.name === 'AMI' || sheet.name === 'MT Sensors') {
          const progCell = row.getCell('progress');
          if (progCell) progCell.numFmt = '0.0%';
        }
        row.eachCell((cell, colNumber) => {
          const colKey = sheet.getColumn(colNumber).key;
          if (colKey !== 'year' && colKey !== 'smInstalled' && colKey !== 'smCumulative' && colKey !== 'accumulatedTransformers' && colKey !== 'progress') {
            cell.numFmt = '#,##0.00';
          } else if (colKey !== 'year' && colKey !== 'progress') {
            cell.numFmt = '#,##0'; // Enteros
          }
        });
      }
    });
  };

  [wsAmi, wsMt, wsComb].forEach(formatSheet);

  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  saveAs(blob, `Flujo_Fondos_${scenario.id}.xlsx`);
}
