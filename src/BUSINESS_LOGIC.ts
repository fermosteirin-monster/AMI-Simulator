// BUSINESS_LOGIC.ts – Motor de cálculo financiero AMI
// Cero backend: todas las fórmulas corren en el browser.

import type { Scenario, YearlyProjection } from './DATA_MODEL';

// ── Helpers ────────────────────────────────────────────────────────────────

/** p2pPct derivado: 100 − wiSun − plc (mínimo 0) */
export function deriveP2pPct(wiSunPct: number, plcPct: number): number {
  return Math.max(0, 100 - wiSunPct - plcPct);
}

// ── Curvas de despliegue ───────────────────────────────────────────────────

/**
 * Devuelve un array [year0, year1, ..., yearN] con los medidores instalados
 * cada año según la curva seleccionada.
 *
 * Año 0 = 0 (inversión IT / PM pre-operativa)
 * Año 1 = 100.000 (ramp-up inicial fijo — igual para todas las curvas)
 * Años 2..N:
 *
 *   'slow'        → cuadrática anclada: year1 + b*(y-1)²  — crece lentamente desde year1
 *   'accelerated' → rampa aritmética:  year1 + (y-1)*δ  — incremento constante cada año
 *   'linear'      → tasa constante:    (total-year1)/(N-1) — mismo volumen años 2..N
 *
 * Las tres curvas son estrictamente monotonamente crecientes y suman totalEndpoints.
 */
export function getDeploymentSchedule(scenario: Scenario): number[] {
  const { totalEndpoints, analysisHorizonYears, deploymentCurve } = scenario.global;
  const horizon = analysisHorizonYears;
  const schedule = new Array(horizon + 1).fill(0);

  if (totalEndpoints <= 0 || horizon <= 0) return schedule;

  const INITIAL_RAMP = 100_000;
  const year1 = Math.min(INITIAL_RAMP, totalEndpoints);
  schedule[1] = year1;

  const remaining = totalEndpoints - year1;
  const remainingYears = horizon - 1; // años 2..N

  if (remaining <= 0 || remainingYears <= 0) return schedule;

  switch (deploymentCurve) {
    case 'linear': {
      // Tasa constante: el sobrante se distribuye igual en cada año 2..N
      const perYear = remaining / remainingYears;
      for (let y = 2; y <= horizon; y++) schedule[y] = perYear;
      break;
    }

    case 'accelerated': {
      // Rampa aritmética: schedule[y] = year1 + (y-1)*delta
      // year2 = year1 + delta > year1 siempre; incremento constante cada año
      // Σ = N*year1 + delta * N*(N-1)/2  => delta = (total - N*year1) / (N*(N-1)/2)
      const delta = remaining / (horizon * (horizon - 1) / 2);
      for (let y = 2; y <= horizon; y++) {
        schedule[y] = year1 + (y - 1) * delta;
      }
      break;
    }

    case 'slow': {
      // Cuadrática anclada: schedule[y] = year1 + b*(y-1)²
      // year2 = year1 + b  > year1 siempre; crece de forma paulatina
      // Σ = N*year1 + b * Σ_{j=1}^{N-1} j² = N*year1 + b*(N-1)*N*(2N-1)/6
      const sumSq = (horizon - 1) * horizon * (2 * horizon - 1) / 6;
      const b = remaining / sumSq;
      for (let y = 2; y <= horizon; y++) {
        schedule[y] = year1 + b * (y - 1) * (y - 1);
      }
      break;
    }
  }

  return schedule;
}

/** Acumulado de medidores desplegados [year0, year1, ..., yearN] */
export function getCumulativeDeployed(scenario: Scenario): number[] {
  const schedule = getDeploymentSchedule(scenario);
  let sum = 0;
  return schedule.map((v) => (sum += v));
}

// ── CAPEX ─────────────────────────────────────────────────────────────────

