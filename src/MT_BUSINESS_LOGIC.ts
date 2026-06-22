// src/MT_BUSINESS_LOGIC.ts
import { MtSensorParams, MtYearlyProjection, MtKpis } from './MT_DATA_MODEL';

// Helper function to calculate IRR
function calculateIRR(cashFlows: number[], guess = 0.1): number {
  // Check if all cashflows after year 0 are positive
  const hasNegative = cashFlows.some((cf, t) => t > 0 && cf < 0);
  const sum = cashFlows.reduce((a, b) => a + b, 0);
  
  // If there are no negative cash flows (e.g. savings > capex even in year 1),
  // the IRR is technically infinite.
  if (!hasNegative && sum > 0) return Infinity;
  // If there's no positive cash flow, it's a total loss
  const hasPositive = cashFlows.some((cf, t) => t > 0 && cf > 0);
  if (!hasPositive) return -100;

  const maxIterations = 1000;
  const precision = 1e-7;
  let rate = guess;

  for (let i = 0; i < maxIterations; i++) {
    let npv = 0;
    let derivativeNpv = 0;

    for (let t = 0; t < cashFlows.length; t++) {
      npv += cashFlows[t] / Math.pow(1 + rate, t);
      if (t > 0) {
        derivativeNpv -= (t * cashFlows[t]) / Math.pow(1 + rate, t + 1);
      }
    }

    if (Math.abs(npv) < precision) return rate * 100;
    
    // Prevent division by zero
    if (derivativeNpv === 0) return 0;
    
    rate -= npv / derivativeNpv;
    
    // Prevent invalid rates that break Math.pow
    if (rate <= -0.999) rate = -0.999;
  }

  return rate * 100; // Return what we have if no convergence
}

export function generateMtProjection(params: MtSensorParams): { projection: MtYearlyProjection[], kpis: MtKpis } {
  const {
    totalTransformers,
    deploymentHorizon,
    projectHorizon,
    sensorUnitCost,
    p2pConnectionCost,
    installationCost,
    annualFailureRate,
    preventiveReduction,
    transformerReplacementCost,
    saidiMtHistorical,
    saidiMtReduction,
    finePerMinute,
    wacc
  } = params;

  const projection: MtYearlyProjection[] = [];
  const cashFlows: number[] = [];
  
  const transformersPerYear = deploymentHorizon > 0 ? totalTransformers / deploymentHorizon : totalTransformers;
  
  let totalCapex = 0;
  let totalMaintenanceSavings = 0;
  let totalSaidiSavings = 0;
  let npv = 0;

  // Year 0 (Usually initial setup, but we start deploying in Year 1 based on the directive structure, or if Year 0 has investment)
  // According to standard logic, we'll start cash flows at Year 1 for savings, but CAPEX can happen in Year 1.
  // We'll generate from Year 1 to projectHorizon. We'll set Year 0 to zero just as a baseline if needed, but let's iterate t=1..projectHorizon.

  // Let's include Year 0 with 0 values to keep index = year
  projection.push({
    year: 0,
    capex: 0,
    maintenanceSavings: 0,
    saidiSavings: 0,
    netCashFlow: 0,
    progress: 0,
    accumulatedTransformers: 0
  });
  cashFlows.push(0);

  for (let t = 1; t <= projectHorizon; t++) {
    // 1. CAPEX
    let capexT = 0;
    if (t <= deploymentHorizon) {
      capexT = transformersPerYear * (sensorUnitCost + p2pConnectionCost + installationCost);
    }

    // 2. Accumulated Transformers
    const accumulatedT = Math.min(transformersPerYear * t, totalTransformers);
    const progressT = totalTransformers > 0 ? accumulatedT / totalTransformers : 0;

    // 3. Maintenance Savings
    const maintenanceSavingsT = accumulatedT * (annualFailureRate / 100) * (preventiveReduction / 100) * transformerReplacementCost;

    // 4. SAIDI Savings
    const saidiSavingsT = saidiMtHistorical * (saidiMtReduction / 100) * finePerMinute * progressT;

    // 5. Net Cash Flow
    const netCashFlowT = maintenanceSavingsT + saidiSavingsT - capexT;

    projection.push({
      year: t,
      capex: capexT,
      maintenanceSavings: maintenanceSavingsT,
      saidiSavings: saidiSavingsT,
      netCashFlow: netCashFlowT,
      progress: progressT,
      accumulatedTransformers: accumulatedT
    });

    cashFlows.push(netCashFlowT);

    // KPI accumulators
    totalCapex += capexT;
    totalMaintenanceSavings += maintenanceSavingsT;
    totalSaidiSavings += saidiSavingsT;
    npv += netCashFlowT / Math.pow(1 + (wacc / 100), t);
  }

  const roi = totalCapex > 0 ? ((totalMaintenanceSavings + totalSaidiSavings) / totalCapex) * 100 : 0;
  
  // Adjust Cashflows if Year 0 is 0 and we have investment in Year 1, IRR works better if Year 0 has the initial investment. 
  // Standard practice if cashFlows[0] === 0 is just to calculate from array as is, IRR function handles it.
  let irr = calculateIRR(cashFlows);
  
  // Fallback for IRR if it's wildly out of bounds or NaN
  if (isNaN(irr) || !isFinite(irr)) irr = 0;

  return {
    projection,
    kpis: {
      totalCapex,
      totalMaintenanceSavings,
      totalSaidiSavings,
      npv,
      roi,
      irr
    }
  };
}
