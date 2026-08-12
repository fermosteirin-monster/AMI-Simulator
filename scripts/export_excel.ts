import ExcelJS from 'exceljs';
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const OUT = 'C:\\Users\\florg\\Desktop\\Antigravity\\SmartMeter\\ami-simulator\\Flujo_Fondos_Baseline_Formulas.xlsx';

const wb = new ExcelJS.Workbook();
wb.creator = 'AMI Simulator - Edesur 2026';
wb.created = new Date();

// ─────────────────────────────────────────────────────────
// SHEET 1: PARÁMETROS
// ─────────────────────────────────────────────────────────
const ps = wb.addWorksheet('Parámetros');
ps.columns = [
  { header: 'Parámetro', key: 'param', width: 42 },
  { header: 'Valor', key: 'value', width: 20 },
  { header: 'Unidad', key: 'unit', width: 20 },
];

// Style header
ps.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
ps.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E3A5F' } };

function addSection(title: string) {
  const r = ps.addRow([title]);
  r.font = { bold: true, italic: true, color: { argb: 'FF1E3A5F' } };
  r.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDCE6F1' } };
  ps.mergeCells(`A${r.number}:C${r.number}`);
  return r.number;
}

function addParam(name: string, value: number, unit: string = ''): number {
  const r = ps.addRow([name, value, unit]);
  r.getCell(2).numFmt = '#,##0.00';
  return r.number; // row number = the "address" we'll use
}

// We'll track row numbers for each param so we can reference them in Sheet 2
addSection('GLOBAL');
const R_TOTAL_ENDPOINTS   = addParam('Total Suministros (Medidores)', 2_700_000, 'unidades');
const R_HORIZON           = addParam('Horizonte de Análisis', 10, 'años');
const R_WACC              = addParam('WACC del Proyecto', 14.2, '%');
const R_WISUN_PCT         = addParam('Mix Wi-SUN', 20, '%');
const R_PLC_PCT           = addParam('Mix PLC', 75, '%');
const R_T2T3_PCT          = addParam('Mix Medidores T2/T3', 2, '%');
const R_INITIAL_RAMP      = addParam('Rampa Inicial Año 1', 100_000, 'unidades');

addSection('CAPEX — Medidores e Instalación');
const R_METER_T1          = addParam('Costo Medidor T1', 60, 'USD/unidad');
const R_METER_T2T3        = addParam('Costo Medidor T2/T3', 100, 'USD/unidad');
const R_COMMS_WISUN       = addParam('Módulo Comunicación Wi-SUN', 15, 'USD/unidad');
const R_COMMS_PLC         = addParam('Módulo Comunicación PLC', 15, 'USD/unidad');
const R_COMMS_P2P         = addParam('Módulo Comunicación P2P/Celular', 15, 'USD/unidad');
const R_INSTALL           = addParam('Costo Instalación (MO)', 35, 'USD/unidad');
const R_LOGISTICS         = addParam('Logística por Medidor', 5, 'USD/unidad');
const R_CONCENTRATOR_PLC  = addParam('Concentrador PLC', 700, 'USD/nodo');
const R_FOCAL_WISUN       = addParam('Focal Point Wi-SUN', 700, 'USD/nodo');
const R_PLC_RATIO         = addParam('Medidores por Concentrador PLC', 250, 'und/nodo');
const R_WISUN_RATIO       = addParam('Medidores por Focal Point Wi-SUN', 5000, 'und/nodo');

addSection('CAPEX — Plataforma IT');
const R_IT_COST           = addParam('Costo Integración IT Total', 15_000_000, 'USD');
const R_PM_COST           = addParam('Costo Project Management', 1_000_000, 'USD');
const R_IT_Y0             = addParam('Desembolso IT Año 0', 40, '%');
const R_IT_Y1             = addParam('Desembolso IT Año 1', 30, '%');
const R_IT_Y2             = addParam('Desembolso IT Año 2', 20, '%');
const R_IT_Y3             = addParam('Desembolso IT Año 3', 10, '%');

