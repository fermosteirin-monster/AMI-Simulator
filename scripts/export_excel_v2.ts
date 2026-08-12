/**
 * export_excel_v2.ts
 * Genera Flujo_Fondos_Baseline_v2.xlsx con:
 *   Hoja 1 — Parámetros        (inputs nombrados)
 *   Hoja 2 — Flujo de Fondos   (formulas por año / por línea desagregada)
 *   Hoja 3 — Indicadores       (VPN, TIR, ROI, PI, Payback, WACC, resumen ejecutivo)
 */

import ExcelJS from 'exceljs';

const OUT = 'C:\\Users\\florg\\Desktop\\Antigravity\\SmartMeter\\ami-simulator\\Flujo_Fondos_Baseline_v2.xlsx';

const wb = new ExcelJS.Workbook();
wb.creator = 'AMI Simulator — Edesur 2026';
wb.created = new Date();

// ╔══════════════════════════════════════════════════════════╗
// ║  UTILIDADES                                              ║
// ╚══════════════════════════════════════════════════════════╝

const COLORS = {
  headerDark:  'FF1E3A5F',
  headerMid:   'FF2E75B6',
  sectionCap:  'FFC00000',
  sectionOpex: 'FFE26B0A',
  sectionBen:  'FF375623',
  sectionVad:  'FF7030A0',
  sectionNet:  'FF4472C4',
  sectionDep:  'FF4472C4',
  subCapex:    'FFFFC7CE',
  subOpex:     'FFFCE4D6',
  subBen:      'FFE2EFDA',
  subVad:      'FFEDE7F6',
  subNet:      'FFD9E1F2',
  white:       'FFFFFFFF',
  sectionRow:  'FFDCE6F1',
  kpiGood:     'FFE2EFDA',
  kpiBad:      'FFFFC7CE',
  kpiNeutral:  'FFDDEBF7',
  accent1:     'FF17375E',
};

function cellStyle(cell: ExcelJS.Cell, opts: {
  bold?: boolean; italic?: boolean; color?: string; bg?: string;
  border?: boolean; wrap?: boolean; hAlign?: ExcelJS.Alignment['horizontal'];
  numFmt?: string; size?: number;
}) {
  if (opts.bold !== undefined || opts.italic !== undefined || opts.color || opts.size) {
    cell.font = {
      bold: opts.bold ?? false,
      italic: opts.italic ?? false,
      color: opts.color ? { argb: opts.color } : undefined,
      size: opts.size,
    };
  }
  if (opts.bg) cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: opts.bg } };
  if (opts.border) cell.border = {
    top: { style: 'thin' }, bottom: { style: 'thin' },
    left: { style: 'thin' }, right: { style: 'thin' },
  };
  if (opts.wrap || opts.hAlign) cell.alignment = { wrapText: opts.wrap, horizontal: opts.hAlign ?? 'left', vertical: 'middle' };
  if (opts.numFmt) cell.numFmt = opts.numFmt;
}

// ╔══════════════════════════════════════════════════════════╗
// ║  HOJA 1 — PARÁMETROS                                    ║
// ╚══════════════════════════════════════════════════════════╝

const ps = wb.addWorksheet('Parámetros');
ps.columns = [
  { key: 'param', width: 46 },
  { key: 'value', width: 20 },
  { key: 'unit',  width: 24 },
];

// Header
['Parámetro', 'Valor', 'Unidad'].forEach((h, i) => {
  const c = ps.getCell(1, i + 1);
  c.value = h;
  cellStyle(c, { bold: true, color: COLORS.white, bg: COLORS.headerDark, border: true, hAlign: 'center' });
});
ps.getRow(1).height = 22;

let pRow = 1;

function pSection(title: string) {
  pRow++;
  ps.mergeCells(pRow, 1, pRow, 3);
  const c = ps.getCell(pRow, 1);
  c.value = title;
  cellStyle(c, { bold: true, italic: true, color: COLORS.headerDark, bg: COLORS.sectionRow });
  ps.getRow(pRow).height = 18;
}

function pParam(name: string, value: number, unit = ''): number {
  pRow++;
  ps.getCell(pRow, 1).value = name;
  const vc = ps.getCell(pRow, 2);
  vc.value = value;
  vc.numFmt = '#,##0.00';
  ps.getCell(pRow, 3).value = unit;
  ps.getRow(pRow).height = 16;
  return pRow;
}

function P(row: number) { return `Parámetros!$B$${row}`; }

// ── GLOBAL ──────────────────────────────────────────────────
pSection('GLOBAL — Proyecto');
const R_ENDPOINTS   = pParam('Total Suministros (Medidores)', 2_700_000, 'unidades');
const R_HORIZON     = pParam('Horizonte de Análisis', 10, 'años');
const R_WACC        = pParam('WACC del Proyecto', 14.2, '%');
const R_WISUN       = pParam('Mix Wi-SUN', 20, '%');
const R_PLC         = pParam('Mix PLC', 75, '%');
const R_T2T3        = pParam('Mix Medidores T2/T3', 2, '%');
const R_RAMP1       = pParam('Rampa Inicial Año 1', 100_000, 'unidades');

