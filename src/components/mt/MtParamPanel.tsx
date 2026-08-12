import { motion, AnimatePresence } from 'framer-motion';
import { useMtSensorStore } from '../../store/useMtSensorStore';
import { useStore, selectActiveScenario } from '../../store/useStore';
import ParamInput from '../ParamInput';
import { Zap, Wrench, ShieldAlert, Lock } from 'lucide-react';

function SectionTitle({ children, icon }: { children: React.ReactNode, icon?: React.ReactNode }) {
  return (
    <div className="section-divider flex items-center gap-2">
      {icon}
      <span className="text-xs font-semibold uppercase tracking-wider text-brand-400 whitespace-nowrap">
        {children}
      </span>
    </div>
  );
}

const itemVariants: any = {
  hidden:  { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] } },
};

export default function MtParamPanel() {
  const params = useMtSensorStore(s => s.params);
  const updateParam = useMtSensorStore(s => s.updateParam);
  const amiScenario = useStore(selectActiveScenario);

  const syncedWacc    = amiScenario?.global.wacc ?? params.wacc;
  const syncedHorizon = amiScenario?.global.analysisHorizonYears ?? params.projectHorizon;

  return (
    <div className="flex flex-col h-full gap-3 overflow-y-auto pb-6">
      <div>
        <h2 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
          Parámetros Sensorización MT
        </h2>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={{
            hidden: {},
            visible: { transition: { staggerChildren: 0.045 } },
          }}
          className="space-y-4"
        >
          {/* 1. Despliegue e Inversión */}
          <motion.div variants={itemVariants}>
            <SectionTitle icon={<Zap className="w-4 h-4 text-brand-400" />}>Despliegue e Inversión</SectionTitle>
          </motion.div>
          
          {/* Parámetros sync con AMI (read-only) */}
          <motion.div variants={itemVariants}>
            <div className="glass rounded-xl p-3 border border-indigo-500/20 bg-indigo-500/5 text-xs space-y-2">
              <div className="flex items-center gap-2 mb-2">
                <Lock className="w-3.5 h-3.5 text-indigo-400" />
                <span className="text-xs font-semibold text-indigo-300">Sincronizado con Escenario AMI</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Horizonte de Evaluación</span>
                <span className="font-mono text-indigo-200">{syncedHorizon} años</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">WACC</span>
                <span className="font-mono text-indigo-200">{syncedWacc}%</span>
              </div>
            </div>
          </motion.div>

          {([
            { id: 'totalTransformers', label: 'Total Trafos a Sensorizar', unit: 'u', format: 'currency' as const, min: 0,
              tooltip: 'Cantidad de centros de transformación de Media Tensión objetivo.', val: params.totalTransformers },
            { id: 'deploymentHorizon', label: 'Horizonte de Despliegue', unit: 'años', format: 'number' as const, min: 1, max: 20,
              tooltip: 'Años que durará la instalación de todos los sensores.', val: params.deploymentHorizon },
            { id: 'sensorUnitCost', label: 'Costo Unitario del Sensor', unit: 'USD', format: 'number' as const, min: 0,
              tooltip: 'Costo CIF del sensor IoT.', val: params.sensorUnitCost },
            { id: 'p2pConnectionCost', label: 'Módulo de Conexión P2P', unit: 'USD', format: 'number' as const, min: 0,
              tooltip: 'Costo del módulo de comunicaciones celular/P2P.', val: params.p2pConnectionCost },
            { id: 'installationCost', label: 'Costo de Instalación', unit: 'USD', format: 'number' as const, min: 0,
              tooltip: 'Costo de cuadrilla e insumos menores por trafo.', val: params.installationCost },
          ] as const).map((p) => (
            <motion.div key={p.id} variants={itemVariants}>
              <ParamInput {...p} value={p.val} onChange={(v) => updateParam(p.id as any, v)} />
            </motion.div>
          ))}

          {/* 2. Mantenimiento Preventivo */}
          <motion.div variants={itemVariants} className="pt-2">
            <SectionTitle icon={<Wrench className="w-4 h-4 text-brand-400" />}>Mantenimiento Preventivo</SectionTitle>
          </motion.div>

          {([
            { id: 'annualFailureRate', label: 'Tasa Falla Anual', unit: '%', format: 'percent' as const, min: 0, max: 100, step: 0.1,
              tooltip: 'Porcentaje histórico de trafos que fallan o se queman por año.', val: params.annualFailureRate },
            { id: 'preventiveReduction', label: 'Trafos Salvados', unit: '%', format: 'percent' as const, min: 0, max: 100,
              tooltip: 'Porcentaje de fallas evitadas al identificar sobrecargas remotamente.', val: params.preventiveReduction },
            { id: 'transformerReplacementCost', label: 'Costo Cambio Trafo', unit: 'USD', format: 'number' as const, min: 0,
              tooltip: 'Costo total de reemplazar un transformador quemado (Equipamiento + Mano de Obra).', val: params.transformerReplacementCost },
          ] as const).map((p) => (
            <motion.div key={p.id} variants={itemVariants}>
              <ParamInput {...p} value={p.val} onChange={(v) => updateParam(p.id as any, v)} />
            </motion.div>
          ))}

          {/* 3. Calidad y Multas */}
          <motion.div variants={itemVariants} className="pt-2">
            <SectionTitle icon={<ShieldAlert className="w-4 h-4 text-brand-400" />}>Calidad y Multas</SectionTitle>
          </motion.div>

          {([
            { id: 'saidiMtHistorical', label: 'SAIDI MT Histórico', unit: 'min/año', format: 'number' as const, min: 0,
              tooltip: 'Minutos de interrupción anuales aportados específicamente por la red de MT.', val: params.saidiMtHistorical },
            { id: 'saidiMtReduction', label: 'Reducción SAIDI MT', unit: '%', format: 'percent' as const, min: 0, max: 100,
              tooltip: 'Porcentaje de reducción del SAIDI esperado gracias a la detección temprana y ruteo preciso.', val: params.saidiMtReduction },
            { id: 'finePerMinute', label: 'Multa por Minuto', unit: 'USD/min', format: 'currency' as const, min: 0,
              tooltip: 'Valor regulatorio de la penalidad por cada minuto de SAIDI excedido.', val: params.finePerMinute },
          ] as const).map((p) => (
            <motion.div key={p.id} variants={itemVariants}>
              <ParamInput {...p} value={p.val} onChange={(v) => updateParam(p.id as any, v)} />
            </motion.div>
          ))}

        </motion.div>

        {/* 4. Impuesto a las Ganancias */}
        <motion.div variants={itemVariants} className="pt-2">
          <SectionTitle icon={<ShieldAlert className="w-4 h-4 text-brand-400" />}>Impuesto a las Ganancias</SectionTitle>
        </motion.div>
        <motion.div variants={itemVariants}>
          <div className="glass rounded-xl p-3 text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <p className="font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                  Incluir impacto fiscal (35%)
                </p>
                <p className="leading-relaxed">
                  Aplica <strong className="text-amber-400">35%</strong> sobre el resultado operativo
                  (Ahorros − Amortización contable). El impuesto se liquida en el <strong className="text-amber-400">período siguiente</strong>.
                  La amortización contable de equipos se calcula a <strong className="text-amber-400">25 años</strong> sobre el CAPEX real.
                </p>
              </div>
              <button
                id="mt-toggle-include-tax"
                onClick={() => updateParam('includeTax', !params.includeTax)}
                className={`flex-shrink-0 relative w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none ${
                  params.includeTax ? 'bg-amber-500' : 'bg-white/10'
                }`}
                title="Incluir / excluir impuesto a las ganancias"
              >
                <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200 ${
                  params.includeTax ? 'translate-x-5' : 'translate-x-0'
                }`} />
              </button>
            </div>
            {params.includeTax && (
              <div className="mt-2 pt-2 border-t border-white/10 text-amber-400/80">
                ✓ Activo — el VPN y TIR reflejan el efecto del impuesto
              </div>
            )}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