addSection('OPEX');
const R_MAINT             = addParam('Mantenimiento IT Anual', 500_000, 'USD/año');
const R_SAAS              = addParam('Licencias SaaS Anual', 200_000, 'USD/año');
const R_ADMIN             = addParam('Administración y Soporte', 500_000, 'USD/año');
const R_TELECOM_MONTHLY   = addParam('Telecomunicaciones (P2P)', 0.52, 'USD/med/mes');
const R_CLOUD_MONTHLY     = addParam('Cloud Mensual (base)', 5_000, 'USD/mes');

addSection('BENEFICIOS — Operacionales');
const R_READS_VOL         = addParam('Volumen Lecturas Manuales Anuales', 32_400_000, 'lecturas');
const R_READS_COST        = addParam('Costo Unitario por Lectura', 0.25, 'USD/lectura');
const R_CUTS_VOL          = addParam('Cortes Anuales (manual)', 318_250, 'eventos');
const R_REPOS_VOL         = addParam('Reposiciones Anuales (manual)', 152_000, 'eventos');
const R_DISPATCH_COST     = addParam('Costo Despacho Cuadrilla', 14.6, 'USD/visita');
const R_UNPROD_VISITS     = addParam('Visitas Improductivas Evitadas', 75_000, 'visitas/año');
const R_REIT_VISITS       = addParam('Visitas Reiterativas Evitadas', 30_000, 'visitas/año');
const R_QUAL_VISITS       = addParam('Visitas de Calidad Evitadas', 20_000, 'visitas/año');
const R_GUARD_DISPATCH    = addParam('Costo Despacho Cuadrilla Guardia', 20, 'USD/visita');

addSection('BENEFICIOS — Regulatorios / Multas');
const R_SAIDI_MIN         = addParam('SAIDI Histórico', 350, 'minutos');
const R_SAIDI_REDUX       = addParam('Reducción SAIDI esperada', 25, '%');
const R_FINE_PER_MIN      = addParam('Penalidad por Minuto SAIDI', 50_000, 'USD/min');
const R_EST_FINES         = addParam('Multas por Estimación (anual base)', 2_420_000, 'USD/año');
const R_APART_BASE        = addParam('Multas Apartamiento (base anual)', 5_250_000, 'USD/año');
const R_APART_REDUX       = addParam('Mejora Apartamiento esperada', 20, '%');
const R_NONCMPL_BASE      = addParam('Multas Incumplimiento (base anual)', 700_000, 'USD/año');
const R_NONCMPL_REDUX     = addParam('Mejora Incumplimiento esperada', 70, '%');

addSection('BENEFICIOS — Comerciales');
const R_BILLING_CLAIMS    = addParam('Reclamos Facturación Evitados', 14_500, 'reclamos/año');
const R_INBOUND_CALLS     = addParam('Llamadas Inbound Evitadas', 46_400, 'llamadas/año');
const R_CALL_COST         = addParam('Costo Unitario Call Center', 1.2, 'USD/llamada');
const R_DMG_CLAIMS        = addParam('Reclamos Resarcimiento Artefactos (base)', 500_000, 'USD/año');
const R_DMG_AVOID         = addParam('Reducción Resarcimientos esperada', 30, '%');

addSection('BENEFICIOS — Recupero Fraude');
const R_NTL_GWH           = addParam('Pérdidas No Técnicas (base)', 2_394, 'GWh');
const R_RECOVERY_RATE     = addParam('Tasa de Recupero esperada', 20, '%');
const R_WHOLESALE_COST    = addParam('Costo Energía Mayorista (MEM)', 40_000, 'USD/GWh');
const R_CURRENT_TARIFF    = addParam('Tarifa Comercial Promedio', 97_200, 'USD/GWh');

