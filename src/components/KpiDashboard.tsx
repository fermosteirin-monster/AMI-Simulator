// components/KpiDashboard.tsx — KPI cards premium con Framer Motion

import { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp, TrendingDown, DollarSign,
  BarChart3, Zap, AlertTriangle, Settings, HardDrive, Landmark,
  Percent, PieChart, Target
} from 'lucide-react';
import { useStore, selectActiveScenario } from '../store/useStore';
import {
  calculateNPV,
  calculateCapexForYear,
  calculateOpexForYear,
  calculateBenefitsForYear,
  getDeploymentSchedule,
  getCumulativeDeployed,
  calculateVadRevenueIT,
  calculateVadRevenueMeters,
  calculateROI,
  calculateIRR,
  calculatePI,
} from '../BUSINESS_LOGIC';

// ── Formatters ─────────────────────────────────────────────────────────────
const fmtUSD = (n: number): string =>
  new Intl.NumberFormat('es-AR', {
    style: 'currency', currency: 'USD',
    notation: 'compact', maximumFractionDigits: 1,
  }).format(n);

const fmtNum = (n: number): string =>
  new Intl.NumberFormat('es-AR', { notation: 'compact', maximumFractionDigits: 1 }).format(n);

// ── Animated Number ─────────────────────────────────────────────────────────
function AnimatedValue({ value }: { value: string }) {
  const prevRef = useRef(value);
  const changed = prevRef.current !== value;
  useEffect(() => { prevRef.current = value; });
  return (
    <AnimatePresence mode="wait">
      <motion.span
        key={value}
        initial={changed ? { opacity: 0, y: -8 } : false}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 8 }}
        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
        className="font-mono block"
      >
        {value}
      </motion.span>
    </AnimatePresence>
  );
}

// ── KPI Card ────────────────────────────────────────────────────────────────
type Accent = 'green' | 'red' | 'blue' | 'amber' | 'purple' | 'cyan';

const ACCENT: Record<Accent, { card: string; icon: string; value: string; badge: string }> = {
  green:  { card: 'kpi-card-green',  icon: 'text-emerald-400', value: 'text-emerald-300', badge: 'bg-emerald-500/15 text-emerald-400' },
  red:    { card: 'kpi-card-red',    icon: 'text-rose-400',    value: 'text-rose-300',    badge: 'bg-rose-500/15 text-rose-400'       },
  blue:   { card: 'kpi-card-blue',   icon: 'text-brand-400',   value: 'text-brand-300',   badge: 'bg-brand-500/15 text-brand-400'     },
  amber:  { card: 'kpi-card-amber',  icon: 'text-amber-400',   value: 'text-amber-300',   badge: 'bg-amber-500/15 text-amber-400'     },
  purple: { card: 'kpi-card-purple', icon: 'text-purple-400',  value: 'text-purple-300',  badge: 'bg-purple-500/15 text-purple-400'   },
  cyan:   { card: 'kpi-card-blue',   icon: 'text-cyan-400',    value: 'text-cyan-300',    badge: 'bg-cyan-500/15 text-cyan-400'       },
};

interface KpiCardProps {
  icon:    React.ReactNode;
  label:   string;
  value:   string;
  sub:     string;
  trend?:  'up' | 'down';
  accent?: Accent;
  delay?:  number;
}

