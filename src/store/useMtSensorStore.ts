import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { MtSensorParams } from '../MT_DATA_MODEL';

export const DEFAULT_MT_PARAMS: MtSensorParams = {
  totalTransformers: 15000,
  deploymentHorizon: 3,
  projectHorizon: 10,
  
  sensorUnitCost: 200,
  p2pConnectionCost: 50,
  installationCost: 100,
  
  annualFailureRate: 2.5,
  preventiveReduction: 40,
  transformerReplacementCost: 6000,
  
  saidiMtHistorical: 120,
  saidiMtReduction: 15,
  finePerMinute: 50000,
  
  wacc: 14.2
};

interface MtSensorStore {
  params: MtSensorParams;
  updateParam: (key: keyof MtSensorParams, value: number) => void;
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
      name: 'mt-sensor-simulator-v1',
      version: 1,
    }
  )
);
