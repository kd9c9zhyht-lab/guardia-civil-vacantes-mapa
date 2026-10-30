// Rebuild the embedded housing extension without changing vacancy/history data.
// Run from any directory: node scripts/build-housing.mjs
import fs from 'node:fs';
const root=new URL('../',import.meta.url);
const file=new URL('mapa_favoritos2.html',root);
const data=JSON.parse(fs.readFileSync(new URL('datos/viviendas_confirmadas_2026.json',root),'utf8'));
const inv=JSON.parse(fs.readFileSync(new URL('datos/pabellones_cyg_2017_verificado.json',root),'utf8'));
if(!/^https:\/\//.test(inv.fuente.url))throw Error('Invalid inventory source');
const ukeep=['unidad','total','ocupados','cyg','cyg_habitables','cyg_inhabitables','cyg_ocupados','cyg_libres_habitables','cyg_estado','cargo','cargo_cyg','suboficial','oficiales','otros'];
const pkeep=['total','ocupados','inhabitables','cyg','cyg_habitables','cyg_inhabitables','cyg_ocupados','cyg_libres_habitables','efectivos_30_04_2017','gasto_212_comandancia'];
const usedProv=new Set(inv.municipios.map(m=>m.provincia_2017));
const invCompact={fuente:inv.fuente,nacional:inv.nacional,nota_efectivos:inv.nota_efectivos,provincias:Object.fromEntries(Object.entries(inv.provincias).filter(([k])=>usedProv.has(k)).map(([k,v])=>[k,Object.fromEntries(pkeep.map(f=>[f,v[f]]))])),municipios:inv.municipios.map(m=>({municipio:m.municipio,provincia:m.provincia,provincia_2017:m.provincia_2017,cyg:m.cyg,cyg_habitables:m.cyg_habitables,cyg_libres_habitables:m.cyg_libres_habitables,unidades:m.unidades.map(u=>Object.fromEntries(ukeep.map(k=>[k,u[k]])))}))};
for(const m of invCompact.municipios)for(const u of m.unidades){if(![u.total,u.cyg,u.cyg_ocupados,u.cyg_libres_habitables].every(Number.isInteger)||u.cyg>u.total||u.cyg_libres_habitables>u.cyg_habitables||u.cyg_libres_habitables<0)throw Error('Invalid inventory row '+u.unidad);}
const plugin=fs.readFileSync(new URL('housing-popup.js',import.meta.url),'utf8');
for(const r of data.records){
  if(r.status!=='confirmed'||!r.municipio||!r.provincia||!r.fuentes?.length)throw Error('Invalid housing record');
  for(const f of r.fuentes)if(!/^https?:\/\//.test(f.url))throw Error('Invalid source URL');
}
let html=fs.readFileSync(file,'utf8');
const pattern=/\/\*GC-HOUSING-START\*\/[\s\S]*?\/\*GC-HOUSING-END\*\/\n/g;
const anchor="new MutationObserver(function(){document.querySelectorAll('.leaflet-popup-content').forEach(addBtn)})";
if(!html.includes(anchor)||!html.includes('gcCharts(c,g);gcHousing(c,g)'))throw Error('Housing integration anchors missing');
html=html.replace(pattern,'');
const block='/*GC-HOUSING-START*/\nvar GC_HOUSING='+JSON.stringify(data).replaceAll('</','<\\/')+';\nvar GC_INV2017='+JSON.stringify(invCompact).replaceAll('</','<\\/')+';\n'+plugin+'\n/*GC-HOUSING-END*/\n';
html=html.replace(anchor,block+anchor);
const source=html.match(/<script type="text\/plain" id="favsrc">([\s\S]*?)<\/script>/)?.[1];
if(!source)throw Error('Missing extension');
new Function(source);
fs.writeFileSync(file,html);
console.log(`Embedded ${data.records.length} verified housing records and ${invCompact.municipios.length} municipalities from the verified 2017 inventory (186/657); JavaScript syntax valid.`);
