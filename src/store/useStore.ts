// store/useStore.ts – Estado global del simulador AMI
// Zustand + persist middleware (localStorage key: ami-simulator-v2)

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Scenario } from '../DATA_MODEL';
import { generateProjection, calculateNPV } from '../BUSINESS_LOGIC';

// ── Escenario Baseline (Edesur 2026) ──────────────────────────────────────
export const BASELINE_SCENARIO: Scenario = {
  id: 'baseline',
  name: 'Baseline — Edesur 2026',
  description: 'Escenario de referencia con supuestos Edesur. Mix tecnológico Wi-Sun/PLC. Curva de despliegue lineal.',
  isBaseline: true,
  global: {
    wacc:                 9.99,
    analysisHorizonYears: 8,
    totalEndpoints:       2_500_000,
    wiSunPct:             50,
    plcPct:               45,
    t2t3Pct:              10,
    deploymentCurve:      'linear',
  },
  capex: {
    meterCostT1:          50,
    meterCostT2T3:        100,
    // Módulos de comunicación por tecnología
    commsCostWiSun:       15,
    commsCostPLC:         0,
    commsCostP2P:         25,
    installCost:          15,
    // Infraestructura
    concentratorCostPLC:  300,
    focalPointCostWiSun:  300,
    // IT Platform
    itIntegrationCost:    15_000_000,
    pmCost:               1_000_000,
    // Distribución temporal IT (% por año, suma = 100)
    itScheduleY0:         40,
    itScheduleY1:         30,
    itScheduleY2:         20,
    itScheduleY3:         10,
    itScheduleY4:         0,
    itScheduleY5:         0,
  },
  opex: {
    telecomMonthly:       0.3,
    saasAnnual:           200_000,
    cloudMonthly:         5_000,
    maintenanceAnnual:    500_000,
    adminAnnual:          500_000,
  },
  benefits: {
    // Operacionales
    manualReadsVolume:         25_000_000,
    manualReadUnitCost:        1,
    annualCutsVolume:          200_000,
    annualReposVolume:         170_000,
    dispatchCost:              15,
    guardDispatchCost:         20,
    // Productividad — visitas evitadas al 100% del despliegue
    unproductiveVisitsAvoided: 70_000,
    reiterativeVisitsAvoided:  30_000,
    qualityVisitsAvoided:      20_000,
    // Agregados
    saidiHistoricalHours:      900,
    saidiTargetReduction:      10,
    finePerHour:               100_000,
    estFinesAnnual:            500_000,
    // Multas de Calidad de Producto
    parkingFineAnnual:         10_000_000,
    parkingFineImprovement:    20,
    nonComplianceFineAnnual:   2_000_000,
    nonComplianceFineImprovement: 70,
    // Fraude
    nonTechLossesMwh:          100_000,
    recoveryRateTarget:        20,
    energyWholesaleCost:       30,
    currentTariff:             50,
  },
  regulatory: {
    waccEnrePhase1:            9.99,
    waccEnrePhase2:            9.99,
    recognizedMeterCapexPhase1:126,
    meterRegulatoryLife:       25,
    itRegulatoryLife:          10,
    enreItSubsidy:             5_000_000,
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
      name: 'ami-simulator-v9',  // v9 = new baseline defaults
      version: 9,
    }
  )
);

// Re-exportar para conveniencia de componentes
export { generateProjection, calculateNPV };
