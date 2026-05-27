// ITScheduleSelector.tsx — Distribución temporal de Integración IT

import { motion } from 'framer-motion';

const YEAR_META = [
  { key: 'itScheduleY0', label: 'Año 0 — Pre-op', color: '#6366f1' },
  { key: 'itScheduleY1', label: 'Año 1',           color: '#8b5cf6' },
  { key: 'itScheduleY2', label: 'Año 2',           color: '#10b981' },
  { key: 'itScheduleY3', label: 'Año 3',           color: '#f59e0b' },
  { key: 'itScheduleY4', label: 'Año 4',           color: '#f43f5e' },
  { key: 'itScheduleY5', label: 'Año 5',           color: '#06b6d4' },
];

interface Props {
  values: Record<string, number>;
  totalAmount: number;
  onChange: (field: string, value: number) => void;
}

export default function ITScheduleSelector({ values, totalAmount, onChange }: Props) {
  const entries = YEAR_META.map((m) => ({ ...m, pct: values[m.key] ?? 0 }));
  const total   = entries.reduce((s, e) => s + e.pct, 0);
  const isValid = Math.abs(total - 100) < 0.5;
  const remaining = 100 - total;

  const fmtM = (pct: number) =>
    `$${((totalAmount * pct) / 100 / 1_000_000).toFixed(1)}M`;

  return (
    <div className="space-y-3">

      {/* Stacked bar */}
      <div className="h-4 rounded-lg overflow-hidden flex" style={{ background: 'var(--bg-glass)' }}>
        {entries.map((e) =>
          e.pct > 0 ? (
            <motion.div
              key={e.key}
              animate={{ width: `${Math.min(100, e.pct)}%` }}
              initial={{ width: 0 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              style={{ background: e.color, minWidth: 2 }}
            />
          ) : null
        )}
      </div>

      {/* Year rows */}
      <div className="space-y-1.5">
        {entries.map((e) => (
          <div key={e.key} className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: e.color }} />
            <span className="text-xs flex-1 whitespace-nowrap" style={{ color: 'var(--text-muted)' }}>
              {e.label}
            </span>
            <span
              className="text-xs font-mono w-14 text-right"
              style={{ color: 'var(--text-secondary)' }}
            >
              {fmtM(e.pct)}
            </span>
            <div className="flex items-center gap-1">
              <input
                type="number"
                min={0}
                max={100}
                step={5}
                value={e.pct}
                onChange={(ev) => {
                  const v = Math.max(0, Math.min(100, parseFloat(ev.target.value) || 0));
                  onChange(e.key, v);
                }}
                className="w-14 text-right text-xs rounded-lg px-2 py-1 font-mono focus:outline-none focus:ring-1 focus:ring-brand-500"
                style={{
                  background: 'var(--bg-glass)',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--text-primary)',
                }}
              />
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>%</span>
            </div>
          </div>
        ))}
      </div>

      {/* Total indicator */}
      <div
        className={`flex items-center justify-between text-xs px-3 py-2 rounded-lg border ${
          isValid
            ? 'border-emerald-500/30 bg-emerald-500/10'
            : remaining > 0
            ? 'border-amber-500/30 bg-amber-500/10'
            : 'border-rose-500/30 bg-rose-500/10'
        }`}
      >
        <span style={{ color: 'var(--text-muted)' }}>Total asignado</span>
        <span
          className={`font-bold font-mono ${
            isValid ? 'text-emerald-400' : remaining > 0 ? 'text-amber-400' : 'text-rose-400'
          }`}
        >
          {total.toFixed(0)}%{' '}
          {isValid
            ? '✓'
            : remaining > 0
            ? `— faltan ${remaining.toFixed(0)}%`
            : `— exceso ${(-remaining).toFixed(0)}%`}
        </span>
      </div>
    </div>
  );
}
