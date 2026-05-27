// store/useStore.ts – Estado global del simulador AMI
// Zustand + persist middleware (localStorage key: ami-simulator-v2)

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Scenario } from '../DATA_MODEL';
import { generateProjection, calculateNPV } from '../BUSINESS_LOGIC';

// ── Escenario Baseline (Edesur 2024) ──────────────────────────────────────
export const BASELINE_SCENARIO: Scenario = {
  id: 'baseline',
  name: 'Baseline — Edesur 2024',
  description: 'Escenario de referencia con supuestos conservadores de licitación pública. Mix tecnológico P2P 100%. Curva de despliegue lineal.',
  isBaseline: true,
  global: {
    wacc:                 14,
    exchangeRate:         1200,
    analysisHorizonYears: 8,
    totalEndpoints:       2_500_000,
    wiSunPct:             0,
    plcPct:               0,
    deploymentCurve:      'linear',
  },
  capex: {
    meterCostT1:          55,
    meterCostT2T3:        120,
    // Módulos de comunicación por tecnología
    commsCostWiSun:       15,
    commsCostPLC:         12,
    commsCostP2P:         22,
    installCost:          18,
    // Infraestructura
    concentratorCostPLC:  3_200,
    focalPointCostWiSun:  8_500,
    // IT Platform
    itIntegrationCost:    15_000_000,
    pmCost:               8_000_000,
    // Distribución temporal IT (% por año, suma = 100)
    itScheduleY0:         40,
    itScheduleY1:         30,
    itScheduleY2:         20,
    itScheduleY3:         10,
    itScheduleY4:         0,
    itScheduleY5:         0,
  },
  opex: {
    telecomMonthly:       0.85,
    saasAnnual:           4_000_000,
    cloudMonthly:         120_000,
    maintenanceAnnual:    6_000_000,
    adminAnnual:          2_500_000,
  },
  benefits: {
    // Operacionales
    manualReadsVolume:         2_500_000,
    manualReadUnitCost:        3.5,
    annualCutsVolume:          180_000,
    annualReposVolume:         180_000,
    dispatchCost:              38,
    guardDispatchCost:         52,   // Guardia: costo mayor por horario y urgencia
    // Productividad — visitas evitadas al 100% del despliegue
    unproductiveVisitsAvoided: 75_000,   // 30% tasa improductiva base estimada
    reiterativeVisitsAvoided:  27_000,   // 15% tasa de reiterancia base estimada
    qualityVisitsAvoided:      20_000,   // Oscilaciones y BT diagnosticadas remotamente
    // Agregados
    saidiHistoricalHours:      18,
    saidiTargetReduction:      30,
    finePerHour:               850_000,
    estFinesAnnual:            3_200_000,
    // Multas de Calidad de Producto
    parkingFineAnnual:         0,
    parkingFineImprovement:    30,
    nonComplianceFineAnnual:   0,
    nonComplianceFineImprovement: 30,
    // Fraude
    nonTechLossesMwh:          850_000,
    recoveryRateTarget:        42,
    energyWholesaleCost:       42,
    currentTariff:             95,
  },
};

// ── Tipos del store ────────────────────────────────────────────────────────
interface AMIStore {
  scenarios:         Scenario[];
  activeScenarioId:  string;

  setActiveScenario:        (id: string) => void;
  cloneScenario:            (id: string, newName: string) => void;
  deleteScenario:           (id: string) => void;
  updateVariable:           (scenarioId: string, section: keyof Omit<Scenario, 'id' | 'name' | 'description' | 'isBaseline'>, key: string, value: number) => void;
  updateGlobalString:       (scenarioId: string, key: string, value: string) => void;
  resetScenarioToBaseline:  (id: string) => void;
}

// ── Selector ────────────────────────────────────────────────────────────────
export const selectActiveScenario = (s: AMIStore): Scenario | undefined =>
  s.scenarios.find((sc) => sc.id === s.activeScenarioId);

// ── Store ──────────────────────────────────────────────────────────────────
export const useStore = create<AMIStore>()(
  persist(
    (set) => ({
      scenarios:        [BASELINE_SCENARIO],
      activeScenarioId: 'baseline',

      setActiveScenario: (id) =>
        set({ activeScenarioId: id }),

      cloneScenario: (id, newName) =>
        set((state) => {
          const src = state.scenarios.find((s) => s.id === id);
          if (!src) return state;
          const cloned: Scenario = {
            ...JSON.parse(JSON.stringify(src)),
            id: `scenario-${Date.now()}`,
            name: newName,
            description: `Clonado desde "${src.name}"`,
            isBaseline: false,
          };
          return {
            scenarios: [...state.scenarios, cloned],
            activeScenarioId: cloned.id,
          };
        }),

      deleteScenario: (id) =>
        set((state) => {
          if (state.scenarios.length <= 1) return state;
          const filtered = state.scenarios.filter((s) => s.id !== id);
          return {
            scenarios: filtered,
            activeScenarioId:
              state.activeScenarioId === id
                ? (filtered[0]?.id ?? '')
                : state.activeScenarioId,
          };
        }),

      updateVariable: (scenarioId, section, key, value) =>
        set((state) => ({
          scenarios: state.scenarios.map((s) => {
            if (s.id !== scenarioId) return s;
            return {
              ...s,
              [section]: { ...(s[section] as unknown as Record<string, number>), [key]: value },
            };
          }),
        })),

      // Para campos string (deploymentCurve)
      updateGlobalString: (scenarioId, key, value) =>
        set((state) => ({
          scenarios: state.scenarios.map((s) => {
            if (s.id !== scenarioId) return s;
            return { ...s, global: { ...s.global, [key]: value } };
          }),
        })),

      resetScenarioToBaseline: (id) =>
        set((state) => ({
          scenarios: state.scenarios.map((s) => {
            if (s.id !== id) return s;
            return {
              ...JSON.parse(JSON.stringify(BASELINE_SCENARIO)),
              id: s.id,
              name: s.name,
              description: s.description,
              isBaseline: s.isBaseline,
            };
          }),
        })),
    }),
    {
      name: 'ami-simulator-v5',  // v5 = IT schedule + multas calidad; borra caché v4
      version: 5,
    }
  )
);

// Re-exportar para conveniencia de componentes
export { generateProjection, calculateNPV };
