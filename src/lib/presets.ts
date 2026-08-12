// lib/presets.ts – Escenarios pre-configurados

import type { Scenario } from '../DATA_MODEL';
import { BASELINE_SCENARIO } from '../store/useStore';

const genId = () => `preset-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`;

export interface Preset {
  id: string;
  label: string;
  description: string;
  emoji: string;
  color: string;
  build: () => Scenario;
}

export const PRESETS: Preset[] = [
  {
    id: 'bp-original',
    label: 'BP Original',
    description: 'Caso base o Business Plan Original con los valores por defecto.',
    emoji: '📊',
    color: 'text-indigo-400 border-indigo-500/30 hover:border-indigo-500/60 hover:bg-indigo-500/5',
    build: () => ({
      ...JSON.parse(JSON.stringify(BASELINE_SCENARIO)),
      id: genId(),
      name: 'BP Original',
      description: 'Caso base o Business Plan Original con los valores por defecto.',
      isBaseline: false,
    }),
  },
  {
    id: 'epec',
    label: 'EPEC',
    description: 'Escenario con los valores de la experiencia de EPEC Córdoba',
    emoji: '🏙️',
    color: 'text-sky-400 border-sky-500/30 hover:border-sky-500/60 hover:bg-sky-500/5',
    build: () => ({
      ...JSON.parse(JSON.stringify(BASELINE_SCENARIO)),
      id: genId(),
      name: 'EPEC',
      description: 'Escenario con los valores de la experiencia de EPEC Córdoba',
      isBaseline: false,
      global: {
        ...BASELINE_SCENARIO.global,
        wacc:                    14.2,
        deploymentHorizonYears:  7,
        analysisHorizonYears:    10,
        totalEndpoints:          2_700_000,
        wiSunPct:                0,
        plcPct:                  80,
        deploymentCurve:         'linear' as const,
      },
      capex: {
        ...BASELINE_SCENARIO.capex,
        meterCostT1:              60,
        meterCostT2T3:            100,
        commsCostWiSun:           15,
        commsCostPLC:             15,
        commsCostP2P:             15,
        installCost:              35,
        logisticsCostPerEndpoint: 5,
        concentratorCostPLC:      700,
        focalPointCostWiSun:      700,
        itIntegrationCost:        10_000_000,
      },
      opex: {
        ...BASELINE_SCENARIO.opex,
        pmCost:            2_000_000,
        telecomMonthly:    0.52,
        cloudAnnualPerNode: 0,          // Sin costo cloud
        maintenanceAnnual: 500_000,
        saasAnnual:        200_000,
        adminAnnual:       500_000,
      },
      benefits: {
        ...BASELINE_SCENARIO.benefits,
        // Operacionales
        manualReadsVolume:         32_400_000,
        manualReadUnitCost:        0.25,
        annualCutsVolume:          318_250,
        annualReposVolume:         152_000,
        dispatchCost:              14.6,
        guardDispatchCost:         20,
        // Productividad — EPEC tiene más visitas evitadas por mayor madurez operativa
        unproductiveVisitsAvoided: 100_000,
        reiterativeVisitsAvoided:  50_000,
        qualityVisitsAvoided:      50_000,
        // Comercial / Call Center
        billingClaimsVolume:       14_500,
        backOfficeTxCost:          80_000,
        inboundCallVolume:         46_400,
        callCenterUnitCost:        1.2,
        deviceDamageClaims:        500_000,
        deviceDamageAvoidance:     30,
        // Regulatorio — SAIDI (en minutos)
        saidiHistoricalMinutes:    350,
        saidiTargetReduction:      25,
        finePerMinute:             50_000,
        estFinesAnnual:            2_420_000,  // Mismo que baseline
        // Multas de Calidad de Producto — EPEC logra mayor mejora
        apartamientoFineAnnual:       5_250_000,
        apartamientoFineImprovement:  70,       // 70% vs 20% Edesur
        nonComplianceFineAnnual:      700_000,
        nonComplianceFineImprovement: 90,       // 90% vs 70% Edesur
        // Fraude — tasa de recuperación menor en EPEC
        nonTechLossesGwh:          2_394,
        recoveryRateTarget:        10,          // 10% vs 20% Edesur
        energyWholesaleCost:       40_000,
        currentTariff:             97_200,
      },
      regulatory: {
        ...BASELINE_SCENARIO.regulatory,
      },
    }),
  },
];