/**
 * CAPEX del año `year`:
 *   Año 0 → IT + PM (inversión pre-operativa)
 *   Años 1..N → hardware + comms (ponderado por mix) + infra proporcional
 */
export function calculateCapexForYear(scenario: Scenario, year: number): number {
  const { global, capex } = scenario;
  const { wiSunPct, plcPct } = global;
  const p2pPct = deriveP2pPct(wiSunPct, plcPct);

  // IT Integration distribuida según schedule (años 0–5)
  const itSchedulePcts = [
    capex.itScheduleY0 ?? 100,
    capex.itScheduleY1 ?? 0,
    capex.itScheduleY2 ?? 0,
    capex.itScheduleY3 ?? 0,
    capex.itScheduleY4 ?? 0,
    capex.itScheduleY5 ?? 0,
  ];
  const itCostThisYear = (year >= 0 && year <= 5)
    ? ((itSchedulePcts[year] ?? 0) / 100) * capex.itIntegrationCost
    : 0;

  if (year === 0) {
    // Pre-operativo: porción IT del año 0 + Project Management
    return itCostThisYear + capex.pmCost;
  }

  const schedule = getDeploymentSchedule(scenario);
  if (year < 1 || year >= schedule.length) return itCostThisYear;

  const metersThisYear = schedule[year];
  if (metersThisYear <= 0) return itCostThisYear;

  // Costo de comunicaciones ponderado por mix tecnológico
  const weightedCommsCost =
    (wiSunPct / 100) * capex.commsCostWiSun +
    (plcPct  / 100) * capex.commsCostPLC +
    (p2pPct  / 100) * capex.commsCostP2P;

  // Costo de medidor base ponderado por mix T1 vs T2/T3
  const t2t3Pct = global.t2t3Pct ?? 0;
  const t1Pct = Math.max(0, 100 - t2t3Pct);
  const weightedMeterCost = (t1Pct / 100) * capex.meterCostT1 + (t2t3Pct / 100) * capex.meterCostT2T3;

  // Costo de hardware + instalación por medidor
  const perMeterCost = weightedMeterCost + weightedCommsCost + capex.installCost;

  // Infraestructura proporcional a medidores de este año
  const plcMeters      = metersThisYear * (plcPct   / 100);
  const wiSunMeters    = metersThisYear * (wiSunPct / 100);
  const plcConcentrators    = plcMeters   / 250;
  const wiSunFocalPoints    = wiSunMeters / 5000;

  const infraCost =
    plcConcentrators  * capex.concentratorCostPLC +
    wiSunFocalPoints  * capex.focalPointCostWiSun;

  return metersThisYear * perMeterCost + infraCost + itCostThisYear;
}

// ── OPEX ──────────────────────────────────────────────────────────────────

/**
 * OPEX del año `year` (solo desde año 1).
 * Telecom M2M solo para medidores P2P activos acumulados.
 */
export function calculateOpexForYear(scenario: Scenario, year: number): number {
  if (year < 1) return 0;
  const { global, opex } = scenario;
  const p2pPct = deriveP2pPct(global.wiSunPct, global.plcPct);

  const cumulative = getCumulativeDeployed(scenario);
  const activeMeters = cumulative[year] ?? 0;
  const p2pActiveMeters = activeMeters * (p2pPct / 100);

  const telecomAnnual    = p2pActiveMeters * opex.telecomMonthly * 12;
  const cloudAnnual      = opex.cloudMonthly * 12;

  return telecomAnnual + cloudAnnual + opex.maintenanceAnnual + opex.saasAnnual + opex.adminAnnual;
}

// ── BENEFICIOS ────────────────────────────────────────────────────────────

/**
 * Beneficios del año `year`.
 * El progreso ya no es lineal (year/horizon) sino proporcional
 * al acumulado de medidores desplegados / totalEndpoints.
 */
