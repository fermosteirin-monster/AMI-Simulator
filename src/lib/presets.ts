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
    id: 'optimista',
    label: 'Optimista',
    description: 'Costos −15%, recuperación fraude 55%, SAIDI −40%, WACC 12%',
    emoji: '🚀',
    color: 'text-emerald-400 border-emerald-500/30 hover:border-emerald-500/60 hover:bg-emerald-500/5',
    build: () => ({
      ...JSON.parse(JSON.stringify(BASELINE_SCENARIO)),
      id: genId(),
      name: 'Escenario Optimista',
      description: 'Licitación competitiva, alta eficiencia operativa, WACC 12% USD.',
      isBaseline: false,
      global: {
        ...BASELINE_SCENARIO.global,
        wacc: 12,
        deploymentCurve: 'accelerated' as const,
      },
      capex: {
        ...BASELINE_SCENARIO.capex,
        meterCostT1:      BASELINE_SCENARIO.capex.meterCostT1      * 0.85,
        commsCostP2P:     BASELINE_SCENARIO.capex.commsCostP2P     * 0.85,
        installCost:      BASELINE_SCENARIO.capex.installCost      * 0.85,
        itIntegrationCost: BASELINE_SCENARIO.capex.itIntegrationCost * 0.90,
      },
      opex: {
        ...BASELINE_SCENARIO.opex,
        telecomMonthly:    BASELINE_SCENARIO.opex.telecomMonthly    * 0.85,
        maintenanceAnnual: BASELINE_SCENARIO.opex.maintenanceAnnual * 0.90,
      },
      benefits: {
        ...BASELINE_SCENARIO.benefits,
        recoveryRateTarget:   55,
        saidiTargetReduction: 40,
      },
    }),
  },
  {
    id: 'pesimista',
    label: 'Pesimista',
    description: 'Costos +20%, recuperación fraude 30%, SAIDI −15%, WACC 18%',
    emoji: '⚠️',
    color: 'text-rose-400 border-rose-500/30 hover:border-rose-500/60 hover:bg-rose-500/5',
    build: () => ({
      ...JSON.parse(JSON.stringify(BASELINE_SCENARIO)),
      id: genId(),
      name: 'Escenario Pesimista',
      description: 'Inflación de costos, menor recuperación de fraude, riesgo país elevado.',
      isBaseline: false,
      global: {
        ...BASELINE_SCENARIO.global,
        wacc: 18,
        deploymentCurve: 'slow' as const,
      },
      capex: {
        ...BASELINE_SCENARIO.capex,
        meterCostT1:  BASELINE_SCENARIO.capex.meterCostT1  * 1.20,
        commsCostP2P: BASELINE_SCENARIO.capex.commsCostP2P * 1.20,
        installCost:  BASELINE_SCENARIO.capex.installCost  * 1.25,
      },
      opex: {
        ...BASELINE_SCENARIO.opex,
        telecomMonthly:    BASELINE_SCENARIO.opex.telecomMonthly    * 1.15,
        maintenanceAnnual: BASELINE_SCENARIO.opex.maintenanceAnnual * 1.20,
        saasAnnual:        BASELINE_SCENARIO.opex.saasAnnual        * 1.10,
      },
      benefits: {
        ...BASELINE_SCENARIO.benefits,
        recoveryRateTarget:   30,
        saidiTargetReduction: 15,
      },
    }),
  },
  {
    id: 'wisun',
    label: 'Mix Wi-SUN 60%',
    description: 'Mix 60% Wi-SUN / 30% PLC / 10% P2P — OPEX M2M mínimo',
    emoji: '📡',
    color: 'text-violet-400 border-violet-500/30 hover:border-violet-500/60 hover:bg-violet-500/5',
    build: () => ({
      ...JSON.parse(JSON.stringify(BASELINE_SCENARIO)),
      id: genId(),
      name: 'Mix Wi-SUN Dominante',
      description: '60% Wi-SUN · 30% PLC · 10% P2P. OPEX M2M mínimo, CAPEX de focal points alto.',
      isBaseline: false,
      global: {
        ...BASELINE_SCENARIO.global,
        wiSunPct: 60,
        plcPct:   30,
        deploymentCurve: 'linear' as const,
      },
    }),
  },
  {
    id: 'conservador',
    label: 'Conservador 10 años',
    description: 'Rollout extendido a 10 años, curva gradual, sin riesgo de ejecución',
    emoji: '🐢',
    color: 'text-blue-400 border-blue-500/30 hover:border-blue-500/60 hover:bg-blue-500/5',
    build: () => ({
      ...JSON.parse(JSON.stringify(BASELINE_SCENARIO)),
      id: genId(),
      name: 'Conservador — 10 Años',
      description: 'Rollout gradual a 10 años. Riesgo de ejecución bajo, beneficios diferidos.',
      isBaseline: false,
      global: {
        ...BASELINE_SCENARIO.global,
        analysisHorizonYears: 10,
        deploymentCurve: 'slow' as const,
      },
      benefits: {
        ...BASELINE_SCENARIO.benefits,
        recoveryRateTarget:   40,
        saidiTargetReduction: 25,
      },
    }),
  },
];
