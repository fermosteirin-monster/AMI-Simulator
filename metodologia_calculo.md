# Metodología de Cálculo: Simulador de Business Case AMI

Este documento evalúa la viabilidad financiera del despliegue de medidores AMI a lo largo de un horizonte de análisis de N años. Opera bajo los siguientes principios:

- **Moneda base:** USD constantes (no ajustados por inflación local).
- **Convención temporal:** El Año 0 es pre-operativo (inversiones IT/PM); el Año 1 es el primer año de instalaciones.
- **Descuento:** Todos los flujos se descuentan usando el WACC definido.
- **Progreso:** Los beneficios y parte del OPEX escalan proporcionalmente con la fracción del parque instalada.

---

## 1. Parámetros de Entrada (Baseline Edesur 2026)

### 1.1. Macro y Despliegue
| Parámetro | Variable | Default | Descripción |
| :--- | :--- | :--- | :--- |
| WACC | `wacc` | 9.99% | Tasa de descuento corporativa |
| Horizonte Análisis | `analysisHorizonYears` | 8 años | Duración de la evaluación del proyecto |
| Total Endpoints | `totalEndpoints` | 2.500.000 | Volumen total de medidores a desplegar |
| Mix T2/T3 | `t2t3Pct` | 10% | Porcentaje del parque con medidores trifásicos/indirectos |
| Mix Wi-SUN | `wiSunPct` | 50% | Porcentaje de medidores con tecnología Wi-SUN |
| Mix PLC | `plcPct` | 45% | Porcentaje de medidores con tecnología PLC |
| Curva Despliegue | `deploymentCurve` | Lineal | Velocidad de instalación de los medidores |

### 1.2. Regulatorio (VAD)
| Parámetro | Variable | Default | Descripción |
| :--- | :--- | :--- | :--- |
| WACC Reconocido F1 | `waccEnrePhase1` | 9.99% | Tasa de rentabilidad RAB reconocida (Años 1-4) |
| WACC Reconocido F2 | `waccEnrePhase2` | 9.99% | Tasa de rentabilidad RAB reconocida (Año 5+) |
| CAPEX Medidor F1 | `recognizedMeterCapexPhase1` | USD 126 | CAPEX unitario reconocido por el ENRE (Años 1-4) |
| Vida Útil Medidores | `meterRegulatoryLife` | 25 años | Años de amortización regulatoria de los equipos |
| Vida Útil IT | `itRegulatoryLife` | 10 años | Años de amortización regulatoria del software |
| Subsidio ENRE IT | `enreItSubsidy` | USD 5.0M | Aporte inicial no reembolsable del regulador |

### 1.3. CAPEX (Inversiones)
| Parámetro | Variable | Default | Descripción |
| :--- | :--- | :--- | :--- |
| Hardware T1 | `meterCostT1` | USD 50 | Costo físico de un medidor monofásico |
| Hardware T2/T3 | `meterCostT2T3` | USD 100 | Costo físico de medidor trifásico |
| Módulo Wi-SUN | `commsCostWiSun` | USD 15 | Costo de la placa/módulo Wi-SUN |
| Módulo PLC | `commsCostPLC` | USD 0 | Costo de la placa/módulo PLC |
| Módulo P2P | `commsCostP2P` | USD 25 | Costo de la placa/módulo Celular |
| Instalación | `installCost` | USD 15 | Mano de obra por recambio de medidor |
| Concentrador PLC | `concentratorCostPLC` | USD 300 | 1 equipo requerido cada 250 medidores PLC |
| Focal Point Wi-SUN | `focalPointCostWiSun`| USD 300 | 1 equipo requerido cada 5000 medidores Wi-SUN |
| Plataforma IT | `itIntegrationCost` | USD 15.0M | Licencias core MDM, HES, integraciones |
| Project Management | `pmCost` | USD 1.0M | Gastos de gestión y licitación (Año 0) |

### 1.4. OPEX (Costos Operativos)
| Parámetro | Variable | Default | Descripción |
| :--- | :--- | :--- | :--- |
| Telecom P2P | `telecomMonthly` | USD 0.3/mes | Abono celular (solo aplica a medidores P2P) |
| SaaS | `saasAnnual` | USD 200K/año| Suscripción anual de software (escala en el tiempo) |
| Cloud | `cloudMonthly` | USD 5K/mes | Infraestructura en la nube |
| Mantenimiento | `maintenanceAnnual` | USD 500K/año| Mantenimiento de la red (escala con progreso) |
| Administración | `adminAnnual` | USD 500K/año| Personal de gestión (escala con progreso) |

