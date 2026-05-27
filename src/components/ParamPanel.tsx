// components/ParamPanel.tsx — Panel de parámetros con tech mix y curvas de despliegue

import { useState } from 'react';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import { Globe, Cpu, Settings, TrendingUp, Activity, Landmark } from 'lucide-react';
import { useStore, selectActiveScenario } from '../store/useStore';
import ParamInput from './ParamInput';
import TechMixSelector from './TechMixSelector';
import DeploymentCurveSelector from './DeploymentCurveSelector';
import ITScheduleSelector from './ITScheduleSelector';
import type { DeploymentCurve } from '../DATA_MODEL';

type Tab = 'global' | 'regulatory' | 'capex' | 'opex' | 'benefits_op' | 'benefits_agr';

const TABS_ROW1: { key: Tab; label: string; icon: React.ReactNode }[] = [
  { key: 'global',     label: 'Macro',     icon: <Globe    className="w-3.5 h-3.5" /> },
  { key: 'regulatory', label: 'Regulador', icon: <Landmark className="w-3.5 h-3.5" /> },
];
const TABS_ROW2: { key: Tab; label: string; icon: React.ReactNode }[] = [
  { key: 'capex',      label: 'CAPEX',     icon: <Cpu      className="w-3.5 h-3.5" /> },
  { key: 'opex',       label: 'OPEX',      icon: <Settings className="w-3.5 h-3.5" /> },
];
const TABS_ROW3: { key: Tab; label: string; icon: React.ReactNode }[] = [
  { key: 'benefits_op',  label: 'Benef. OP',  icon: <Activity   className="w-3.5 h-3.5" /> },
  { key: 'benefits_agr', label: 'Benef. AGR', icon: <TrendingUp className="w-3.5 h-3.5" /> },
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

  const upd = (section: Tab, key: string, value: number) => {
    // benefits_op y benefits_agr mapean al mismo bloque 'benefits' del store
    const storeSection = (section === 'benefits_op' || section === 'benefits_agr')
      ? 'benefits'
      : section;
    updateVariable(scenario.id, storeSection as 'global' | 'capex' | 'opex' | 'benefits', key, value);
  };

  return (
    <div className="flex flex-col h-full gap-3">
      <div>
        <h2 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
          Parámetros del Escenario
        </h2>
        {/* Tab pills — 2 filas */}
        <div className="space-y-1">
          {/* Fila 1: Macro / CAPEX / OPEX */}
          <div className="grid grid-cols-2 gap-1 rounded-xl p-1" style={{ background: 'var(--bg-glass)' }}>
            {TABS_ROW1.map((t) => (
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
          {/* Fila 2: CAPEX / OPEX */}
          <div className="grid grid-cols-2 gap-1 rounded-xl p-1" style={{ background: 'var(--bg-glass)' }}>
            {TABS_ROW2.map((t) => (
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
          {/* Fila 3: Beneficios OP / Beneficios AGR */}
          <div className="grid grid-cols-2 gap-1 rounded-xl p-1" style={{ background: 'var(--bg-glass)' }}>
            {TABS_ROW3.map((t) => (
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
                { id: 't2t3Pct',              label: 'Mix Hardware: T2/T3',   unit: '%', format: 'percent' as const, min: 0, max: 100, step: 1,
                  tooltip: 'Porcentaje del parque que utilizará medidores T2 o T3. El resto usará T1.', val: scenario.global.t2t3Pct ?? 0 },
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

            {/* ── REGULATORY ────────────────────────────────────────── */}
            {activeTab === 'regulatory' && (() => {
              const reg = scenario.regulatory || { waccEnrePhase1: 9.99, waccEnrePhase2: 9.99, recognizedMeterCapexPhase1: 126, meterRegulatoryLife: 25, itRegulatoryLife: 10, enreItSubsidy: 0 };
              return (
                <>
                  <motion.div variants={itemVariants}><SectionTitle>Condiciones ENRE (VAD)</SectionTitle></motion.div>
                  <motion.div variants={itemVariants}>
                    <div className="glass rounded-xl p-3 mb-2 text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                      💡 Parámetros de reconocimiento tarifario sobre la Base de Capital (RAB). Los activos ingresan a la RAB en cohortes anuales.
                    </div>
                  </motion.div>
                  {([
                    { id: 'waccEnrePhase1',             label: 'WACC ENRE Fase 1 (Años 1-4)', unit: '%', format: 'percent' as const, min: 0, val: reg.waccEnrePhase1, tooltip: 'Tasa fija aplicable a los medidores instalados hasta el año 4 inclusive.' },
                    { id: 'waccEnrePhase2',             label: 'WACC ENRE Fase 2 (Año 5+)',   unit: '%', format: 'percent' as const, min: 0, val: reg.waccEnrePhase2, tooltip: 'Tasa aplicable a los medidores instalados a partir del año 5.' },
                    { id: 'recognizedMeterCapexPhase1', label: 'CAPEX Reconocido Fase 1',     unit: 'USD', format: 'currency' as const, min: 0, val: reg.recognizedMeterCapexPhase1, tooltip: 'Monto fijo unitario por medidor ingresado a la RAB en la Fase 1.' },
                    { id: 'meterRegulatoryLife',        label: 'Vida Útil Medidores',         unit: 'años', format: 'number' as const, min: 1, val: reg.meterRegulatoryLife, tooltip: 'Años de amortización lineal de los medidores en la RAB.' },
                  ] as const).map((p) => (
                    <motion.div key={p.id} variants={itemVariants}>
                      <ParamInput {...p} value={p.val} onChange={(v) => upd('regulatory', p.id, v)} />
                    </motion.div>
                  ))}

                  <motion.div variants={itemVariants}><SectionTitle>Aportes y Software IT</SectionTitle></motion.div>
                  {([
                    { id: 'itRegulatoryLife',           label: 'Vida Útil Software IT',       unit: 'años', format: 'number' as const, min: 1, val: reg.itRegulatoryLife, tooltip: 'Años de amortización de la plataforma IT en la RAB.' },
                    { id: 'enreItSubsidy',              label: 'Aporte Único ENRE (IT)',      unit: 'M USD', format: 'millions' as const, min: 0, val: reg.enreItSubsidy, tooltip: 'Monto no reintegrable otorgado en el Año 0 que reduce el CAPEX IT elegible para VAD.' },
                  ] as const).map((p) => (
                    <motion.div key={p.id} variants={itemVariants}>
                      <ParamInput {...p} value={p.val} onChange={(v) => upd('regulatory', p.id, v)} />
                    </motion.div>
                  ))}
                </>
              );
            })()}

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
              <motion.div variants={itemVariants}>
                <ParamInput
                  id="itIntegrationCost"
                  label="Integración IT (MDM + SAP)"
                  unit="M USD"
                  format="millions"
                  min={0}
                  tooltip="Inversión total distribuible en MDM, integración SAP/CRM y ciberseguridad."
                  value={scenario.capex.itIntegrationCost}
                  onChange={(v) => upd('capex', 'itIntegrationCost', v)}
                />
              </motion.div>
              <motion.div variants={itemVariants}>
                <p className="text-xs mb-2 mt-1 font-medium" style={{ color: 'var(--text-secondary)' }}>
                  Distribución por año
                </p>
                <ITScheduleSelector
                  values={{
                    itScheduleY0: scenario.capex.itScheduleY0,
                    itScheduleY1: scenario.capex.itScheduleY1,
                    itScheduleY2: scenario.capex.itScheduleY2,
                    itScheduleY3: scenario.capex.itScheduleY3,
                    itScheduleY4: scenario.capex.itScheduleY4,
                    itScheduleY5: scenario.capex.itScheduleY5,
                  }}
                  totalAmount={scenario.capex.itIntegrationCost}
                  onChange={(field, value) => upd('capex', field, value)}
                />
              </motion.div>
              <motion.div variants={itemVariants}>
                <ParamInput
                  id="pmCost"
                  label="Project Management"
                  unit="M USD"
                  format="millions"
                  min={0}
                  tooltip="Gerencia de proyecto, comunicación institucional y campañas de concientización. Se ejecuta en Año 0."
                  value={scenario.capex.pmCost}
                  onChange={(v) => upd('capex', 'pmCost', v)}
                />
              </motion.div>
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

            {/* ── BENEFICIOS OP (Operacionales) ────────────────────────── */}
            {activeTab === 'benefits_op' && (<>
              <motion.div variants={itemVariants}><SectionTitle>Lecturas y Despachos</SectionTitle></motion.div>
              {([
                { id: 'manualReadsVolume',  label: 'Lecturas Pedestres Anuales', unit: 'lect/año',   format: 'currency' as const, min: 0, val: scenario.benefits.manualReadsVolume,
                  tooltip: 'Volumen de lecturas manuales en campo que el AMI elimina.' },
                { id: 'manualReadUnitCost', label: 'Costo por Lectura',           unit: 'USD',        format: 'number'  as const, min: 0, max: 50, step: 0.5, val: scenario.benefits.manualReadUnitCost,
                  tooltip: 'Costo unitario por lectura pedestre (RRHH + viáticos).' },
                { id: 'annualCutsVolume',   label: 'Cortes Físicos Anuales',      unit: 'órdenes',    format: 'currency' as const, min: 0, val: scenario.benefits.annualCutsVolume,
                  tooltip: 'Órdenes de corte físico que pasarán a ser corte remoto.' },
                { id: 'annualReposVolume',  label: 'Reposiciones Físicas',        unit: 'órdenes',    format: 'currency' as const, min: 0, val: scenario.benefits.annualReposVolume,
                  tooltip: 'Reposiciones físicas que pasarán a ser reposición remota.' },
                { id: 'dispatchCost',       label: 'Costo Cuadrilla Corte/Repo', unit: 'USD/visita', format: 'number'  as const, min: 0, max: 500, val: scenario.benefits.dispatchCost,
                  tooltip: 'Costo por visita de cuadrilla para cortes y reposiciones físicas.' },
              ] as const).map((p) => (
                <motion.div key={p.id} variants={itemVariants}>
                  <ParamInput {...p} value={p.val} onChange={(v) => upd('benefits_op', p.id, v)} />
                </motion.div>
              ))}

              <motion.div variants={itemVariants}><SectionTitle>Productividad — Visitas Evitadas</SectionTitle></motion.div>
              <motion.div variants={itemVariants}>
                <div className="glass rounded-xl p-3 mb-2 text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                  💡 Ingresá el <strong className="text-brand-400">total de visitas a evitar al 100% del despliegue</strong>.
                  El ahorro escala proporcionalmente con el avance del rollout.
                  Todas multiplican por el <strong className="text-brand-400">Costo de Cuadrilla de Guardia</strong> definido abajo.
                </div>
              </motion.div>
              {([
                { id: 'unproductiveVisitsAvoided', label: 'Improductivas Evitadas',       unit: 'visitas/año', format: 'currency' as const, min: 0,
                  tooltip: 'Tasa actual ~30%. Visitas donde el meter confirma que el suministro volvió antes de despachar. Se evita la salida de la cuadrilla.',
                  val: scenario.benefits.unproductiveVisitsAvoided },
                { id: 'reiterativeVisitsAvoided',  label: 'Reiteradas Evitadas',          unit: 'visitas/año', format: 'currency' as const, min: 0,
                  tooltip: 'Tasa actual ~15%. Con cierre seguro (validado por el meter) la reiterancia cae considerablemente.',
                  val: scenario.benefits.reiterativeVisitsAvoided },
                { id: 'qualityVisitsAvoided',      label: 'Calidad de Producto Evitadas', unit: 'visitas/año', format: 'currency' as const, min: 0,
                  tooltip: 'Oscilaciones de tensión y eventos BT diagnosticados remotamente por el meter, evitando la visita presencial.',
                  val: scenario.benefits.qualityVisitsAvoided },
                { id: 'guardDispatchCost',         label: 'Costo Cuadrilla de Guardia',   unit: 'USD/visita',   format: 'number'  as const, min: 0, max: 500,
                  tooltip: 'Costo por visita de cuadrilla de guardia. Generalmente mayor al de corte/repo por horario, urgencia y disponibilidad.',
                  val: scenario.benefits.guardDispatchCost },
              ] as const).map((p) => (
                <motion.div key={p.id} variants={itemVariants}>
                  <ParamInput {...p} value={p.val} onChange={(v) => upd('benefits_op', p.id, v)} />
                </motion.div>
              ))}
            </>)}

            {/* ── BENEFICIOS AGR (Agregados) ───────────────────────────── */}
            {activeTab === 'benefits_agr' && (<>
              <motion.div variants={itemVariants}><SectionTitle>Calidad y Multas ENRE</SectionTitle></motion.div>
              {([
                { id: 'saidiHistoricalHours', label: 'SAIDI Histórico',           unit: 'horas/año', format: 'number'   as const, min: 0, max: 100, step: 0.5, val: scenario.benefits.saidiHistoricalHours,
                  tooltip: 'Duración media de interrupción por usuario al año (histórico Edesur).' },
                { id: 'saidiTargetReduction', label: 'Reducción SAIDI Esperada', unit: '%',          format: 'percent'  as const, min: 0, max: 80, val: scenario.benefits.saidiTargetReduction,
                  tooltip: 'Reducción porcentual del SAIDI atribuible al AMI (detección temprana de fallas).' },
                { id: 'finePerHour',          label: 'Multa por Hora SAIDI',     unit: 'USD/hora',   format: 'currency' as const, min: 0, val: scenario.benefits.finePerHour,
                  tooltip: 'Penalidad regulatoria ENRE por cada hora de SAIDI sobre el umbral.' },
                { id: 'estFinesAnnual',       label: 'Ahorro Multas por Estimación', unit: 'M USD/año',  format: 'millions' as const, min: 0, val: scenario.benefits.estFinesAnnual,
                  tooltip: 'Total de multas ENRE por facturación estimada que el AMI elimina. Escala con el avance del despliegue.' },
              ] as const).map((p) => (
                <motion.div key={p.id} variants={itemVariants}>
                  <ParamInput {...p} value={p.val} onChange={(v) => upd('benefits_agr', p.id, v)} />
                </motion.div>
              ))}
              <motion.div variants={itemVariants}><SectionTitle>Multas de Calidad de Producto</SectionTitle></motion.div>
              <motion.div variants={itemVariants}>
                <div className="glass rounded-xl p-3 mb-2 text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                  💡 Ingresá el monto total de cada multa y el <strong className="text-brand-400">% de mejora atribuible al AMI</strong>.
                  El beneficio escala proporcionalmente con el avance del despliegue.
                </div>
              </motion.div>
              {([
                { id: 'parkingFineAnnual',           label: 'Aparcamiento — Monto Total',    unit: 'M USD/año', format: 'millions' as const, min: 0,
                  tooltip: 'Monto total anual de multas por Aparcamiento. El AMI mejora el indicador al reducir tiempos de detección.',
                  val: scenario.benefits.parkingFineAnnual },
                { id: 'parkingFineImprovement',      label: 'Aparcamiento — % Mejora AMI',   unit: '%',          format: 'percent'  as const, min: 0, max: 100,
                  tooltip: 'Porcentaje de reducción de la multa de Aparcamiento atribuible al despliegue AMI.',
                  val: scenario.benefits.parkingFineImprovement },
                { id: 'nonComplianceFineAnnual',     label: 'Incumplimiento — Monto Total',  unit: 'M USD/año', format: 'millions' as const, min: 0,
                  tooltip: 'Monto total anual de multas por Incumplimiento. El AMI mejora la respuesta operativa.',
                  val: scenario.benefits.nonComplianceFineAnnual },
                { id: 'nonComplianceFineImprovement',label: 'Incumplimiento — % Mejora AMI', unit: '%',          format: 'percent'  as const, min: 0, max: 100,
                  tooltip: 'Porcentaje de reducción de la multa de Incumplimiento atribuible al despliegue AMI.',
                  val: scenario.benefits.nonComplianceFineImprovement },
              ] as const).map((p) => (
                <motion.div key={p.id} variants={itemVariants}>
                  <ParamInput {...p} value={p.val} onChange={(v) => upd('benefits_agr', p.id, v)} />
                </motion.div>
              ))}
              <motion.div variants={itemVariants}><SectionTitle>Fraude y Pérdidas No Técnicas</SectionTitle></motion.div>
              {([
                { id: 'nonTechLossesMwh',   label: 'Pérdidas No Técnicas',     unit: 'MWh/año',   format: 'currency' as const, min: 0, val: scenario.benefits.nonTechLossesMwh,
                  tooltip: 'Energía distribuida no cobrada: fraude, derivaciones clandestinas.' },
                { id: 'recoveryRateTarget', label: 'Tasa de Recuperación AMI', unit: '%',          format: 'percent'  as const, min: 0, max: 100, val: scenario.benefits.recoveryRateTarget,
                  tooltip: 'Porcentaje de pérdidas no técnicas que el AMI logra recuperar.' },
                { id: 'energyWholesaleCost',label: 'Costo Energía en MEM',     unit: 'USD/MWh',   format: 'number'   as const, min: 0, max: 200, val: scenario.benefits.energyWholesaleCost,
                  tooltip: 'Costo de compra de energía en el MEM (Mercado Eléctrico Mayorista).' },
                { id: 'currentTariff',      label: 'Tarifa Comercial Vigente', unit: 'USD/MWh',   format: 'number'   as const, min: 0, max: 500, val: scenario.benefits.currentTariff,
                  tooltip: 'Precio de venta al usuario final. El margen = Tarifa − Costo MEM.' },
              ] as const).map((p) => (
                <motion.div key={p.id} variants={itemVariants}>
                  <ParamInput {...p} value={p.val} onChange={(v) => upd('benefits_agr', p.id, v)} />
                </motion.div>
              ))}
            </>)}

          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
