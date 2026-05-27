// components/ProjectionChart.tsx
// Gráfico de líneas: Proyección a N años del Flujo Neto Anual (Fase 4)

import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer, ReferenceLine,
  Area, ComposedChart,
} from 'recharts';
import { useStore, selectActiveScenario } from '../store/useStore';
import { generateProjection } from '../BUSINESS_LOGIC';

// ── Formatters ─────────────────────────────────────────────────────────────
const fmtM = (v: number) => {
  if (Math.abs(v) >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (Math.abs(v) >= 1_000)     return `$${(v / 1_000).toFixed(0)}K`;
  return `$${v.toFixed(0)}`;
};

const fmtAxis = (v: number) => {
  if (Math.abs(v) >= 1_000_000_000) return `$${(v / 1_000_000_000).toFixed(1)}B`;
  if (Math.abs(v) >= 1_000_000)     return `$${(v / 1_000_000).toFixed(0)}M`;
  if (Math.abs(v) >= 1_000)         return `$${(v / 1_000).toFixed(0)}K`;
  return `$${v}`;
};

// ── Custom Tooltip ─────────────────────────────────────────────────────────
interface TooltipPayloadItem {
  name: string;
  value: number;
  color: string;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: string | number;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-surface-700 border border-white/10 rounded-xl p-3 shadow-2xl min-w-[200px]">
      <p className="text-xs font-bold text-brand-400 mb-2">
        {label === 0 ? 'Año 0 (Inversión Inicial)' : `Año ${label}`}
      </p>
      {payload.map((item) => (
        <div key={item.name} className="flex items-center justify-between gap-4 text-xs py-0.5">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
            <span className="text-slate-400">{item.name}</span>
          </div>
          <span className="font-mono font-semibold text-white">{fmtM(item.value)}</span>
        </div>
      ))}
    </div>
  );
}

