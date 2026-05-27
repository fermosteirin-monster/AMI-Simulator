// components/ScenarioCompare.tsx
// Tabla comparativa de KPIs entre todos los escenarios cargados

import { useStore } from '../store/useStore';
import {
  calculateNPV,
  calculateCapexForYear,
  calculateOpexForYear,
  calculateBenefitsForYear,
} from '../BUSINESS_LOGIC';

const fmtUSD = (n: number) =>
  new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'USD',
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(n);

const fmtX = (n: number) => `${n.toFixed(1)}x`;

function DeltaBadge({ base, value }: { base: number; value: number }) {
  if (base === 0) return null;
  const pct = ((value - base) / Math.abs(base)) * 100;
  if (Math.abs(pct) < 0.1) return <span className="text-xs text-slate-500">—</span>;
  const pos = pct > 0;
  return (
    <span className={`text-xs font-mono px-1.5 py-0.5 rounded-md ${pos ? 'bg-emerald-500/15 text-emerald-400' : 'bg-rose-500/15 text-rose-400'}`}>
      {pos ? '+' : ''}{pct.toFixed(1)}%
    </span>
  );
}

export default function ScenarioCompare() {
  const { scenarios, activeScenarioId, setActiveScenario } = useStore();

  if (scenarios.length < 2) {
    return (
      <div className="glass-card p-5 flex items-center justify-center min-h-[100px]">
        <p className="text-xs text-slate-500 text-center">
          Cloná el escenario base para ver la comparativa aquí.<br />
          <span className="text-brand-400">Botón "Clonar escenario activo" en el sidebar.</span>
        </p>
      </div>
    );
  }

  // Calcular KPIs para cada escenario
  const rows = scenarios.map((s) => {
    const horizon = s.global.analysisHorizonYears;
    const totalCapex = Array.from({ length: horizon + 1 }, (_, i) =>
      calculateCapexForYear(s, i)
    ).reduce((a, b) => a + b, 0);
    const opexMature     = calculateOpexForYear(s, horizon);
    const benefitsMature = calculateBenefitsForYear(s, horizon);
    const npv            = calculateNPV(s);

    // Breakeven
    let breakeven: number | null = null;
    let cum = 0;
    const r = s.global.wacc / 100;
    for (let t = 0; t <= horizon; t++) {
      cum += (calculateBenefitsForYear(s, t) - calculateOpexForYear(s, t) - calculateCapexForYear(s, t))
        / Math.pow(1 + r, t);
      if (cum >= 0 && breakeven === null) breakeven = t;
    }

    return { scenario: s, npv, totalCapex, opexMature, benefitsMature, breakeven: breakeven as number | null };
  });

  // Baseline es el primero con isBaseline === true, o el primero de la lista
  const baseRow = rows.find((r) => r.scenario.isBaseline) ?? rows[0];

  const COLS = [
    { key: 'npv',            label: 'VPN Total',         fmt: (v: number) => fmtUSD(v),   baseVal: baseRow.npv },
    { key: 'totalCapex',     label: 'CAPEX Acum.',       fmt: (v: number) => fmtUSD(v),   baseVal: baseRow.totalCapex },
    { key: 'benefitsMature', label: 'Beneficios A.Final',fmt: (v: number) => fmtUSD(v),   baseVal: baseRow.benefitsMature },
    { key: 'opexMature',     label: 'OPEX A.Final',      fmt: (v: number) => fmtUSD(v),   baseVal: baseRow.opexMature },
    {
      key: 'coverage',
      label: 'Cobertura B/O',
      fmt: (_: number, row: typeof rows[0]) =>
        row.opexMature > 0 ? fmtX(row.benefitsMature / row.opexMature) : '—',
      baseVal: baseRow.opexMature > 0 ? baseRow.benefitsMature / baseRow.opexMature : 0,
    },
    {
      key: 'breakeven',
      label: 'Breakeven',
      fmt: (_: number, row: typeof rows[0]) =>
        row.breakeven !== null ? `Año ${row.breakeven}` : '> Horizonte',
      baseVal: baseRow.breakeven ?? 99,
    },
  ];

  return (
    <div className="glass-card p-5 animate-fade-in overflow-x-auto">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-white">Comparativa de Escenarios</h3>
        <p className="text-xs text-slate-500 mt-0.5">
          Los delta (%) se calculan respecto al escenario baseline · Click para activar
        </p>
      </div>

      <table className="w-full text-xs border-collapse">
        <thead>
          <tr className="border-b border-white/5">
            <th className="text-left pb-2 pr-4 text-slate-500 font-medium w-32">Escenario</th>
            {COLS.map((c) => (
              <th key={c.key} className="text-right pb-2 px-3 text-slate-500 font-medium whitespace-nowrap">
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {rows.map(({ scenario: s, ...vals }) => {
            const isActive = s.id === activeScenarioId;
            return (
              <tr
                key={s.id}
                id={`compare-row-${s.id}`}
                onClick={() => setActiveScenario(s.id)}
                className={`cursor-pointer transition-all duration-150 group ${
                  isActive
                    ? 'bg-brand-600/10'
                    : 'hover:bg-white/3'
                }`}
              >
                {/* Scenario name */}
                <td className="py-2.5 pr-4">
                  <div className="flex items-center gap-2">
                    {isActive && (
                      <div className="w-1.5 h-1.5 rounded-full bg-brand-400 flex-shrink-0" />
                    )}
                    <div>
                      <p className={`font-medium truncate max-w-[120px] ${isActive ? 'text-brand-300' : 'text-slate-300 group-hover:text-white'}`}>
                        {s.name}
                      </p>
                      {s.isBaseline && (
                        <span className="text-brand-500 text-xs">baseline</span>
                      )}
                    </div>
                  </div>
                </td>

                {/* KPI columns */}
                {COLS.map((c) => {
                  const rawVal = c.key === 'coverage'
                    ? vals.opexMature > 0 ? vals.benefitsMature / vals.opexMature : 0
                    : c.key === 'breakeven'
                    ? vals.breakeven ?? 99
                    : vals[c.key as keyof typeof vals] as number;

                  const isBaseScenario = s.isBaseline;

                  return (
                    <td key={c.key} className="py-2.5 px-3 text-right">
                      <div className="flex flex-col items-end gap-0.5">
                        <span className={`font-mono ${
                          c.key === 'npv'
                            ? rawVal >= 0 ? 'text-emerald-400' : 'text-rose-400'
                            : 'text-slate-200'
                        }`}>
                          {'fmt' in c && typeof c.fmt === 'function'
                            ? c.fmt(rawVal, { scenario: s, ...vals })
                            : '—'
                          }
                        </span>
                        {!isBaseScenario && (
                          <DeltaBadge base={c.baseVal} value={rawVal} />
                        )}
                      </div>
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
