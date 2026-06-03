// store/useStore.ts – Estado global del simulador AMI
// Zustand + persist middleware (localStorage key: ami-simulator-v10)

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
    wacc:                 14.23,
    analysisHorizonYears: 10,
    totalEndpoints:       2_700_000,
    wiSunPct:             30,
    plcPct:               65,
    t2t3Pct:              2,
    deploymentCurve:      'linear',
  },
  capex: {
    meterCostT1:          60,
    meterCostT2T3:        100,
    // Módulos de comunicación por tecnología
    commsCostWiSun:       15,
    commsCostPLC:         15,
    commsCostP2P:         15,
    installCost:          15,
    logisticsCostPerEndpoint: 5,
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
    telecomMonthly:       0.52,
    saasAnnual:           200_000,
    cloudMonthly:         5_000,
    maintenanceAnnual:    500_000,
    adminAnnual:          500_000,
  },
  benefits: {
    // Operacionales
    manualReadsVolume:         32_400_000,
    manualReadUnitCost:        0.25,
    annualCutsVolume:          335_000,
    annualReposVolume:         160_000,
    dispatchCost:              14.6,
    guardDispatchCost:         20,
    // Productividad — visitas evitadas al 100% del despliegue
    unproductiveVisitsAvoided: 75_000,
    reiterativeVisitsAvoided:  30_000,
    qualityVisitsAvoided:      20_000,
    // Comercial / Call Center
    billingClaimsVolume:       14_500,
    backOfficeTxCost:          80_000,
    inboundCallVolume:         46_400,
    callCenterUnitCost:        1.2,
    deviceDamageClaims:        500_000,
    deviceDamageAvoidance:     30,
    // Agregados
    saidiHistoricalHours:      350,
    saidiTargetReduction:      10,
    finePerHour:               110_000,
    estFinesAnnual:            2_420_000,
    // Multas de Calidad de Producto
    parkingFineAnnual:         5_250_000,
    parkingFineImprovement:    20,
    nonComplianceFineAnnual:   1_000_000,
    nonComplianceFineImprovement: 70,
    // Fraude
    nonTechLossesMwh:          2394,
    recoveryRateTarget:        20,
    energyWholesaleCost:       40_000,
    currentTariff:             120_000,
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
      name: 'ami-simulator-v10',
      version: 10,
    }
  )
);

// Re-exportar para conveniencia de componentes
export { generateProjection, calculateNPV };