// ── CAPEX ────────────────────────────────────────────────────
pSection('CAPEX — Medidores e Instalación');
const R_MT1         = pParam('Costo Medidor T1', 60, 'USD/unidad');
const R_MT2T3       = pParam('Costo Medidor T2/T3', 100, 'USD/unidad');
const R_CW          = pParam('Módulo Comunicación Wi-SUN', 15, 'USD/unidad');
const R_CP          = pParam('Módulo Comunicación PLC', 15, 'USD/unidad');
const R_CP2P        = pParam('Módulo Comunicación P2P/Celular', 15, 'USD/unidad');
const R_INST        = pParam('Costo Instalación (MO)', 35, 'USD/unidad');
const R_LOG         = pParam('Logística por Medidor', 5, 'USD/unidad');
const R_CONC        = pParam('Concentrador PLC', 700, 'USD/nodo');
const R_FP          = pParam('Focal Point Wi-SUN', 700, 'USD/nodo');
const R_CONCR       = pParam('Medidores por Concentrador PLC', 250, 'und/nodo');
const R_FPR         = pParam('Medidores por Focal Point Wi-SUN', 5_000, 'und/nodo');

pSection('CAPEX — Plataforma IT');
const R_IT          = pParam('Costo Integración IT Total', 15_000_000, 'USD');
const R_PM          = pParam('Costo Project Management', 1_000_000, 'USD');
const R_ITY0        = pParam('Desembolso IT Año 0', 40, '%');
const R_ITY1        = pParam('Desembolso IT Año 1', 30, '%');
const R_ITY2        = pParam('Desembolso IT Año 2', 20, '%');
const R_ITY3        = pParam('Desembolso IT Año 3', 10, '%');

// ── OPEX ─────────────────────────────────────────────────────
pSection('OPEX');
const R_MAINT       = pParam('Mantenimiento IT Anual', 500_000, 'USD/año');
const R_SAAS        = pParam('Licencias SaaS Anual', 200_000, 'USD/año');
const R_ADMIN       = pParam('Administración y Soporte', 500_000, 'USD/año');
const R_TMOM        = pParam('Telecomunicaciones P2P (mensual/medidor)', 0.52, 'USD/med/mes');
const R_CLOUD       = pParam('Cloud Mensual (base fija)', 5_000, 'USD/mes');

// ── BENEFICIOS ───────────────────────────────────────────────
pSection('BENEFICIOS — Operacionales');
const R_RVOL        = pParam('Volumen Lecturas Manuales Anuales', 32_400_000, 'lecturas');
const R_RCOST       = pParam('Costo Unitario por Lectura', 0.25, 'USD/lectura');
const R_CUTS        = pParam('Cortes Anuales (manual)', 318_250, 'eventos');
const R_REPOS       = pParam('Reposiciones Anuales (manual)', 152_000, 'eventos');
const R_DISP        = pParam('Costo Despacho Cuadrilla', 14.6, 'USD/visita');
const R_UNPR        = pParam('Visitas Improductivas Evitadas', 75_000, 'visitas/año');
const R_REIT        = pParam('Visitas Reiterativas Evitadas', 30_000, 'visitas/año');
const R_QUAL        = pParam('Visitas de Calidad Evitadas', 20_000, 'visitas/año');
const R_GDISP       = pParam('Costo Despacho Cuadrilla Guardia', 20, 'USD/visita');

pSection('BENEFICIOS — Regulatorios / Multas');
const R_SAIDI       = pParam('SAIDI Histórico', 350, 'minutos');
const R_SAIXR       = pParam('Reducción SAIDI esperada', 25, '%');
const R_FMIN        = pParam('Penalidad por Minuto SAIDI', 50_000, 'USD/min');
const R_ESTF        = pParam('Multas por Estimación (base anual)', 2_420_000, 'USD/año');
const R_APB         = pParam('Multas Apartamiento (base anual)', 5_250_000, 'USD/año');
const R_APRI        = pParam('Mejora Apartamiento esperada', 20, '%');
const R_NCB         = pParam('Multas Incumplimiento (base anual)', 700_000, 'USD/año');
const R_NCRI        = pParam('Mejora Incumplimiento esperada', 70, '%');

pSection('BENEFICIOS — Comerciales');
const R_BCLM        = pParam('Reclamos Facturación Evitados', 14_500, 'reclamos/año');
const R_INBC        = pParam('Llamadas Inbound Evitadas', 46_400, 'llamadas/año');
const R_CCOST       = pParam('Costo Unitario Call Center', 1.2, 'USD/llamada');
const R_DMGB        = pParam('Reclamos Resarcimiento Artefactos (base)', 500_000, 'USD/año');
const R_DMGR        = pParam('Reducción Resarcimientos esperada', 30, '%');

pSection('BENEFICIOS — Recupero Fraude');
const R_NTL         = pParam('Pérdidas No Técnicas (base)', 2_394, 'GWh');
const R_RECR        = pParam('Tasa de Recupero esperada', 20, '%');
const R_WHLSL       = pParam('Costo Energía Mayorista (MEM)', 40_000, 'USD/GWh');
const R_TARIFF      = pParam('Tarifa Comercial Promedio', 97_200, 'USD/GWh');

pSection('REGULATORIO — VAD (ENRE)');
const R_WENRE       = pParam('WACC Reconocido ENRE', 9.99, '%');
const R_RCAPM       = pParam('CAPEX Medidor Reconocido Fase 1', 151, 'USD/und');
const R_MLIFE       = pParam('Vida Útil Regulatoria Medidor', 25, 'años');
const R_ITLIF       = pParam('Vida Útil Regulatoria Plataforma IT', 10, 'años');
const R_ENRES       = pParam('Subsidio ENRE IT', 5_000_000, 'USD');