addSection('REGULATORIO — VAD (ENRE)');
const R_WACC_ENRE         = addParam('WACC Reconocido ENRE', 9.99, '%');
const R_REC_CAPEX_METER   = addParam('CAPEX Medidor Reconocido Fase 1', 151, 'USD/und');
const R_METER_LIFE        = addParam('Vida Útil Regulatoria Medidor', 25, 'años');
const R_IT_LIFE           = addParam('Vida Útil Regulatoria Plataforma IT', 10, 'años');
const R_ENRE_IT_SUBSIDY   = addParam('Subsidio ENRE IT', 5_000_000, 'USD');

// ─────────────────────────────────────────────────────────
// HELPER: cell reference for a param row
// ─────────────────────────────────────────────────────────
const P = (row: number) => `Parámetros!$B$${row}`;

// ─────────────────────────────────────────────────────────
// SHEET 2: FLUJO DE FONDOS
// ─────────────────────────────────────────────────────────
const fs2 = wb.addWorksheet('Flujo de Fondos');

// ── Colors ──────────────────────────────────────────────
const CLR_HEADER = 'FF1E3A5F';
const CLR_SUB    = 'FF2E75B6';
const CLR_CAPEX  = 'FFC00000';
const CLR_OPEX   = 'FFE26B0A';
const CLR_BEN    = 'FF375623';
const CLR_VAD    = 'FF7030A0';
const CLR_NET    = 'FF1E3A5F';

function makeHeader(ws: ExcelJS.Worksheet, row: number, col: number, label: string, bgColor: string) {
  const cell = ws.getCell(row, col);
  cell.value = label;
  cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgColor } };
  cell.alignment = { wrapText: true, vertical: 'middle', horizontal: 'center' };
  cell.border = { bottom: { style: 'thin', color: { argb: 'FF000000' } } };
}

// ── Row definitions (row numbers in the cash flow sheet) ──
// We use a 3-row header block (rows 1-3), then data rows 4-14 (years 0-10)
// Column A = labels, Columns B-L = Years 0-10

const HEADER_ROW = 1;
const SUB_HEADER = 2;
const UNIT_ROW   = 3;
const DATA_START = 4;  // Year 0
const YEARS = 10;

// ── Column widths ──
fs2.getColumn(1).width = 44;  // Labels
for (let c = 2; c <= 12; c++) {
  fs2.getColumn(c).width = 16;
}

// ── Row 1: Year headers ──
makeHeader(fs2, HEADER_ROW, 1, 'Concepto', CLR_HEADER);
for (let y = 0; y <= YEARS; y++) {
  const cell = fs2.getCell(HEADER_ROW, y + 2);
  cell.value = `Año ${y}`;
  cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: CLR_HEADER } };
  cell.alignment = { horizontal: 'center', vertical: 'middle' };
}

// Helper to get the Excel column letter for a given year (y=0 → col B, y=1 → col C, etc.)
function colLetter(y: number): string {
  return String.fromCharCode(66 + y); // B=66
}
// Helper: row address of the data row for a given cashflow row index (0-based from DATA_START)
// rowIndex is the row within the cash flow sheet (0 = CAPEX IT row, etc.)
// we'll define these as we go.

// ── Intermediate rows: SM Deployment ──
let currentRow = DATA_START;

function addSectionRow(label: string, color: string): number {
  const r = fs2.getRow(currentRow);
  const cell = r.getCell(1);
  cell.value = label;
  cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: color } };
  for (let c = 2; c <= 12; c++) {
    r.getCell(c).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: color } };
  }
  fs2.mergeCells(currentRow, 1, currentRow, 12);
  currentRow++;
  return currentRow - 1;
}

function addDataRow(label: string, formulas: string[], numFmt: string = '#,##0', color?: string, bold?: boolean): number {
  const r = fs2.getRow(currentRow);
  r.getCell(1).value = label;
  if (bold) r.getCell(1).font = { bold: true };
  if (color) {
    r.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: color } };
  }
  for (let y = 0; y <= YEARS; y++) {
    const cell = r.getCell(y + 2);
    cell.value = { formula: formulas[y], date1904: false } as any;
    cell.numFmt = numFmt;
    if (color) {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: color } };
      cell.font = { color: { argb: 'FFFFFFFF' }, bold: !!bold };
    }
    cell.alignment = { horizontal: 'right' };
  }
  currentRow++;
  return currentRow - 1;
}

