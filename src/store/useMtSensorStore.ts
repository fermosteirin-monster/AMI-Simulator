import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { MtSensorParams } from '../MT_DATA_MODEL';

export const DEFAULT_MT_PARAMS: MtSensorParams = {
  totalTransformers: 10000,
  deploymentHorizon: 5,
  projectHorizon: 10,
  
  sensorUnitCost: 1500,
  p2pConnectionCost: 50,
  installationCost: 100,
  
  annualFailureRate: 2.5,
  preventiveReduction: 50,
  transformerReplacementCost: 6000,
  
  saidiMtHistorical: 300,
  saidiMtReduction: 20,
  finePerMinute: 50000,
  
  wacc: 14.2
};

interface MtSensorStore {
  params: MtSensorParams;
  updateParam: <K extends keyof MtSensorParams>(key: K, value: MtSensorParams[K]) => void;
  resetToDefault: () => void;
}

export const useMtSensorStore = create<MtSensorStore>()(
  persist(
    (set) => ({
      params: { ...DEFAULT_MT_PARAMS },
      updateParam: (key, value) =>
        set((state) => ({
          params: {
            ...state.params,
            [key]: value,
          },
        })),
      resetToDefault: () =>
        set(() => ({
          params: { ...DEFAULT_MT_PARAMS },
        })),
    }),
    {
      name: 'mt-sensor-simulator-v2',
      version: 2,
    }
  )
);
