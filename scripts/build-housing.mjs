// Rebuild the embedded housing extension without changing vacancy/history data.
// Run from any directory: node scripts/build-housing.mjs
import fs from 'node:fs';
const root=new URL('../',import.meta.url);
const file=new URL('mapa_favoritos2.html',root);
const data=JSON.parse(fs.readFileSync(new URL('datos/viviendas_confirmadas_2026.json',root),'utf8'));
const inv=JSON.parse(fs.readFileSync(new URL('datos/pabellones_inventario_2017.json',root),'utf8'));
if(!/^https:\/\//.test(inv.fuente.url)||!/^https:\/\//.test(inv.clasificacion.url))throw Error('Invalid inventory source');
const keep=['unidad','existentes','tipo','cargo_reservado','max_cabos_guardias','grupos_mixtos','incluido','motivo_exclusion'];
const invCompact={fuente:inv.fuente,clasificacion:inv.clasificacion,municipios:inv.municipios.map(m=>({municipio:m.municipio,provincia:m.provincia,provincia_2017:m.provincia_2017,unidades:m.unidades.map(u=>Object.fromEntries(keep.map(k=>[k,u[k]])))}))};
for(const m of invCompact.municipios)for(const u of m.unidades){if(!Number.isInteger(u.existentes)||u.max_cabos_guardias>u.existentes||u.max_cabos_guardias<0)throw Error('Invalid inventory row '+u.unidad);}
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
console.log(`Embedded ${data.records.length} verified housing records and ${invCompact.municipios.length} municipalities from the 2017 inventory; JavaScript syntax valid.`);