function addSubDataRow(label: string, formulas: string[], numFmt: string = '#,##0', lightColor?: string): number {
  const r = fs2.getRow(currentRow);
  r.getCell(1).value = `  └ ${label}`;
  if (lightColor) {
    r.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: lightColor } };
  }
  for (let y = 0; y <= YEARS; y++) {
    const cell = r.getCell(y + 2);
    cell.value = { formula: formulas[y], date1904: false } as any;
    cell.numFmt = numFmt;
    if (lightColor) {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: lightColor } };
    }
    cell.alignment = { horizontal: 'right' };
  }
  currentRow++;
  return currentRow - 1;
}

// ════════════════════════════════════════════
// BLOCK 1: DESPLIEGUE DE MEDIDORES
// ════════════════════════════════════════════
addSectionRow('DESPLIEGUE DE MEDIDORES', 'FF4472C4');

// Row: SM Instalados en el año
// Year 0 = 0; Year 1 = INITIAL_RAMP; Years 2-10 = (TOTAL - RAMP) / (HORIZON-1)
const smInstalFormulas = Array.from({ length: YEARS + 1 }, (_, y) => {
  if (y === 0) return `0`;
  if (y === 1) return P(R_INITIAL_RAMP);
  return `(${P(R_TOTAL_ENDPOINTS)}-${P(R_INITIAL_RAMP)})/(${P(R_HORIZON)}-1)`;
});
const ROW_SM_INSTAL = addSubDataRow('SM Instalados en el Año', smInstalFormulas, '#,##0');

// Row: SM Acumulados
const smAcumFormulas = Array.from({ length: YEARS + 1 }, (_, y) => {
  if (y === 0) return `0`;
  // SUM from year 1 to year y
  return `SUM(${colLetter(1)}${ROW_SM_INSTAL}:${colLetter(y)}${ROW_SM_INSTAL})`;
});
const ROW_SM_ACUM = addSubDataRow('SM Acumulados (Total Red)', smAcumFormulas, '#,##0');

// Row: Avance %
const avanceFormulas = Array.from({ length: YEARS + 1 }, (_, y) => {
  if (y === 0) return `0`;
  return `${colLetter(y)}${ROW_SM_ACUM}/${P(R_TOTAL_ENDPOINTS)}`;
});
const ROW_AVANCE = addSubDataRow('Avance del Despliegue (%)', avanceFormulas, '0.0%');

// Add blank separator
fs2.addRow([]);
currentRow++;

// ════════════════════════════════════════════
// BLOCK 2: CAPEX
// ════════════════════════════════════════════
addSectionRow('CAPEX — INVERSIÓN', CLR_CAPEX);

// IT y PM
const capexITFormulas = Array.from({ length: YEARS + 1 }, (_, y) => {
  const itPcts: {[k:number]: number} = {0: R_IT_Y0, 1: R_IT_Y1, 2: R_IT_Y2, 3: R_IT_Y3};
  if (y === 0) return `${P(itPcts[0])}/100*${P(R_IT_COST)}+${P(R_PM_COST)}`;
  if (itPcts[y]) return `${P(itPcts[y])}/100*${P(R_IT_COST)}`;
  return `0`;
});
const ROW_CAPEX_IT = addSubDataRow('CAPEX IT y PM', capexITFormulas, '#,##0', 'FFFFC7CE');