function KpiCard({ icon, label, value, sub, trend, accent = 'blue', delay = 0 }: KpiCardProps) {
  const a = ACCENT[accent];
  return (
    <motion.div
      className={`kpi-card p-3.5 ${a.card}`}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay, ease: [0.16, 1, 0.3, 1] }}
      layout
    >
      <div className="relative z-10 flex items-start gap-3">
        <div className={`flex-shrink-0 w-9 h-9 rounded-lg glass flex items-center justify-center ${a.icon}`}>
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] uppercase tracking-widest font-bold mb-1"
            style={{ color: 'var(--text-muted)' }}>
            {label}
          </p>
          <div className={`text-xl font-bold leading-none mb-1 ${a.value}`}>
            <AnimatedValue value={value} />
          </div>
          <p className="text-[10px] leading-tight" style={{ color: 'var(--text-muted)' }}>{sub}</p>
        </div>
      </div>
      {trend && (
        <div className="relative z-10 mt-2 flex items-center gap-1">
          <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-medium ${a.badge}`}>
            {trend === 'up'
              ? <><TrendingUp className="w-2.5 h-2.5" /> Positivo</>
              : <><TrendingDown className="w-2.5 h-2.5" /> Negativo</>
            }
          </span>
        </div>
      )}
    </motion.div>
  );
}

// ── Main Dashboard ──────────────────────────────────────────────────────────
export default function KpiDashboard() {
  const scenario = useStore(selectActiveScenario);
  if (!scenario) return null;

  const { global } = scenario;
  const horizon = global.analysisHorizonYears;

  const totalCapex = Array.from({ length: horizon + 1 }, (_, i) =>
    calculateCapexForYear(scenario, i)
  ).reduce((a, b) => a + b, 0);

  const opexMature     = calculateOpexForYear(scenario, horizon);
  const benefitsMature = calculateBenefitsForYear(scenario, horizon);
  const vadMature      = calculateVadRevenueIT(scenario, horizon) + calculateVadRevenueMeters(scenario, horizon);
  const npv            = calculateNPV(scenario);
  const roi            = calculateROI(scenario);
  const irr            = calculateIRR(scenario);
  const pi             = calculatePI(scenario);

  // Deployment data
  const schedule   = getDeploymentSchedule(scenario);
  const cumulative = getCumulativeDeployed(scenario);
  const installsLastYear = schedule[horizon] ?? 0;
  const totalDeployed    = cumulative[horizon] ?? 0;

  // Breakeven
  let breakevenYear: number | null = null;
  let cumulativeNPV = 0;
  const r = global.wacc / 100;
  for (let t = 0; t <= horizon; t++) {
    const vad = calculateVadRevenueIT(scenario, t) + calculateVadRevenueMeters(scenario, t);
    cumulativeNPV += (calculateBenefitsForYear(scenario, t) + vad - calculateOpexForYear(scenario, t) - calculateCapexForYear(scenario, t)) / Math.pow(1 + r, t);
    if (cumulativeNPV >= 0 && breakevenYear === null) breakevenYear = t;
  }

  const coverageRatio = opexMature > 0 ? benefitsMature / opexMature : 0;

  const cards: KpiCardProps[] = [
    {
      icon:   <DollarSign className="w-5 h-5" />,
      label:  'VPN Total del Proyecto',
      value:  fmtUSD(npv),
      sub:    `Horizonte ${horizon} años · WACC ${global.wacc}%`,
      accent: npv >= 0 ? 'green' : 'red',
      trend:  npv >= 0 ? 'up' : 'down',
    },
    {
      icon:   <BarChart3 className="w-5 h-5" />,
      label:  'CAPEX Total Acumulado',
      value:  fmtUSD(totalCapex),
      sub:    `≈ ${(totalCapex / global.totalEndpoints).toFixed(0)} USD/endpoint promedio`,
      accent: 'red',
      trend:  'down',
    },
    {
      icon:   <Zap className="w-5 h-5" />,
      label:  'Ahorros Año Final',
      value:  fmtUSD(benefitsMature),
      sub:    'Eficiencias Operativas puras al 100% del rollout',
      accent: 'green',
      trend:  'up',
    },
    {
      icon:   <Landmark className="w-5 h-5" />,
      label:  'Ingresos VAD Año Final',
      value:  fmtUSD(vadMature),
      sub:    'Retorno regulatorio sobre RAB (IT y Medidores)',
      accent: 'purple',
      trend:  'up',
    },
    {
      icon:   <Settings className="w-5 h-5" />,
      label:  'OPEX Año Final',
      value:  fmtUSD(opexMature),
      sub:    'Costo operativo con flota completa',
      accent: 'amber',
    },
    {
      icon:   <TrendingUp className="w-5 h-5" />,
      label:  'Cobertura Beneficios / OPEX',
      value:  `${coverageRatio.toFixed(1)}x`,
      sub:    coverageRatio >= 2
        ? '✓ Holgada — beneficios cubren ampliamente el OPEX'
        : coverageRatio >= 1
        ? '⚠ Ajustada — revisar supuestos de beneficios'
        : '✗ Insuficiente — proyecto no viable en OPEX',
      accent: coverageRatio >= 2 ? 'green' : coverageRatio >= 1 ? 'amber' : 'red',
      trend:  coverageRatio >= 1 ? 'up' : 'down',
    },
    {
      icon:   <AlertTriangle className="w-5 h-5" />,
      label:  'Año de Breakeven',
      value:  breakevenYear !== null ? `Año ${breakevenYear}` : '> Horizonte',
      sub:    breakevenYear !== null
        ? `Recuperación total de la inversión en el año ${breakevenYear}`
        : 'El proyecto no recupera la inversión en el horizonte definido',
      accent: breakevenYear !== null && breakevenYear <= Math.ceil(horizon * 0.6) ? 'green' : breakevenYear !== null ? 'amber' : 'red',
      trend:  breakevenYear !== null ? 'up' : 'down',
    },
    {
      icon:   <HardDrive className="w-5 h-5" />,
      label:  `Instalaciones — Año ${horizon}`,
      value:  fmtNum(installsLastYear),
      sub:    `${fmtNum(totalDeployed)} acumulados de ${fmtNum(global.totalEndpoints)} totales · curva ${global.deploymentCurve}`,
      accent: 'cyan',
    },
    {
      icon:   <Target className="w-5 h-5" />,
      label:  'ROI (Nominal)',
      value:  `${(roi * 100).toFixed(1)}%`,
      sub:    'Retorno total sobre la inversión',
      accent: roi >= 0 ? 'green' : 'red',
      trend:  roi >= 0 ? 'up' : 'down',
    },
    {
      icon:   <Percent className="w-5 h-5" />,
      label:  'TIR (Interna)',
      value:  irr !== null ? `${(irr * 100).toFixed(2)}%` : 'N/A',
      sub:    irr !== null && irr * 100 > global.wacc ? `Supera el WACC (${global.wacc}%)` : 'Inferior al WACC',
      accent: irr !== null && irr * 100 >= global.wacc ? 'green' : 'amber',
      trend:  irr !== null && irr * 100 >= global.wacc ? 'up' : 'down',
    },
    {
      icon:   <PieChart className="w-5 h-5" />,
      label:  'Profitability Index',
      value:  `${pi.toFixed(2)}x`,
      sub:    pi > 1 ? 'El proyecto crea valor (PI > 1)' : 'Destruye valor (PI < 1)',
      accent: pi >= 1 ? 'green' : 'red',
      trend:  pi >= 1 ? 'up' : 'down',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
      {cards.map((card, i) => (
        <KpiCard key={card.label} {...card} delay={i * 0.04} />
      ))}
    </div>
  );
}
