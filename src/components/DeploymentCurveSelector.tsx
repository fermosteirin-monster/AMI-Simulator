// components/DeploymentCurveSelector.tsx
// Selector visual de curva de despliegue con preview SVG

import { motion } from 'framer-motion';
import type { DeploymentCurve } from '../DATA_MODEL';

interface Props {
  value: DeploymentCurve;
  onChange: (v: DeploymentCurve) => void;
  totalEndpoints: number;
  horizon: number;
}

const CURVES: {
  key: DeploymentCurve;
  label: string;
  desc: string;
  color: string;
  border: string;
  activeBg: string;
  svgPath: (w: number, h: number) => string;
}[] = [
  {
    key: 'slow',
    label: 'Gradual (cuadrático)',
    desc: 'Comienza lento, acelera progresivamente hacia el final',
    color: 'text-amber-400',
    border: 'border-amber-500/40',
    activeBg: 'bg-amber-500/10',
    // Curva cuadrática: comienza plano, sube rápido al final
    svgPath: (w, h) => {
      const pts = Array.from({ length: 20 }, (_, i) => {
        const t = i / 19;
        const x = t * w;
        const y = h - (t * t) * h * 0.9;
        return `${x},${y}`;
      });
      return `M 0,${h} L ${pts.join(' L ')} L ${w},${h * 0.1}`;
    },
  },
  {
    key: 'accelerated',
    label: 'Acelerado (aritmético)',
    desc: 'Crece a ritmo creciente, entre gradual y lineal',
    color: 'text-emerald-400',
    border: 'border-emerald-500/40',
    activeBg: 'bg-emerald-500/10',
    // Curva exponencial: sube rápido al principio
    svgPath: (w, h) => {
      const pts = Array.from({ length: 20 }, (_, i) => {
        const t = i / 19;
        // Exponencial limitada a 1 (se aplana al llegar al total)
        const raw = Math.min(1, (Math.pow(2, t * 4) - 1) / (Math.pow(2, 4) - 1));
        const x = t * w;
        const y = h - raw * h * 0.9;
        return `${x},${y}`;
      });
      return `M 0,${h} L ${pts.join(' L ')} L ${w},${h * 0.1}`;
    },
  },
  {
    key: 'linear',
    label: 'Lineal (tasa constante)',
    desc: 'Misma cantidad de instalaciones cada año tras el Año 1',
    color: 'text-brand-400',
    border: 'border-brand-500/40',
    activeBg: 'bg-brand-500/10',
    // Línea recta
    svgPath: (w, h) => `M 0,${h} L ${w},${h * 0.1}`,
  },
];

// Mini chart SVG
function CurvePreview({ svgPath, color, isActive }: {
  svgPath: (w: number, h: number) => string;
  color: string;
  isActive: boolean;
}) {
  const W = 80; const H = 36;
  const path = svgPath(W, H);
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} className="flex-shrink-0">
      {/* Área rellena */}
      <path
        d={`${path} L ${W},${H} Z`}
        fill={isActive ? 'currentColor' : 'currentColor'}
        fillOpacity={isActive ? 0.15 : 0.06}
        className={color}
      />
      {/* Línea */}
      <path
        d={path.replace(/^M 0,\d+ L /, 'M ')} // solo la línea superior
        fill="none"
        stroke="currentColor"
        strokeWidth={isActive ? 2 : 1.5}
        strokeLinecap="round"
        className={color}
        opacity={isActive ? 1 : 0.5}
      />
    </svg>
  );
}

export default function DeploymentCurveSelector({ value, onChange }: Props) {
  return (
    <div className="space-y-1.5">
      {CURVES.map((c) => {
        const isActive = value === c.key;
        return (
          <motion.button
            key={c.key}
            onClick={() => onChange(c.key)}
            className={`
              w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border text-left
              transition-all duration-150
              ${isActive
                ? `${c.activeBg} ${c.border}`
                : 'border-transparent hover:bg-white/4'
              }
            `}
            whileTap={{ scale: 0.98 }}
          >
            <CurvePreview svgPath={c.svgPath} color={c.color} isActive={isActive} />
            <div className="flex-1 min-w-0">
              <p className={`text-xs font-semibold ${isActive ? c.color : 'text-slate-400'}`}>
                {c.label}
              </p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                {c.desc}
              </p>
            </div>
            {isActive && (
              <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${c.color.replace('text-', 'bg-')}`} />
            )}
          </motion.button>
        );
      })}
    </div>
  );
}