// ╔══════════════════════════════════════════════════════════╗
// ║  HOJA 2 — FLUJO DE FONDOS                               ║
// ╚══════════════════════════════════════════════════════════╝

const ff = wb.addWorksheet('Flujo de Fondos');
const YEARS = 10;

ff.getColumn(1).width = 48;
for (let c = 2; c <= YEARS + 2; c++) ff.getColumn(c).width = 17;

// Column letter helpers
function col(y: number) { return String.fromCharCode(65 + y + 1); } // y=0→B, y=1→C …

// Row counter
let row = 0;

function nextRow() { row++; return row; }

// ── Header ──────────────────────────────────────────────────
nextRow();
const hRow = ff.getRow(row);
hRow.height = 24;
['Concepto / Fórmula', ...Array.from({length: YEARS+1}, (_, y) => `Año ${y}`)].forEach((v, i) => {
  const c = hRow.getCell(i + 1);
  c.value = v;
  cellStyle(c, { bold: true, color: COLORS.white, bg: COLORS.headerDark, hAlign: 'center', border: true });
});

// ── Section row helper ────────────────────────────────────────
function sectionRow(label: string, color: string): number {
  nextRow();
  ff.mergeCells(row, 1, row, YEARS + 2);
  const c = ff.getCell(row, 1);
  c.value = label;
  cellStyle(c, { bold: true, color: COLORS.white, bg: color });
  ff.getRow(row).height = 18;
  return row;
}

// ── Data row helpers ──────────────────────────────────────────
function dataRow(
  label: string,
  formulas: string[],
  opts: { numFmt?: string; bg?: string; textColor?: string; bold?: boolean; indent?: boolean } = {}
): number {
  nextRow();
  const r = ff.getRow(row);
  r.height = 18;
  const lc = r.getCell(1);
  lc.value = opts.indent ? `  └ ${label}` : label;
  if (opts.bg) cellStyle(lc, { bg: opts.bg, bold: opts.bold, color: opts.textColor });
  else if (opts.bold) lc.font = { bold: true };

  formulas.forEach((f, y) => {
    const cell = r.getCell(y + 2);
    if (f === '0' || f === '') {
      cell.value = 0;
    } else {
      (cell as any).value = { formula: f };
    }
    cell.numFmt = opts.numFmt ?? '#,##0';
    cell.alignment = { horizontal: 'right', vertical: 'middle' };
    if (opts.bg) cellStyle(cell, { bg: opts.bg, color: opts.textColor });
  });
  return row;
}

function blankRow() { nextRow(); ff.getRow(row).height = 8; }

// ╔══════════════════════════════════════════════════════════╗
// ║  BLOQUE: DESPLIEGUE                                     ║
// ╚══════════════════════════════════════════════════════════╝
sectionRow('DESPLIEGUE DE MEDIDORES', COLORS.sectionDep);

const smInsF = Array.from({length: YEARS+1}, (_, y) => {
  if (y === 0) return '0';
  if (y === 1) return P(R_RAMP1);
  return `(${P(R_ENDPOINTS)}-${P(R_RAMP1)})/(${P(R_HORIZON)}-1)`;
});
const ROW_SMINS = dataRow('SM Instalados en el Año', smInsF, { bg: COLORS.subNet, indent: true });

const smAcF = Array.from({length: YEARS+1}, (_, y) => {
  if (y === 0) return '0';
  return `SUM(${col(0)}${ROW_SMINS}:${col(y)}${ROW_SMINS})`;
});
const ROW_SMAC = dataRow('SM Acumulados (Total Red)', smAcF, { bg: COLORS.subNet, indent: true });

const avF = Array.from({length: YEARS+1}, (_, y) => {
  if (y === 0) return '0';
  return `${col(y)}${ROW_SMAC}/${P(R_ENDPOINTS)}`;
});
const ROW_AV = dataRow('Avance del Despliegue', avF, { numFmt: '0.0%', bg: COLORS.subNet, indent: true });

blankRow();

// ╔══════════════════════════════════════════════════════════╗
// ║  BLOQUE: CAPEX                                          ║
// ╚══════════════════════════════════════════════════════════╝
sectionRow('CAPEX — INVERSIÓN', COLORS.sectionCap);

// IT and PM
const itPctRefs = [R_ITY0, R_ITY1, R_ITY2, R_ITY3, 0, 0];
const capexITF = Array.from({length: YEARS+1}, (_, y) => {
  if (y === 0) return `${P(itPctRefs[0])}/100*${P(R_IT)}+${P(R_PM)}`;
  if (y <= 3) return `${P(itPctRefs[y])}/100*${P(R_IT)}`;
  return '0';
});
const ROW_CIT = dataRow('CAPEX IT y PM', capexITF, { bg: COLORS.subCapex, indent: true });

// Hardware
const mCost = `((1-${P(R_T2T3)}/100)*${P(R_MT1)}+(${P(R_T2T3)}/100)*${P(R_MT2T3)})`;
const cCost = `((${P(R_WISUN)}/100)*${P(R_CW)}+(${P(R_PLC)}/100)*${P(R_CP)}+((100-${P(R_WISUN)}-${P(R_PLC)})/100)*${P(R_CP2P)})`;
const capexHWF = Array.from({length: YEARS+1}, (_, y) => {
  if (y === 0) return '0';
  return `${col(y)}${ROW_SMINS}*(${mCost}+${cCost})`;
});
const ROW_CHW = dataRow('CAPEX Hardware (Medidores + Módulos Comms)', capexHWF, { bg: COLORS.subCapex, indent: true });