// Hardware (medidor + comms ponderado)
// weightedMeterCost = (1 - T2T3/100)*MeterT1 + (T2T3/100)*MeterT2T3
// weightedCommsCost = (WiSUN/100)*CommWiSUN + (PLC/100)*CommPLC + ((100-WiSUN-PLC)/100)*CommP2P
// hwCostPerMeter = weightedMeterCost + weightedCommsCost
// capexHW = smInstalYear * hwCostPerMeter
const hwFormula = (y: number) => {
  if (y === 0) return `0`;
  const smCell = `${colLetter(y)}${ROW_SM_INSTAL}`;
  const meterCost = `((1-${P(R_T2T3_PCT)}/100)*${P(R_METER_T1)}+(${P(R_T2T3_PCT)}/100)*${P(R_METER_T2T3)})`;
  const commsCost = `((${P(R_WISUN_PCT)}/100)*${P(R_COMMS_WISUN)}+(${P(R_PLC_PCT)}/100)*${P(R_COMMS_PLC)}+((100-${P(R_WISUN_PCT)}-${P(R_PLC_PCT)})/100)*${P(R_COMMS_P2P)})`;
  return `${smCell}*(${meterCost}+${commsCost})`;
};
const ROW_CAPEX_HW = addSubDataRow('CAPEX Hardware (Medidores + Módulos Comms)', Array.from({length:YEARS+1},(_,y)=>hwFormula(y)), '#,##0', 'FFFFC7CE');

// Instalación y Logística
const capexInstFormulas = Array.from({ length: YEARS + 1 }, (_, y) => {
  if (y === 0) return `0`;
  return `${colLetter(y)}${ROW_SM_INSTAL}*(${P(R_INSTALL)}+${P(R_LOGISTICS)})`;
});
const ROW_CAPEX_INST = addSubDataRow('CAPEX Instalación y Logística', capexInstFormulas, '#,##0', 'FFFFC7CE');

// Infraestructura (Concentradores + Focal Points)
const capexInfraFormulas = Array.from({ length: YEARS + 1 }, (_, y) => {
  if (y === 0) return `0`;
  const smCell = `${colLetter(y)}${ROW_SM_INSTAL}`;
  const plcNodes = `(${smCell}*${P(R_PLC_PCT)}/100)/${P(R_PLC_RATIO)}`;
  const wiSunNodes = `(${smCell}*${P(R_WISUN_PCT)}/100)/${P(R_WISUN_RATIO)}`;
  return `${plcNodes}*${P(R_CONCENTRATOR_PLC)}+${wiSunNodes}*${P(R_FOCAL_WISUN)}`;
});
const ROW_CAPEX_INFRA = addSubDataRow('CAPEX Infraestructura (Nodos de Red)', capexInfraFormulas, '#,##0', 'FFFFC7CE');

// CAPEX TOTAL
const capexTotalFormulas = Array.from({ length: YEARS + 1 }, (_, y) => {
  const c = colLetter(y);
  return `${c}${ROW_CAPEX_IT}+${c}${ROW_CAPEX_HW}+${c}${ROW_CAPEX_INST}+${c}${ROW_CAPEX_INFRA}`;
});
const ROW_CAPEX_TOTAL = addDataRow('CAPEX TOTAL', capexTotalFormulas, '#,##0', 'FFFFC7CE', true);

fs2.addRow([]); currentRow++;

// ════════════════════════════════════════════
// BLOCK 3: OPEX
// ════════════════════════════════════════════
addSectionRow('OPEX — COSTOS OPERATIVOS', CLR_OPEX);

const opexRows: {label: string, formula: (y:number)=>string}[] = [
  { label: 'Mantenimiento IT', formula: (y) => y >= 1 ? P(R_MAINT) : '0' },
  { label: 'Licencias SaaS', formula: (y) => y >= 1 ? P(R_SAAS) : '0' },
  { label: 'Administración y Soporte', formula: (y) => y >= 1 ? P(R_ADMIN) : '0' },
  {
    label: 'Telecomunicaciones P2P (var. según medidores activos)',
    formula: (y) => y >= 1
      ? `${colLetter(y)}${ROW_SM_ACUM}*((100-${P(R_WISUN_PCT)}-${P(R_PLC_PCT)})/100)*${P(R_TELECOM_MONTHLY)}*12`
      : '0'
  },
  { label: 'Cloud Mensual (base fija)', formula: (y) => y >= 1 ? `${P(R_CLOUD_MONTHLY)}*12` : '0' },
];

