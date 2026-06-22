import { motion, AnimatePresence } from 'framer-motion';
import { useMtSensorStore } from '../../store/useMtSensorStore';
import ParamInput from '../ParamInput';
import { Zap, Wrench, ShieldAlert } from 'lucide-react';

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
          
          {([
            { id: 'totalTransformers', label: 'Total Trafos a Sensorizar', unit: 'u', format: 'currency' as const, min: 0,
              tooltip: 'Cantidad de centros de transformación de Media Tensión objetivo.', val: params.totalTransformers },
            { id: 'deploymentHorizon', label: 'Horizonte de Despliegue', unit: 'años', format: 'number' as const, min: 1, max: 20,
              tooltip: 'Años que durará la instalación de todos los sensores.', val: params.deploymentHorizon },
            { id: 'projectHorizon', label: 'Horizonte de Evaluación', unit: 'años', format: 'number' as const, min: 1, max: 30,
              tooltip: 'Período total del caso de negocio a evaluar.', val: params.projectHorizon },
            { id: 'wacc', label: 'WACC (Tasa de Descuento)', unit: '%', format: 'percent' as const, min: 0, max: 100, step: 0.5,
              tooltip: 'Costo de capital promedio ponderado.', val: params.wacc },
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
      </AnimatePresence>
    </div>
  );
}
