// components/TechMixSelector.tsx
// Selector de mix tecnológico con 3 sliders que suman 100%

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { deriveP2pPct } from '../BUSINESS_LOGIC';

interface Props {
  wiSunPct: number;
  plcPct:   number;
  onChange: (field: 'wiSunPct' | 'plcPct', value: number) => void;
}

const TECHS = [
  {
    key: 'wiSunPct' as const,
    label: 'Wi-SUN',
    subtitle: '1 Focal Point / 5.000 conexiones',
    color: 'bg-violet-500',
    borderColor: 'border-violet-500/40',
    textColor: 'text-violet-400',
    trackColor: 'accent-violet-500',
  },
  {
    key: 'plcPct' as const,
    label: 'PLC',
    subtitle: '1 Concentrador / 250 conexiones',
    color: 'bg-amber-500',
    borderColor: 'border-amber-500/40',
    textColor: 'text-amber-400',
    trackColor: 'accent-amber-500',
  },
];

function Bar({ wiSunPct, plcPct }: { wiSunPct: number; plcPct: number }) {
  const p2pPct = deriveP2pPct(wiSunPct, plcPct);
  const segments = [
    { pct: wiSunPct, color: 'bg-violet-500', label: 'Wi-SUN' },
    { pct: plcPct,   color: 'bg-amber-500',  label: 'PLC' },
    { pct: p2pPct,   color: 'bg-brand-500',  label: 'P2P' },
  ];

  return (
    <div className="space-y-1">
      <div className="h-3 rounded-full overflow-hidden flex gap-px">
        {segments.map((s) =>
          s.pct > 0 ? (
            <motion.div
              key={s.label}
              className={`${s.color} h-full`}
              style={{ width: `${s.pct}%` }}
              layout
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            />
          ) : null
        )}
      </div>
      <div className="flex text-xs gap-3">
        {segments.map((s) => (
          <span key={s.label} className="flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
            <span className={`w-2 h-2 rounded-full inline-block ${s.color}`} />
            {s.label} <strong style={{ color: 'var(--text-secondary)' }}>{Math.round(s.pct)}%</strong>
          </span>
        ))}
      </div>
    </div>
  );
}

export default function TechMixSelector({ wiSunPct, plcPct, onChange }: Props) {
  const p2pPct = useMemo(() => deriveP2pPct(wiSunPct, plcPct), [wiSunPct, plcPct]);
  const total = wiSunPct + plcPct;
  const overflow = total > 100;

  const handleChange = (field: 'wiSunPct' | 'plcPct', raw: number) => {
    const other = field === 'wiSunPct' ? plcPct : wiSunPct;
    // Limitar para que wiSun + plc no supere 100
    const capped = Math.min(raw, 100 - other);
    onChange(field, capped);
  };

  return (
    <div className="space-y-3">
      {/* Barra visual */}
      <Bar wiSunPct={wiSunPct} plcPct={plcPct} />

      {overflow && (
        <p className="text-xs text-rose-400">
          ⚠ Wi-SUN + PLC supera 100%. P2P = 0%.
        </p>
      )}

      {/* Sliders Wi-SUN y PLC */}
      {TECHS.map((tech) => {
        const val = tech.key === 'wiSunPct' ? wiSunPct : plcPct;
        return (
          <div key={tech.key} className={`glass rounded-xl p-3 border ${tech.borderColor}`}>
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className={`text-xs font-semibold ${tech.textColor}`}>{tech.label}</p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{tech.subtitle}</p>
              </div>
              <span className={`font-mono text-sm font-bold ${tech.textColor}`}>{Math.round(val)}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              step={1}
              value={val}
              onChange={(e) => handleChange(tech.key, Number(e.target.value))}
              className={`w-full h-1.5 rounded-full appearance-none cursor-pointer ${tech.trackColor}`}
              style={{
                background: `linear-gradient(to right, currentColor ${val}%, var(--border-subtle) ${val}%)`,
              }}
            />
          </div>
        );
      })}

      {/* P2P (read-only) */}
      <div className="glass rounded-xl p-3 border border-brand-500/30">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-brand-400">P2P / Celular</p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>SIM M2M — derivado automáticamente</p>
          </div>
          <span className="font-mono text-sm font-bold text-brand-400">{Math.round(Math.max(0, p2pPct))}%</span>
        </div>
        <div className="mt-2 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--border-subtle)' }}>
          <motion.div
            className="h-full bg-brand-500 rounded-full"
            style={{ width: `${Math.max(0, p2pPct)}%` }}
            layout
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          />
        </div>
      </div>
    </div>
  );
}
