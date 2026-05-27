// App.tsx — Premium shell con Framer Motion, modo light/dark, animaciones fluidas

import { useState, useCallback, useEffect } from 'react';
import LoginScreen from './components/LoginScreen';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Zap, Copy, Trash2, ChevronRight, RotateCcw,
  LayoutDashboard, TrendingUp, BarChart2, GitCompare,
  Sparkles, Download, Sun, Moon,
} from 'lucide-react';
import { useStore, selectActiveScenario } from './store/useStore';
import KpiDashboard from './components/KpiDashboard';
import ParamPanel from './components/ParamPanel';
import { NetCashFlowChart, CapexVsBenefitsChart, BenefitsBreakdownChart } from './components/ProjectionChart';
import SensitivityChart from './components/SensitivityChart';
import ScenarioCompare from './components/ScenarioCompare';
import MultiScenarioChart from './components/MultiScenarioChart';
import { PRESETS } from './lib/presets';
import { generateProjection } from './BUSINESS_LOGIC';
import { generateDetailedCSV } from './lib/exportUtils';

type DashTab = 'overview' | 'projection' | 'sensitivity' | 'compare';

const DASH_TABS: { key: DashTab; label: string; icon: React.ReactNode }[] = [
  { key: 'overview',    label: 'Resumen',      icon: <LayoutDashboard className="w-3.5 h-3.5" /> },
  { key: 'projection',  label: 'Proyección',   icon: <TrendingUp className="w-3.5 h-3.5" /> },
  { key: 'sensitivity', label: 'Sensibilidad', icon: <BarChart2 className="w-3.5 h-3.5" /> },
  { key: 'compare',     label: 'Comparativa',  icon: <GitCompare className="w-3.5 h-3.5" /> },
];

// ── Export helpers ─────────────────────────────────────────────────────────
function downloadJSON(data: unknown, filename: string) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}

