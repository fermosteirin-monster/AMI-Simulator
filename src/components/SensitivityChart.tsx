// components/SensitivityChart.tsx
// Análisis de sensibilidad: cuánto cambia el VPN ante ±20% en cada variable clave

import { useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine, Cell,
} from 'recharts';
import { useStore, selectActiveScenario } from '../store/useStore';
import { calculateNPV } from '../BUSINESS_LOGIC';
import type { Scenario } from '../DATA_MODEL';

const DELTA = 0.20; // ±20% sobre el valor base

// Variables clave a analizar (section, key, label)
const SENSITIVITY_VARS: { section: keyof Omit<Scenario, 'id' | 'name' | 'description' | 'isBaseline'>; key: string; label: string }[] = [
  { section: 'capex',    key: 'meterCostT1',          label: 'Costo Medidor T1'      },
  { section: 'global',   key: 'wacc',                  label: 'WACC'                  },
  { section: 'benefits', key: 'recoveryRateTarget',    label: '% Rec. Fraude'         },
  { section: 'benefits', key: 'nonTechLossesMwh',      label: 'Pérdidas No Técnicas'  },
  { section: 'capex',    key: 'installCost',           label: 'Costo Instalación'     },
  { section: 'benefits', key: 'finePerHour',           label: 'Multa por Hora SAIDI'  },
  { section: 'opex',     key: 'telecomMonthly',        label: 'Abono M2M'             },
  { section: 'benefits', key: 'manualReadUnitCost',    label: 'Costo Lectura Manual'  },
  { section: 'benefits', key: 'saidiTargetReduction',  label: '% Red. SAIDI'          },
  { section: 'capex',    key: 'commsCost',             label: 'Módulo Comms'          },
];

const fmtM = (v: number) => {
  const abs = Math.abs(v);
  if (abs >= 1_000_000_000) return `${(v / 1_000_000_000).toFixed(1)}B`;
  if (abs >= 1_000_000)     return `${(v / 1_000_000).toFixed(0)}M`;
  if (abs >= 1_000)         return `${(v / 1_000).toFixed(0)}K`;
  return v.toFixed(0);
};

interface SensRow {
  label: string;
  low: number;
  high: number;
  swing: number;
  baseNPV: number;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: { payload: SensRow }[];
}

function SensTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-surface-700 border border-white/10 rounded-xl p-3 shadow-2xl text-xs min-w-[220px]">
      <p className="font-bold text-brand-300 mb-2">{d.label}</p>
      <div className="space-y-1">
        <div className="flex justify-between gap-4">
          <span className="text-slate-400">VPN −20%:</span>
          <span className="font-mono text-rose-300">${fmtM(d.low)}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-slate-400">VPN base:</span>
          <span className="font-mono text-slate-200">${fmtM(d.baseNPV)}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-slate-400">VPN +20%:</span>
          <span className="font-mono text-emerald-300">${fmtM(d.high)}</span>
        </div>
        <div className="border-t border-white/10 pt-1 mt-1 flex justify-between gap-4">
          <span className="text-slate-400">Swing total:</span>
          <span className="font-mono font-bold text-amber-300">${fmtM(d.swing)}</span>
        </div>
      </div>
    </div>
  );
}

