/* Extension scoped to mapa_favoritos2. Data is embedded in the exported HTML. */
// Current municipal source uses the official co-official short province names.
// Keep the existing map keys stable; only add equivalent province spellings.
aliases.alacant = 'alicante';
aliases.castello = 'castellon';
aliases.alacantalicante = 'alicante';
aliases.castellocastellon = 'castellon';
var housingByKey = new Map();
(GC_HOUSING.records || []).forEach(function (record) {
  var k = key(record.municipio, record.provincia);
  if (groups.has(k) && groups.get(k).vacantes > 0 && record.status === 'confirmed') {
    if (!housingByKey.has(k)) housingByKey.set(k, []);
    housingByKey.get(k).push(record);
  }
});
var invByKey = new Map();
(typeof GC_INV2017 !== 'undefined' ? GC_INV2017.municipios : []).forEach(function (m) {
  var k = key(m.municipio, m.provincia);
  if (groups.has(k)) invByKey.set(k, m);
});
function gcInvEntry(g) { return g ? invByKey.get(g.key) : null; }
function gcInvTotal(m) { return m ? m.cyg_habitables : 0; }
function gcInvFree(m) { return m ? m.cyg_libres_habitables : 0; }
function gcInvFreeOnly() {
  var input = document.getElementById('inv2017Free');
  return !!(input && input.checked && !input.disabled);
}
function gcHasInv(g) {
  var m = gcInvEntry(g);
  return !!(g && g.vacantes > 0 && gcInvTotal(m) > 0 && (!gcInvFreeOnly() || gcInvFree(m) > 0));
}
function gcInvOnly() {
  var input = document.getElementById('inv2017Only');
  return !!(input && input.checked);
}
function gcHasHousing(g) {
  return !!(g && g.vacantes > 0 && housingByKey.has(g.key));
}
function gcHousingOnly() {
  var input = document.getElementById('housingOnly');
  return !!(input && input.checked);
}
function gcHousingAllowed(g) {
  var a = gcHousingOnly(), b = gcInvOnly();
  if (!a && !b) return true;
  return (a && gcHasHousing(g)) || (b && gcHasInv(g));
}
function gcSafeSource(url) {
  try {
    var u = new URL(url);
    return u.protocol === 'https:' || u.protocol === 'http:' ? u.href : '';
  } catch (e) { return ''; }
}
function gcHousing(c, g) {
  gcHousingCurrent(c, g);
  gcInv2017(c, g);
}
function gcHousingCurrent(c, g) {
  if (!gcHasHousing(g) || c.querySelector('.gc-housing')) return;
  var section = document.createElement('section');
  section.className = 'gc-housing';
  section.setAttribute('aria-label', 'Vivienda o pabellón');
  var title = document.createElement('h4');
  title.textContent = 'Vivienda o pabellón documentado';
  section.appendChild(title);
  housingByKey.get(g.key).forEach(function (r) {
    var article = document.createElement('article');
    var html = '<h5>' + esc(r.cuartel) + '</h5>' +
      '<p><strong>Existencia:</strong> ' + esc(r.existencia) + '</p>' +
      '<p><strong>Tipo y cantidad:</strong> ' + esc(r.tipo_cantidad) + '</p>';
    if (r.restriccion) html += '<p><strong>Condiciones:</strong> ' + esc(r.restriccion) + '</p>';
    html += '<p><strong>Evidencia:</strong> ' + esc(r.evidencia) + '</p><ul>';
    (r.fuentes || []).forEach(function (s) {
      var href = gcSafeSource(s.url);
      if (href) html += '<li><a target="_blank" rel="noopener noreferrer" href="' + esc(href) + '">' +
        esc(s.nombre) + '</a>' + (s.fecha ? ' · ' + esc(s.fecha) : '') + '</li>';
    });
    html += '</ul><p><strong>Disponibilidad actual:</strong> ' + esc(r.disponibilidad) + '</p>';
    if (r.nota) html += '<p class="gc-house-note">' + esc(r.nota) + '</p>';
    article.innerHTML = html;
    section.appendChild(article);
  });
  var note = document.createElement('p');
  note.className = 'gc-house-note';
  note.textContent = 'La existencia de viviendas en el municipio no garantiza el derecho de uso para esta vacante, su habitabilidad actual ni una adjudicación. Consulta la unidad o comandancia. Revisión documental: ' + GC_HOUSING.revisado + '.';
  section.appendChild(note);
  var charts = c.querySelector('.gc-charts');
  if (charts) charts.after(section); else c.appendChild(section);
}
function gcFmt(n) { return Number(n).toLocaleString('es-ES'); }
function gcInv2017(c, g) {
  var m = gcInvEntry(g);
  if (!m || !(g.vacantes > 0) || c.querySelector('.gc-inv2017')) return;
  var F = GC_INV2017.fuente;
  var section = document.createElement('section');
  section.className = 'gc-inv2017';
  section.setAttribute('aria-label', 'Pabellones de Cabos y Guardias en 2017, documento oficial verificado');
  var html = '<span class="gc-inv-badge">Verificado · documento oficial 2017</span>' +
    '<h4>Pabellones de Cabos y Guardias en 2017</h4>';
  if (m.cyg > 0) {
    html += '<p class="gc-inv-total"><strong>' + gcFmt(m.cyg) + '</strong> ' + (m.cyg === 1 ? 'pabellón' : 'pabellones') + ' de Cabo a Guardia: <strong>' +
      gcFmt(m.cyg_habitables) + '</strong> habitables, <strong>' + gcFmt(m.cyg_libres_habitables) + '</strong> ' + (m.cyg_libres_habitables === 1 ? 'libre' : 'libres') + ' y habitables a la fecha del inventario.</p>';
  } else {
    html += '<p class="gc-inv-total">Sin pabellones de unidad para Cabos y Guardias en 2017.</p>';
  }
  html += '<table><thead><tr><th>Unidad (2017)</th><th title="Pabellones de unidad para Cabo a Guardia">C. y G.</th><th title="Ocupados en 2017">Ocup.</th><th title="Libres y habitables en 2017">Libres</th><th title="No utilizables o inhabitables">Inhab.</th></tr></thead><tbody>';
  var other = { cargo: 0, cargo_cyg: 0, suboficial: 0, oficiales: 0, otros: 0, total: 0 }, est = {};
  m.unidades.forEach(function (u) {
    html += '<tr' + (u.cyg ? '' : ' class="gc-inv-out"') + '><td>' + esc(u.unidad) + '<span class="gc-inv-type">' + gcFmt(u.total) + ' pabellones en total</span></td><td>' +
      gcFmt(u.cyg) + '</td><td>' + gcFmt(u.cyg_ocupados) + '</td><td>' + gcFmt(u.cyg_libres_habitables) + '</td><td>' + gcFmt(u.cyg_inhabitables) + '</td></tr>';
    Object.keys(other).forEach(function (k) { other[k] += u[k] || 0; });
    Object.keys(u.cyg_estado || {}).forEach(function (k) { est[k] = (est[k] || 0) + u.cyg_estado[k]; });
  });
  html += '</tbody></table>';
  var order = [['BUENO', 'bueno'], ['REGULAR', 'regular'], ['DEFICIENTE', 'deficiente'], ['MALO', 'malo'], ['NO UTILIZABLE / INHABITABLE', 'inhabitable'], ['SIN ESTADO', 'sin estado']];
  var parts = order.filter(function (o) { return est[o[0]]; }).map(function (o) { return gcFmt(est[o[0]]) + ' ' + o[1]; });
  if (parts.length) html += '<p class="gc-house-note">Estado de los pabellones de Cabos y Guardias: ' + parts.join(', ') + '.</p>';
  var oth = [];
  if (other.cargo) oth.push(gcFmt(other.cargo) + ' de cargo' + (other.cargo_cyg ? ' (' + gcFmt(other.cargo_cyg) + ' de Cabo a Guardia, ligados a un mando)' : ''));
  if (other.suboficial) oth.push(gcFmt(other.suboficial) + ' de suboficiales');
  if (other.oficiales) oth.push(gcFmt(other.oficiales) + ' de oficiales');
  if (other.otros) oth.push(gcFmt(other.otros) + ' sin tipo o empleo indicado o de representación');
  if (oth.length) html += '<p class="gc-house-note">Otros pabellones no computados: ' + oth.join('; ') + '.</p>';
  var p = GC_INV2017.provincias[m.provincia_2017];
  if (p) {
    html += '<p class="gc-house-note">Provincia en 2017: ' + gcFmt(p.total) + ' pabellones, ' + gcFmt(p.ocupados) + ' ocupados y ' + gcFmt(p.inhabitables) + ' inhabitables; ' +
      gcFmt(p.cyg) + ' de Cabos y Guardias, de ellos ' + gcFmt(p.cyg_libres_habitables) + ' libres y habitables' +
      (p.efectivos_30_04_2017 ? '. Efectivos disponibles a 30/04/2017: ' + gcFmt(p.efectivos_30_04_2017) : '') + '.</p>';
    (p.gasto_212_comandancia || []).forEach(function (x) {
      var sum = x.importes.reduce(function (a, b) { return a + b; }, 0);
      html += '<p class="gc-house-note">Gasto en conservación de pabellones, Comandancia de ' + esc(x.comandancia.charAt(0) + x.comandancia.slice(1).toLowerCase()) + ': ' +
        sum.toLocaleString('es-ES', { maximumFractionDigits: 0 }) + ' € entre 2012 y 2016 (' + x.importes[4].toLocaleString('es-ES', { maximumFractionDigits: 0 }) + ' € en 2016).</p>';
    });
  }
  html += '<p class="gc-house-note">Libres: pabellones de Cabo a Guardia habitables que no figuraban como ocupados en 2017. Es una foto de 2017, no la disponibilidad actual; los inhabitables no se adjudican hasta repararse.</p>';
  html += '<ul><li><a target="_blank" rel="noopener noreferrer" href="' + esc(gcSafeSource(F.url)) + '">Respuesta del Gobierno a la solicitud de informe 186/657, anexos II y III</a> · ' + esc(F.fecha) + '</li></ul>';
  section.innerHTML = html;
  var after = c.querySelector('.gc-housing') || c.querySelector('.gc-charts');
  if (after) after.after(section); else c.appendChild(section);
}
function gcInvStats() {
  var output = document.getElementById('inv2017Status');
  if (!output) return;
  var count = 0, visible = new Set();
  groups.forEach(function (g) { if (gcHasInv(g)) count++; });
  layer.eachLayer(function (marker) {
    var g = marker._gcHousingKey && groups.get(marker._gcHousingKey);
    if (g && gcHasInv(g)) visible.add(g.key);
  });
  output.textContent = count + ' municipios con vacantes 2026 tenían pabellones habitables de Cabos y Guardias en 2017' +
    (gcInvFreeOnly() ? ', con al menos uno libre' : '') + '. ' + visible.size + ' visibles con los filtros actuales.';
}
function gcHousingStats() {
  var output = document.getElementById('housingStatus');
  if (!output) return;
  var q = norm($('search').value);
  var selected = sorted.filter(function (g) {
    return gcHasHousing(g) && (!q || norm(g.municipio + ' ' + g.provincia).includes(q));
  });
  var visible = new Set();
  layer.eachLayer(function (marker) {
    if (marker._gcHousingKey && housingByKey.has(marker._gcHousingKey)) visible.add(marker._gcHousingKey);
  });
  var missingCount = selected.filter(function (g) { return !valid(coords[g.key]); }).length;
  output.textContent = housingByKey.size + ' municipios con evidencia aceptada de ' + GC_HOUSING.scope_count +
    ' con vacantes 2026. ' + visible.size + ' visibles con los filtros actuales.' +
    (missingCount ? ' ' + missingCount + ' coincidencias sin coordenadas.' : '') +
    (gcHousingOnly() && !visible.size ? ' No hay resultados visibles; prueba a borrar la búsqueda o activar Vacantes anunciadas.' : '');
}
(function gcInstallHousing() {
  var st = document.createElement('style');
  st.id = 'gc-housing-style';
  st.textContent = '.num.gc-has-housing{border-radius:3px!important}.gc-housing{border-top:1px solid #d2d9df;margin-top:12px;padding-top:10px;overflow-wrap:anywhere}.gc-housing h4{margin:0 0 8px;font-size:14px}.gc-housing h5{margin:8px 0 6px;font-size:13px}.gc-housing p{margin:6px 0;font-size:13px;line-height:1.5}.gc-housing ul{margin:4px 0 8px;padding-left:18px;font-size:12px}.gc-housing article+article{border-top:1px solid #e4e8ec;padding-top:6px}.gc-house-note{color:#465a6b;font-size:12px!important}.gc-housing-controls{margin:12px 0;padding:10px;border:1px solid #c5cfd8;border-radius:5px;background:#fff}.gc-housing-controls label{display:flex;gap:8px;align-items:center;cursor:pointer;font-weight:600}.gc-housing-controls input{width:17px;height:17px;flex:none}.gc-inv-sep{border:0;border-top:1px solid #d2d9df;margin:10px 0}.gc-housing-controls p{font-size:12px;line-height:1.45;margin:6px 0;color:#465a6b}.gc-housing-square{display:inline-block;width:11px;height:11px;background:#18314a;border-radius:2px;margin-right:4px}.num.gc-has-inv2017{outline:2px dashed #9a6400;outline-offset:2px}.gc-inv2017{border-top:1px solid #d2d9df;margin-top:12px;padding:10px;background:#fbf7ee;border-radius:4px;overflow-wrap:anywhere}.gc-inv2017 h4{margin:4px 0 6px;font-size:14px}.gc-inv-badge{display:inline-block;font-size:11px;font-weight:700;letter-spacing:.02em;color:#6b4500;background:#f3e3bf;border:1px dashed #9a6400;border-radius:3px;padding:1px 6px}.gc-inv-total{margin:4px 0 8px;font-size:13px}.gc-inv2017 table{width:100%;border-collapse:collapse;font-size:12px;margin:4px 0 6px}.gc-inv2017 th,.gc-inv2017 td{border-bottom:1px solid #e6dcc6;padding:4px 5px;text-align:right;vertical-align:top}.gc-inv2017 th{white-space:nowrap;overflow-wrap:normal}.gc-inv2017 td{overflow-wrap:normal;word-break:normal}.gc-inv2017 th:first-child,.gc-inv2017 td:first-child{text-align:left}.gc-inv-type{display:block;color:#6b5a3a;font-size:11px}.gc-inv-out td{color:#7b7b7b}.gc-housing-controls .gc-inv-sub{font-weight:500;margin:6px 0 0 25px;font-size:13px}.gc-inv-sub input:disabled+*{opacity:.5}.gc-housing-controls label:has(input:disabled){color:#7a8896;cursor:not-allowed}.gc-inv2017 p{margin:6px 0;line-height:1.45}.gc-inv2017 ul{margin:4px 0 0;padding-left:18px;font-size:12px}.gc-inv-ring{display:inline-block;width:10px;height:10px;border-radius:50%;background:#2a7d3c;outline:2px dashed #9a6400;outline-offset:2px;margin:0 7px 0 3px}.gc-housing-fav{border:3px solid #b8860b;border-radius:3px;background:#ffd700cc;width:20px;height:20px;box-sizing:border-box}.gc-housing a:focus-visible,.gc-housing-controls input:focus-visible{outline:2px solid #0756a3;outline-offset:2px}';
  document.getElementById(st.id)?.remove();
  document.head.appendChild(st);
  var fitStyle = document.createElement('style');
  fitStyle.id = 'gc-housing-fit';
  fitStyle.textContent = '.leaflet-popup-content{max-height:min(78vh,var(--gc-popup-height,760px))}.leaflet-container.gc-popup-open .leaflet-control-zoom,.leaflet-container.gc-popup-open .leaflet-control-layers{visibility:hidden}';
  document.getElementById(fitStyle.id)?.remove();
  document.head.appendChild(fitStyle);
  function fitPopup() {
    map.getContainer().style.setProperty('--gc-popup-height', Math.max(150, map.getSize().y - 70) + 'px');
    if (map._popup) map._popup.update();
  }
  map.on('resize', fitPopup);
  map.on('popupopen', function () { map.getContainer().classList.add('gc-popup-open'); });
  map.on('popupclose', function () { map.getContainer().classList.remove('gc-popup-open'); });
  fitPopup();
  document.getElementById('housingControls')?.remove();
  {
    var panel = document.createElement('div');
    panel.id = 'housingControls';
    panel.className = 'gc-housing-controls';
    panel.innerHTML = '<label><input type="checkbox" id="housingOnly" role="switch">Solo vacantes con vivienda documentada</label>' +
      '<p><span class="gc-housing-square" aria-hidden="true"></span>Cuadrado: pabellones o viviendas acreditados. No significa que haya alojamiento libre.</p>' +
      '<p id="housingStatus" role="status" aria-live="polite"></p>' +
      '<p>Los círculos indican falta de confirmación, no ausencia de vivienda. Solo se marcan municipios con vacantes 2026 positivas.</p>' +
      '<hr class="gc-inv-sep">' +
      '<label><input type="checkbox" id="inv2017Only" role="switch">Pabellones de Cabos y Guardias 2017 (verificado)</label>' +
      '<label class="gc-inv-sub"><input type="checkbox" id="inv2017Free" disabled>Solo con pabellones libres y habitables en 2017</label>' +
      '<p><span class="gc-inv-ring" aria-hidden="true"></span>Contorno discontinuo: pabellones habitables de Cabo a Guardia según el documento oficial de 06/11/2017 (solicitud 186/657). Dato de 2017, separado de las confirmaciones actuales.</p>' +
      '<p id="inv2017Status" role="status" aria-live="polite"></p>' +
      '<p>Con ambos filtros activados se muestran los municipios que cumplen cualquiera de los dos.</p>';
    $('zero').closest('label').after(panel);
  }
  var originalAdd = window.add;
  window.add = function (g, p, n, bq, dual, zero) {
    if (!gcHousingAllowed(g)) return;
    var result = originalAdd(g, p, n, bq, dual, zero);
    var all = layer.getLayers();
    var marker = all[all.length - 1];
    if (marker) {
      marker._gcHousingKey = g.key;
      var cls = [], tip = '';
      if (gcHasHousing(g)) { cls.push('gc-has-housing'); tip += ' · Vivienda documentada (disponibilidad no verificada)'; }
      if (gcHasInv(g)) { cls.push('gc-has-inv2017'); var im = gcInvEntry(g); tip += ' · 2017 (verificado): ' + im.cyg_habitables + ' pabellones habitables de Cabos y Guardias, ' + im.cyg_libres_habitables + ' libres'; }
      if (cls.length) {
        var options = Object.assign({}, marker.options.icon.options);
        options.html = options.html.replace('class="num"', 'class="num ' + cls.join(' ') + '"');
        marker.setIcon(L.divIcon(options));
        var tooltip = marker.getTooltip();
        if (tooltip) tooltip.setContent(tooltip.getContent() + tip);
      }
    }
    return result;
  };
  var originalRefresh = window.refresh;
  window.refresh = function () {
    originalRefresh();
    draw();
    gcHousingStats();
    gcInvStats();
  };
  ['search', 'vac', 'bq', 'zero'].forEach(function (id) {
    $(id).removeEventListener('input', originalRefresh);
    $(id).addEventListener('input', window.refresh);
  });
  $('housingOnly').addEventListener('change', window.refresh);
  $('inv2017Only').addEventListener('change', function () { $('inv2017Free').disabled = !$('inv2017Only').checked; window.refresh(); });
  $('inv2017Free').addEventListener('change', window.refresh);
  if (audit.loaded && missing().some(function (g) {
    return ['alicante', 'castellon'].includes(prov(g.provincia));
  })) load();
})();
