// components/MultiScenarioChart.tsx
// Overlay de curvas VPN acumulado para todos los escenarios en un mismo gráfico

import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, ReferenceLine,
} from 'recharts';
import { useStore } from '../store/useStore';
import { generateProjection } from '../BUSINESS_LOGIC';

// Paleta de colores para escenarios
const SCENARIO_COLORS = [
  '#6366f1', // brand (baseline)
  '#10b981', // emerald
  '#f59e0b', // amber
  '#f43f5e', // rose
  '#8b5cf6', // violet
  '#06b6d4', // cyan
];

const fmtAxis = (v: number) => {
  const abs = Math.abs(v);
  if (abs >= 1_000_000_000) return `$${(v / 1_000_000_000).toFixed(1)}B`;
  if (abs >= 1_000_000)     return `$${(v / 1_000_000).toFixed(0)}M`;
  return `$${v}`;
};

interface TooltipPayloadItem {
  name: string;
  value: number;
  color: string;
}

function CustomTooltip({ active, payload, label }: {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: string | number;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-surface-700 border border-white/10 rounded-xl p-3 shadow-2xl min-w-[220px]">
      <p className="text-xs font-bold text-brand-400 mb-2">
        {label === 0 ? 'Año 0' : `Año ${label}`}
      </p>
      {payload.map((item) => (
        <div key={item.name} className="flex items-center justify-between gap-4 text-xs py-0.5">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
            <span className="text-slate-400 truncate max-w-[130px]">{item.name}</span>
          </div>
          <span className={`font-mono font-semibold ${item.value >= 0 ? 'text-emerald-300' : 'text-rose-300'}`}>
            {fmtAxis(item.value)}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function MultiScenarioChart() {
  const { scenarios, activeScenarioId } = useStore();

  // Construir datos: un array por año, con un campo por escenario
  const maxHorizon = Math.max(...scenarios.map((s) => s.global.analysisHorizonYears));

  const data = Array.from({ length: maxHorizon + 1 }, (_, year) => {
    const row: Record<string, number | string> = { year };
    scenarios.forEach((s) => {
      const proj = generateProjection(s);
      const entry = proj.find((p) => p.year === year);
      row[s.name] = entry?.cumulativeNPV ?? 0;
    });
    return row;
  });

  return (
    <div className="glass-card p-5 animate-fade-in">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-white">VPN Acumulado — Todos los Escenarios</h3>
        <p className="text-xs text-slate-500 mt-0.5">
          El cruce del eje 0 marca el año de recuperación de la inversión en cada escenario
        </p>
      </div>
      <ResponsiveContainer width="100%" height={260}>
        <LineChart data={data} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
          <XAxis
            dataKey="year"
            tickFormatter={(v) => `A${v}`}
            tick={{ fill: '#64748b', fontSize: 11 }}
            axisLine={false} tickLine={false}
          />
          <YAxis
            tickFormatter={fmtAxis}
            tick={{ fill: '#64748b', fontSize: 11 }}
            axisLine={false} tickLine={false} width={70}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ paddingTop: '12px', fontSize: '11px', color: '#94a3b8' }} />
          <ReferenceLine y={0} stroke="rgba(255,255,255,0.2)" strokeDasharray="4 4" />
          {scenarios.map((s, i) => (
            <Line
              key={s.id}
              type="monotone"
              dataKey={s.name}
              stroke={SCENARIO_COLORS[i % SCENARIO_COLORS.length]}
              strokeWidth={s.id === activeScenarioId ? 3 : 1.5}
              strokeDasharray={s.isBaseline ? undefined : '6 3'}
              dot={false}
              activeDot={{ r: 5 }}
              opacity={s.id === activeScenarioId ? 1 : 0.6}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
