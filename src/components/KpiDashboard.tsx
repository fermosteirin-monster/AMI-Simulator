// components/KpiDashboard.tsx — KPI cards premium con Framer Motion

import { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp, TrendingDown, DollarSign,
  BarChart3, Zap, AlertTriangle, Settings, HardDrive,
} from 'lucide-react';
import { useStore, selectActiveScenario } from '../store/useStore';
import {
  calculateNPV,
  calculateCapexForYear,
  calculateOpexForYear,
  calculateBenefitsForYear,
  getDeploymentSchedule,
  getCumulativeDeployed,
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
      className={`kpi-card p-5 ${a.card}`}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay, ease: [0.16, 1, 0.3, 1] }}
      layout
    >
      <div className="relative z-10 flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-xs uppercase tracking-widest font-semibold mb-3"
            style={{ color: 'var(--text-muted)' }}>
            {label}
          </p>
          <div className={`text-2xl font-bold leading-none mb-2 ${a.value}`}>
            <AnimatedValue value={value} />
          </div>
          <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>{sub}</p>
        </div>
        <div className={`flex-shrink-0 w-10 h-10 rounded-xl glass flex items-center justify-center ${a.icon}`}>
          {icon}
        </div>
      </div>
      {trend && (
        <div className="relative z-10 mt-3 flex items-center gap-1">
          <span className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs font-medium ${a.badge}`}>
            {trend === 'up'
              ? <><TrendingUp className="w-3 h-3" /> Positivo</>
              : <><TrendingDown className="w-3 h-3" /> Negativo</>
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

  const opexMature    = calculateOpexForYear(scenario, horizon);
  const benefitsMature = calculateBenefitsForYear(scenario, horizon);
  const npv           = calculateNPV(scenario);

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
    cumulativeNPV += (calculateBenefitsForYear(scenario, t) - calculateOpexForYear(scenario, t) - calculateCapexForYear(scenario, t)) / Math.pow(1 + r, t);
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
      label:  'Beneficios Año Final',
      value:  fmtUSD(benefitsMature),
      sub:    '3 palancas al 100% del rollout',
      accent: 'green',
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
  ];

  return (
    <div className="grid grid-cols-2 xl:grid-cols-3 gap-4">
      {cards.map((card, i) => (
        <KpiCard key={card.label} {...card} delay={i * 0.06} />
      ))}
    </div>
  );
}
