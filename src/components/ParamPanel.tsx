// components/ParamPanel.tsx — Panel de parámetros con tech mix y curvas de despliegue

import { useState } from 'react';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import { Globe, Cpu, Settings, TrendingUp } from 'lucide-react';
import { useStore, selectActiveScenario } from '../store/useStore';
import ParamInput from './ParamInput';
import TechMixSelector from './TechMixSelector';
import DeploymentCurveSelector from './DeploymentCurveSelector';
import type { DeploymentCurve } from '../DATA_MODEL';

type Tab = 'global' | 'capex' | 'opex' | 'benefits';

const TABS: { key: Tab; label: string; icon: React.ReactNode }[] = [
  { key: 'global',   label: 'Macro',      icon: <Globe      className="w-3.5 h-3.5" /> },
  { key: 'capex',    label: 'CAPEX',      icon: <Cpu        className="w-3.5 h-3.5" /> },
  { key: 'opex',     label: 'OPEX',       icon: <Settings   className="w-3.5 h-3.5" /> },
  { key: 'benefits', label: 'Beneficios', icon: <TrendingUp className="w-3.5 h-3.5" /> },
];

const containerVariants: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.045 } },
};
const itemVariants: Variants = {
  hidden:  { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] } },
};

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="section-divider">
      <span className="text-xs font-semibold uppercase tracking-wider text-brand-400 whitespace-nowrap">
        {children}
      </span>
    </div>
  );
}