// Instalación y logística
const capexInstF = Array.from({length: YEARS+1}, (_, y) => {
  if (y === 0) return '0';
  return `${col(y)}${ROW_SMINS}*(${P(R_INST)}+${P(R_LOG)})`;
});
const ROW_CINST = dataRow('CAPEX Instalación y Logística', capexInstF, { bg: COLORS.subCapex, indent: true });

// Infraestructura
const capexInfF = Array.from({length: YEARS+1}, (_, y) => {
  if (y === 0) return '0';
  const sm = `${col(y)}${ROW_SMINS}`;
  return `(${sm}*${P(R_PLC)}/100)/${P(R_CONCR)}*${P(R_CONC)}+(${sm}*${P(R_WISUN)}/100)/${P(R_FPR)}*${P(R_FP)}`;
});
const ROW_CINF = dataRow('CAPEX Infraestructura (Nodos de Red)', capexInfF, { bg: COLORS.subCapex, indent: true });

// CAPEX TOTAL
const capexTotF = Array.from({length: YEARS+1}, (_, y) =>
  `${col(y)}${ROW_CIT}+${col(y)}${ROW_CHW}+${col(y)}${ROW_CINST}+${col(y)}${ROW_CINF}`);
const ROW_CTOT = dataRow('CAPEX TOTAL', capexTotF, { bg: COLORS.subCapex, bold: true });

blankRow();

// ╔══════════════════════════════════════════════════════════╗
// ║  BLOQUE: OPEX                                           ║
// ╚══════════════════════════════════════════════════════════╝
sectionRow('OPEX — COSTOS OPERATIVOS', COLORS.sectionOpex);

const opexItems = [
  { label: 'Mantenimiento IT', f: (y:number) => y >= 1 ? P(R_MAINT) : '0' },
  { label: 'Licencias SaaS', f: (y:number) => y >= 1 ? P(R_SAAS) : '0' },
  { label: 'Administración y Soporte (Personal)', f: (y:number) => y >= 1 ? P(R_ADMIN) : '0' },
  { label: 'Telecomunicaciones P2P (var. según red activa)',
    f: (y:number) => y >= 1
      ? `${col(y)}${ROW_SMAC}*((100-${P(R_WISUN)}-${P(R_PLC)})/100)*${P(R_TMOM)}*12`
      : '0' },
  { label: 'Cloud (base mensual fija)', f: (y:number) => y >= 1 ? `${P(R_CLOUD)}*12` : '0' },
];
const opexSubRows: number[] = [];
for (const o of opexItems) {
  opexSubRows.push(dataRow(o.label, Array.from({length:YEARS+1},(_,y)=>o.f(y)), { bg: COLORS.subOpex, indent: true }));
}
const opexTotF = Array.from({length:YEARS+1}, (_, y) =>
  opexSubRows.map(r => `${col(y)}${r}`).join('+'));
const ROW_OTOT = dataRow('OPEX TOTAL', opexTotF, { bg: COLORS.subOpex, bold: true });

blankRow();

// ╔══════════════════════════════════════════════════════════╗
// ║  BLOQUE: BENEFICIOS                                     ║
// ╚══════════════════════════════════════════════════════════╝
sectionRow('BENEFICIOS — SAVINGS OPERACIONALES Y REGULATORIOS', COLORS.sectionBen);

const av = (y:number) => `${col(y)}${ROW_AV}`;

const benItems = [
  { label: 'Lecturas Manuales Evitadas',
    f: (y:number) => y<1?'0':`${P(R_RVOL)}*${P(R_RCOST)}*${av(y)}` },
  { label: 'Cortes y Reposiciones Remotas (cuadrilla evitada)',
    f: (y:number) => y<1?'0':`(${P(R_CUTS)}+${P(R_REPOS)})*${P(R_DISP)}*${av(y)}` },
  { label: 'Visitas Improductivas + Reiterativas + Calidad Evitadas',
    f: (y:number) => y<1?'0':`(${P(R_UNPR)}+${P(R_REIT)}+${P(R_QUAL)})*${P(R_GDISP)}*${av(y)}` },
  { label: 'Reducción Multas SAIDI (minutos × penalidad)',
    f: (y:number) => y<1?'0':`${P(R_SAIDI)}*(${P(R_SAIXR)}/100)*${P(R_FMIN)}*${av(y)}` },
  { label: 'Reducción Multas por Estimación',
    f: (y:number) => y<1?'0':`${P(R_ESTF)}*${av(y)}` },
  { label: 'Reducción Multas Apartamiento (Calidad de Producto)',
    f: (y:number) => y<1?'0':`${P(R_APB)}*(${P(R_APRI)}/100)*${av(y)}` },
  { label: 'Reducción Multas de Incumplimiento Regulatorio',
    f: (y:number) => y<1?'0':`${P(R_NCB)}*(${P(R_NCRI)}/100)*${av(y)}` },
  { label: 'Reducción Reclamos y Llamadas Call Center',
    f: (y:number) => y<1?'0':`(${P(R_BCLM)}+${P(R_INBC)})*${P(R_CCOST)}*${av(y)}` },
  { label: 'Reducción Resarcimientos por Artefactos Quemados',
    f: (y:number) => y<1?'0':`${P(R_DMGB)}*(${P(R_DMGR)}/100)*${av(y)}` },
  { label: 'Recupero Pérdidas No Técnicas / Fraude',
    f: (y:number) => y<1?'0':`${P(R_NTL)}*(${P(R_RECR)}/100)*MAX(0,${P(R_TARIFF)}-${P(R_WHLSL)})*${av(y)}` },
];
const benSubRows: number[] = [];
for (const b of benItems) {
  benSubRows.push(dataRow(b.label, Array.from({length:YEARS+1},(_,y)=>b.f(y)), { bg: COLORS.subBen, indent: true }));
}
const benTotF = Array.from({length:YEARS+1}, (_, y) =>
  benSubRows.map(r=>`${col(y)}${r}`).join('+'));
