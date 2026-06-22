import { motion } from 'framer-motion';
import { useMtSensorStore } from '../../store/useMtSensorStore';
import { generateMtProjection } from '../../MT_BUSINESS_LOGIC';

const fmt = (v: number) => {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(v);
};

const fmtPct = (v: number) => {
  if (v === Infinity) return '> 1000%';
  if (v <= -100) return 'No viable';
  return new Intl.NumberFormat('es-AR', {
    style: 'percent',
    maximumFractionDigits: 1,
  }).format(v / 100);
};

interface KpiCardProps {
  title: string;
  value: string;
  subtitle: string;
  isPositive?: boolean;
  isNegative?: boolean;
}

function KpiCard({ title, value, subtitle, isPositive, isNegative }: KpiCardProps) {
  let colorClass = 'text-white';
  if (isPositive) colorClass = 'text-green-400';
  if (isNegative) colorClass = 'text-red-400';

  return (
    <motion.div
      whileHover={{ y: -2 }}
      className="glass-card p-6 flex flex-col justify-center items-center text-center shadow-lg hover:shadow-brand-500/10 transition-all border border-white/5"
    >
      <h3 className="text-sm font-medium text-slate-400 mb-2">{title}</h3>
      <div className={`text-3xl font-bold tracking-tight mb-1 ${colorClass}`}>
        {value}
      </div>
      <p className="text-xs text-slate-500 mt-1">{subtitle}</p>
    </motion.div>
  );
}

export default function MtResultsPanel() {
  const params = useMtSensorStore((s) => s.params);
  const { kpis } = generateMtProjection(params);

  const npvIsPositive = kpis.npv > 0;
  const irrIsPositive = kpis.irr > params.wacc || kpis.irr === Infinity;

  return (
    <div className="h-full flex flex-col overflow-y-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white mb-2">Resultados Consolidados</h2>
        <p className="text-sm text-slate-400">
          Proyección financiera del caso de negocio de Media Tensión a {params.projectHorizon} años.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 auto-rows-fr">
        <KpiCard
          title="Inversión Total (CAPEX)"
          value={fmt(kpis.totalCapex)}
          subtitle="Sensores, Comunicación e Instalación"
        />
        <KpiCard
          title="Ahorro Mantenimiento"
          value={fmt(kpis.totalMaintenanceSavings)}
          subtitle="Trafos Salvados (OPEX evitado)"
        />
        <KpiCard
          title="Ahorro Multas SAIDI"
          value={fmt(kpis.totalSaidiSavings)}
          subtitle="Mejora en Calidad de Servicio"
        />
        <KpiCard
          title="Valor Presente Neto (VPN)"
          value={fmt(kpis.npv)}
          subtitle={`Descontado al WACC del ${params.wacc}%`}
          isPositive={npvIsPositive}
          isNegative={!npvIsPositive}
        />
        <KpiCard
          title="TIR (IRR)"
          value={fmtPct(kpis.irr)}
          subtitle={kpis.irr === Infinity ? 'Retorno inmediato (Flujo siempre positivo)' : (kpis.irr > params.wacc ? 'Supera el costo de capital' : 'Inferior al costo de capital')}
          isPositive={irrIsPositive}
          isNegative={!irrIsPositive && kpis.irr !== 0}
        />
        <KpiCard
          title="Retorno de Inversión (ROI)"
          value={fmtPct(kpis.roi)}
          subtitle="Beneficios Totales / CAPEX Total"
        />
      </div>
    </div>
  );
}
