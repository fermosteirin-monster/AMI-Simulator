# Memoria de Cálculo — Baseline (Edesur 2026)

Esta memoria detalla paso a paso cómo se componen y calculan los principales KPIs del caso de negocio AMI para el escenario **Baseline**.

> [!NOTE]
> Todos los valores monetarios están expresados en USD. El análisis se realiza sobre un horizonte de **12 años**.

## 1. Parámetros Globales (Variables de Entrada)
- **Total de Suministros (Medidores):** 2.700.000
- **Curva de Despliegue:** Lineal (Año 1: 100.000. Años 2-12: ~236.363 por año)
- **Mix de Medidores:** T1: 98% | T2/T3: 2%
- **Mix de Comunicaciones:** PLC: 75% | Wi-SUN: 20% | Celular P2P: 5%
- **Costo de Capital (WACC):** 14.2%

---

## 2. Cálculo de Inversión (CAPEX)

El CAPEX se ejecuta año a año en función de la cantidad de medidores desplegados en ese período. A continuación, el detalle de los costos unitarios base:

### Medidores e Instalación
- **Costo Unitario T1:** $60
- **Costo Unitario T2/T3:** $100
- **Costo Módulo Comunicación:** $15 (Aplica igual para PLC, Wi-SUN y P2P)
- **Costo de Instalación (Mano de Obra):** $35 por medidor
- **Logística:** $5 por medidor

**Costo total instalado por medidor T1:** $60 + $15 + $35 + $5 = **$115**
**Costo total instalado por medidor T2/T3:** $100 + $15 + $35 + $5 = **$155**

### Infraestructura de Red (Concentradores / Focal Points)
La red requiere equipamiento de agregación. Se asume una cobertura promedio de 100 medidores por nodo:
- **Concentrador PLC:** $700 unitario.
- **Focal Point Wi-SUN:** $700 unitario.
*(Es decir, agrega aproximadamente $7 adicionales al CAPEX de cada medidor de estas tecnologías)*.

### Integración IT y Plataformas (MDM/HES/SAP)
Costo Core fijo que se eroga en los primeros años del proyecto:
- **Integración IT (Total):** $15.000.000 (Distribuido: 40% Año 0, 30% Año 1, 20% Año 2, 10% Año 3)
- **Project Management (PM):** $1.000.000

---

## 3. Costos Operativos (OPEX)

El OPEX se incrementa de forma acumulativa conforme avanza la cantidad de medidores instalados e integrados al sistema.

### Costos Fijos IT Anuales
Independientes de la curva de despliegue, inician en el Año 1:
- **Mantenimiento IT Anual:** $500.000
- **Licenciamiento SaaS Anual:** $200.000
- **Administración y Soporte (Personal):** $500.000

### Costos Variables (Por medidor activo)
- **Telecomunicaciones:** $0.52 USD / medidor / mes ($6.24 al año).
- **Consumo Cloud (AWS/Azure):** $5.000 / mes fijo como base + un escalamiento dinámico por volumen transaccional de lecturas (típicamente $0.05 adicionales al año por endpoint activo).

---

## 4. Beneficios Operacionales (Savings)

Los beneficios se liberan proporcionalmente al avance de la instalación. Las fórmulas abajo asumen el 100% de despliegue (Año 12). Durante los años intermedios, el beneficio se multiplica por el porcentaje de avance físico.

### 4.1 Lecturas Manuales Evitadas
La automatización elimina la necesidad de cuadrillas de lectura pedestre.
- **Volumen actual:** 32.400.000 lecturas anuales (aprox. 1 por mes por suministro).
- **Costo unitario por lectura:** $0.25
- **Ahorro Anual (al 100%):** 32.400.000 × $0.25 = **$8.100.000 / año**

### 4.2 Cortes y Reposiciones Remotas
La capacidad de actuar sobre el relé interno (breaker) del medidor evita el despacho de cuadrillas morosas.
- **Cortes Manuales anuales:** 318.250
- **Reposiciones anuales:** 152.000
- **Costo de despacho de cuadrilla:** $14.60
- **Ahorro Anual (al 100%):** (318.250 + 152.000) × $14.60 = **$6.865.650 / año**

### 4.3 Reducción de Visitas Improductivas y Reiterativas
Mejora en la asertividad operativa gracias a la telemetría previa al despacho.
- **Visitas Improductivas (Evitadas):** 75.000
- **Visitas Reiterativas (Evitadas):** 30.000
- **Costo de despacho:** $14.60
- **Ahorro Anual (al 100%):** 105.000 × $14.60 = **$1.533.000 / año**

### 4.4 Disminución de Multas (SAIDI / Calidad / Estimaciones)
El ruteo eficiente, ping remoto de tensión y análisis de carga reducen drásticamente las penalidades regulatorias.
- **Multas SAIDI Base:** 350 minutos históricos. Meta de Reducción: 25%.
- **Penalidad SAIDI:** $50.000 / minuto.
- **Ahorro SAIDI Anual (al 100%):** (350 × 25%) × $50.000 = **$4.375.000 / año**
- **Multas por Estimación:** Base de penalidad anual evitada al tener lectura real: **$2.420.000 / año**
- **Multas Calidad de Producto (Apartamiento):** Base de $5.250.000. Reducción esperada: 20% = **$1.050.000 / año**
- **Multas de Incumplimiento:** Base de $700.000. Reducción esperada: 70% = **$490.000 / año**

