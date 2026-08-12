// components/CombinedView.tsx — Vista consolidada AMI + MT Sensors
// WACC y horizonte de análisis de MT se sincronizan con el escenario AMI activo.

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  ComposedChart, Bar, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, ReferenceLine,
} from 'recharts';
import { useStore, selectActiveScenario } from '../store/useStore';
import { useMtSensorStore } from '../store/useMtSensorStore';
import { generateProjection } from '../BUSINESS_LOGIC';
import { generateMtProjection } from '../MT_BUSINESS_LOGIC';
import {
  TrendingUp, DollarSign, BarChart3, Target, Zap,
} from 'lucide-react';

// ── Formatters ───────────────────────────────────────────────────────────────
const fmtUSD = (n: number) =>
  new Intl.NumberFormat('es-AR', {
    style: 'currency', currency: 'USD',
    notation: 'compact', maximumFractionDigits: 1,
  }).format(n);

const fmtAxis = (v: number) => {
  if (Math.abs(v) >= 1e6) return `$${(v / 1e6).toFixed(0)}M`;
  if (Math.abs(v) >= 1e3) return `$${(v / 1e3).toFixed(0)}K`;
  return `$${v.toFixed(0)}`;
};

const fmtPct = (v: number) => {
  if (v === null || v === undefined) return '—';
  if (!isFinite(v)) return v > 0 ? '>1000%' : 'N/A';
  return `${v.toFixed(1)}%`;
};

// ── Custom Tooltip ─────────────────────────────────────────────────────────
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="glass rounded-xl px-3 py-2 shadow-xl border text-xs space-y-1"
      style={{ borderColor: 'var(--border-medium)', background: 'var(--bg-surface)', minWidth: 170 }}
    >
      <p className="font-semibold text-white mb-1.5">Año {label}</p>
      {payload.map((p: any) => (
        <div key={p.name} className="flex justify-between gap-4">
          <span style={{ color: p.fill ?? p.stroke }}>{p.name}</span>
          <span className="font-mono text-white">{fmtUSD(p.value)}</span>
        </div>
      ))}
    </div>
  );
}

// ── IRR helper ────────────────────────────────────────────────────────────
function calcIRR(cashFlows: number[]): number | null {
  let r0 = 0.05, r1 = 0.20;
  for (let i = 0; i < 120; i++) {
    const npv = (r: number) =>
      cashFlows.reduce((acc, cf, t) => acc + cf / Math.pow(1 + r, t), 0);
    const n0 = npv(r0), n1 = npv(r1);
    if (Math.abs(n1) < 1e-4) return r1 * 100;
    if (Math.abs(n0 - n1) < 1e-10) break;
    const r2 = r1 - n1 * ((r1 - r0) / (n1 - n0));
    r0 = r1; r1 = r2;
  }
  return isFinite(r1) ? r1 * 100 : null;
}

// ── KPI Card ──────────────────────────────────────────────────────────────
type Accent = 'green' | 'red' | 'amber' | 'indigo' | 'emerald' | 'purple';
const ACCENT_MAP: Record<Accent, { bg: string; text: string; icon: string }> = {
  green:   { bg: 'border-emerald-500/30 bg-emerald-500/5', text: 'text-emerald-300', icon: 'text-emerald-400' },
  red:     { bg: 'border-rose-500/30 bg-rose-500/5',       text: 'text-rose-300',    icon: 'text-rose-400' },
  amber:   { bg: 'border-amber-500/30 bg-amber-500/5',     text: 'text-amber-300',   icon: 'text-amber-400' },
  indigo:  { bg: 'border-indigo-500/30 bg-indigo-500/5',   text: 'text-indigo-300',  icon: 'text-indigo-400' },
  emerald: { bg: 'border-teal-500/30 bg-teal-500/5',       text: 'text-teal-300',    icon: 'text-teal-400' },
  purple:  { bg: 'border-purple-500/30 bg-purple-500/5',   text: 'text-purple-300',  icon: 'text-purple-400' },
};

interface KpiCardProps {
  icon: React.ReactNode;
  title: string;
  value: string;
  subtitle: string;
  accent: Accent;
  amiValue?: string;
  mtValue?: string;
}

