// DATA_MODEL.ts – Fuente de verdad de tipos e interfaces del simulador AMI

export type DeploymentCurve = 'slow' | 'accelerated' | 'linear';

export interface GlobalParams {
  wacc: number;
  analysisHorizonYears: number;
  totalEndpoints: number;
  wiSunPct: number;               // % de endpoints con módulo Wi-SUN
  plcPct: number;                 // % de endpoints con módulo PLC
  t2t3Pct: number;                // % de endpoints que son medidores T2/T3
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
  // IT Platform (inversión total)
  itIntegrationCost: number;
  pmCost: number;
  // Distribución temporal de Integración IT (% del total, años 0-5, debe sumar 100)
  itScheduleY0: number;
  itScheduleY1: number;
  itScheduleY2: number;
  itScheduleY3: number;
  itScheduleY4: number;
  itScheduleY5: number;
}

export interface OpexParams {
  telecomMonthly: number;      // Solo medidores P2P (SIM M2M)
  saasAnnual: number;
  cloudMonthly: number;
  maintenanceAnnual: number;
  adminAnnual: number;
}

export interface BenefitParams {
  // ── Operacionales ──────────────────────────────────────────────────────────
  manualReadsVolume: number;
  manualReadUnitCost: number;
  annualCutsVolume: number;
  annualReposVolume: number;
  dispatchCost: number;          // Cuadrilla corte / reposición
  guardDispatchCost: number;     // Cuadrilla de guardia (improductivas, reiteradas, calidad)
  // Productividad: visitas evitadas al 100% del despliegue (escalan con progress)
  unproductiveVisitsAvoided: number;  // Visitas improductivas (~30% tasa actual)
  reiterativeVisitsAvoided: number;   // Visitas reiteradas (~15% tasa actual)
  qualityVisitsAvoided: number;       // Visitas calidad de producto (oscilaciones/BT)
  // ── Agregados / Agrupados ──────────────────────────────────────────────────
  saidiHistoricalHours: number;
  saidiTargetReduction: number;
  finePerHour: number;
  estFinesAnnual: number;
  // Multas de Calidad de Producto (escalan con progress)
  parkingFineAnnual: number;            // Monto total multa Aparcamiento (M USD/año actual)
  parkingFineImprovement: number;       // % de mejora atribuible al AMI
  nonComplianceFineAnnual: number;      // Monto total multa Incumplimiento (M USD/año actual)
  nonComplianceFineImprovement: number; // % de mejora atribuible al AMI
  nonTechLossesMwh: number;
  recoveryRateTarget: number;
  energyWholesaleCost: number;
  currentTariff: number;
}

export interface RegulatoryParams {
  waccEnrePhase1: number;             // % (ej: 9.99)
  waccEnrePhase2: number;             // %
  recognizedMeterCapexPhase1: number; // USD (ej: 126)
  meterRegulatoryLife: number;        // años (ej: 25)
  itRegulatoryLife: number;           // años (ej: 10)
  enreItSubsidy: number;              // Monto en USD aportado por ENRE para IT (resta de RAB IT)
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
  regulatory: RegulatoryParams;
}

export interface YearlyProjection {
  year: number;
  metersDeployedThisYear: number;
  cumulativeMeters: number;
  capex: number;
  opex: number;
  benefits: number;
  vadRevenue: number;
  fcf: number;
  discountedFcf: number;
  netCashFlow: number;
  cumulativeNPV: number;
}