const ROW_BTOT = dataRow('BENEFICIOS TOTALES', benTotF, { bg: COLORS.subBen, bold: true });

blankRow();

// ╔══════════════════════════════════════════════════════════╗
// ║  BLOQUE: VAD                                            ║
// ╚══════════════════════════════════════════════════════════╝
sectionRow('INGRESOS VAD — RECONOCIMIENTO TARIFARIO ENRE', COLORS.sectionVad);

// VAD IT cohorts (Y0 neto de subsidio, Y1, Y2, Y3)
function itCapexExpr(cy: number) {
  const refs: Record<number, number> = {0:R_ITY0, 1:R_ITY1, 2:R_ITY2, 3:R_ITY3};
  if (cy === 0) return `MAX(0,${P(refs[0])}/100*${P(R_IT)}-${P(R_ENRES)})`;
  return `${P(refs[cy])}/100*${P(R_IT)}`;
}

function vadITCohort(capexExpr: string, cy: number, ey: number): string {
  const age = ey - cy;
  if (age < 0 || age >= 10) return '0';
  return `(${capexExpr}/${P(R_ITLIF)}+(${capexExpr}-${capexExpr}*${age}/${P(R_ITLIF)})*${P(R_WENRE)}/100)`;
}

const vadITF = Array.from({length:YEARS+1}, (_, y) => {
  const parts = [0,1,2,3].map(k => vadITCohort(itCapexExpr(k), k, y)).filter(p => p!=='0');
  return parts.length ? parts.join('+') : '0';
});
const ROW_VDIT = dataRow('VAD IT (Amortización + Retorno RAB — Plataforma)', vadITF, { bg: COLORS.subVad, indent: true });

function vadMeterCohort(cy: number, ey: number): string {
  if (ey < cy || ey - cy >= 25) return '0';
  const age = ey - cy;
  const smCell = `${col(cy)}${ROW_SMINS}`;
  let capU: string;
  if (cy <= 3) {
    capU = P(R_RCAPM);
  } else {
    capU = `(${mCost}+${cCost}+${P(R_INST)})`;
  }
  const cohCap = `(${smCell}*${capU})`;
  return `(${cohCap}/${P(R_MLIFE)}+(${cohCap}-${cohCap}*${age}/${P(R_MLIFE)})*${P(R_WENRE)}/100)`;
}

const vadMetF = Array.from({length:YEARS+1}, (_, y) => {
  const parts: string[] = [];
  for (let k = 1; k <= Math.min(y, YEARS); k++) {
    const f = vadMeterCohort(k, y);
    if (f !== '0') parts.push(f);
  }
  return parts.length ? parts.join('+') : '0';
});
const ROW_VDMT = dataRow('VAD Medidores (Amortización + Retorno RAB — por Cohorte)', vadMetF, { bg: COLORS.subVad, indent: true });

const vadTotF = Array.from({length:YEARS+1}, (_, y) =>
  `${col(y)}${ROW_VDIT}+${col(y)}${ROW_VDMT}`);
const ROW_VTOT = dataRow('INGRESOS VAD TOTALES', vadTotF, { bg: COLORS.subVad, bold: true, textColor: COLORS.white });

blankRow();

// ╔══════════════════════════════════════════════════════════╗
// ║  BLOQUE: FLUJO DE CAJA                                  ║
// ╚══════════════════════════════════════════════════════════╝
sectionRow('FLUJO DE CAJA', COLORS.sectionNet);

const fcfF = Array.from({length:YEARS+1}, (_, y) =>
  `${col(y)}${ROW_BTOT}+${col(y)}${ROW_VTOT}-${col(y)}${ROW_OTOT}-${col(y)}${ROW_CTOT}`);
const ROW_FCF = dataRow('Flujo de Caja Libre (FCF)', fcfF, { bg: COLORS.subNet, bold: true });

const dFcfF = Array.from({length:YEARS+1}, (_, y) =>
  `${col(y)}${ROW_FCF}/(1+${P(R_WACC)}/100)^${y}`);
const ROW_DFCF = dataRow('FCF Descontado al WACC del Proyecto', dFcfF, { bg: COLORS.subNet, indent: true });

const npvCumF = Array.from({length:YEARS+1}, (_, y) =>
  y === 0 ? `${col(0)}${ROW_DFCF}` : `SUM(${col(0)}${ROW_DFCF}:${col(y)}${ROW_DFCF})`);
const ROW_VPN = dataRow('VPN Acumulado', npvCumF, { bg: COLORS.subNet, indent: true });

// Freeze & autofilter
ff.views = [{ state: 'frozen', xSplit: 1, ySplit: 1, topLeftCell: 'B2', activeCell: 'B2' }];

// ╔══════════════════════════════════════════════════════════╗
// ║  HOJA 3 — INDICADORES FINANCIEROS                       ║
// ╚══════════════════════════════════════════════════════════╝
const ind = wb.addWorksheet('Indicadores');
ind.getColumn(1).width = 36;
ind.getColumn(2).width = 24;
ind.getColumn(3).width = 48;

