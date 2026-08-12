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
 * Año 1 = 100.000 (ramp-up inicial fijo)
 * Año N = ~200.000 (o proporcional al total)
 *
 * Curvas:
 *   'bell'    → Campana simétrica usando onda seno. Alcanza el máximo a mitad del proyecto.
 *   'plateau' → Meseta trapezoidal. Sube rápido, mantiene un peak estable, baja al final.
 *   'linear'  → Tasa constante (distribuye el remanente uniformemente).
 *
 * Las curvas son estrictamente controladas para que su suma sea exacta.
 */
export function getDeploymentSchedule(scenario: Scenario): number[] {
  const { totalEndpoints, deploymentHorizonYears, analysisHorizonYears, deploymentCurve } = scenario.global;
  const deployHorizon  = deploymentHorizonYears;
  const analysisHorizon = analysisHorizonYears;

  // El array siempre tiene tamaño (analysisHorizon + 1); las instalaciones
  // ocurren solo en los primeros deployHorizon años. El resto queda en 0.
  const schedule = new Array(analysisHorizon + 1).fill(0);

  if (totalEndpoints <= 0 || deployHorizon <= 0) return schedule;

  const INITIAL_RAMP = 100_000;
  // Para garantizar curvas monotónicamente crecientes sin dar negativo, year1 no puede exceder el promedio anual
  const year1 = Math.min(INITIAL_RAMP, totalEndpoints / deployHorizon);
  schedule[1] = year1;

  const remaining = totalEndpoints - year1;
  const remainingYears = deployHorizon - 1; // años 2..deployHorizon

  if (remaining <= 0 || remainingYears <= 0) return schedule;

  switch (deploymentCurve) {
    case 'linear': {
      const perYear = remaining / remainingYears;
      for (let y = 2; y <= deployHorizon; y++) schedule[y] = perYear;
      break;
    }

    case 'bell': {
      // Base lineal de Y1 a Y_deployHorizon
      const Y_N = Math.min(200_000, remaining / remainingYears);
      let sumBase = 0;
      const baseLine = new Array(deployHorizon + 1).fill(0);
      for (let y = 2; y <= deployHorizon; y++) {
        const progress = (y - 1) / remainingYears;
        baseLine[y] = year1 + progress * (Y_N - year1);
        sumBase += baseLine[y];
      }

      // Onda seno (campana) sobre la base
      let sumSine = 0;
      const sines = new Array(deployHorizon + 1).fill(0);
      for (let y = 2; y < deployHorizon; y++) {
        // En y=1 y y=deployHorizon el seno debe ser 0.
        const angle = Math.PI * (y - 1) / remainingYears;
        sines[y] = Math.sin(angle);
        sumSine += sines[y];
      }

      const extraNeeded = remaining - sumBase;
      const amplitude = sumSine > 0 ? extraNeeded / sumSine : 0;

      for (let y = 2; y <= deployHorizon; y++) {
        schedule[y] = Math.max(0, baseLine[y] + sines[y] * amplitude);
      }
      break;
    }

    case 'plateau': {
      // Meseta trapezoidal: sube rápido, mantiene (plateau), baja al final
      const Y_N = Math.min(200_000, remaining / remainingYears);
      
      let sumBase = 0;
      const baseLine = new Array(deployHorizon + 1).fill(0);
      for (let y = 2; y <= deployHorizon; y++) {
        const progress = (y - 1) / remainingYears;
        baseLine[y] = year1 + progress * (Y_N - year1);
        sumBase += baseLine[y];
      }
      
      const pShape = new Array(deployHorizon + 1).fill(0);
      let sumShape = 0;
      
      // Definimos los puntos de inflexión del trapecio (ramp-up y ramp-down del 20%)
      const r1 = Math.max(3, Math.round(1 + remainingYears * 0.2));
      const r2 = Math.min(deployHorizon - 1, Math.round(deployHorizon - remainingYears * 0.2));
      
      for (let y = 2; y <= deployHorizon; y++) {
        if (y < r1) {
          pShape[y] = (y - 1) / (r1 - 1); // Rampa de subida
        } else if (y <= r2) {
          pShape[y] = 1; // Meseta (Plateau)
        } else {
          pShape[y] = (deployHorizon - y) / (deployHorizon - r2); // Rampa de bajada
        }
        sumShape += pShape[y];
      }
      
      const extraNeeded = remaining - sumBase;
      const amplitude = sumShape > 0 ? extraNeeded / sumShape : 0;
      
      for (let y = 2; y <= deployHorizon; y++) {
        schedule[y] = Math.max(0, baseLine[y] + pShape[y] * amplitude);
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
    // Pre-operativo: solo porción IT del año 0 (PM ahora va en OPEX)
    return itCostThisYear;
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

  // Costo de hardware + instalación + logística por medidor
  const perMeterCost = weightedMeterCost + weightedCommsCost + capex.installCost + (capex.logisticsCostPerEndpoint ?? 0);

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
  if (year < 0) return 0;
  const { global, opex } = scenario;
  const deployHorizon = global.deploymentHorizonYears ?? 10;
  const p2pPct = deriveP2pPct(global.wiSunPct, global.plcPct);

  // Project Management: distribuido en partes iguales por año de despliegue (años 0..deployHorizon-1)
  const pmPerYear = (opex.pmCost ?? 0) > 0 && deployHorizon > 0
    ? (opex.pmCost ?? 0) / deployHorizon
    : 0;
  const pmThisYear = year < deployHorizon ? pmPerYear : 0;

  // El resto del OPEX operativo arranca desde el año 1
  if (year < 1) return pmThisYear;

  const cumulative = getCumulativeDeployed(scenario);
  const activeMeters = cumulative[year] ?? 0;
  const p2pActiveMeters = activeMeters * (p2pPct / 100);

  const telecomAnnual = p2pActiveMeters * opex.telecomMonthly * 12;
  const cloudAnnual   = opex.cloudMonthly * 12;

  return pmThisYear + telecomAnnual + cloudAnnual + opex.maintenanceAnnual + opex.saasAnnual + opex.adminAnnual;
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

  // Palanca 2: Reducción multas SAIDI (en minutos) + estimaciones
  const saidiMinutesSaved = benefits.saidiHistoricalMinutes * (benefits.saidiTargetReduction / 100) * progress;
  const saidiBenefit     = saidiMinutesSaved * benefits.finePerMinute;
  const estFinesBenefit  = benefits.estFinesAnnual * progress;

  // Palanca 2b: Multas de Calidad de Producto (Apartamiento + Incumplimiento)
  const qualityFinesBenefit =
    (benefits.apartamientoFineAnnual * ((benefits.apartamientoFineImprovement ?? 0) / 100) +
     benefits.nonComplianceFineAnnual * ((benefits.nonComplianceFineImprovement ?? 0) / 100)) *
    progress;

  // Palanca 4: Beneficios Comerciales (Back-Office y Call Center)
  const claimsSavings = (benefits.backOfficeTxCost ?? 0) * progress;
  const callCenterSavings = ((benefits.inboundCallVolume ?? 0) * (benefits.callCenterUnitCost ?? 0)) * progress;
  const deviceDamageSavings = ((benefits.deviceDamageClaims ?? 0) * ((benefits.deviceDamageAvoidance ?? 0) / 100)) * progress;

  // Palanca 3: Recuperación pérdidas no técnicas (en GWh)
  const gwhRecovered     = benefits.nonTechLossesGwh * (benefits.recoveryRateTarget / 100) * progress;
  const revenuePerGwh    = benefits.currentTariff - benefits.energyWholesaleCost;
  const fraudBenefit     = gwhRecovered * Math.max(0, revenuePerGwh);

  return productivitySavings + readingSavings + dispatchSavings + saidiBenefit + estFinesBenefit + qualityFinesBenefit + claimsSavings + callCenterSavings + deviceDamageSavings + fraudBenefit;
}

// ── INGRESOS VAD (ENRE) ───────────────────────────────────────────────────

function calculateCohortVad(capex: number, cohortYear: number, evalYear: number, life: number, wacc: number): number {
  const age = evalYear - cohortYear;
  if (age < 1 || age >= life) return 0; // El activo entra a la RAB al cierre del año; primer VAD en año siguiente
  
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

    if (cohortYear <= 3) { // Fase 1 (primeros 3 años)
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

// ── AMORTIZACIÓN CONTABLE E IMPUESTO A LAS GANANCIAS ─────────────────────

const INCOME_TAX_RATE = 0.35;

/**
 * Depreciación contable del CAPEX real (medidores + IT) a 25 años.
 * Reduce la base imponible del impuesto a las ganancias.
 * age >= 1: el activo entra al balance al cierre del año de adquisición.
 */
export function calculateAccountingDepreciation(scenario: Scenario, evalYear: number): number {
  if (evalYear <= 0) return 0;
  const { capex, global } = scenario;
  const { wiSunPct, plcPct, t2t3Pct = 0 } = global;
  const p2pPct = deriveP2pPct(wiSunPct, plcPct);
  const t1Pct = Math.max(0, 100 - t2t3Pct);
  const depLife = 25;
  let dep = 0;

  // IT: cada cohorte (años 0-5) amortiza a 25 años
  const itSchedule = [
    capex.itScheduleY0 ?? 100, capex.itScheduleY1 ?? 0, capex.itScheduleY2 ?? 0,
    capex.itScheduleY3 ?? 0,  capex.itScheduleY4 ?? 0, capex.itScheduleY5 ?? 0,
  ];
  for (let cohort = 0; cohort <= 5; cohort++) {
    const pct = itSchedule[cohort] ?? 0;
    if (pct <= 0) continue;
    const cohortCapex = (pct / 100) * capex.itIntegrationCost;
    const age = evalYear - cohort;
    if (age >= 1 && age <= depLife) dep += cohortCapex / depLife;
  }

  // Medidores: cada cohorte de instalación a 25 años
  const schedule = getDeploymentSchedule(scenario);
  for (let cohort = 1; cohort < schedule.length; cohort++) {
    const meters = schedule[cohort] || 0;
    if (meters <= 0) continue;
    const wMeter = (t1Pct / 100) * capex.meterCostT1 + (t2t3Pct / 100) * capex.meterCostT2T3;
    const wComms = (wiSunPct / 100) * capex.commsCostWiSun
      + (plcPct / 100) * capex.commsCostPLC
      + (p2pPct / 100) * capex.commsCostP2P;
    const plcConcentrators = (meters * (plcPct / 100)) / 250;
    const wiFocalPoints = (meters * (wiSunPct / 100)) / 5000;
    const cohortCapex = meters * (wMeter + wComms + capex.installCost)
      + plcConcentrators * capex.concentratorCostPLC
      + wiFocalPoints * capex.focalPointCostWiSun;
    const age = evalYear - cohort;
    if (age >= 1 && age <= depLife) dep += cohortCapex / depLife;
  }

  return dep;
}

/**
 * Base imponible del año t:
 *   Ingresos (Beneficios + VAD) - OPEX - Amortización contable
 * No se deduce el CAPEX (se capitaliza y amortiza).
 */
export function calculateTaxableBase(scenario: Scenario, year: number): number {
  const benefits   = calculateBenefitsForYear(scenario, year);
  const vad        = calculateVadRevenueIT(scenario, year) + calculateVadRevenueMeters(scenario, year);
  const opex       = calculateOpexForYear(scenario, year);
  const amort      = calculateAccountingDepreciation(scenario, year);
  return benefits + vad - opex - amort;
}

/**
 * Impuesto a las ganancias pagado en el año `year`.
 * En Argentina se liquida sobre el resultado del año anterior (t-1).
 * Si el resultado previo fue negativo: impuesto = 0 (sin carry-forward por simplicidad).
 */
export function calculateIncomeTax(scenario: Scenario, year: number): number {
  if (!scenario.global.includeTax) return 0;
  if (year <= 1) return 0;   // Año 0 y 1: no hay ejercicio anterior positivo gravable
  const prevTaxableBase = calculateTaxableBase(scenario, year - 1);
  return prevTaxableBase > 0 ? prevTaxableBase * INCOME_TAX_RATE : 0;
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
    const tax        = calculateIncomeTax(scenario, t);
    npv += (benefits + vadRevenue - opex - capex - tax) / Math.pow(1 + r, t);
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
    const tax = calculateIncomeTax(scenario, t);
    
    totalCapex += capex;
    totalInflows += (benefits + vad - opex - tax);
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
    const tax = calculateIncomeTax(scenario, t);
    
    const discount = Math.pow(1 + r, t);
    pvOutflows += capex / discount;
    pvInflows += (benefits + vad - opex - tax) / discount;
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
    const tax = calculateIncomeTax(scenario, t);
    npv += (benefits + vad - opex - capex - tax) / Math.pow(1 + rate, t);
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
    const taxableBase = calculateTaxableBase(scenario, year);
    const incomeTax  = calculateIncomeTax(scenario, year);
    const netCashFlow = benefits + vadRevenue - opex - capex - incomeTax;
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
      cumulativeNPV,
      incomeTax,
      taxableBase,
    });
  }

  return result;
}