export default function SensitivityChart() {
  const scenario = useStore(selectActiveScenario);

  const rows = useMemo<SensRow[]>(() => {
    if (!scenario) return [];
    const baseNPV = calculateNPV(scenario);

    return SENSITIVITY_VARS.map(({ section, key, label }) => {
      const baseVal = (scenario[section] as unknown as Record<string, number>)[key];

      const applyDelta = (factor: number): number => {
        const modified: Scenario = {
          ...scenario,
          [section]: {
            ...(scenario[section] as unknown as Record<string, number>),
            [key]: baseVal * factor,
          },
        };
        return calculateNPV(modified);
      };

      const lowNPV  = applyDelta(1 - DELTA);
      const highNPV = applyDelta(1 + DELTA);
      const swing   = Math.abs(highNPV - lowNPV);

      return { label, low: lowNPV, high: highNPV, swing, baseNPV };
    }).sort((a, b) => b.swing - a.swing); // Ordenar por impacto descendente
  }, [scenario]);

  if (!scenario) return null;
  const baseNPV = calculateNPV(scenario);

  // Transformar para gráfico tornado: low relativo, high relativo al base
  const chartData = rows.map((r) => ({
    label:    r.label,
    lowNPV:   r.low,
    highNPV:  r.high,
    swing:    r.swing,
    baseNPV:  r.baseNPV,
    // Para las barras relativas al base
    downside: Math.min(r.low, r.high) - baseNPV,
    upside:   Math.max(r.low, r.high) - baseNPV,
  }));

  return (
    <div className="glass-card p-5 animate-fade-in">
      <div className="mb-4 flex items-start justify-between">
        <div>
          <h3 className="text-sm font-semibold text-white">Análisis de Sensibilidad</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Impacto de ±20% en cada variable sobre el VPN · Ordenado por swing descendente
          </p>
        </div>
        <div className="text-xs text-slate-500 text-right">
          <p>VPN Base</p>
          <p className={`font-mono font-bold ${baseNPV >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            ${fmtM(baseNPV)}
          </p>
        </div>
      </div>

      {/* Tornado bars */}
      <div className="space-y-2">
        {chartData.map((d) => {
          const maxSwing = chartData[0]?.swing ?? 1;
          const downPct  = Math.abs(d.downside) / maxSwing * 100;
          const upPct    = Math.abs(d.upside)   / maxSwing * 100;
          const isNegDir = d.lowNPV < d.highNPV; // si bajar la var → VPN baja

          return (
            <div key={d.label} className="flex items-center gap-2 group" title={`Swing: $${fmtM(d.swing)}`}>
              {/* Label */}
              <div className="w-36 flex-shrink-0 text-right">
                <span className="text-xs text-slate-400 group-hover:text-slate-200 transition-colors truncate block">
                  {d.label}
                </span>
              </div>

              {/* Bar container */}
              <div className="flex-1 flex items-center gap-0 h-6 relative">
                {/* Center line */}
                <div className="absolute inset-y-0 left-1/2 w-px bg-white/15 z-10" />

                {/* Left half (downside) */}
                <div className="w-1/2 flex justify-end">
                  <div
                    className={`h-5 rounded-l-sm transition-all duration-300 ${isNegDir ? 'bg-rose-500/70' : 'bg-emerald-500/70'}`}
                    style={{ width: `${downPct}%` }}
                  />
                </div>

                {/* Right half (upside) */}
                <div className="w-1/2 flex justify-start">
                  <div
                    className={`h-5 rounded-r-sm transition-all duration-300 ${isNegDir ? 'bg-emerald-500/70' : 'bg-rose-500/70'}`}
                    style={{ width: `${upPct}%` }}
                  />
                </div>
              </div>

              {/* Swing value */}
              <div className="w-20 flex-shrink-0">
                <span className="text-xs font-mono text-amber-400">±${fmtM(d.swing / 2)}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-4 flex items-center gap-6 text-xs text-slate-500">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-rose-500/70" />
          <span>Variable baja → VPN baja</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-emerald-500/70" />
          <span>Variable baja → VPN sube</span>
        </div>
      </div>

      {/* Mini recharts de respaldo para verificación */}
      <details className="mt-4">
        <summary className="text-xs text-slate-600 cursor-pointer hover:text-slate-400 transition-colors">
          Ver gráfico de barras alternativo
        </summary>
        <div className="mt-3">
          <ResponsiveContainer width="100%" height={rows.length * 28 + 40}>
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ top: 0, right: 10, left: 130, bottom: 0 }}
              barSize={10}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
              <XAxis
                type="number"
                tickFormatter={(v) => `$${fmtM(v)}`}
                tick={{ fill: '#64748b', fontSize: 10 }}
                axisLine={false} tickLine={false}
              />
              <YAxis
                type="category"
                dataKey="label"
                tick={{ fill: '#94a3b8', fontSize: 10 }}
                axisLine={false} tickLine={false} width={125}
              />
              <Tooltip content={<SensTooltip />} />
              <ReferenceLine x={baseNPV} stroke="rgba(255,255,255,0.3)" strokeDasharray="4 4" />
              <Bar dataKey="lowNPV" name="VPN −20%" radius={[0, 0, 0, 0]}>
                {chartData.map((d) => (
                  <Cell key={d.label} fill={d.lowNPV < baseNPV ? '#f43f5e99' : '#10b98199'} />
                ))}
              </Bar>
              <Bar dataKey="highNPV" name="VPN +20%" radius={[2, 2, 2, 2]}>
                {chartData.map((d) => (
                  <Cell key={d.label} fill={d.highNPV > baseNPV ? '#10b98199' : '#f43f5e99'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </details>
    </div>
  );
}