function KpiCard({ icon, title, value, subtitle, accent, amiValue, mtValue }: KpiCardProps) {
  const a = ACCENT_MAP[accent];
  return (
    <motion.div
      whileHover={{ y: -2, transition: { duration: 0.15 } }}
      className={`glass-card rounded-2xl p-4 border flex flex-col gap-2 ${a.bg}`}
    >
      <div className={`w-8 h-8 rounded-xl flex items-center justify-center bg-white/5 ${a.icon}`}>
        {icon}
      </div>
      <p className="text-xs text-slate-400 mt-1">{title}</p>
      <p className={`text-2xl font-bold font-mono tracking-tight ${a.text}`}>{value}</p>
      <p className="text-xs text-slate-500">{subtitle}</p>
      {(amiValue || mtValue) && (
        <div className="mt-1 pt-2 border-t border-white/8 flex gap-3 text-xs">
          {amiValue && (
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-sm bg-indigo-400 inline-block" />
              <span className="text-slate-400">AMI:</span>
              <span className="text-indigo-300 font-mono">{amiValue}</span>
            </span>
          )}
          {mtValue && (
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-sm bg-emerald-400 inline-block" />
              <span className="text-slate-400">MT:</span>
              <span className="text-emerald-300 font-mono">{mtValue}</span>
            </span>
          )}
        </div>
      )}
    </motion.div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────
export default function CombinedView() {
  const amiScenario = useStore(selectActiveScenario);
  const mtParamsRaw = useMtSensorStore(s => s.params);

  const horizon = amiScenario?.global.analysisHorizonYears ?? 20;
  const wacc    = amiScenario?.global.wacc ?? 14;

  // Override MT params to sync WACC and horizon with AMI
  const mtParams = useMemo(
    () => ({ ...mtParamsRaw, wacc, projectHorizon: horizon }),
    [mtParamsRaw, wacc, horizon]
  );

  const amiProjection = useMemo(
    () => (amiScenario ? generateProjection(amiScenario) : []),
    [amiScenario]
  );

  const { projection: mtProjection, kpis: mtKpis } = useMemo(
    () => generateMtProjection(mtParams),
    [mtParams]
  );

  // ── Alinear proyecciones al horizonte AMI ────────────────────────────────
  const combinedData = useMemo(() => {
    return amiProjection.map((ami) => {
      const mt = mtProjection.find(m => m.year === ami.year);
      return {
        year: ami.year,
        'FCF AMI':   ami.netCashFlow,
        'FCF MT':    mt?.netCashFlow ?? 0,
        'CAPEX AMI': -ami.capex,
        'CAPEX MT':  mt ? -(mt.capex) : 0,
        'Impuesto AMI': amiScenario?.global.includeTax && ami.incomeTax > 0 ? -ami.incomeTax : null,
        'Impuesto MT':  mtParams.includeTax && (mt?.incomeTax ?? 0) > 0 ? -(mt!.incomeTax) : null,
      };
    });
  }, [amiProjection, mtProjection]);

  // ── KPIs combinados ──────────────────────────────────────────────────────
  const combinedKpis = useMemo(() => {
    const r = wacc / 100;

    // NPV: cada uno descontado a WACC de AMI
    const amiNpv = amiProjection.reduce(
      (acc, d) => acc + d.netCashFlow / Math.pow(1 + r, d.year), 0
    );
    const mtNpv = mtProjection.reduce(
      (acc, d) => acc + d.netCashFlow / Math.pow(1 + r, d.year), 0
    );
    const totalNpv = amiNpv + mtNpv;

    // CAPEX total
    const amiCapex = amiProjection.reduce((acc, d) => acc + d.capex, 0);
    const mtCapex  = mtKpis.totalCapex;
    const totalCapex = amiCapex + mtCapex;

    // IRR combinada sobre suma de FCFs
    const maxLen = Math.max(amiProjection.length, mtProjection.length);
    const combinedCfs: number[] = [];
    for (let t = 0; t < maxLen; t++) {
      const a = amiProjection[t]?.netCashFlow ?? 0;
      const m = mtProjection[t]?.netCashFlow  ?? 0;
      combinedCfs.push(a + m);
    }
    const combinedIrr = calcIRR(combinedCfs);

    // Payback combinado (primer año FCF acumulado >= 0)
    let accFcf = 0;
    let breakeven: number | null = null;
    let peakNeg = 0;
    let peakNegYear: number | null = null;
    for (const ami of amiProjection) {
      const mt  = mtProjection.find(m => m.year === ami.year);
      const combined = ami.netCashFlow + (mt?.netCashFlow ?? 0);
      accFcf += combined;
      if (accFcf < peakNeg) { peakNeg = accFcf; peakNegYear = ami.year; }
      if (breakeven === null && accFcf >= 0 && ami.year > 0) breakeven = ami.year;
    }

    return { amiNpv, mtNpv, totalNpv, amiCapex, mtCapex, totalCapex, combinedIrr, breakeven, peakNeg, peakNegYear };
  }, [amiProjection, mtProjection, mtKpis, wacc]);

  // ── Flujo acumulado (hasta breakeven) ──────────────────────────────────
  const chartDataWithAcc = useMemo(() => {
    let acc = 0;
    return combinedData.map(d => {
      acc += (d['FCF AMI'] + d['FCF MT']);
      const pastBreakeven = combinedKpis.breakeven !== null && d.year > combinedKpis.breakeven;
      return {
        ...d,
        'Flujo Acumulado': pastBreakeven ? null : acc,
      };
    });
  }, [combinedData, combinedKpis.breakeven]);

  if (!amiScenario) return (
    <div className="flex items-center justify-center h-full text-slate-500">
      No hay escenario AMI activo
    </div>
  );

  const npvPositive = combinedKpis.totalNpv > 0;
  const irrPositive = combinedKpis.combinedIrr !== null && combinedKpis.combinedIrr > wacc;

  return (
    <div className="flex-1 overflow-y-auto p-5 space-y-5">

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Vista Combinada — AMI + MT Sensors</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Horizonte de análisis: {horizon} años · WACC: {wacc}% · Escenario AMI: {amiScenario.name}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {(amiScenario.global.includeTax || mtParams.includeTax) && (
            <span className="flex items-center gap-1.5 text-xs px-2 py-1 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30 mr-2">
              Imp. Ganancias Activo
            </span>
          )}
          <span className="flex items-center gap-1.5 text-xs px-2 py-1 rounded-full bg-indigo-500/15 text-indigo-300 border border-indigo-500/25">
            <span className="w-2 h-2 rounded-sm bg-indigo-400" /> AMI
          </span>
          <span className="flex items-center gap-1.5 text-xs px-2 py-1 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/25">
            <span className="w-2 h-2 rounded-sm bg-emerald-400" /> MT Sensors
          </span>
        </div>
      </div>

      {/* ── KPI Cards ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard
          icon={<TrendingUp className="w-4 h-4" />}
          title="VPN Total Combinado"
          value={fmtUSD(combinedKpis.totalNpv)}
          subtitle={`Descontado al WACC ${wacc}%`}
          accent={npvPositive ? 'green' : 'red'}
          amiValue={fmtUSD(combinedKpis.amiNpv)}
          mtValue={fmtUSD(combinedKpis.mtNpv)}
        />
        <KpiCard
          icon={<BarChart3 className="w-4 h-4" />}
          title="TIR Combinada"
          value={combinedKpis.combinedIrr !== null ? fmtPct(combinedKpis.combinedIrr) : '—'}
          subtitle={irrPositive ? `Supera el WACC (${wacc}%)` : `Inferior al WACC (${wacc}%)`}
          accent={irrPositive ? 'green' : 'amber'}
        />
        <KpiCard
          icon={<DollarSign className="w-4 h-4" />}
          title="CAPEX Total"
          value={fmtUSD(combinedKpis.totalCapex)}
          subtitle="Inversión total del programa"
          accent="indigo"
          amiValue={fmtUSD(combinedKpis.amiCapex)}
          mtValue={fmtUSD(combinedKpis.mtCapex)}
        />
        <KpiCard
          icon={<Target className="w-4 h-4" />}
          title="Punto de Equilibrio"
          value={combinedKpis.breakeven !== null ? `Año ${combinedKpis.breakeven}` : '— sin PEQ —'}
          subtitle={
            combinedKpis.peakNeg < 0
              ? `Máx. exposición: ${fmtUSD(combinedKpis.peakNeg)}`
              : 'Flujo positivo desde el inicio'
          }
          accent={combinedKpis.breakeven !== null ? 'emerald' : 'amber'}
        />
      </div>

      {/* ── FCF Apilado ────────────────────────────────────────────────── */}
      <div className="glass-card p-5 animate-fade-in space-y-3">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-sm font-semibold text-white">Flujo de Caja Neto por Fuente</h3>
            <p className="text-xs text-slate-500 mt-0.5">Barras apiladas — AMI (índigo) + MT (esmeralda) · USD</p>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={280}>
          <ComposedChart data={chartDataWithAcc} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
            <defs>
              <linearGradient id="accGradCombined" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#10b981" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
            <XAxis dataKey="year" tickFormatter={v => `A${v}`} tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tickFormatter={fmtAxis} tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} width={72} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ paddingTop: '12px', fontSize: '11px', color: '#94a3b8' }} />
            <ReferenceLine y={0} stroke="rgba(255,255,255,0.15)" strokeDasharray="4 4" />
            {/* Barras apiladas AMI + MT */}
            <Bar dataKey="FCF AMI" stackId="fcf" fill="#818cf8" opacity={0.85} />
            <Bar dataKey="FCF MT"  stackId="fcf" fill="#34d399" opacity={0.85} radius={[3, 3, 0, 0]} />
            {/* Barras de impuestos (valores negativos) */}
            {(amiScenario.global.includeTax || mtParams.includeTax) && (
              <>
                <Bar dataKey="Impuesto AMI" stackId="tax" fill="#f59e0b" opacity={0.85} />
                <Bar dataKey="Impuesto MT"  stackId="tax" fill="#d97706" opacity={0.85} radius={[0, 0, 3, 3]} />
              </>
            )}
            {/* Flujo acumulado combinado */}
            <Area
              type="monotone"
              dataKey="Flujo Acumulado"
              stroke="#10b981"
              strokeWidth={2}
              strokeDasharray="6 3"
              fill="url(#accGradCombined)"
              dot={false}
              connectNulls={false}
              activeDot={{ r: 4, fill: '#10b981' }}
            />
          </ComposedChart>
        </ResponsiveContainer>

        {/* Tarjeta de exposición máxima */}
        {combinedKpis.peakNeg < 0 && (
          <div className="grid grid-cols-2 gap-3 pt-1">
            <div className="glass rounded-xl p-3.5 border border-rose-500/25 bg-rose-500/5">
              <p className="text-xs text-slate-400 mb-1">📉 Máxima Exposición Negativa</p>
              <p className="text-lg font-bold font-mono text-rose-300">{fmtUSD(combinedKpis.peakNeg)}</p>
              <p className="text-xs text-slate-500 mt-0.5">
                {combinedKpis.peakNegYear !== null ? `Pico en Año ${combinedKpis.peakNegYear}` : '—'}
              </p>
            </div>
            <div className="glass rounded-xl p-3.5 border border-emerald-500/25 bg-emerald-500/5">
              <p className="text-xs text-slate-400 mb-1">⚖️ Punto de Equilibrio</p>
              <p className="text-lg font-bold font-mono text-emerald-300">
                {combinedKpis.breakeven !== null ? `Año ${combinedKpis.breakeven}` : '— fuera de horizonte —'}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">FCF acumulado sin descontar ≥ 0</p>
            </div>
          </div>
        )}
      </div>

      {/* ── CAPEX Apilado ──────────────────────────────────────────────── */}
      <div className="glass-card p-5 animate-fade-in space-y-3">
        <div>
          <h3 className="text-sm font-semibold text-white">CAPEX por Fuente</h3>
          <p className="text-xs text-slate-500 mt-0.5">Inversión anual — AMI (índigo) + MT (esmeralda) · USD</p>
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <ComposedChart
            data={combinedData.map(d => ({ year: d.year, 'CAPEX AMI': d['CAPEX AMI'], 'CAPEX MT': d['CAPEX MT'] }))}
            margin={{ top: 5, right: 10, left: 10, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
            <XAxis dataKey="year" tickFormatter={v => `A${v}`} tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tickFormatter={fmtAxis} tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} width={72} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ paddingTop: '12px', fontSize: '11px', color: '#94a3b8' }} />
            <ReferenceLine y={0} stroke="rgba(255,255,255,0.15)" strokeDasharray="4 4" />
            <Bar dataKey="CAPEX AMI" stackId="capex" fill="#818cf8" opacity={0.85} />
            <Bar dataKey="CAPEX MT"  stackId="capex" fill="#34d399" opacity={0.85} radius={[3, 3, 0, 0]} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* ── Tabla de beneficios por fuente ──────────────────────────────── */}
      <div className="glass-card p-5 animate-fade-in">
        <h3 className="text-sm font-semibold text-white mb-4">Beneficios Totales por Fuente</h3>
        <div className="grid grid-cols-2 gap-3">
          {/* AMI */}
          <div className="glass rounded-xl p-4 border border-indigo-500/20 bg-indigo-500/5 space-y-2">
            <div className="flex items-center gap-2 mb-3">
              <Zap className="w-4 h-4 text-indigo-400" />
              <span className="text-xs font-semibold text-indigo-300">AMI (Smart Meters)</span>
            </div>
            {[
              { label: 'VPN',   value: fmtUSD(combinedKpis.amiNpv) },
              { label: 'CAPEX', value: fmtUSD(combinedKpis.amiCapex) },
              { label: 'Endpoints', value: `${(amiScenario.global.totalEndpoints / 1e6).toFixed(2)}M` },
              { label: 'Horizonte', value: `${horizon}a` },
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between text-xs">
                <span className="text-slate-400">{label}</span>
                <span className="font-mono text-indigo-200">{value}</span>
              </div>
            ))}
          </div>
          {/* MT */}
          <div className="glass rounded-xl p-4 border border-emerald-500/20 bg-emerald-500/5 space-y-2">
            <div className="flex items-center gap-2 mb-3">
              <Zap className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-semibold text-emerald-300">MT Sensors</span>
            </div>
            {[
              { label: 'VPN',   value: fmtUSD(combinedKpis.mtNpv) },
              { label: 'CAPEX', value: fmtUSD(combinedKpis.mtCapex) },
              { label: 'Trafos', value: `${mtParams.totalTransformers.toLocaleString()}` },
              { label: 'Horizonte Desp.', value: `${mtParams.deploymentHorizon}a` },
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between text-xs">
                <span className="text-slate-400">{label}</span>
                <span className="font-mono text-emerald-200">{value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
}
