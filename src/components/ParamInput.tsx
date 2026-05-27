// components/ParamInput.tsx – Input numérico con tooltip y fix de overlap de unidades

import { useState, useRef } from 'react';
import { HelpCircle } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

type Format = 'number' | 'currency' | 'percent' | 'millions';

interface Props {
  id:       string;
  label:    string;
  value:    number;
  unit:     string;
  format?:  Format;
  min?:     number;
  max?:     number;
  step?:    number;
  tooltip?: string;
  onChange: (v: number) => void;
}

function formatDisplay(v: number, fmt: Format): string {
  switch (fmt) {
    case 'currency': return new Intl.NumberFormat('es-AR').format(Math.round(v));
    case 'percent':  return v.toFixed(1);
    case 'millions': return (v / 1_000_000).toFixed(2);
    case 'number':
    default:         return v % 1 === 0 ? String(v) : v.toFixed(2);
  }
}

function parseInput(raw: string, fmt: Format): number {
  const clean = raw.replace(/\./g, '').replace(',', '.');
  const n = parseFloat(clean);
  if (isNaN(n)) return 0;
  return fmt === 'millions' ? n * 1_000_000 : n;
}

export default function ParamInput({
  id, label, value, unit, format = 'number',
  min, max, step = 1, tooltip, onChange,
}: Props) {
  const [editing, setEditing]   = useState(false);
  const [draft, setDraft]       = useState('');
  const [showTip, setShowTip]   = useState(false);
  const inputRef                = useRef<HTMLInputElement>(null);

  // Calcula el padding derecho según la longitud del unit label
  // Cada caracter ≈ 7px + padding base 8px
  const unitPaddingRight = Math.max(48, unit.length * 7 + 16);

  const displayed = editing ? draft : formatDisplay(value, format);

  const commit = (raw: string) => {
    const n = parseInput(raw, format);
    const clamped = Math.max(min ?? -Infinity, Math.min(max ?? Infinity, n));
    onChange(isNaN(clamped) ? value : clamped);
    setEditing(false);
  };

  return (
    <div className="space-y-1">
      {/* Label row */}
      <div className="flex items-center gap-1">
        <label htmlFor={id} className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
          {label}
        </label>
        {tooltip && (
          <div className="relative ml-auto">
            <button
              onMouseEnter={() => setShowTip(true)}
              onMouseLeave={() => setShowTip(false)}
              className="focus:outline-none"
              tabIndex={-1}
            >
              <HelpCircle className="w-3 h-3" style={{ color: 'var(--text-muted)' }} />
            </button>
            <AnimatePresence>
              {showTip && (
                <motion.div
                  initial={{ opacity: 0, y: 4, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 bottom-full mb-2 z-50 w-56 rounded-xl p-2.5 text-xs leading-relaxed shadow-2xl border"
                  style={{
                    background: 'var(--bg-elevated)',
                    borderColor: 'var(--border-medium)',
                    color: 'var(--text-secondary)',
                  }}
                >
                  {tooltip}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Input + unit */}
      <div className="relative flex items-center">
        <input
          ref={inputRef}
          id={id}
          type="text"
          inputMode="decimal"
          className="param-input font-mono text-xs w-full"
          style={{ paddingRight: `${unitPaddingRight}px` }}
          value={displayed}
          onFocus={() => {
            setDraft(formatDisplay(value, format));
            setEditing(true);
            setTimeout(() => inputRef.current?.select(), 0);
          }}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={(e) => commit(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter')  { commit(draft); inputRef.current?.blur(); }
            if (e.key === 'Escape') { setEditing(false); inputRef.current?.blur(); }
            if (e.key === 'ArrowUp') {
              e.preventDefault();
              onChange(Math.min(max ?? Infinity, value + step));
            }
            if (e.key === 'ArrowDown') {
              e.preventDefault();
              onChange(Math.max(min ?? -Infinity, value - step));
            }
          }}
        />
        {/* Unit label — posicionado con padding calculado */}
        <span
          className="absolute right-2.5 text-xs pointer-events-none select-none whitespace-nowrap"
          style={{ color: 'var(--text-muted)' }}
        >
          {unit}
        </span>
      </div>
    </div>
  );
}
