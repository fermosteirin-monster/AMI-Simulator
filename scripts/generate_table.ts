import fs from 'fs';
import { BASELINE_SCENARIO } from '../src/store/useStore.ts';
import { generateProjection } from '../src/BUSINESS_LOGIC.ts';

const customScenario = JSON.parse(JSON.stringify(BASELINE_SCENARIO));
customScenario.global.analysisHorizonYears = 10;
customScenario.global.deploymentCurve = 'linear';
const projection = generateProjection(customScenario);

let md = '## 6. Proyección de Flujos de Caja a 10 Años (Despliegue Lineal)\n\n';
md += 'A continuación se presenta el flujo de caja anualizado asumiendo un despliegue puramente lineal durante todo el horizonte de 10 años. Las cantidades acumuladas de medidores (SM) determinan el impacto en el CAPEX, OPEX y los Beneficios año a año.\n\n';
md += '| Año | SM Instalados Año | SM Acumulados | Avance (%) | CAPEX Total | OPEX Total | Beneficios Totales | Flujo Neto (Flujo de Caja) | VPN Acumulado |\n';
md += '|:---:|---:|---:|---:|---:|---:|---:|---:|---:|\n';

const fmt = (v: number) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(v);
const fmtNum = (v: number) => new Intl.NumberFormat('es-AR', { maximumFractionDigits: 0 }).format(v);
const fmtPct = (v: number) => (v * 100).toFixed(1) + '%';

projection.forEach(p => {
  md += `| ${p.year} | ${fmtNum(p.installations || 0)} | ${fmtNum(p.cumulative || 0)} | ${fmtPct(p.progress || 0)} | ${fmt(p.capex)} | ${fmt(p.opex)} | ${fmt(p.benefits)} | ${fmt(p.netCashFlow)} | ${fmt(p.cumulativeNPV)} |\n`;
});

const mdPath = 'C:\\Users\\florg\\.gemini\\antigravity\\brain\\c7b18535-dbb0-4187-92a5-c32a34a9e77e\\memoria_calculo_baseline.md';
let fileContent = fs.readFileSync(mdPath, 'utf8');
fileContent = fileContent.replace(/## 6\. Proyección de Flujos de Caja a 10 Años \(Despliegue Lineal\)[\s\S]*$/, md);
fs.writeFileSync(mdPath, fileContent);
console.log('Fixed markdown file.');