// ── Chart 1: Net Cash Flow & Cumulative NPV ────────────────────────────────
export function NetCashFlowChart() {
  const scenario = useStore(selectActiveScenario);
  if (!scenario) return null;

  const data = generateProjection(scenario).map((d) => ({
    year: d.year,
    'Flujo Neto':       d.netCashFlow,
    'VPN Acumulado':    d.cumulativeNPV,
  }));

  return (
    <div className="glass-card p-5 animate-fade-in">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-white">Flujo Neto Anual & VPN Acumulado</h3>
        <p className="text-xs text-slate-500 mt-0.5">Proyección {scenario.global.analysisHorizonYears} años · Valores en USD</p>
      </div>
      <ResponsiveContainer width="100%" height={240}>
        <ComposedChart data={data} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
          <defs>
            <linearGradient id="npvGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="#6366f1" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#6366f1" stopOpacity={0}   />
            </linearGradient>
          </defs>
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
          <Legend
            wrapperStyle={{ paddingTop: '12px', fontSize: '11px', color: '#94a3b8' }}
          />
          <ReferenceLine y={0} stroke="rgba(255,255,255,0.15)" strokeDasharray="4 4" />
          <Bar dataKey="Flujo Neto" fill="#818cf8" radius={[3, 3, 0, 0]} opacity={0.8} />
          <Area
            type="monotone"
            dataKey="VPN Acumulado"
            stroke="#a855f7"
            strokeWidth={2.5}
            fill="url(#npvGradient)"
            dot={{ fill: '#a855f7', r: 3, strokeWidth: 0 }}
            activeDot={{ r: 5, fill: '#a855f7' }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

// ── Chart 2: CAPEX vs Beneficios vs OPEX (acumulado) ──────────────────────
export function CapexVsBenefitsChart() {
  const scenario = useStore(selectActiveScenario);
  if (!scenario) return null;

  const raw = generateProjection(scenario);
  // Acumular valores año a año para la curva de payback
  let cumCapex = 0, cumBenefits = 0, cumOpex = 0, cumVad = 0;
  const data = raw.map((d) => {
    cumCapex    += d.capex;
    cumBenefits += d.benefits;
    cumOpex     += d.opex;
    cumVad      += d.vadRevenue || 0;
    return {
      year:               d.year,
      'CAPEX Acum.':      cumCapex,
      'Ahorros Acum.':    cumBenefits,
      'VAD Acum.':        cumVad,
      'Ingresos Tot.':    cumBenefits + cumVad,
      'OPEX Acum.':       cumOpex,
    };
  });

  return (
    <div className="glass-card p-5 animate-fade-in">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-white">Curva de Payback: Costos vs. Ingresos Acumulados</h3>
        <p className="text-xs text-slate-500 mt-0.5">El cruce entre Ingresos (Ahorros + VAD) y Egresos (CAPEX+OPEX) marca el breakeven</p>
      </div>
      <ResponsiveContainer width="100%" height={240}>
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
          <Legend
            wrapperStyle={{ paddingTop: '12px', fontSize: '11px', color: '#94a3b8' }}
          />
          <Line
            type="monotone"
            dataKey="CAPEX Acum."
            stroke="#f43f5e"
            strokeWidth={2.5}
            dot={{ fill: '#f43f5e', r: 3, strokeWidth: 0 }}
            activeDot={{ r: 5 }}
          />
          <Line
            type="monotone"
            dataKey="OPEX Acum."
            stroke="#f59e0b"
            strokeWidth={2}
            strokeDasharray="5 3"
            dot={{ fill: '#f59e0b', r: 3, strokeWidth: 0 }}
            activeDot={{ r: 5 }}
          />
          <Line
            type="monotone"
            dataKey="Ingresos Tot."
            stroke="#10b981"
            strokeWidth={2.5}
            dot={{ fill: '#10b981', r: 3, strokeWidth: 0 }}
            activeDot={{ r: 5 }}
          />
          <Line
            type="monotone"
            dataKey="VAD Acum."
            stroke="#a855f7"
            strokeWidth={2}
            strokeDasharray="3 3"
            dot={{ fill: '#a855f7', r: 3, strokeWidth: 0 }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

// ── Chart 3: Descomposición anual de Beneficios (barras apiladas) ──────────
export function BenefitsBreakdownChart() {
  const scenario = useStore(selectActiveScenario);
  if (!scenario) return null;

  const { global, benefits } = scenario;

  const data = generateProjection(scenario)
    .filter((d) => d.year > 0)
    .map((d) => {
      const progress = d.year / global.analysisHorizonYears;
      const savingsOpex =
        ((benefits.manualReadsVolume * benefits.manualReadUnitCost) +
         ((benefits.annualCutsVolume + benefits.annualReposVolume) * benefits.dispatchCost)) * progress;
      const savingsFines =
        (benefits.estFinesAnnual +
         (benefits.saidiHistoricalHours * (benefits.saidiTargetReduction / 100) * benefits.finePerHour)) * progress;
      const fraudRecovery =
        (benefits.nonTechLossesMwh * (benefits.recoveryRateTarget / 100) *
         (benefits.currentTariff - benefits.energyWholesaleCost)) * progress;

      return {
        year:              d.year,
        'Efic. Operativa': savingsOpex,
        'Multas/Calidad':  savingsFines,
        'Rec. Fraude':     fraudRecovery,
        'VAD (ENRE)':      d.vadRevenue,
      };
    });

  return (
    <div className="glass-card p-5 animate-fade-in">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-white">Composición de Beneficios por Año</h3>
        <p className="text-xs text-slate-500 mt-0.5">Las 3 palancas de generación de valor madurando con el rollout</p>
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
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
          <Legend
            wrapperStyle={{ paddingTop: '12px', fontSize: '11px', color: '#94a3b8' }}
          />
          <Bar dataKey="Efic. Operativa" stackId="a" fill="#10b981" radius={[0, 0, 0, 0]} />
          <Bar dataKey="Multas/Calidad"  stackId="a" fill="#3b82f6" />
          <Bar dataKey="Rec. Fraude"     stackId="a" fill="#f59e0b" />
          <Bar dataKey="VAD (ENRE)"      stackId="a" fill="#a855f7" radius={[3, 3, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