export function calculateBenefitsForYear(scenario: Scenario, year: number): number {
  if (year < 1) return 0;
  const { global, benefits } = scenario;

  const cumulative = getCumulativeDeployed(scenario);
  const progress = global.totalEndpoints > 0
    ? Math.min(1, (cumulative[year] ?? 0) / global.totalEndpoints)
    : 0;

  // Palanca 0: Productividad — Visitas evitadas × costo cuadrilla de guardia
  // Cada campo representa el total de visitas a evitar al 100% del despliegue.
  // El impacto escala proporcionalmente con el avance del rollout (progress).
  const productivitySavings =
    (benefits.unproductiveVisitsAvoided +
     benefits.reiterativeVisitsAvoided +
     benefits.qualityVisitsAvoided) *
    benefits.guardDispatchCost * progress;

  // Palanca 1: Ahorro en lecturas y despachos
  const readingSavings   = benefits.manualReadsVolume * benefits.manualReadUnitCost * progress;
  const dispatchSavings  = (benefits.annualCutsVolume + benefits.annualReposVolume)
                           * benefits.dispatchCost * progress;

  // Palanca 2: Reducción multas SAIDI + estimaciones
  const saidiHoursSaved  = benefits.saidiHistoricalHours * (benefits.saidiTargetReduction / 100) * progress;
  const saidiBenefit     = saidiHoursSaved * benefits.finePerHour;
  const estFinesBenefit  = benefits.estFinesAnnual * progress;

  // Palanca 2b: Multas de Calidad de Producto (Aparcamiento + Incumplimiento)
  const qualityFinesBenefit =
    (benefits.parkingFineAnnual * ((benefits.parkingFineImprovement ?? 0) / 100) +
     benefits.nonComplianceFineAnnual * ((benefits.nonComplianceFineImprovement ?? 0) / 100)) *
    progress;

  // Palanca 3: Recuperación pérdidas no técnicas
  const mwhRecovered     = benefits.nonTechLossesMwh * (benefits.recoveryRateTarget / 100) * progress;
  const revenuePerMwh    = benefits.currentTariff - benefits.energyWholesaleCost;
  const fraudBenefit     = mwhRecovered * Math.max(0, revenuePerMwh);

  return productivitySavings + readingSavings + dispatchSavings + saidiBenefit + estFinesBenefit + qualityFinesBenefit + fraudBenefit;
}

// ── INGRESOS VAD (ENRE) ───────────────────────────────────────────────────

function calculateCohortVad(capex: number, cohortYear: number, evalYear: number, life: number, wacc: number): number {
  const age = evalYear - cohortYear;
  if (age < 0 || age >= life) return 0; // No instalada o totalmente amortizada
  
  const annualAmortization = capex / life;
  const remRAB = capex - (annualAmortization * age); // Base de Capital Remanente
  
  // VAD = Depreciación lineal + Retorno sobre Base de Capital Remanente
  return annualAmortization + remRAB * (wacc / 100);
}

export function calculateVadRevenueIT(scenario: Scenario, evalYear: number): number {
  if (evalYear < 0) return 0;
  const { capex } = scenario;
  const regulatory = scenario.regulatory || { waccEnrePhase1: 9.99, waccEnrePhase2: 9.99, recognizedMeterCapexPhase1: 126, meterRegulatoryLife: 25, itRegulatoryLife: 10, enreItSubsidy: 0 };
  const itLife = regulatory.itRegulatoryLife;
  let totalVad = 0;

  // Cohorte Año 0: descontar el subsidio ENRE
  const itCostY0 = (capex.itScheduleY0 ?? 100) / 100 * capex.itIntegrationCost;
  const eligibleY0 = Math.max(0, itCostY0 - regulatory.enreItSubsidy);
  totalVad += calculateCohortVad(eligibleY0, 0, evalYear, itLife, regulatory.waccEnrePhase1);

  // Cohortes Y1 a Y5 (si se configuró schedule distribuido)
  const itSchedule = [0, capex.itScheduleY1, capex.itScheduleY2, capex.itScheduleY3, capex.itScheduleY4, capex.itScheduleY5];
  for (let cohortYear = 1; cohortYear <= 5; cohortYear++) {
    const itCostYn = ((itSchedule[cohortYear] ?? 0) / 100) * capex.itIntegrationCost;
    if (itCostYn > 0) {
      totalVad += calculateCohortVad(itCostYn, cohortYear, evalYear, itLife, regulatory.waccEnrePhase1);
    }
  }

  return totalVad;
}

