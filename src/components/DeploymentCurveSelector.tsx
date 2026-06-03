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
    key: 'bell',
    label: 'Campana (Orgánica)',
    desc: 'Despliegue gradual simétrico. Pico máximo a mitad del proyecto',
    color: 'text-amber-400',
    border: 'border-amber-500/40',
    activeBg: 'bg-amber-500/10',
    svgPath: (w, h) => {
      const pts = Array.from({ length: 20 }, (_, i) => {
        const t = i / 19;
        const x = t * w;
        const y = h - (0.2 + 0.8 * Math.sin(t * Math.PI)) * h * 0.9;
        return `${x},${y}`;
      });
      return `M 0,${h} L ${pts.join(' L ')} L ${w},${h}`;
    },
  },
  {
    key: 'plateau',
    label: 'Meseta (Front-loaded)',
    desc: 'Rápida aceleración a tope de capacidad, meseta estable, y desmovilización',
    color: 'text-emerald-400',
    border: 'border-emerald-500/40',
    activeBg: 'bg-emerald-500/10',
    svgPath: (w, h) => {
      const pts = Array.from({ length: 20 }, (_, i) => {
        const t = i / 19;
        const x = t * w;
        let y = h;
        if (t < 0.25) y = h - (0.2 + 0.8 * (t / 0.25)) * h * 0.9;
        else if (t <= 0.75) y = h - 1.0 * h * 0.9;
        else y = h - (0.2 + 0.8 * ((1 - t) / 0.25)) * h * 0.9;
        return `${x},${y}`;
      });
      return `M 0,${h} L ${pts.join(' L ')} L ${w},${h}`;
    },
  },
  {
    key: 'linear',
    label: 'Lineal (Tasa Constante)',
    desc: 'Misma cantidad de instalaciones cada año tras el Año 1',
    color: 'text-brand-400',
    border: 'border-brand-500/40',
    activeBg: 'bg-brand-500/10',
    svgPath: (w, h) => `M 0,${h} L 0,${h*0.6} L ${w},${h*0.6} L ${w},${h}`,
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