// Header
nextRow(); // reset not needed — ind is separate
let iRow = 0;
function iNextRow() { iRow++; return iRow; }

function iHeader(title: string) {
  iNextRow();
  ind.mergeCells(iRow, 1, iRow, 3);
  const c = ind.getCell(iRow, 1);
  c.value = title;
  cellStyle(c, { bold: true, color: COLORS.white, bg: COLORS.headerDark, size: 12 });
  ind.getRow(iRow).height = 28;
}

function iSection(label: string) {
  iNextRow();
  ind.mergeCells(iRow, 1, iRow, 3);
  const c = ind.getCell(iRow, 1);
  c.value = label;
  cellStyle(c, { bold: true, italic: true, color: COLORS.headerDark, bg: COLORS.sectionRow });
  ind.getRow(iRow).height = 18;
}

function iBlank() { iNextRow(); ind.getRow(iRow).height = 8; }

function iKPI(
  label: string,
  formula: string,
  numFmt: string,
  description: string,
  bg = COLORS.kpiNeutral
): number {
  iNextRow();
  const r = ind.getRow(iRow);
  r.height = 22;
  const lc = r.getCell(1);
  lc.value = label;
  cellStyle(lc, { bold: true, bg, border: true });

  const vc = r.getCell(2);
  if (formula) {
    (vc as any).value = { formula };
  } else {
    vc.value = '—';
  }
  vc.numFmt = numFmt;
  cellStyle(vc, { bold: true, bg, border: true, hAlign: 'center', size: 12 });

  const dc = r.getCell(3);
  dc.value = description;
  cellStyle(dc, { italic: true, wrap: true, bg: COLORS.white, border: true });

  return iRow;
}

function iDetail(label: string, formula: string, numFmt: string, description: string) {
  iNextRow();
  const r = ind.getRow(iRow);
  r.height = 18;
  r.getCell(1).value = `  └ ${label}`;

  const vc = r.getCell(2);
  (vc as any).value = { formula };
  vc.numFmt = numFmt;
  vc.alignment = { horizontal: 'right', vertical: 'middle' };

  r.getCell(3).value = description;
  cellStyle(r.getCell(3), { italic: true });
}

// Referencias de la hoja Flujo de Fondos
// Usamos la fila ROW_FCF (array de flujos) para la TIR y demás cálculos
// FCFs están en celdas B{ROW_FCF}:L{ROW_FCF} de la hoja Flujo de Fondos
const fcfRange = `'Flujo de Fondos'!${col(0)}${ROW_FCF}:${col(YEARS)}${ROW_FCF}`;
const vtotRange = `'Flujo de Fondos'!${col(0)}${ROW_VTOT}:${col(YEARS)}${ROW_VTOT}`;
const ctotRange = `'Flujo de Fondos'!${col(0)}${ROW_CTOT}:${col(YEARS)}${ROW_CTOT}`;
const ototRange = `'Flujo de Fondos'!${col(0)}${ROW_OTOT}:${col(YEARS)}${ROW_OTOT}`;
const btotRange = `'Flujo de Fondos'!${col(0)}${ROW_BTOT}:${col(YEARS)}${ROW_BTOT}`;
const vpnFinal  = `'Flujo de Fondos'!${col(YEARS)}${ROW_VPN}`;

// Title
iHeader('📊 INDICADORES FINANCIEROS — AMI Baseline (Edesur 2026)');
iBlank();
iNextRow();
ind.getRow(iRow).getCell(1).value = `Horizonte: ${YEARS} años | WACC: 14.2% | Medidores: 2.700.000 | Curva: Lineal`;
cellStyle(ind.getRow(iRow).getCell(1), { italic: true, color: 'FF666666' });
iBlank();

// ── VPN ──────────────────────────────────────────────────────
iSection('1. VALOR PRESENTE NETO (VPN)');
iKPI(
  'VPN del Proyecto',
  vpnFinal,
  '#,##0 "USD"',
  'Suma de todos los FCF anuales descontados al WACC (14.2%). Un VPN > 0 indica que el proyecto crea valor por encima del costo de capital.',
  COLORS.kpiGood
);
iDetail('CAPEX Total Nominal (sin descontar)', `SUM(${ctotRange})`, '#,##0 "USD"',
  'Inversión total ejecutada a lo largo del horizonte.');
iDetail('OPEX Total Nominal (sin descontar)', `SUM(${ototRange})`, '#,##0 "USD"',
  'Costos operativos acumulados del proyecto.');
iDetail('Beneficios Totales Nominales', `SUM(${btotRange})`, '#,##0 "USD"',
  'Suma de todos los savings operacionales y regulatorios (sin descontar).');
iDetail('Ingresos VAD Totales Nominales', `SUM(${vtotRange})`, '#,##0 "USD"',
  'Flujos de ingreso tarifario reconocidos por el ENRE (sin descontar).');
iBlank();

// ── TIR ──────────────────────────────────────────────────────
iSection('2. TASA INTERNA DE RETORNO (TIR / IRR)');
iKPI(
  'TIR del Proyecto',
  `IRR(${fcfRange})`,
  '0.00%',
  'Tasa que hace el VPN = 0. Se calcula con IRR() de Excel sobre los FCF anuales (Año 0 a Año 10). Debe compararse contra el WACC (14.2%): TIR > WACC → proyecto viable.',
  COLORS.kpiGood
);
iDetail('WACC del Proyecto (umbral mínimo)', P(R_WACC), '0.00"%"', 'Si TIR > WACC → el proyecto supera el costo de capital.');
iDetail('Spread TIR - WACC', `IRR(${fcfRange})-${P(R_WACC)}/100`, '0.00%',
  'Cuánto supera la TIR al costo de capital. Spread positivo = creación de valor.');