### 4.5 Atención Comercial, Call Center y Resarcimientos
Reducción del flujo de llamadas inbound (reclamos por falta de suministro / facturación) debido a la visibilidad en tiempo real, sumado a la menor cantidad de electrodomésticos quemados.
- **Volumen llamadas inbound evitadas:** 46.400
- **Reclamos comerciales (Facturación) evitados:** 14.500
- **Costo unitario llamada (Call Center):** $1.20
- **Ahorro Call Center Anual (al 100%):** (46.400 + 14.500) × $1.20 = **$73.080 / año**
- **Resarcimiento por Artefactos Quemados:** Base de $500.000. Reducción esperada: 30% = **$150.000 / año**
### 4.6 Reducción de Pérdidas No Técnicas (Fraude)
AMI permite balances de energía precisos en tiempo real por transformador y alertas de manipulación (tamper).
- **Pérdidas no técnicas base (GWh):** 2.394 GWh
- **Tasa de recuperación esperada:** 20% (478.8 GWh)
- **Costo de Energía Mayorista (MEM):** $40.000 / GWh
- **Ahorro Energía Recuperada Anual:** 478.8 GWh × $40.000 = **$19.152.000 / año**

### 4.7 Reconocimiento Tarifario (Ingresos VAD)
Las inversiones en AMI son reconocidas por el ente regulador (ENRE) formando parte de la Base de Capital (RAB) de la distribuidora, generando ingresos genuinos al proyecto.
- **Amortización:** La inversión de CAPEX en IT (Vida útil 10 años) y Medidores (Vida útil 25 años) se recupera linealmente vía tarifa.
- **Retorno sobre la Base de Capital (WACC ENRE):** Sobre el capital remanente no amortizado de cada "cohorte" de inversión, se reconoce un retorno anual del 9.99%.
- **Impacto Financiero:** Estos ingresos se suman a los Beneficios Operacionales (Savings) para conformar el **Flujo de Caja Neto** del proyecto, impulsando significativamente la rentabilidad (TIR/VPN).

---

## 5. Resumen Consolidado (Año de Régimen al 100%)

Cuando la red llega a su etapa de maduración, el balance anual simplificado (incorporando ahorros totales y la cuota VAD del periodo) arroja un flujo de caja positivo.
El Valor Presente Neto (VPN) y la Tasa Interna de Retorno (TIR) descuentan el flujo completo descontando la inyección de CAPEX durante los primeros años utilizando el WACC del proyecto (14.2%).

> [!TIP]
> Cualquier ajuste que se realice en el simulador a estos parámetros base escalará proporcionalmente tanto el CAPEX, como la cuota anual del OPEX y la liberación de los Ahorros según la curva de despliegue seleccionada.


## 6. Proyección de Flujos de Caja a 10 Años (Despliegue Lineal)

A continuación se presenta el flujo de caja anualizado asumiendo un despliegue puramente lineal durante todo el horizonte de 10 años. Las cantidades acumuladas de medidores (SM) determinan el impacto en el CAPEX, OPEX, Beneficios e Ingresos por VAD año a año.

| Año | SM Instalados Año | SM Acumulados | Avance (%) | CAPEX Total | OPEX Total | Beneficios Totales | Ingresos VAD | Flujo Neto (Flujo de Caja) | VPN Acumulado |
|:---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| 0 | 0 | 0 | 0.0% | US$ 7.000.000 | US$ 0 | US$ 0 | US$ 199.900 | -US$ 6.800.100 | -US$ 6.800.100 |
| 1 | 100.000 | 100.000 | 3.7% | US$ 16.292.800 | US$ 1.291.200 | US$ 1.980.507 | US$ 3.201.950 | -US$ 12.401.543 | -US$ 17.659.595 |
| 2 | 288.889 | 388.889 | 14.4% | US$ 37.068.089 | US$ 1.381.333 | US$ 7.701.972 | US$ 9.789.114 | -US$ 20.958.336 | -US$ 33.729.917 |
| 3 | 288.889 | 677.778 | 25.1% | US$ 35.568.089 | US$ 1.471.467 | US$ 13.423.437 | US$ 15.872.144 | -US$ 7.743.975 | -US$ 38.929.466 |
| 4 | 288.889 | 966.667 | 35.8% | US$ 34.068.089 | US$ 1.561.600 | US$ 19.144.901 | US$ 19.841.319 | US$ 3.356.532 | -US$ 36.956.015 |
| 5 | 288.889 | 1.255.556 | 46.5% | US$ 34.068.089 | US$ 1.651.733 | US$ 24.866.366 | US$ 23.682.587 | US$ 12.829.131 | -US$ 30.351.107 |
| 6 | 288.889 | 1.544.444 | 57.2% | US$ 34.068.089 | US$ 1.741.867 | US$ 30.587.831 | US$ 27.395.947 | US$ 22.173.822 | -US$ 20.354.700 |
| 7 | 288.889 | 1.833.333 | 67.9% | US$ 34.068.089 | US$ 1.832.000 | US$ 36.309.296 | US$ 30.981.400 | US$ 31.390.606 | -US$ 7.962.826 |
| 8 | 288.889 | 2.122.222 | 78.6% | US$ 34.068.089 | US$ 1.922.133 | US$ 42.030.760 | US$ 34.438.945 | US$ 40.479.483 | US$ 6.030.022 |
| 9 | 288.889 | 2.411.111 | 89.3% | US$ 34.068.089 | US$ 2.012.267 | US$ 47.752.225 | US$ 37.768.582 | US$ 49.440.452 | US$ 20.995.393 |
| 10 | 288.889 | 2.700.000 | 100.0% | US$ 34.068.089 | US$ 2.102.400 | US$ 53.473.690 | US$ 40.870.312 | US$ 58.173.513 | US$ 36.414.679 |