function downloadCSV(rows: string[][], filename: string) {
  const csv = rows.map((r) => r.map((c) => `"${c}"`).join(',')).join('\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}

// ── Scenario color palette ─────────────────────────────────────────────────
const SCENARIO_COLORS = ['#6366f1','#10b981','#f59e0b','#f43f5e','#8b5cf6','#06b6d4'];

// ── Main ───────────────────────────────────────────────────────────────────
export default function App() {
  const {
    scenarios, activeScenarioId,
    setActiveScenario, cloneScenario, deleteScenario, resetScenarioToBaseline,
  } = useStore();
  const activeScenario = useStore(selectActiveScenario);

  const [authenticated, setAuthenticated] = useState<boolean>(
    () => sessionStorage.getItem('ami_authenticated') === 'true'
  );

  const [cloneName, setCloneName]           = useState('');
  const [showCloneInput, setShowCloneInput] = useState(false);
  const [showPresets, setShowPresets]       = useState(false);
  const [sidebarOpen, setSidebarOpen]       = useState(true);
  const [dashTab, setDashTab]               = useState<DashTab>('overview');
  const [confirmReset, setConfirmReset]     = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [theme, setTheme]                   = useState<'dark' | 'light'>('dark');

  // Apply theme to <html>
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Close export menu on outside click
  useEffect(() => {
    if (!showExportMenu) return;
    const handler = () => setShowExportMenu(false);
    window.addEventListener('click', handler, true);
    return () => window.removeEventListener('click', handler, true);
  }, [showExportMenu]);

  const handleClone = () => {
    if (!cloneName.trim()) return;
    cloneScenario(activeScenarioId, cloneName.trim());
    setCloneName('');
    setShowCloneInput(false);
  };

  const handleReset = () => {
    if (!confirmReset) { setConfirmReset(true); return; }
    resetScenarioToBaseline(activeScenarioId);
    setConfirmReset(false);
  };

  const handleLoadPreset = (presetId: string) => {
    const preset = PRESETS.find((p) => p.id === presetId);
    if (!preset) return;
    const scenario = preset.build();
    useStore.setState((state) => ({
      scenarios: [...state.scenarios, scenario],
      activeScenarioId: scenario.id,
    }));
    setShowPresets(false);
  };

  const handleExportDetailedCSV = () => {
    if (!activeScenario) return;
    const csvStr = generateDetailedCSV(activeScenario);
    const blob = new Blob([csvStr], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `ami-formulas-${activeScenario.id}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
    setShowExportMenu(false);
  };

  const handleExportPDF = () => {
    setShowExportMenu(false);
    setTimeout(() => {
      window.print();
    }, 100);
  };

  const handleExportJSON = useCallback(() => {
    if (!activeScenario) return;
    downloadJSON(activeScenario, `${activeScenario.name.replace(/\s+/g,'_')}.json`);
    setShowExportMenu(false);
  }, [activeScenario]);

  const handleExportCSV = useCallback(() => {
    if (!activeScenario) return;
    const proj = generateProjection(activeScenario);
    const header = ['Año','CAPEX (USD)','OPEX (USD)','Beneficios (USD)','Flujo Neto (USD)','VPN Acumulado (USD)'];
    const rows = proj.map((p) => [
      String(p.year), p.capex.toFixed(2), p.opex.toFixed(2),
      p.benefits.toFixed(2), p.netCashFlow.toFixed(2), p.cumulativeNPV.toFixed(2),
    ]);
    downloadCSV([header, ...rows], `${activeScenario.name.replace(/\s+/g,'_')}_proyeccion.csv`);
    setShowExportMenu(false);
  }, [activeScenario]);

  const handleExportAllJSON = useCallback(() => {
    downloadJSON({ scenarios, exportedAt: new Date().toISOString() }, 'ami_simulator_todos_escenarios.json');
    setShowExportMenu(false);
  }, [scenarios]);

  const isDark = theme === 'dark';

  if (!authenticated) {
    return <LoginScreen onSuccess={() => setAuthenticated(true)} />;
  }

  return (
    <div
      className="flex h-screen overflow-hidden font-sans mesh-bg"
      style={{ color: 'var(--text-primary)' }}
    >
      {/* ── SIDEBAR ─────────────────────────────────────────────────────── */}
      <motion.aside
        animate={{ width: sidebarOpen ? 256 : 56 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className="flex-shrink-0 flex flex-col border-r overflow-hidden"
        style={{
          background: isDark ? 'rgba(15,15,46,0.95)' : 'rgba(255,255,255,0.95)',
          borderColor: 'var(--border-subtle)',
          backdropFilter: 'blur(16px)',
        }}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-3.5 py-4 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
          <div className="w-8 h-8 flex-shrink-0 rounded-xl bg-gradient-to-br from-brand-500 to-purple-600 flex items-center justify-center shadow-lg shadow-brand-500/30">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <AnimatePresence>
            {sidebarOpen && (
              <motion.div
                initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }} transition={{ duration: 0.2 }}
                className="flex-1 overflow-hidden"
              >
                <p className="text-sm font-bold leading-none whitespace-nowrap" style={{ color: 'var(--text-primary)' }}>
                  AMI Simulator
                </p>
                <p className="text-xs leading-none mt-0.5 whitespace-nowrap" style={{ color: 'var(--text-muted)' }}>
                  Edesur · 2.5M endpoints
                </p>
              </motion.div>
            )}
          </AnimatePresence>
          <button id="sidebar-toggle-btn" onClick={() => setSidebarOpen(!sidebarOpen)}
            className="ml-auto flex-shrink-0 transition-colors"
            style={{ color: 'var(--text-muted)' }}>
            <motion.div animate={{ rotate: sidebarOpen ? 180 : 0 }} transition={{ duration: 0.3 }}>
              <ChevronRight className="w-4 h-4" />
            </motion.div>
          </button>
        </div>

        {/* Scenarios */}
        <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
          <AnimatePresence>
            {sidebarOpen && (
              <motion.p
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="text-xs uppercase tracking-widest px-2 py-2 font-semibold"
                style={{ color: 'var(--text-muted)' }}
              >
                Escenarios
              </motion.p>
            )}
          </AnimatePresence>

          {scenarios.map((s, i) => {
            const isActive = s.id === activeScenarioId;
            const dotColor = SCENARIO_COLORS[i % SCENARIO_COLORS.length];
            return (
              <motion.div
                key={s.id}
                id={`scenario-item-${s.id}`}
                className={`scenario-item group ${isActive ? 'scenario-item-active' : ''}`}
                onClick={() => setActiveScenario(s.id)}
                layout
              >
                <div className="w-2.5 h-2.5 rounded-full flex-shrink-0 ring-2 ring-white/10"
                  style={{ background: dotColor }} />
                <AnimatePresence>
                  {sidebarOpen && (
                    <motion.div
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      className="flex-1 min-w-0"
                    >
                      <p className="text-sm font-medium truncate" style={{ color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                        {s.name}
                      </p>
                      {s.isBaseline && <span className="text-xs text-brand-400">baseline</span>}
                    </motion.div>
                  )}
                </AnimatePresence>
                {sidebarOpen && !s.isBaseline && (
                  <button
                    id={`delete-scenario-${s.id}`}
                    onClick={(e) => { e.stopPropagation(); if (scenarios.length > 1) deleteScenario(s.id); }}
                    className="opacity-0 group-hover:opacity-100 transition-all duration-150 text-rose-400 hover:text-rose-300 flex-shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* CTAs */}
        {sidebarOpen && (
          <div className="p-3 border-t space-y-2" style={{ borderColor: 'var(--border-subtle)' }}>
            <AnimatePresence mode="wait">
              {showPresets ? (
                <motion.div key="presets" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="space-y-1.5">
                  <p className="text-xs px-1 pb-0.5" style={{ color: 'var(--text-muted)' }}>Cargar preset:</p>
                  {PRESETS.map((p) => (
                    <button key={p.id} id={`preset-${p.id}`} onClick={() => handleLoadPreset(p.id)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-xs border transition-all ${p.color}`}>
                      <span className="mr-1">{p.emoji}</span><strong>{p.label}</strong>
                      <p className="mt-0.5 text-xs leading-tight" style={{ color: 'var(--text-muted)' }}>{p.description}</p>
                    </button>
                  ))}
                  <button onClick={() => setShowPresets(false)}
                    className="w-full text-xs py-1.5 text-center" style={{ color: 'var(--text-muted)' }}>
                    Cancelar
                  </button>
                </motion.div>
              ) : showCloneInput ? (
                <motion.div key="clone" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="space-y-2">
                  <input id="clone-name-input" className="param-input text-xs" placeholder="Nombre del nuevo escenario…"
                    value={cloneName} onChange={(e) => setCloneName(e.target.value)} autoFocus
                    onKeyDown={(e) => { if (e.key === 'Enter') handleClone(); if (e.key === 'Escape') setShowCloneInput(false); }} />
                  <div className="flex gap-1.5">
                    <button id="clone-confirm-btn" onClick={handleClone}
                      className="flex-1 bg-brand-600 hover:bg-brand-500 text-white text-xs font-medium py-1.5 rounded-lg transition-colors">
                      Crear
                    </button>
                    <button id="clone-cancel-btn" onClick={() => { setShowCloneInput(false); setCloneName(''); }}
                      className="flex-1 glass text-xs font-medium py-1.5 rounded-lg transition-colors"
                      style={{ color: 'var(--text-secondary)' }}>
                      Cancelar
                    </button>
                  </div>
                </motion.div>
              ) : (
                <motion.div key="ctas" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="space-y-1.5">
                  <button id="preset-btn" onClick={() => setShowPresets(true)}
                    className="w-full flex items-center justify-center gap-2 py-2 text-xs font-medium
                      text-purple-400 hover:text-purple-300 border border-purple-500/30 hover:border-purple-500/50
                      rounded-lg transition-all hover:bg-purple-500/5">
                    <Sparkles className="w-3.5 h-3.5" />Cargar preset
                  </button>
                  <button id="clone-scenario-btn" onClick={() => setShowCloneInput(true)}
                    className="w-full flex items-center justify-center gap-2 py-2 text-xs font-medium
                      text-brand-400 hover:text-brand-300 border border-brand-500/30 hover:border-brand-500/50
                      rounded-lg transition-all hover:bg-brand-500/5">
                    <Copy className="w-3.5 h-3.5" />Clonar escenario
                  </button>
                  {!activeScenario?.isBaseline && (
                    <button id="reset-scenario-btn" onClick={handleReset} onBlur={() => setConfirmReset(false)}
                      className={`w-full flex items-center justify-center gap-2 py-2 text-xs font-medium rounded-lg transition-all
                        ${confirmReset
                          ? 'bg-rose-600 text-white border border-rose-500'
                          : 'border hover:bg-white/3'}`}
                      style={!confirmReset ? { borderColor: 'var(--border-subtle)', color: 'var(--text-muted)' } : {}}>
                      <RotateCcw className="w-3.5 h-3.5" />
                      {confirmReset ? '¿Confirmar reset?' : 'Resetear a baseline'}
                    </button>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </motion.aside>

      {/* ── MAIN ────────────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Header */}
        <header className="px-6 py-3 flex items-center justify-between flex-shrink-0 border-b relative z-50"
          style={{
            background: isDark ? 'rgba(15,15,46,0.80)' : 'rgba(255,255,255,0.80)',
            borderColor: 'var(--border-subtle)',
            backdropFilter: 'blur(12px)',
          }}>
          <div>
            <h1 className="text-base font-bold text-gradient leading-none">
              {activeScenario?.name ?? 'Sin escenario'}
            </h1>
            <p className="text-xs mt-0.5 max-w-lg truncate" style={{ color: 'var(--text-muted)' }}>
              {activeScenario?.description}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Meta pills */}
            <div className="flex items-center gap-2">
              {[
                { label: 'Horizonte', value: `${activeScenario?.global.analysisHorizonYears ?? 8}a` },
                { label: 'WACC', value: `${activeScenario?.global.wacc ?? 14}%` },
                { label: 'Endpoints', value: `${((activeScenario?.global.totalEndpoints ?? 0)/1e6).toFixed(1)}M` },
              ].map(({ label, value }) => (
                <div key={label} className="glass px-2.5 py-1 rounded-lg flex items-center gap-1.5">
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{label}:</span>
                  <span className="text-xs font-semibold font-mono text-brand-400">{value}</span>
                </div>
              ))}
              <div className="glass px-2.5 py-1 rounded-lg flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 pulse-glow" />
                <span className="text-xs font-medium text-emerald-400">Live</span>
              </div>
            </div>

            {/* Theme toggle */}
            <button
              id="theme-toggle-btn"
              onClick={() => setTheme(isDark ? 'light' : 'dark')}
              className="glass-hover w-8 h-8 rounded-lg flex items-center justify-center transition-all"
              style={{ color: 'var(--text-secondary)' }}
            >
              <AnimatePresence mode="wait">
                <motion.div key={theme} initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.5, opacity: 0 }} transition={{ duration: 0.2 }}>
                  {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                </motion.div>
              </AnimatePresence>
            </button>

            {/* Export */}
            <div className="relative">
              <button id="export-btn" onClick={(e) => { e.stopPropagation(); setShowExportMenu(!showExportMenu); }}
                className="glass-hover flex items-center gap-1.5 px-3 h-8 text-xs font-medium rounded-lg transition-all"
                style={{ color: 'var(--text-secondary)' }}>
                <Download className="w-3.5 h-3.5" />Exportar
              </button>
              <AnimatePresence>
                {showExportMenu && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -4 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -4 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-full mt-1.5 rounded-xl border p-1.5 min-w-[210px] z-50"
                    style={{
                      background: isDark ? '#161638' : '#ffffff',
                      borderColor: 'var(--border-medium)',
                      boxShadow: '0 16px 48px rgba(0,0,0,0.3)',
                    }}
                  >
                    {[
                      { id: 'export-pdf-btn', icon: '📄', label: 'Exportar a PDF (Reporte de KPIs)', fn: handleExportPDF },
                      { id: 'export-csv-btn', icon: '📊', label: 'Exportar a Google Sheets (Auditoría de Fórmulas)', fn: handleExportDetailedCSV },
                    ].map((item) => (
                      <button key={item.id} id={item.id} onClick={item.fn}
                        className="w-full text-left px-3 py-2 text-xs rounded-lg transition-colors hover:bg-white/5"
                        style={{ color: 'var(--text-secondary)' }}>
                        <span className="mr-2">{item.icon}</span>{item.label}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        {/* Tabs */}
        <div className="px-5 flex items-center gap-0.5 flex-shrink-0 border-b"
          style={{
            background: isDark ? 'rgba(15,15,46,0.5)' : 'rgba(255,255,255,0.5)',
            borderColor: 'var(--border-subtle)',
          }}>
          {DASH_TABS.map((t) => (
            <button key={t.key} id={`dash-tab-${t.key}`} onClick={() => setDashTab(t.key)}
              className={`dash-tab relative ${dashTab === t.key ? 'dash-tab-active' : ''}`}>
              {t.icon}{t.label}
              {dashTab === t.key && (
                <motion.div layoutId="tab-indicator"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-500 rounded-t-full"
                />
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex bg-grid-dark">

          {/* Param Panel */}
          <div className="w-72 flex-shrink-0 border-r overflow-y-auto p-4"
            style={{
              background: isDark ? 'rgba(8,8,26,0.6)' : 'rgba(248,250,252,0.9)',
              borderColor: 'var(--border-subtle)',
            }}>
            <ParamPanel />
          </div>

          {/* Tab panels */}
          <div className="flex-1 overflow-y-auto p-5">
            <AnimatePresence mode="wait">
              <motion.div
                key={dashTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                className="space-y-5"
              >
                {dashTab === 'overview' && (
                  <>
                    <KpiDashboard />
                    <NetCashFlowChart />
                    {scenarios.length >= 2 && <MultiScenarioChart />}
                    <ScenarioCompare />
                  </>
                )}

                {dashTab === 'projection' && (
                  <>
                    <NetCashFlowChart />
                    <div className="grid grid-cols-2 gap-4">
                      <CapexVsBenefitsChart />
                      <BenefitsBreakdownChart />
                    </div>
                    {scenarios.length >= 2 && <MultiScenarioChart />}
                  </>
                )}

                {dashTab === 'sensitivity' && (
                  <>
                    <motion.div
                      className="glass p-4 rounded-xl text-xs leading-relaxed border-l-2 border-brand-500/60"
                      style={{ color: 'var(--text-secondary)' }}
                      initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                    >
                      <strong className="text-brand-400">Cómo leer este análisis: </strong>
                      Cada barra muestra cuánto cambia el VPN si esa variable sube o baja un 20%.
                      Las más largas son las más críticas.{' '}
                      <strong className="text-amber-400">Tip:</strong> modificá un parámetro y volvé aquí para ver cómo cambia la jerarquía.
                    </motion.div>
                    <SensitivityChart />
                  </>
                )}

                {dashTab === 'compare' && (
                  <>
                    {scenarios.length >= 2
                      ? <MultiScenarioChart />
                      : (
                        <motion.div className="glass p-8 rounded-xl text-center"
                          initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}>
                          <Sparkles className="w-8 h-8 text-brand-400 mx-auto mb-3" />
                          <p className="font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
                            Cargá un preset para activar la comparativa
                          </p>
                          <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>
                            Compará curvas de VPN entre escenarios simultáneamente
                          </p>
                          <button onClick={() => setShowPresets(true)}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white text-xs font-medium rounded-lg transition-colors">
                            <Sparkles className="w-3.5 h-3.5" />Cargar preset
                          </button>
                        </motion.div>
                      )
                    }
                    <ScenarioCompare />
                    <div className="grid grid-cols-2 gap-4">
                      <CapexVsBenefitsChart />
                      <BenefitsBreakdownChart />
                    </div>
                  </>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
