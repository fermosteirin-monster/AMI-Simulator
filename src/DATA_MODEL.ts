// DATA_MODEL.ts – Fuente de verdad de tipos e interfaces del simulador AMI

export type DeploymentCurve = 'slow' | 'accelerated' | 'linear';

export interface GlobalParams {
  wacc: number;
  exchangeRate: number;
  analysisHorizonYears: number;
  totalEndpoints: number;
  // Mix tecnológico (wiSunPct + plcPct <= 100; p2pPct = 100 - wiSun - plc)
  wiSunPct: number;
  plcPct: number;
  // Curva de despliegue
  deploymentCurve: DeploymentCurve;
}

export interface CapexParams {
  meterCostT1: number;
  meterCostT2T3: number;
  // Módulo de comunicación por tecnología (USD/medidor)
  commsCostWiSun: number;
  commsCostPLC: number;
  commsCostP2P: number;
  installCost: number;
  // Infraestructura de concentración
  concentratorCostPLC: number;   // 1 cada 250 conexiones PLC
  focalPointCostWiSun: number;   // 1 cada 5000 conexiones Wi-SUN
  // IT Platform (inversión única)
  itIntegrationCost: number;
  pmCost: number;
}

export interface OpexParams {
  telecomMonthly: number;      // Solo medidores P2P (SIM M2M)
  saasAnnual: number;
  cloudMonthly: number;
  maintenanceAnnual: number;
  adminAnnual: number;
}

export interface BenefitParams {
  manualReadsVolume: number;
  manualReadUnitCost: number;
  annualCutsVolume: number;
  annualReposVolume: number;
  dispatchCost: number;
  saidiHistoricalHours: number;
  saidiTargetReduction: number;
  finePerHour: number;
  estFinesAnnual: number;
  nonTechLossesMwh: number;
  recoveryRateTarget: number;
  energyWholesaleCost: number;
  currentTariff: number;
}

export interface Scenario {
  id: string;
  name: string;
  description: string;
  isBaseline: boolean;
  global:   GlobalParams;
  capex:    CapexParams;
  opex:     OpexParams;
  benefits: BenefitParams;
}

export interface YearlyProjection {
  year: number;
  metersDeployedThisYear: number;
  cumulativeMeters: number;
  capex: number;
  opex: number;
  benefits: number;
  netCashFlow: number;
  cumulativeNPV: number;
}