iBlank();

// ── ROI ──────────────────────────────────────────────────────
iSection('3. RETORNO SOBRE LA INVERSIÓN (ROI)');
// ROI = (TotalInflows - TotalCapex) / TotalCapex
// TotalInflows = SUM(Benefits + VAD - OPEX)
const totalInflows = `(SUM(${btotRange})+SUM(${vtotRange})-SUM(${ototRange}))`;
const totalCapex   = `SUM(${ctotRange})`;
iKPI(
  'ROI Nominal del Proyecto',
  `(${totalInflows}-${totalCapex})/${totalCapex}`,
  '0.00%',
  `ROI = (Ingresos Totales Netos de OPEX - CAPEX Total) / CAPEX Total. Mide cuánto retorna el proyecto sobre cada USD invertido, en términos nominales (sin descontar).`,
  COLORS.kpiNeutral
);
iDetail('Total Ingresos Netos de OPEX (nominales)', totalInflows, '#,##0 "USD"',
  'Suma de Beneficios + VAD - OPEX a lo largo de todo el horizonte.');
iDetail('Total CAPEX (nominal)', totalCapex, '#,##0 "USD"', 'Inversión total ejecutada.');
iBlank();

// ── PI ────────────────────────────────────────────────────────
iSection('4. ÍNDICE DE RENTABILIDAD (Profitability Index — PI)');
// PI = PV(Inflows) / PV(Outflows)
// PV inflows = sum of (ben+vad-opex)/(1+wacc)^t
// PV outflows = sum of capex/(1+wacc)^t
// We reference the discounted FCF and discounted CAPEX rows
// Since we have dFCF = (ben+vad-opex-capex)/(1+wacc)^t, we need to build it differently
// Easier: PI = (VPN + PV_Capex) / PV_Capex
// PV_Capex = SUM of capex_t/(1+wacc)^t  — we compute it inline
let pvCapexParts = [];
for (let y = 0; y <= YEARS; y++) {
  pvCapexParts.push(`'Flujo de Fondos'!${col(y)}${ROW_CTOT}/(1+${P(R_WACC)}/100)^${y}`);
}
const pvCapex = `(${pvCapexParts.join('+')})`;
iKPI(
  'Profitability Index (PI)',
  `(${vpnFinal}+${pvCapex})/${pvCapex}`,
  '0.000',
  'PI = VP(Ingresos Netos) / VP(CAPEX). PI > 1 indica que el valor presente de los ingresos supera el valor presente de las inversiones. Un PI = 1.3 significa que por cada USD invertido, se generan USD 1.30 en valor descontado.',
  COLORS.kpiNeutral
);
iDetail('VP del CAPEX Total (descontado)', pvCapex, '#,##0 "USD"',
  'Valor presente de todas las inversiones de capital.');
iDetail('VP de Ingresos Netos (descontado)', `${vpnFinal}+${pvCapex}`, '#,##0 "USD"',
  'VP(Beneficios + VAD - OPEX).');
iBlank();

// ── PAYBACK ───────────────────────────────────────────────────
iSection('5. PERÍODO DE RECUPERO (Payback)');

// Para cada año, mostrar el VPN acumulado y si es positivo, se recuperó
// Payback simple: primer año donde VPN acumulado >= 0
// En Excel podemos usar MATCH para encontrarlo

// Create a helper block showing cumulative FCF and cumulative discounted FCF
iNextRow();
const paybackHeaderRow = iRow;
['Año', 'FCF Año', 'FCF Acumulado (nominal)', 'FCF Acumulado (descontado)'].forEach((v, i) => {
  const c = ind.getCell(iRow, i + 1);
  if (i < 4) {
    c.value = v;
    cellStyle(c, { bold: true, color: COLORS.white, bg: COLORS.headerMid, hAlign: 'center', border: true });
  }
});

// Extra columns for payback table (years 0-10 as rows)
const pbFcfRows: number[] = [];
const pbCumRows: number[] = [];
const pbDCumRows: number[] = [];

for (let y = 0; y <= YEARS; y++) {
  iNextRow();
  ind.getRow(iRow).getCell(1).value = `Año ${y}`;
  cellStyle(ind.getRow(iRow).getCell(1), { hAlign: 'center' });

  const fcfCell = ind.getRow(iRow).getCell(2);
  (fcfCell as any).value = { formula: `'Flujo de Fondos'!${col(y)}${ROW_FCF}` };
  fcfCell.numFmt = '#,##0';
  fcfCell.alignment = { horizontal: 'right' };

  const cumCell = ind.getRow(iRow).getCell(3);
  if (y === 0) {
    (cumCell as any).value = { formula: `'Flujo de Fondos'!${col(0)}${ROW_FCF}` };
  } else {
    (cumCell as any).value = { formula: `C${iRow - 1}+'Flujo de Fondos'!${col(y)}${ROW_FCF}` };
  }
  cumCell.numFmt = '#,##0';
  cumCell.alignment = { horizontal: 'right' };
  // Color rojo si negativo, verde si positivo
  cumCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.subBen } };

  const dcumCell = ind.getRow(iRow).getCell(4);
  if (y === 0) {
    (dcumCell as any).value = { formula: `'Flujo de Fondos'!${col(0)}${ROW_DFCF}` };
  } else {
    (dcumCell as any).value = { formula: `D${iRow - 1}+'Flujo de Fondos'!${col(y)}${ROW_DFCF}` };
  }
  dcumCell.numFmt = '#,##0';
  dcumCell.alignment = { horizontal: 'right' };

  pbFcfRows.push(iRow);
  pbCumRows.push(iRow);
  pbDCumRows.push(iRow);
}

