// src/MT_DATA_MODEL.ts
export interface MtSensorParams {
  // Despliegue
  totalTransformers: number;      // Cantidad total de transformadores a sensorizar
  deploymentHorizon: number;      // Horizonte de despliegue en años
  projectHorizon: number;         // Horizonte de evaluación total (ej. 10 años)
  
  // Inversión (CAPEX Unitario)
  sensorUnitCost: number;         // Valor unitario del sensor (USD)
  p2pConnectionCost: number;      // Valor unitario de la conexión P2P (USD)
  installationCost: number;       // Valor del trabajo de cuadrilla por trafo (USD)
  
  // Ahorro Operativo (Mantenimiento)
  annualFailureRate: number;      // Tasa histórica de quema/falla de trafos (%)
  preventiveReduction: number;    // % de trafos salvados por identificar sobrecargas
  transformerReplacementCost: number; // Costo de cambiar un trafo quemado (USD)
  
  // Impacto Regulatorio (Multas SAIDI)
  saidiMtHistorical: number;      // Minutos SAIDI aportados históricamente por MT
  saidiMtReduction: number;       // % de reducción del SAIDI MT esperado
  finePerMinute: number;          // Valor de la multa por minuto de SAIDI (USD)
  
  // Financiero
  wacc: number;                   // Tasa de descuento / Costo de capital (%)
  includeTax?: boolean;           // Impuesto a las ganancias (35%)
}

export interface MtYearlyProjection {
  year: number;
  capex: number;
  maintenanceSavings: number;
  saidiSavings: number;
  netCashFlow: number;
  progress: number;
  accumulatedTransformers: number;
  accountingDepreciation: number;
  taxableBase: number;
  incomeTax: number;
}

export interface MtKpis {
  totalCapex: number;
  totalMaintenanceSavings: number;
  totalSaidiSavings: number;
  npv: number;
  roi: number;
  irr: number;
}
