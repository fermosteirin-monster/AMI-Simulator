import MtParamPanel from './MtParamPanel';
import MtResultsPanel from './MtResultsPanel';

export default function MtSensorView() {
  return (
    <div className="flex-1 flex overflow-hidden p-4 gap-4 h-[calc(100vh-64px)]">
      {/* Panel Izquierdo: Formularios */}
      <aside className="w-80 flex-shrink-0 flex flex-col bg-surface-800/40 backdrop-blur-md rounded-2xl border border-white/10 shadow-2xl overflow-hidden z-10 relative">
        <div className="flex-1 p-4 overflow-hidden flex flex-col">
          <MtParamPanel />
        </div>
      </aside>

      {/* Panel Derecho: Resultados (Cards Grid) */}
      <main className="flex-1 flex flex-col min-w-0 bg-surface-900/60 backdrop-blur-sm rounded-2xl border border-white/5 shadow-2xl overflow-hidden relative p-8">
        <MtResultsPanel />
      </main>
    </div>
  );
}