// Payback summary
iBlank();

// Simple payback: primer año donde FCF acumulado >= 0
const cumRange = `C${pbCumRows[0]}:C${pbCumRows[YEARS]}`;
const dcumRange = `D${pbDCumRows[0]}:D${pbDCumRows[YEARS]}`;

iKPI(
  'Payback Simple (años)',
  `MATCH(TRUE,${cumRange}>=0,0)-1`,
  '0 "años"',
  'Primer año en el que el FCF acumulado nominal es mayor o igual a cero. Indica cuándo se recupera la inversión en términos corrientes.',
  COLORS.kpiNeutral
);

iKPI(
  'Payback Descontado (años)',
  `MATCH(TRUE,${dcumRange}>=0,0)-1`,
  '0 "años"',
  'Primer año en el que el VPN acumulado (FCF descontado al WACC) es mayor o igual a cero. Es el indicador más conservador de recupero.',
  COLORS.kpiNeutral
);

iBlank();

// ── COSTOS UNITARIOS ──────────────────────────────────────────
iSection('6. MÉTRICAS UNITARIAS POR MEDIDOR');
iKPI(
  'CAPEX por Medidor (promedio)',
  `${totalCapex}/${P(R_ENDPOINTS)}`,
  '#,##0.00 "USD/SM"',
  'Costo de inversión total dividido por el total de medidores instalados. Incluye hardware, instalación, IT e infraestructura.',
  COLORS.kpiNeutral
);
iKPI(
  'Beneficio por Medidor (régimen anual)',
  `(SUM(${btotRange})+SUM(${vtotRange}))/${P(R_ENDPOINTS)}/${P(R_HORIZON)}`,
  '#,##0.00 "USD/SM/año"',
  'Savings anuales en régimen por cada medidor activo en la red. Mide la "productividad económica" de cada punto de medición.',
  COLORS.kpiNeutral
);
iKPI(
  'OPEX por Medidor en Régimen',
  `SUM(${ototRange})/${P(R_ENDPOINTS)}/${P(R_HORIZON)}`,
  '#,##0.00 "USD/SM/año"',
  'Costo operativo anual por medidor activo (telecom, cloud, mantenimiento, etc.).',
  COLORS.kpiNeutral
);
iBlank();

// ── RESUMEN EJECUTIVO ─────────────────────────────────────────
iSection('7. RESUMEN EJECUTIVO — SEMÁFORO');
iNextRow();
const sfRow = iRow;
[
  ['Indicador', 'Valor', 'Referencia / Umbral'],
  ['VPN', vpnFinal, '> 0 USD → Proyecto crea valor'],
  ['TIR', `IRR(${fcfRange})`, `> ${P(R_WACC)}/100 → supera el WACC`],
  ['ROI Nominal', `(${totalInflows}-${totalCapex})/${totalCapex}`, '> 0% → Rentable sobre el capital'],
  ['PI', `(${vpnFinal}+${pvCapex})/${pvCapex}`, '> 1.0 → VP ingresos supera VP inversión'],
  ['Payback Descontado', `MATCH(TRUE,${dcumRange}>=0,0)-1`, `< ${P(R_HORIZON)} años (horizonte del proyecto)`],
].forEach((rowData, ri) => {
  iNextRow();
  const r = ind.getRow(iRow);
  r.height = 20;
  const numFmts = ['', '#,##0 "USD"', '0.00%', '0.00%', '0.000', '0 "años"'];
  rowData.forEach((v, ci) => {
    const c = r.getCell(ci + 1);
    if (ri === 0) {
      c.value = v;
      cellStyle(c, { bold: true, color: COLORS.white, bg: COLORS.headerDark, border: true, hAlign: 'center' });
    } else {
      if (ci === 0) {
        c.value = v;
        cellStyle(c, { bold: true, bg: COLORS.kpiNeutral, border: true });
      } else if (ci === 1) {
        if (ri > 0 && typeof v === 'string' && v.startsWith('I') || v.startsWith('(') || v.startsWith('M') || v.startsWith("'")) {
          (c as any).value = { formula: v };
          c.numFmt = numFmts[ri] || '#,##0';
        } else {
          c.value = v;
        }
        cellStyle(c, { bold: true, bg: COLORS.kpiGood, border: true, hAlign: 'center' });
      } else {
        c.value = v;
        cellStyle(c, { italic: true, border: true });
      }
    }
  });
});

// Freeze top row of indicators sheet
ind.views = [{ state: 'frozen', xSplit: 0, ySplit: 1, topLeftCell: 'A2', activeCell: 'A2' }];

// ── Column widths for indicators sheet ──
ind.getColumn(1).width = 38;
ind.getColumn(2).width = 22;
ind.getColumn(3).width = 60;
ind.getColumn(4).width = 22;

// ╔══════════════════════════════════════════════════════════╗
// ║  GUARDAR                                                ║
// ╚══════════════════════════════════════════════════════════╝

await wb.xlsx.writeFile(OUT);
console.log('✅ Archivo Excel generado: ' + OUT);
