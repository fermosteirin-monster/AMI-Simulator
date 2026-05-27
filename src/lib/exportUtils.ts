import { Scenario } from '../DATA_MODEL';
import { getDeploymentSchedule, getCumulativeDeployed, deriveP2pPct } from '../BUSINESS_LOGIC';

const fmt = (n: number) => n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 }).replace(/,/g, '');

export function generateDetailedCSV(scenario: Scenario): string {
  const { global, capex, opex, benefits, regulatory } = scenario;
  const horizon = global.analysisHorizonYears;
  const schedule = getDeploymentSchedule(scenario);
  const cumulative = getCumulativeDeployed(scenario);
  
  const rows: string[][] = [
    ['Año', 'Categoría', 'Métrica', 'Fórmula Teórica', 'Fórmula con Valores', 'Resultado (USD)']
  ];

  const addRow = (year: number, cat: string, metric: string, formula: string, values: string, result: number) => {
    rows.push([year.toString(), `"${cat}"`, `"${metric}"`, `"${formula}"`, `"${values}"`, result.toFixed(2)]);
  };

  const reg = regulatory || { waccEnrePhase1: 9.99, waccEnrePhase2: 9.99, recognizedMeterCapexPhase1: 126, meterRegulatoryLife: 25, itRegulatoryLife: 10, enreItSubsidy: 0 };
  const { wiSunPct, plcPct, t2t3Pct = 0 } = global;
  const p2pPct = deriveP2pPct(wiSunPct, plcPct);
  const t1Pct = Math.max(0, 100 - t2t3Pct);

  for (let year = 0; year <= horizon; year++) {
    const metersThisYear = schedule[year] || 0;
    const cumMeters = cumulative[year] || 0;
    const progress = global.totalEndpoints > 0 ? cumMeters / global.totalEndpoints : 0;
    
    // --- CAPEX ---
    if (year >= 0 && year <= 5) {
      const itSchedule = [capex.itScheduleY0 ?? 100, capex.itScheduleY1 ?? 0, capex.itScheduleY2 ?? 0, capex.itScheduleY3 ?? 0, capex.itScheduleY4 ?? 0, capex.itScheduleY5 ?? 0];
      const pct = itSchedule[year] ?? 0;
      const itCost = (pct / 100) * capex.itIntegrationCost;
      if (pct > 0) addRow(year, 'CAPEX', 'Integración IT', 'IT Cost * % Distribución Anual', `${fmt(capex.itIntegrationCost)} * ${pct}%`, itCost);
      if (year === 0 && capex.pmCost > 0) {
        addRow(year, 'CAPEX', 'Project Management', 'PM Cost Fijo Año 0', `${fmt(capex.pmCost)}`, capex.pmCost);
      }
    }

    if (metersThisYear > 0) {
      const wMeterCost = (t1Pct / 100) * capex.meterCostT1 + (t2t3Pct / 100) * capex.meterCostT2T3;
      addRow(year, 'CAPEX (Unidad)', 'Costo Hardware Medidor (Ponderado)', 'T1_Cost * %T1 + T2T3_Cost * %T2T3', `${fmt(capex.meterCostT1)} * ${fmt(t1Pct)}% + ${fmt(capex.meterCostT2T3)} * ${fmt(t2t3Pct)}%`, wMeterCost);
      
      const wCommsCost = (wiSunPct / 100) * capex.commsCostWiSun + (plcPct / 100) * capex.commsCostPLC + (p2pPct / 100) * capex.commsCostP2P;
      addRow(year, 'CAPEX (Unidad)', 'Módulo de Comms (Ponderado)', 'WiSun_Cost * %WiSun + PLC_Cost * %PLC + P2P_Cost * %P2P', `${fmt(capex.commsCostWiSun)} * ${fmt(wiSunPct)}% + ${fmt(capex.commsCostPLC)} * ${fmt(plcPct)}% + ${fmt(capex.commsCostP2P)} * ${fmt(p2pPct)}%`, wCommsCost);
      
      const perMeterCost = wMeterCost + wCommsCost + capex.installCost;
      const totalMetersCost = metersThisYear * perMeterCost;
      addRow(year, 'CAPEX', 'Despliegue de Medidores', 'Medidores Instalados * (HW_Ponderado + Comms_Ponderado + Instalación)', `${fmt(metersThisYear)} * (${fmt(wMeterCost)} + ${fmt(wCommsCost)} + ${fmt(capex.installCost)})`, totalMetersCost);

      const plcMeters = metersThisYear * (plcPct / 100);
      const plcConcentrators = plcMeters / 250;
      if (plcConcentrators > 0) addRow(year, 'CAPEX', 'Concentradores PLC', '(Medidores * %PLC) / 250 * Costo_Concen_PLC', `(${fmt(metersThisYear)} * ${fmt(plcPct)}%) / 250 * ${fmt(capex.concentratorCostPLC)}`, plcConcentrators * capex.concentratorCostPLC);

      const wiSunMeters = metersThisYear * (wiSunPct / 100);
      const wiSunFocalPoints = wiSunMeters / 5000;
      if (wiSunFocalPoints > 0) addRow(year, 'CAPEX', 'Focal Points Wi-SUN', '(Medidores * %WiSun) / 5000 * Costo_FocalPoint', `(${fmt(metersThisYear)} * ${fmt(wiSunPct)}%) / 5000 * ${fmt(capex.focalPointCostWiSun)}`, wiSunFocalPoints * capex.focalPointCostWiSun);
    }

    // --- OPEX ---
    if (year > 0) {
      const p2pMetersCumulative = cumMeters * (p2pPct / 100);
      const telecomCost = p2pMetersCumulative * opex.telecomMonthly * 12;
      addRow(year, 'OPEX', 'Telecomunicaciones M2M (P2P)', 'Medidores_P2P_Acumulados * Costo_Mensual * 12', `${fmt(p2pMetersCumulative)} * ${fmt(opex.telecomMonthly)} * 12`, telecomCost);
      addRow(year, 'OPEX', 'SaaS', 'SaaS_Anual * (Año_Actual / Horizonte)', `${fmt(opex.saasAnnual)} * (${year} / ${horizon})`, opex.saasAnnual * (year / horizon));
      addRow(year, 'OPEX', 'Mantenimiento de Red', 'Mantenimiento_Anual * Progreso_Despliegue', `${fmt(opex.maintenanceAnnual)} * ${fmt(progress * 100)}%`, opex.maintenanceAnnual * progress);
      addRow(year, 'OPEX', 'Infraestructura Cloud', 'Cloud_Mensual * 12 * Progreso_Despliegue', `${fmt(opex.cloudMonthly)} * 12 * ${fmt(progress * 100)}%`, opex.cloudMonthly * 12 * progress);
      addRow(year, 'OPEX', 'Administración y Gestión', 'Admin_Anual * Progreso_Despliegue', `${fmt(opex.adminAnnual)} * ${fmt(progress * 100)}%`, opex.adminAnnual * progress);
    }

    // --- BENEFICIOS ---
    if (year > 0) {
      const prodSavings = (benefits.manualReadsVolume * benefits.manualReadUnitCost) * progress;
      addRow(year, 'BENEFICIOS', 'Eficiencia Operativa (Lecturas)', 'Volumen_Lecturas * Costo_Lectura * Progreso_Despliegue', `${fmt(benefits.manualReadsVolume)} * ${fmt(benefits.manualReadUnitCost)} * ${fmt(progress * 100)}%`, prodSavings);

      const cutsSavings = (benefits.annualCutsVolume * benefits.dispatchCost) * progress;
      addRow(year, 'BENEFICIOS', 'Cortes y Reposiciones (Cuadrilla Regular)', 'Volumen_Cortes * Costo_Despacho * Progreso_Despliegue', `${fmt(benefits.annualCutsVolume)} * ${fmt(benefits.dispatchCost)} * ${fmt(progress * 100)}%`, cutsSavings);

      const guardSavings = (benefits.annualReposVolume * benefits.guardDispatchCost) * progress;
      addRow(year, 'BENEFICIOS', 'Guardia Operativa', 'Volumen_Reposiciones * Costo_Despacho_Guardia * Progreso_Despliegue', `${fmt(benefits.annualReposVolume)} * ${fmt(benefits.guardDispatchCost)} * ${fmt(progress * 100)}%`, guardSavings);

      const saidiBenefit = (benefits.saidiHistoricalHours * (benefits.saidiTargetReduction / 100) * benefits.finePerHour) * progress;
      addRow(year, 'BENEFICIOS', 'Multas SAIDI/SAIFI', 'Horas_Historicas * %Reducción * Costo_Hora * Progreso_Despliegue', `${fmt(benefits.saidiHistoricalHours)} * ${fmt(benefits.saidiTargetReduction)}% * ${fmt(benefits.finePerHour)} * ${fmt(progress * 100)}%`, saidiBenefit);

      const estFinesBenefit = benefits.estFinesAnnual * progress;
      addRow(year, 'BENEFICIOS', 'Ahorro Multas Estimación', 'Monto_Anual * Progreso_Despliegue', `${fmt(benefits.estFinesAnnual)} * ${fmt(progress * 100)}%`, estFinesBenefit);

      const parkingBenefit = benefits.parkingFineAnnual * (benefits.parkingFineImprovement / 100) * progress;
      addRow(year, 'BENEFICIOS', 'Multas Calidad (Aparcamiento)', 'Monto_Anual * %Mejora * Progreso_Despliegue', `${fmt(benefits.parkingFineAnnual)} * ${fmt(benefits.parkingFineImprovement)}% * ${fmt(progress * 100)}%`, parkingBenefit);

      const nonComplianceBenefit = benefits.nonComplianceFineAnnual * (benefits.nonComplianceFineImprovement / 100) * progress;
      addRow(year, 'BENEFICIOS', 'Multas Calidad (Incumplimiento)', 'Monto_Anual * %Mejora * Progreso_Despliegue', `${fmt(benefits.nonComplianceFineAnnual)} * ${fmt(benefits.nonComplianceFineImprovement)}% * ${fmt(progress * 100)}%`, nonComplianceBenefit);

      const fraudBenefit = (benefits.nonTechLossesMwh * (benefits.recoveryRateTarget / 100) * (benefits.currentTariff - benefits.energyWholesaleCost)) * progress;
      addRow(year, 'BENEFICIOS', 'Recuperación de Fraude', 'Pérdidas_MWh * %Recuperación * (Tarifa - Costo_Energía) * Progreso_Despliegue', `${fmt(benefits.nonTechLossesMwh)} * ${fmt(benefits.recoveryRateTarget)}% * (${fmt(benefits.currentTariff)} - ${fmt(benefits.energyWholesaleCost)}) * ${fmt(progress * 100)}%`, fraudBenefit);
    }
  }

  // --- CABECERAS PARA BOM ---
  const bomBytes = new Uint8Array([0xEF, 0xBB, 0xBF]); // UTF-8 BOM
  return '\uFEFF' + rows.map(r => r.join(',')).join('\n');
}