### 1.5. Beneficios (Ahorros y Recuperos)
| Parámetro | Variable | Default | Descripción |
| :--- | :--- | :--- | :--- |
| Visitas Lecturas | `manualReadsVolume` | 25.0M/año | Visitas manuales de toma de lectura (baseline) |
| Costo Lectura | `manualReadUnitCost`| USD 1 | Costo por lectura física |
| Cortes de Suministro| `annualCutsVolume` | 200K/año | Cantidad de cortes en terreno |
| Reposiciones | `annualReposVolume` | 170K/año | Cantidad de reposiciones en terreno |
| Costo Despacho | `dispatchCost` | USD 15 | Costo cuadrilla operativa regular |
| Costo Guardia | `guardDispatchCost` | USD 20 | Costo cuadrilla urgencia (calidad y reposiciones) |
| Improductivas Ev. | `unproductiveVisitsAvoided`| 70K/año | Reducción de visitas fallidas |
| Calidad BT Evitada | `qualityVisitsAvoided` | 20K/año | Diagnóstico remoto evita visitas innecesarias |
| Multas Estimación | `estFinesAnnual` | USD 500K/año| Ahorro de penalidad por lectura estimada |
| Multas Aparcamiento | `parkingFineAnnual` | USD 10.0M/año| Histórico de multas por aparcamiento |
| Mejora Aparcamiento | `parkingFineImprovement` | 20% | Porcentaje que el AMI logra reducir |
| Multas Incumpl. | `nonComplianceFineAnnual`| USD 2.0M/año| Histórico de multas por incumplimiento |
| Mejora Incumpl. | `nonComplianceFineImprovement`| 70% | Porcentaje que el AMI logra reducir |
| Pérdidas NT (Fraude)| `nonTechLossesMwh` | 100K MWh/año| Robo o hurto de energía actual |
| Mejora Pérdidas | `recoveryRateTarget` | 20% | Porcentaje de la energía robada que el AMI detecta |

---

## 2. Notas Metodológicas Actualizadas

1. **Hardware Ponderado:** El costo unitario total de cada medidor se calcula dinámicamente sumando el costo del medidor base ponderado por el mix T1 vs T2/T3, más el módulo de comunicación ponderado por el mix tecnológico (Wi-SUN, PLC, P2P).
2. **Infraestructura Proporcional:** Los concentradores PLC y focal points Wi-SUN se adquieren estrictamente en proporción a los medidores de esa tecnología instalados cada año. No es una inversión fija del Año 0.
3. **M2M Diferenciado:** El costo mensual de telecomunicaciones (`telecomMonthly`) se aplica **exclusivamente** al porcentaje de medidores P2P, lo que beneficia fuertemente a los escenarios con alta penetración de Wi-SUN o PLC.
4. **Progreso Acumulado:** Todos los beneficios (operativos y agregados) escalan no con la instalación del año en curso, sino con el porcentaje del parque *acumulado* hasta la fecha.
5. **Reconocimiento Regulatorio (RAB):** La Fase 1 (Años 1 a 4) utiliza un CAPEX de reconocimiento fijo acordado por el ENRE, mitigando riesgo. A partir del Año 5, la base de capital se ajusta a los valores nominales reales ponderados invertidos por la distribuidora.

## 3. Diccionario de Métricas Financieras

* **VPN (Valor Presente Neto):** Suma del flujo de caja neto de cada año (Beneficios + VAD - CAPEX - OPEX) descontado anualmente por el WACC corporativo.
* **TIR (Tasa Interna de Retorno):** Calculada iterativamente por el método de la Secante. Es la tasa máxima que el proyecto soportaría antes de destruir valor (VPN = 0).
* **ROI (Retorno sobre Inversión):** Cálculo *nominal* (sin descuento temporal). Divide el total de ingresos netos generados por el total de CAPEX invertido a lo largo del horizonte.
* **Profitability Index (PI):** Índice que indica la creación de valor relativo. $PI = (VPN Inflows) / (VPN Outflows)$. Todo proyecto con $PI > 1.0$ resulta viable.