export function calculateVadRevenueMeters(scenario: Scenario, evalYear: number): number {
  if (evalYear <= 0) return 0;
  const { global, capex } = scenario;
  const regulatory = scenario.regulatory || { waccEnrePhase1: 9.99, waccEnrePhase2: 9.99, recognizedMeterCapexPhase1: 126, meterRegulatoryLife: 25, itRegulatoryLife: 10, enreItSubsidy: 0 };
  const schedule = getDeploymentSchedule(scenario);
  const meterLife = regulatory.meterRegulatoryLife;
  let totalVad = 0;

  for (let cohortYear = 1; cohortYear <= evalYear; cohortYear++) {
    if (cohortYear >= schedule.length) break;
    const metersInstalled = schedule[cohortYear];
    if (metersInstalled <= 0) continue;

    let cohortCapexUnit = 0;
    let cohortWacc = 0;

    if (cohortYear <= 4) { // Fase 1
      cohortCapexUnit = regulatory.recognizedMeterCapexPhase1;
      cohortWacc = regulatory.waccEnrePhase1;
    } else { // Fase 2
      const { wiSunPct, plcPct, t2t3Pct = 0 } = global;
      const p2pPct = deriveP2pPct(wiSunPct, plcPct);
      const weightedCommsCost =
        (wiSunPct / 100) * capex.commsCostWiSun +
        (plcPct  / 100) * capex.commsCostPLC +
        (p2pPct  / 100) * capex.commsCostP2P;
      
      const t1Pct = Math.max(0, 100 - t2t3Pct);
      const weightedMeterCost = (t1Pct / 100) * capex.meterCostT1 + (t2t3Pct / 100) * capex.meterCostT2T3;
      
      cohortCapexUnit = weightedMeterCost + weightedCommsCost + capex.installCost;
      cohortWacc = regulatory.waccEnrePhase2;
    }

    const cohortTotalCapex = metersInstalled * cohortCapexUnit;
    totalVad += calculateCohortVad(cohortTotalCapex, cohortYear, evalYear, meterLife, cohortWacc);
  }

  return totalVad;
}

// ── VPN TOTAL ─────────────────────────────────────────────────────────────

export function calculateNPV(scenario: Scenario): number {
  const r = scenario.global.wacc / 100;
  const horizon = scenario.global.analysisHorizonYears;
  let npv = 0;
  for (let t = 0; t <= horizon; t++) {
    const capex      = calculateCapexForYear(scenario, t);
    const opex       = calculateOpexForYear(scenario, t);
    const benefits   = calculateBenefitsForYear(scenario, t);
    const vadRevenue = calculateVadRevenueIT(scenario, t) + calculateVadRevenueMeters(scenario, t);
    npv += (benefits + vadRevenue - opex - capex) / Math.pow(1 + r, t);
  }
  return npv;
}

export function calculateROI(scenario: Scenario): number {
  const horizon = scenario.global.analysisHorizonYears;
  let totalCapex = 0;
  let totalInflows = 0; 
  
  for (let t = 0; t <= horizon; t++) {
    const capex = calculateCapexForYear(scenario, t);
    const opex = calculateOpexForYear(scenario, t);
    const benefits = calculateBenefitsForYear(scenario, t);
    const vad = calculateVadRevenueIT(scenario, t) + calculateVadRevenueMeters(scenario, t);
    
    totalCapex += capex;
    totalInflows += (benefits + vad - opex);
  }
  
  if (totalCapex === 0) return 0;
  return (totalInflows - totalCapex) / totalCapex;
}