const opexSubRows: number[] = [];
for (const o of opexRows) {
  const row = addSubDataRow(o.label, Array.from({length:YEARS+1},(_,y)=>o.formula(y)), '#,##0', 'FFFCE4D6');
  opexSubRows.push(row);
}

// OPEX TOTAL
const opexTotalFormulas = Array.from({ length: YEARS + 1 }, (_, y) => {
  const c = colLetter(y);
  return opexSubRows.map(r => `${c}${r}`).join('+');
});
const ROW_OPEX_TOTAL = addDataRow('OPEX TOTAL', opexTotalFormulas, '#,##0', 'FFFCE4D6', true);

fs2.addRow([]); currentRow++;

// ════════════════════════════════════════════
// BLOCK 4: BENEFICIOS
// ════════════════════════════════════════════
addSectionRow('BENEFICIOS — SAVINGS OPERACIONALES Y REGULATORIOS', CLR_BEN);

const avCell = (y: number) => `${colLetter(y)}${ROW_AVANCE}`;

const benefitItems: {label: string, formula: (y:number)=>string}[] = [
  {
    label: 'Lecturas Manuales Evitadas',
    formula: (y) => y < 1 ? '0' : `${P(R_READS_VOL)}*${P(R_READS_COST)}*${avCell(y)}`
  },
  {
    label: 'Cortes y Reposiciones Remotas (cuadrilla evitada)',
    formula: (y) => y < 1 ? '0' : `(${P(R_CUTS_VOL)}+${P(R_REPOS_VOL)})*${P(R_DISPATCH_COST)}*${avCell(y)}`
  },
  {
    label: 'Visitas Improductivas, Reiterativas y de Calidad Evitadas',
    formula: (y) => y < 1 ? '0' : `(${P(R_UNPROD_VISITS)}+${P(R_REIT_VISITS)}+${P(R_QUAL_VISITS)})*${P(R_GUARD_DISPATCH)}*${avCell(y)}`
  },
  {
    label: 'Reducción Multas SAIDI (minutos × penalidad)',
    formula: (y) => y < 1 ? '0' : `${P(R_SAIDI_MIN)}*(${P(R_SAIDI_REDUX)}/100)*${P(R_FINE_PER_MIN)}*${avCell(y)}`
  },
  {
    label: 'Reducción Multas por Estimación (lectura real evita sanción)',
    formula: (y) => y < 1 ? '0' : `${P(R_EST_FINES)}*${avCell(y)}`
  },
  {
    label: 'Reducción Multas de Apartamiento (Calidad de Producto)',
    formula: (y) => y < 1 ? '0' : `${P(R_APART_BASE)}*(${P(R_APART_REDUX)}/100)*${avCell(y)}`
  },
  {
    label: 'Reducción Multas de Incumplimiento Regulatorio',
    formula: (y) => y < 1 ? '0' : `${P(R_NONCMPL_BASE)}*(${P(R_NONCMPL_REDUX)}/100)*${avCell(y)}`
  },
  {
    label: 'Reducción Reclamos y Llamadas Call Center',
    formula: (y) => y < 1 ? '0' : `(${P(R_BILLING_CLAIMS)}+${P(R_INBOUND_CALLS)})*${P(R_CALL_COST)}*${avCell(y)}`
  },
  {
    label: 'Reducción Resarcimientos por Artefactos Quemados',
    formula: (y) => y < 1 ? '0' : `${P(R_DMG_CLAIMS)}*(${P(R_DMG_AVOID)}/100)*${avCell(y)}`
  },
  {
    label: 'Recupero de Pérdidas No Técnicas / Fraude',
    formula: (y) => y < 1 ? '0' : `${P(R_NTL_GWH)}*(${P(R_RECOVERY_RATE)}/100)*(${P(R_CURRENT_TARIFF)}-${P(R_WHOLESALE_COST)})*${avCell(y)}`
  },
];

const benefitSubRows: number[] = [];
for (const b of benefitItems) {
  const row = addSubDataRow(b.label, Array.from({length:YEARS+1},(_,y)=>b.formula(y)), '#,##0', 'FFE2EFDA');
  benefitSubRows.push(row);
}

