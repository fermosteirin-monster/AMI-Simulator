# Metodología de Cálculo — AMI Simulator
### Simulador Financiero de Medición Inteligente (AMI) — Edesur

**Versión:** 1.0.0 | **Fecha:** Mayo 2026 | **Clasificación:** Interno

---

## Índice

1. [Arquitectura del Modelo](#1-arquitectura-del-modelo)
2. [Parámetros de Entrada](#2-parámetros-de-entrada)
3. [Curvas de Despliegue](#3-curvas-de-despliegue)
4. [Mix Tecnológico](#4-mix-tecnológico)
5. [CAPEX — Inversión de Capital](#5-capex--inversión-de-capital)
6. [OPEX — Costo Operativo](#6-opex--costo-operativo)
7. [Beneficios — Tres Palancas de Valor](#7-beneficios--tres-palancas-de-valor)
8. [VPN — Valor Presente Neto](#8-vpn--valor-presente-neto)
9. [Indicadores Derivados](#9-indicadores-derivados)
10. [Glosario de Parámetros](#10-glosario-de-parámetros)

---

## 1. Arquitectura del Modelo

El modelo evalúa la viabilidad financiera del despliegue de medidores AMI a lo largo de un horizonte de análisis de N años. Opera bajo los siguientes principios:

- **Moneda base:** USD constantes (no ajustados por inflación local)
- **Convención temporal:** El Año 0 es pre-operativo (inversiones IT/PM); el Año 1 es el primer año de instalaciones
- **Descuento:** Todos los flujos se descuentan al inicio del período (convención de inicio de período)
- **Progreso:** Los beneficios y parte del OPEX escalan proporcionalmente con la fracción del parque instalada

---

## 2. Parámetros de Entrada

### 2.1 Parámetros Globales

| Símbolo | Descripción | Unidad |
|---|---|---|
| N | Horizonte de análisis | años |
| WACC | Costo promedio ponderado de capital | % anual en USD |
| M | Total de endpoints (medidores) a desplegar | unidades |
| α_ws | Porcentaje de medidores Wi-SUN | % |
| α_plc | Porcentaje de medidores PLC | % |
| α_p2p | Porcentaje de medidores P2P/celular | % = 100 − α_ws − α_plc |
| Curva | Perfil de despliegue | slow / accelerated / linear |

### 2.2 Relación entre porcentajes tecnológicos

El porcentaje P2P se deriva automáticamente:

```
α_p2p = max(0, 100 − α_ws − α_plc)
```

Restricción: α_ws + α_plc + α_p2p = 100%

---

## 3. Curvas de Despliegue

El modelo define la cantidad de medidores instalados cada año mediante la función `schedule[y]`, donde `y = 1..N`.

### 3.1 Año 1 — Ramp-up inicial (igual para todas las curvas)

```
schedule[1] = min(100.000, M)
```

El primer año está fijado en **100.000 instalaciones** para todos los escenarios, reflejando el tiempo de ramp-up logístico inicial.

Sea `R = schedule[1]` (ramp-up) y `P = M − R` (endpoints restantes a distribuir en años 2..N).

### 3.2 Curva Gradual — Progresión Cuadrática

Cada año crece de forma paulatina, acelerando hacia el final del horizonte:

```
schedule[y] = R + b · (y − 1)²     para y = 2..N
```

Donde el coeficiente `b` se calcula para que la sumatoria sea exactamente M:

```
b = P / Σ_{j=1}^{N-1} j²  =  P / [(N−1)·N·(2N−1)/6]
```

**Propiedades:**
- schedule[2] = R + b (levemente por encima del Año 1)
- Monotónicamente creciente: schedule[y+1] > schedule[y]
- Σ schedule[y] = M (exacto)

**Ejemplo (M=2.5M, N=8):** Año 2 ≈ 112.000 → Año 8 ≈ 695.000

### 3.3 Curva Acelerada — Rampa Aritmética

El incremento anual es constante (delta fija), resultando en una tasa que crece linealmente:

```
schedule[y] = R + (y − 1) · δ     para y = 2..N
```

Donde delta se calcula para que la sumatoria sea exactamente M:

```
δ = P / [N · (N−1) / 2]  =  2P / [N(N−1)]
```

**Propiedades:**
- schedule[y+1] − schedule[y] = δ (incremento constante)
- Monotónicamente creciente
- Σ schedule[y] = M (exacto)
- Posicionada entre Gradual y Lineal en todo el horizonte

**Ejemplo (M=2.5M, N=8):** Año 2 ≈ 161.000 → Año 8 ≈ 525.000

### 3.4 Curva Lineal — Tasa Constante

Los años 2 hasta N reciben la misma cantidad de instalaciones:

```
schedule[y] = P / (N − 1)     para y = 2..N
```

**Propiedades:**
- Máximo volumen en el menor tiempo posible a tasa uniforme
- schedule[1] puede ser menor que schedule[2..N]
- Σ schedule[y] = M (exacto)

**Ejemplo (M=2.5M, N=8):** Año 2..8 ≈ 343.000 cada año

### 3.5 Acumulado de medidores desplegados

```
cumulative[y] = Σ_{t=1}^{y} schedule[t]
```

El **progreso de rollout** al año `y` es:

```
progress[y] = cumulative[y] / M       (entre 0 y 1)
```

---

## 4. Mix Tecnológico

El mix tecnológico determina los costos de CAPEX (módulos de comunicación e infraestructura) y OPEX (M2M telecom) de forma proporcional.

### 4.1 Costo de comunicaciones ponderado por medidor

```
C_comms = (α_ws/100) · C_comms_ws  +  (α_plc/100) · C_comms_plc  +  (α_p2p/100) · C_comms_p2p
```

Donde:
- `C_comms_ws` = costo del módulo Wi-SUN por medidor (USD)
- `C_comms_plc` = costo del módulo PLC por medidor (USD)
- `C_comms_p2p` = costo del módulo celular/NB-IoT por medidor (USD)

### 4.2 Infraestructura de concentración

Para cada año `y` de instalación:

**Concentradores PLC** (1 por cada 250 medidores PLC):
```
Conc_plc[y] = schedule[y] · (α_plc/100) / 250
```

**Focal Points Wi-SUN** (1 por cada 5.000 medidores Wi-SUN):
```
FP_ws[y] = schedule[y] · (α_ws/100) / 5.000
```

Estos equipos se adquieren proporcionalmente a cada año de despliegue.

---

## 5. CAPEX — Inversión de Capital

### 5.1 CAPEX del Año 0 (pre-operativo)

Corresponde a la inversión en plataforma IT antes de iniciar instalaciones:

```
CAPEX[0] = C_IT  +  C_PM
```

Donde:
- `C_IT` = costo de integración IT (MDM, SAP/CRM, ciberseguridad)
- `C_PM` = costo de gestión del proyecto y comunicación institucional

### 5.2 CAPEX de los Años 1..N (inversión en campo)

Para cada año `y` del despliegue:

**Costo unitario por medidor:**
```
C_medidor[y] = C_hw  +  C_comms  +  C_install
```

Donde:
- `C_hw` = costo de hardware del medidor (monofásico T1, en USD)
- `C_comms` = módulo de comunicación ponderado (Sección 4.1)
- `C_install` = costo de instalación en campo por medidor (mano de obra, viáticos)

**CAPEX de infraestructura del año `y`:**
```
CAPEX_infra[y] = Conc_plc[y] · C_conc_plc  +  FP_ws[y] · C_fp_ws
```

**CAPEX total del año `y`:**
```
CAPEX[y] = schedule[y] · C_medidor[y]  +  CAPEX_infra[y]
```

**CAPEX total acumulado:**
```
CAPEX_total = Σ_{y=0}^{N} CAPEX[y]
```

**CAPEX promedio por endpoint:**
```
CAPEX_avg = CAPEX_total / M
```

---

## 6. OPEX — Costo Operativo

El OPEX comienza en el Año 1 y escala con el parque instalado activo.

### 6.1 OPEX variable (escala con el parque)

**Medidores P2P activos al año `y`:**
```
M_p2p[y] = cumulative[y] · (α_p2p / 100)
```

El costo M2M de telecom solo aplica a medidores con SIM activa (P2P/celular):
```
OPEX_telecom[y] = M_p2p[y] · C_m2m · 12
```

Donde `C_m2m` es el abono mensual por SIM (USD/mes).

Cloud y almacenamiento (escala linealmente con el parque total pero se simplifica como fijo para el modelo):
```
OPEX_cloud[y] = C_cloud_mensual · 12
```

### 6.2 OPEX fijo (desde Año 1, independiente del rollout)

```
OPEX_fijo = OPEX_saas  +  OPEX_mant  +  OPEX_admin
```

Donde:
- `OPEX_saas` = licencias anuales MDM, SCADA/OMS, Analytics
- `OPEX_mant` = mantenimiento en campo (reposición de equipos)
- `OPEX_admin` = estructura NOC, analistas de datos, RRHH

### 6.3 OPEX total del año `y`

```
OPEX[y] = OPEX_telecom[y]  +  OPEX_cloud[y]  +  OPEX_fijo     para y ≥ 1
OPEX[0] = 0
```

---

## 7. Beneficios — Tres Palancas de Valor

Los beneficios escalan en función del progreso del rollout:

```
progress[y] = min(1,  cumulative[y] / M)
```

A medida que más medidores están activos, mayor es la fracción de beneficios realizables.

### Palanca 1: Eficiencias Operativas

#### 1a. Ahorro en lecturas pedestres

La AMI elimina la necesidad de cuadrillas para toma de lectura manual:

```
B_lecturas[y] = V_lecturas · C_lectura · progress[y]
```

Donde:
- `V_lecturas` = volumen anual de lecturas manuales actuales (unidades)
- `C_lectura` = costo unitario por lectura (USD)

#### 1b. Ahorro en despachos de corte y reposición

El telecomando permite gestionar cortes/reposiciones remotamente, eliminando viajes en campo:

```
B_despachos[y] = (V_cortes + V_repos) · C_cuadrilla · progress[y]
```

Donde:
- `V_cortes` = órdenes de corte físico anuales
- `V_repos` = órdenes de reposición física anuales
- `C_cuadrilla` = costo por visita en campo (USD)

**Subtotal Palanca 1:**
```
B_P1[y] = B_lecturas[y] + B_despachos[y]
```

---

### Palanca 2: Calidad de Servicio y Multas ENRE

#### 2a. Reducción de multas por SAIDI

La AMI permite detección temprana de fallas y mejora de la calidad de suministro:

```
Horas_SAIDI_evitadas[y] = H_SAIDI · (r_SAIDI / 100) · progress[y]
B_SAIDI[y] = Horas_SAIDI_evitadas[y] · C_multa_SAIDI
```

Donde:
- `H_SAIDI` = horas de interrupción histórica anual (SAIDI histórico)
- `r_SAIDI` = porcentaje de reducción de SAIDI esperada con AMI (%)
- `C_multa_SAIDI` = multa regulatoria por hora de SAIDI (USD/hora)

#### 2b. Eliminación de multas por estimaciones

Las lecturas remotas eliminan la necesidad de estimar consumos, lo que genera multas del ENRE:

```
B_estimaciones[y] = M_estimaciones · progress[y]
```

Donde `M_estimaciones` es el monto anual de multas por estimación (USD/año).

**Subtotal Palanca 2:**
```
B_P2[y] = B_SAIDI[y] + B_estimaciones[y]
```

---

### Palanca 3: Recuperación de Pérdidas No Técnicas (Fraude)

La AMI permite identificar y cortar desvíos de energía (hurto, by-pass de medidores):

**Energía recuperada:**
```
MWh_recuperados[y] = L_NT · (r_rec / 100) · progress[y]
```

**Margen por MWh recuperado:**
```
Margen_MWh = T_tarifa − C_MEM
```

Donde:
- `L_NT` = pérdidas no técnicas actuales (MWh/año)
- `r_rec` = tasa de recuperación esperada con AMI (%)
- `T_tarifa` = tarifa comercial vigente (USD/MWh)
- `C_MEM` = costo de la energía en el mercado mayorista — MEM (USD/MWh)

**Beneficio por recuperación:**
```
B_P3[y] = MWh_recuperados[y] · max(0, Margen_MWh)
```

> Nota: Se aplica `max(0, Margen_MWh)` para evitar beneficios negativos en escenarios donde el costo mayorista supera la tarifa.

---

### 7.1 Beneficio Total del Año

```
B_total[y] = B_P1[y]  +  B_P2[y]  +  B_P3[y]
```

---

## 8. VPN — Valor Presente Neto

### 8.1 Flujo neto de caja del año `y`

```
FCF[y] = B_total[y]  −  OPEX[y]  −  CAPEX[y]
```

### 8.2 VPN Total del Proyecto

```
VPN = Σ_{y=0}^{N} FCF[y] / (1 + WACC/100)^y
```

El denominador `(1 + r)^y` descuenta cada flujo al valor presente del Año 0, reflejando el costo de oportunidad del capital (WACC).

**Interpretación:**
- VPN > 0: el proyecto genera valor por encima del costo del capital → viable
- VPN < 0: el proyecto destruye valor → requiere revisión de supuestos
- VPN = 0: el proyecto retorna exactamente el WACC → punto de indiferencia

### 8.3 VPN Acumulado por año

```
VPN_acum[y] = Σ_{t=0}^{y} FCF[t] / (1 + WACC/100)^t
```

Se grafica en el panel "Proyección" para visualizar la evolución del valor del proyecto.

---

## 9. Indicadores Derivados

### 9.1 Año de Breakeven (Payback descontado)

El año en que el VPN acumulado cruza el cero por primera vez:

```
Breakeven = min{ y ∈ [0..N] : VPN_acum[y] ≥ 0 }
```

Si no existe tal `y`, el proyecto no recupera la inversión dentro del horizonte de análisis.

### 9.2 Ratio de Cobertura Beneficios / OPEX

Mide cuántas veces los beneficios cubren el costo operativo en el año de madurez (último año):

```
Cobertura = B_total[N] / OPEX[N]
```

**Interpretación:**
- ≥ 2.0x → holgada: el negocio es sostenible con margen amplio
- 1.0x – 2.0x → ajustada: viable pero sensible a variaciones
- < 1.0x → insuficiente: los beneficios no cubren el OPEX, proyecto no viable operativamente

### 9.3 CAPEX Promedio por Endpoint

```
CAPEX_avg = CAPEX_total / M
```

Permite comparar la inversión unitaria entre escenarios con distintos mix tecnológicos o volúmenes.

### 9.4 Instalaciones en el Último Año

```
Inst_N = schedule[N]
```

Muestra la capacidad de instalación requerida en el pico del despliegue. Útil para dimensionar la logística del contratista.

### 9.5 Análisis de Sensibilidad

Para cada parámetro `p` de los más relevantes (WACC, costo de medidor, tasa de recuperación de fraude, SAIDI, etc.), se calcula el VPN variando el parámetro en ±30% respecto al valor base:

```
Δ_VPN(p) = VPN(p + 30%)  −  VPN(p − 30%)
```

Los parámetros se ordenan de mayor a menor `|Δ_VPN|` para identificar los factores de mayor impacto (gráfico "Tornado").

---

## 10. Glosario de Parámetros

### Globales

| Parámetro | Símbolo | Valor base | Descripción |
|---|---|---|---|
| WACC | r | 14% | Costo de capital en USD, incluye riesgo país Argentina |
| Horizonte | N | 8 años | Período de evaluación financiera |
| Total endpoints | M | 2.500.000 | Universo de medidores a desplegar (clientes Edesur) |
| Tipo de cambio | TC | 1.200 ARS/USD | Referencia para costos en pesos |
| % Wi-SUN | α_ws | 0% | Medidores con tecnología Wi-SUN mesh |
| % PLC | α_plc | 0% | Medidores con tecnología Power Line Communication |
| % P2P | α_p2p | 100% | Medidores con SIM celular/NB-IoT (derivado) |

### CAPEX

| Parámetro | Símbolo | Valor base | Descripción |
|---|---|---|---|
| Medidor T1 | C_hw | USD 55 | Costo CIF monofásico residencial |
| Medidor T2/T3 | — | USD 120 | Costo CIF trifásico PyMEs |
| Módulo Wi-SUN | C_comms_ws | USD 15 | Módulo de comunicación mesh |
| Módulo PLC | C_comms_plc | USD 12 | Módulo de comunicación powerline |
| Módulo P2P | C_comms_p2p | USD 22 | Módulo celular/NB-IoT con SIM |
| Instalación | C_install | USD 18 | Mano de obra por medidor |
| Concentrador PLC | C_conc_plc | USD 3.200 | Equipo concentrador PLC (1 c/250 nodos) |
| Focal Point WS | C_fp_ws | USD 8.500 | Gateway Wi-SUN mesh (1 c/5.000 nodos) |
| Integración IT | C_IT | USD 15M | Plataforma MDM, SAP, ciberseguridad (año 0) |
| Project Mgmt | C_PM | USD 8M | Gerencia de proyecto (año 0) |

### OPEX

| Parámetro | Símbolo | Valor base | Descripción |
|---|---|---|---|
| Abono M2M | C_m2m | USD 0,85/mes | Costo mensual SIM por medidor P2P |
| Licencias SaaS | OPEX_saas | USD 4M/año | MDM, SCADA/OMS, Analytics |
| Cloud | C_cloud | USD 120K/mes | Almacenamiento y procesamiento cloud |
| Mantenimiento | OPEX_mant | USD 6M/año | Reposición equipos, mantenimiento campo |
| Administración | OPEX_admin | USD 2,5M/año | NOC, analistas, RRHH especializado |

### Beneficios

| Parámetro | Símbolo | Valor base | Descripción |
|---|---|---|---|
| Lecturas anuales | V_lecturas | 2.500.000 | Lecturas pedestres actuales |
| Costo por lectura | C_lectura | USD 3,50 | Costo unitario de lectura manual |
| Cortes físicos | V_cortes | 180.000/año | Órdenes de corte con cuadrilla |
| Repos físicas | V_repos | 180.000/año | Órdenes de reposición con cuadrilla |
| Costo cuadrilla | C_cuadrilla | USD 38 | Costo por visita en campo |
| SAIDI histórico | H_SAIDI | 18 hs/año | Horas de interrupción promedio anuales |
| Reducción SAIDI | r_SAIDI | 30% | Mejora esperada con AMI |
| Multa SAIDI | C_multa | USD 850K/hora | Penalidad regulatoria por hora |
| Multas estimación | M_estimaciones | USD 3,2M/año | Multas ENRE por lecturas estimadas |
| Pérdidas NT | L_NT | 850.000 MWh/año | Pérdidas no técnicas (hurto energía) |
| Recuperación AMI | r_rec | 42% | Fracción recuperable con AMI |
| Costo MEM | C_MEM | USD 42/MWh | Precio energía mercado mayorista |
| Tarifa comercial | T_tarifa | USD 95/MWh | Precio promedio facturación clientes |

---

## Notas Metodológicas

1. **Moneda:** Todos los valores en USD constantes. Los costos en ARS se convierten usando el tipo de cambio de referencia ingresado.

2. **Conservadurismo de beneficios:** Solo se computan beneficios directamente cuantificables. No se incluyen beneficios intangibles (imagen de marca, satisfacción del cliente, habilitación de nuevos modelos de negocio).

3. **Infraestructura proporcional:** Los concentradores PLC y focal points Wi-SUN se adquieren en proporción a los medidores instalados cada año, no como inversión única inicial.

4. **M2M diferenciado:** El costo de telecom solo aplica a medidores P2P (con SIM). Los medidores Wi-SUN y PLC no tienen abono M2M mensual, lo que reduce significativamente el OPEX en mixes tecnológicos mixtos.

5. **Progreso acumulado:** Los beneficios no siguen la curva de instalación anual sino la curva acumulada. Un medidor instalado en el Año 2 genera beneficios en los Años 3, 4, ..., N.

6. **Breakeven descontado:** El cálculo de payback utiliza flujos descontados (no nominales), siendo un indicador más conservador y financieramente correcto que el payback simple.

---

*Documento generado por AMI Simulator v1.0.0 — Antigravity*