export function calculatePI(scenario: Scenario): number {
  const r = scenario.global.wacc / 100;
  const horizon = scenario.global.analysisHorizonYears;
  
  let pvInflows = 0;
  let pvOutflows = 0;
  
  for (let t = 0; t <= horizon; t++) {
    const capex = calculateCapexForYear(scenario, t);
    const opex = calculateOpexForYear(scenario, t);
    const benefits = calculateBenefitsForYear(scenario, t);
    const vad = calculateVadRevenueIT(scenario, t) + calculateVadRevenueMeters(scenario, t);
    
    const discount = Math.pow(1 + r, t);
    pvOutflows += capex / discount;
    pvInflows += (benefits + vad - opex) / discount;
  }
  
  if (pvOutflows === 0) return 0;
  return pvInflows / pvOutflows;
}

function npvAtRate(scenario: Scenario, rate: number): number {
  const horizon = scenario.global.analysisHorizonYears;
  let npv = 0;
  for (let t = 0; t <= horizon; t++) {
    const capex = calculateCapexForYear(scenario, t);
    const opex = calculateOpexForYear(scenario, t);
    const benefits = calculateBenefitsForYear(scenario, t);
    const vad = calculateVadRevenueIT(scenario, t) + calculateVadRevenueMeters(scenario, t);
    npv += (benefits + vad - opex - capex) / Math.pow(1 + rate, t);
  }
  return npv;
}

export function calculateIRR(scenario: Scenario): number | null {
  let r0 = 0.05;
  let r1 = 0.15;
  const maxIter = 100;
  const tolerance = 1e-4;
  
  for (let i = 0; i < maxIter; i++) {
    const npv0 = npvAtRate(scenario, r0);
    const npv1 = npvAtRate(scenario, r1);
    
    if (Math.abs(npv1) < tolerance) return r1;
    if (Math.abs(npv0 - npv1) < 1e-10) break; 
    
    const r2 = r1 - npv1 * ((r1 - r0) / (npv1 - npv0));
    r0 = r1;
    r1 = r2;
  }
  
  // Si iteró sin converger o divergió
  return null;
}

// ── PROYECCIÓN COMPLETA ───────────────────────────────────────────────────

export function generateProjection(scenario: Scenario): YearlyProjection[] {
  const r = scenario.global.wacc / 100;
  const horizon = scenario.global.analysisHorizonYears;
  const schedule = getDeploymentSchedule(scenario);
  const cumulative = getCumulativeDeployed(scenario);

  let cumulativeNPV = 0;
  const result: YearlyProjection[] = [];

  for (let year = 0; year <= horizon; year++) {
    const capex      = calculateCapexForYear(scenario, year);
    const opex       = calculateOpexForYear(scenario, year);
    const benefits   = calculateBenefitsForYear(scenario, year);
    const vadRevenue = calculateVadRevenueIT(scenario, year) + calculateVadRevenueMeters(scenario, year);
    const netCashFlow = benefits + vadRevenue - opex - capex;
    const discountedFcf = netCashFlow / Math.pow(1 + r, year);
    cumulativeNPV += discountedFcf;

    result.push({
      year,
      metersDeployedThisYear: Math.round(schedule[year] ?? 0),
      installations: Math.round(schedule[year] ?? 0),
      cumulative: Math.round(cumulative[year] ?? 0),
      progress: scenario.global.totalEndpoints > 0
        ? Math.min(1, (cumulative[year] ?? 0) / scenario.global.totalEndpoints)
        : 0,
      capex,
      opex,
      benefits,
      vadRevenue,
      fcf: netCashFlow,
      discountedFcf,
      netCashFlow,
      cumulativeNPV
    });
  }

  return result;
}