// BENEFICIOS TOTAL
const benTotalFormulas = Array.from({ length: YEARS + 1 }, (_, y) => {
  const c = colLetter(y);
  return benefitSubRows.map(r => `${c}${r}`).join('+');
});
const ROW_BEN_TOTAL = addDataRow('BENEFICIOS TOTALES', benTotalFormulas, '#,##0', 'FF375623', true);

fs2.addRow([]); currentRow++;

// ════════════════════════════════════════════
// BLOCK 5: VAD (Ingresos Regulatorios)
// ════════════════════════════════════════════
addSectionRow('INGRESOS VAD — RECONOCIMIENTO TARIFARIO ENRE', CLR_VAD);

// IT VAD: simplificado — amortización lineal + retorno sobre RAB remanente
// IT capital desembolsado en cada año, menos subsidio en Y0
// For simplicity in Excel we'll compute VAD IT as the running annual VAD from the IT cohorts
// VAD(año y) = SUM_over_cohorts_k_where_k<=y_and_y-k<vida_util {  (itCapexK / vida + itCapexK*(1-(y-k)/vida)*(waccENRE/100))  }
// We'll do it per-cohort row then sum

// IT cohorts (Y0 net of subsidy, Y1, Y2, Y3)
function itCapexPExpr(cohortYear: number): string {
  const itPcts: {[k:number]: number} = {0: R_IT_Y0, 1: R_IT_Y1, 2: R_IT_Y2, 3: R_IT_Y3};
  if (cohortYear === 0) return `MAX(0,${P(itPcts[0])}/100*${P(R_IT_COST)}-${P(R_ENRE_IT_SUBSIDY)})`;
  return `${P(itPcts[cohortYear])}/100*${P(R_IT_COST)}`;
}

function vadCohortFormula(itCapexExpr: string, cohortYear: number, evalYear: number, lifeRef: number, waccRef: number): string {
  const age = evalYear - cohortYear;
  if (age < 0 || age >= 10) return '0'; // simplified: hardcode max IT life = 10
  // VAD = capex/life + (capex - capex*age/life) * wacc/100
  return `(${itCapexExpr}/${P(lifeRef)}+(${itCapexExpr}-${itCapexExpr}*${age}/${P(lifeRef)})*${P(waccRef)}/100)`;
}

// VAD IT total per year
const vadITFormulas = Array.from({ length: YEARS + 1 }, (_, y) => {
  const parts = [0, 1, 2, 3].map(k => vadCohortFormula(itCapexPExpr(k), k, y, R_IT_LIFE, R_WACC_ENRE));
  const nonZero = parts.filter(p => p !== '0');
  return nonZero.length > 0 ? nonZero.join('+') : '0';
});
const ROW_VAD_IT = addSubDataRow('VAD IT (Amortización + Retorno sobre RAB — Plataforma)', vadITFormulas, '#,##0', 'FFEDE7F6');

// VAD Meters: for each cohort year (1 to y), VAD = (cohortCapex/life + remRAB * wacc)
// In Excel we can reference SM installed row and recognized capex per meter
// For each evaluation year we sum over all installed cohorts k=1..min(y,HORIZON)
// Simplified: only first 3 years use recognized capex (Fase 1), rest use actual
// We'll build formulas referencing meter installed rows