export default function ParamPanel() {
  const [activeTab, setActiveTab] = useState<Tab>('global');
  const scenario       = useStore(selectActiveScenario);
  const updateVariable = useStore((s) => s.updateVariable);
  const updateGlobalString = useStore((s) => s.updateGlobalString);

  if (!scenario) return null;

  const upd = (section: Tab, key: string, value: number) =>
    updateVariable(scenario.id, section, key, value);

  return (
    <div className="flex flex-col h-full gap-3">
      <div>
        <h2 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
          Parámetros del Escenario
        </h2>
        {/* Tab pills */}
        <div className="grid grid-cols-4 gap-1 rounded-xl p-1" style={{ background: 'var(--bg-glass)' }}>
          {TABS.map((t) => (
            <button
              key={t.key}
              id={`tab-${t.key}`}
              onClick={() => setActiveTab(t.key)}
              className="relative flex items-center justify-center gap-1 py-1.5 rounded-lg text-xs font-medium transition-colors duration-150"
              style={{ color: activeTab === t.key ? 'white' : 'var(--text-muted)' }}
            >
              {activeTab === t.key && (
                <motion.div layoutId="tab-pill"
                  className="absolute inset-0 rounded-lg bg-brand-600"
                  transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                />
              )}
              <span className="relative z-10 flex items-center gap-1">
                {t.icon}
                <span className="hidden sm:inline">{t.label}</span>
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit={{ opacity: 0, transition: { duration: 0.1 } }}
            className="space-y-3 pb-4"
          >

            {/* ── GLOBAL ───────────────────────────────────────────── */}
            {activeTab === 'global' && (<>

              <motion.div variants={itemVariants}><SectionTitle>Parámetros Financieros</SectionTitle></motion.div>
              {([
                { id: 'wacc',                 label: 'WACC',                  unit: '%',      format: 'percent' as const, min: 1,   max: 50, step: 0.5,
                  tooltip: 'Tasa de descuento en USD. Incluye riesgo país Argentina + costo financiero corporativo.', val: scenario.global.wacc },
                { id: 'analysisHorizonYears', label: 'Horizonte de Análisis', unit: 'años',   format: 'number'  as const, min: 3,   max: 20, step: 1,
                  tooltip: 'Período de evaluación del proyecto.', val: scenario.global.analysisHorizonYears },
                { id: 'totalEndpoints',       label: 'Total de Endpoints',    unit: 'medidores', format: 'currency' as const, min: 10000,
                  tooltip: 'Universo total de medidores a desplegar. Edesur tiene ~2.5M de clientes activos.', val: scenario.global.totalEndpoints },
                { id: 'exchangeRate',         label: 'Tipo de Cambio',        unit: 'ARS/USD', format: 'currency' as const, min: 100,
                  tooltip: 'Tipo de cambio de referencia para conversión de costos internos en ARS.', val: scenario.global.exchangeRate },
              ] as const).map((p) => (
                <motion.div key={p.id} variants={itemVariants}>
                  <ParamInput {...p} value={p.val} onChange={(v) => upd('global', p.id, v)} />
                </motion.div>
              ))}

              {/* Curva de despliegue */}
              <motion.div variants={itemVariants}><SectionTitle>Curva de Despliegue</SectionTitle></motion.div>
              <motion.div variants={itemVariants}>
                <p className="text-xs mb-2 leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                  Año 1 siempre arranca con <strong className="text-brand-400">100.000</strong> instalaciones. Los años siguientes dependen de la curva:
                </p>
                <DeploymentCurveSelector
                  value={scenario.global.deploymentCurve}
                  onChange={(v: DeploymentCurve) => updateGlobalString(scenario.id, 'deploymentCurve', v)}
                  totalEndpoints={scenario.global.totalEndpoints}
                  horizon={scenario.global.analysisHorizonYears}
                />
              </motion.div>

              {/* Mix tecnológico */}
              <motion.div variants={itemVariants}><SectionTitle>Mix Tecnológico</SectionTitle></motion.div>
              <motion.div variants={itemVariants}>
                <p className="text-xs mb-2 leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                  Distribución de medidores por tecnología. Afecta CAPEX de módulos,
                  concentradores (PLC) y focal points (Wi-SUN), y OPEX de telecom (solo P2P).
                </p>
                <TechMixSelector
                  wiSunPct={scenario.global.wiSunPct}
                  plcPct={scenario.global.plcPct}
                  onChange={(field, value) => upd('global', field, value)}
                />
              </motion.div>

            </>)}

            {/* ── CAPEX ─────────────────────────────────────────────── */}
            {activeTab === 'capex' && (<>
              <motion.div variants={itemVariants}><SectionTitle>Hardware por Medidor</SectionTitle></motion.div>
              {([
                { id: 'meterCostT1',   label: 'Medidor Monofásico (T1)', unit: 'USD',   format: 'number'  as const, min: 10, max: 500,
                  tooltip: 'Costo CIF del medidor AMI residencial.', val: scenario.capex.meterCostT1 },
                { id: 'meterCostT2T3', label: 'Medidor Trifásico (T2/T3)', unit: 'USD', format: 'number'  as const, min: 10, max: 1000,
                  tooltip: 'Medidores para PyMEs y grandes usuarios.', val: scenario.capex.meterCostT2T3 },
                { id: 'installCost',   label: 'Instalación en Campo', unit: 'USD/nodo', format: 'number'  as const, min: 0, max: 300,
                  tooltip: 'Mano de obra por medidor instalado: cuadrilla, viáticos, herramientas.', val: scenario.capex.installCost },
              ] as const).map((p) => (
                <motion.div key={p.id} variants={itemVariants}>
                  <ParamInput {...p} value={p.val} onChange={(v) => upd('capex', p.id, v)} />
                </motion.div>
              ))}

              <motion.div variants={itemVariants}><SectionTitle>Módulos de Comunicación (USD/medidor)</SectionTitle></motion.div>
              {([
                { id: 'commsCostWiSun', label: 'Wi-SUN — Módulo mesh', unit: 'USD',  format: 'number' as const, min: 0, max: 200,
                  tooltip: 'Módulo Wi-SUN por medidor. Red mesh sin SIM; más barato en OPEX.', val: scenario.capex.commsCostWiSun },
                { id: 'commsCostPLC',   label: 'PLC — Módulo powerline', unit: 'USD', format: 'number' as const, min: 0, max: 200,
                  tooltip: 'Módulo PLC por medidor. Usa la red eléctrica como medio.', val: scenario.capex.commsCostPLC },
                { id: 'commsCostP2P',   label: 'P2P — Módulo celular', unit: 'USD',   format: 'number' as const, min: 0, max: 200,
                  tooltip: 'Módulo NB-IoT/4G con SIM. Mayor flexibilidad, mayor OPEX M2M.', val: scenario.capex.commsCostP2P },
              ] as const).map((p) => (
                <motion.div key={p.id} variants={itemVariants}>
                  <ParamInput {...p} value={p.val} onChange={(v) => upd('capex', p.id, v)} />
                </motion.div>
              ))}

              <motion.div variants={itemVariants}><SectionTitle>Infraestructura de Concentración</SectionTitle></motion.div>
              {([
                { id: 'concentratorCostPLC',  label: 'Concentrador PLC',     unit: 'USD/u', format: 'currency' as const, min: 500, max: 20000,
                  tooltip: '1 concentrador cada 250 conexiones PLC.', val: scenario.capex.concentratorCostPLC },
                { id: 'focalPointCostWiSun',  label: 'Focal Point Wi-SUN',   unit: 'USD/u', format: 'currency' as const, min: 500, max: 50000,
                  tooltip: '1 focal point cada 5.000 conexiones Wi-SUN. Actúa como collector/gateway de la red mesh.', val: scenario.capex.focalPointCostWiSun },
              ] as const).map((p) => (
                <motion.div key={p.id} variants={itemVariants}>
                  <ParamInput {...p} value={p.val} onChange={(v) => upd('capex', p.id, v)} />
                </motion.div>
              ))}

              <motion.div variants={itemVariants}><SectionTitle>Plataforma IT</SectionTitle></motion.div>
              {([
                { id: 'itIntegrationCost', label: 'Integración IT (MDM + SAP)', unit: 'M USD', format: 'millions' as const, min: 0,
                  tooltip: 'Inversión única en plataforma MDM, integración SAP/CRM y ciberseguridad.', val: scenario.capex.itIntegrationCost },
                { id: 'pmCost',            label: 'Project Management',         unit: 'M USD', format: 'millions' as const, min: 0,
                  tooltip: 'Gerencia de proyecto, comunicación institucional y campañas de concientización.', val: scenario.capex.pmCost },
              ] as const).map((p) => (
                <motion.div key={p.id} variants={itemVariants}>
                  <ParamInput {...p} value={p.val} onChange={(v) => upd('capex', p.id, v)} />
                </motion.div>
              ))}
            </>)}

            {/* ── OPEX ──────────────────────────────────────────────── */}
            {activeTab === 'opex' && (<>
              <motion.div variants={itemVariants}><SectionTitle>Variable (escala con el rollout)</SectionTitle></motion.div>
              <motion.div variants={itemVariants}>
                <div className="glass rounded-xl p-3 mb-3 text-xs" style={{ color: 'var(--text-muted)' }}>
                  💡 El <strong className="text-brand-400">abono M2M</strong> solo aplica a medidores <strong className="text-brand-400">P2P</strong> activos.
                  Wi-SUN y PLC no tienen costo M2M mensual.
                </div>
              </motion.div>
              {([
                { id: 'telecomMonthly',    label: 'Abono M2M por Medidor (P2P)', unit: 'USD/mes', format: 'number'   as const, min: 0, max: 10, step: 0.05,
                  tooltip: 'Costo mensual de SIM/conectividad. Solo aplica a medidores P2P/celular activos.', val: scenario.opex.telecomMonthly },
                { id: 'cloudMonthly',      label: 'Almacenamiento Cloud',         unit: 'USD/mes', format: 'currency'  as const, min: 0,
                  tooltip: 'Costo mensual de cloud computing y almacenamiento de telemetría.', val: scenario.opex.cloudMonthly },
                { id: 'maintenanceAnnual', label: 'Mantenimiento en Campo',       unit: 'M USD/año', format: 'millions' as const, min: 0,
                  tooltip: 'Reposición de medidores defectuosos, mantenimiento de concentradores.', val: scenario.opex.maintenanceAnnual },
              ] as const).map((p) => (
                <motion.div key={p.id} variants={itemVariants}>
                  <ParamInput {...p} value={p.val} onChange={(v) => upd('opex', p.id, v)} />
                </motion.div>
              ))}
              <motion.div variants={itemVariants}><SectionTitle>Fijo (desde año 1)</SectionTitle></motion.div>
              {([
                { id: 'saasAnnual',   label: 'Licencias SaaS Anuales', unit: 'M USD/año', format: 'millions' as const, min: 0,
                  tooltip: 'Plataforma MDM, SCADA/OMS, Analytics y SLA.', val: scenario.opex.saasAnnual },
                { id: 'adminAnnual',  label: 'Estructura NOC/Data',    unit: 'M USD/año', format: 'millions' as const, min: 0,
                  tooltip: 'NOC, analistas de datos y RRHH especializado.', val: scenario.opex.adminAnnual },
              ] as const).map((p) => (
                <motion.div key={p.id} variants={itemVariants}>
                  <ParamInput {...p} value={p.val} onChange={(v) => upd('opex', p.id, v)} />
                </motion.div>
              ))}
            </>)}

            {/* ── BENEFITS ──────────────────────────────────────────── */}
            {activeTab === 'benefits' && (<>
              <motion.div variants={itemVariants}><SectionTitle>Eficiencias Operativas</SectionTitle></motion.div>
              {([
                { id: 'manualReadsVolume',  label: 'Lecturas Pedestres Anuales', unit: 'lect/año',  format: 'currency' as const, min: 0, val: scenario.benefits.manualReadsVolume },
                { id: 'manualReadUnitCost', label: 'Costo por Lectura',           unit: 'USD',       format: 'number'  as const, min: 0, max: 50, step: 0.5, val: scenario.benefits.manualReadUnitCost },
                { id: 'annualCutsVolume',   label: 'Cortes Físicos Anuales',      unit: 'órdenes',   format: 'currency' as const, min: 0, val: scenario.benefits.annualCutsVolume },
                { id: 'annualReposVolume',  label: 'Reposiciones Físicas',         unit: 'órdenes',   format: 'currency' as const, min: 0, val: scenario.benefits.annualReposVolume },
                { id: 'dispatchCost',       label: 'Costo de Cuadrilla',           unit: 'USD/visita', format: 'number' as const, min: 0, max: 500, val: scenario.benefits.dispatchCost },
              ] as const).map((p) => (
                <motion.div key={p.id} variants={itemVariants}>
                  <ParamInput {...p} value={p.val} onChange={(v) => upd('benefits', p.id, v)}
                    tooltip={undefined} />
                </motion.div>
              ))}
              <motion.div variants={itemVariants}><SectionTitle>Calidad y Multas ENRE</SectionTitle></motion.div>
              {([
                { id: 'saidiHistoricalHours', label: 'SAIDI Histórico',            unit: 'horas/año',  format: 'number'  as const, min: 0, max: 100, step: 0.5, val: scenario.benefits.saidiHistoricalHours },
                { id: 'saidiTargetReduction', label: 'Reducción SAIDI Esperada',   unit: '%',          format: 'percent' as const, min: 0, max: 80, val: scenario.benefits.saidiTargetReduction },
                { id: 'finePerHour',          label: 'Multa por Hora SAIDI',       unit: 'USD/hora',   format: 'currency' as const, min: 0, val: scenario.benefits.finePerHour },
                { id: 'estFinesAnnual',       label: 'Multas por Estimación',      unit: 'M USD/año',  format: 'millions' as const, min: 0, val: scenario.benefits.estFinesAnnual },
              ] as const).map((p) => (
                <motion.div key={p.id} variants={itemVariants}>
                  <ParamInput {...p} value={p.val} onChange={(v) => upd('benefits', p.id, v)}
                    tooltip={undefined} />
                </motion.div>
              ))}
              <motion.div variants={itemVariants}><SectionTitle>Fraude y Pérdidas No Técnicas</SectionTitle></motion.div>
              {([
                { id: 'nonTechLossesMwh',   label: 'Pérdidas No Técnicas',      unit: 'MWh/año',   format: 'currency' as const, min: 0, val: scenario.benefits.nonTechLossesMwh },
                { id: 'recoveryRateTarget', label: 'Tasa de Recuperación AMI',  unit: '%',          format: 'percent' as const, min: 0, max: 100, val: scenario.benefits.recoveryRateTarget },
                { id: 'energyWholesaleCost',label: 'Costo Energía en MEM',      unit: 'USD/MWh',   format: 'number'  as const, min: 0, max: 200, val: scenario.benefits.energyWholesaleCost },
                { id: 'currentTariff',      label: 'Tarifa Comercial Vigente',  unit: 'USD/MWh',   format: 'number'  as const, min: 0, max: 500, val: scenario.benefits.currentTariff },
              ] as const).map((p) => (
                <motion.div key={p.id} variants={itemVariants}>
                  <ParamInput {...p} value={p.val} onChange={(v) => upd('benefits', p.id, v)}
                    tooltip={undefined} />
                </motion.div>
              ))}
            </>)}

          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