function vadMetersCohortFormula(cohortYear: number, evalYear: number): string {
  if (evalYear < cohortYear || evalYear - cohortYear >= 25) return '0';
  const age = evalYear - cohortYear;
  const smCell = `${colLetter(cohortYear)}${ROW_SM_INSTAL}`;
  const lifeRef = P(R_METER_LIFE);
  const waccRef = P(R_WACC_ENRE);
  let capexPerUnit: string;
  if (cohortYear <= 3) {
    capexPerUnit = P(R_REC_CAPEX_METER);
  } else {
    const meterCost = `((1-${P(R_T2T3_PCT)}/100)*${P(R_METER_T1)}+(${P(R_T2T3_PCT)}/100)*${P(R_METER_T2T3)})`;
    const commsCost = `((${P(R_WISUN_PCT)}/100)*${P(R_COMMS_WISUN)}+(${P(R_PLC_PCT)}/100)*${P(R_COMMS_PLC)}+((100-${P(R_WISUN_PCT)}-${P(R_PLC_PCT)})/100)*${P(R_COMMS_P2P)})`;
    capexPerUnit = `(${meterCost}+${commsCost}+${P(R_INSTALL)})`;
  }
  const cohortCapex = `${smCell}*${capexPerUnit}`;
  return `(${cohortCapex}/${lifeRef}+(${cohortCapex}-${cohortCapex}*${age}/${lifeRef})*${waccRef}/100)`;
}

const vadMetersFormulas = Array.from({ length: YEARS + 1 }, (_, y) => {
  const parts: string[] = [];
  for (let k = 1; k <= Math.min(y, YEARS); k++) {
    const f = vadMetersCohortFormula(k, y);
    if (f !== '0') parts.push(f);
  }
  return parts.length > 0 ? parts.join('+') : '0';
});
const ROW_VAD_METERS = addSubDataRow('VAD Medidores (Amortización + Retorno sobre RAB — por Cohorte)', vadMetersFormulas, '#,##0', 'FFEDE7F6');

// VAD TOTAL
const vadTotalFormulas = Array.from({ length: YEARS + 1 }, (_, y) => {
  const c = colLetter(y);
  return `${c}${ROW_VAD_IT}+${c}${ROW_VAD_METERS}`;
});
const ROW_VAD_TOTAL = addDataRow('INGRESOS VAD TOTALES', vadTotalFormulas, '#,##0', CLR_VAD, true);

fs2.addRow([]); currentRow++;

// ════════════════════════════════════════════
// BLOCK 6: FLUJO DE CAJA NETO
// ════════════════════════════════════════════
addSectionRow('FLUJO DE CAJA', CLR_NET);

// Gross cashflow
const netCFFormulas = Array.from({ length: YEARS + 1 }, (_, y) => {
  const c = colLetter(y);
  return `${c}${ROW_BEN_TOTAL}+${c}${ROW_VAD_TOTAL}-${c}${ROW_OPEX_TOTAL}-${c}${ROW_CAPEX_TOTAL}`;
});
const ROW_NET_CF = addDataRow('Flujo de Caja Neto (FCF)', netCFFormulas, '#,##0', 'FF4472C4', true);

// Discounted cashflow
const discCFFormulas = Array.from({ length: YEARS + 1 }, (_, y) => {
  const c = colLetter(y);
  return `${c}${ROW_NET_CF}/(1+${P(R_WACC)}/100)^${y}`;
});
const ROW_DISC_CF = addSubDataRow('FCF Descontado (al WACC del Proyecto)', discCFFormulas, '#,##0', 'FFD9E1F2');

// Cumulative NPV
let cumulRow: number;
const cumulFormulas = Array.from({ length: YEARS + 1 }, (_, y) => {
  const c = colLetter(y);
  if (y === 0) return `${c}${ROW_DISC_CF}`;
  return `SUM(${colLetter(0)}${ROW_DISC_CF}:${c}${ROW_DISC_CF})`;
});
cumulRow = addSubDataRow('VPN Acumulado', cumulFormulas, '#,##0', 'FFD9E1F2');

// ── Format all number rows with accounting style for readability ──
for (let r = DATA_START; r <= currentRow; r++) {
  const row = fs2.getRow(r);
  row.height = 20;
}

// ── Freeze top row & first column ──
fs2.views = [{ state: 'frozen', xSplit: 1, ySplit: 1, topLeftCell: 'B2', activeCell: 'B2' }];

// ── Auto-filter header row ──
fs2.autoFilter = { from: 'A1', to: `L1` };

await wb.xlsx.writeFile(OUT);
console.log('Archivo Excel generado: ' + OUT);
