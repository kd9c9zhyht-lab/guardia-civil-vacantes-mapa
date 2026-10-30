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
function gcHasHousing(g) {
  return !!(g && g.vacantes > 0 && housingByKey.has(g.key));
}
function gcHousingOnly() {
  var input = document.getElementById('housingOnly');
  return !!(input && input.checked);
}
function gcHousingAllowed(g) {
  return !gcHousingOnly() || gcHasHousing(g);
}
function gcSafeSource(url) {
  try {
    var u = new URL(url);
    return u.protocol === 'https:' || u.protocol === 'http:' ? u.href : '';
  } catch (e) { return ''; }
}
function gcHousing(c, g) {
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
  st.textContent = '.num.gc-has-housing{border-radius:3px!important}.gc-housing{border-top:1px solid #d2d9df;margin-top:12px;padding-top:10px;overflow-wrap:anywhere}.gc-housing h4{margin:0 0 8px;font-size:14px}.gc-housing h5{margin:8px 0 6px;font-size:13px}.gc-housing p{margin:6px 0;font-size:13px;line-height:1.5}.gc-housing ul{margin:4px 0 8px;padding-left:18px;font-size:12px}.gc-housing article+article{border-top:1px solid #e4e8ec;padding-top:6px}.gc-house-note{color:#465a6b;font-size:12px!important}.gc-housing-controls{margin:12px 0;padding:10px;border:1px solid #c5cfd8;border-radius:5px;background:#fff}.gc-housing-controls label{display:flex;gap:8px;align-items:center;cursor:pointer;font-weight:600}.gc-housing-controls input{width:17px;height:17px;flex:none}.gc-housing-controls p{font-size:12px;line-height:1.45;margin:6px 0;color:#465a6b}.gc-housing-square{display:inline-block;width:11px;height:11px;background:#18314a;border-radius:2px;margin-right:4px}.gc-housing-fav{border:3px solid #b8860b;border-radius:3px;background:#ffd700cc;width:20px;height:20px;box-sizing:border-box}.gc-housing a:focus-visible,.gc-housing-controls input:focus-visible{outline:2px solid #0756a3;outline-offset:2px}';
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
  if (!document.getElementById('housingControls')) {
    var panel = document.createElement('div');
    panel.id = 'housingControls';
    panel.className = 'gc-housing-controls';
    panel.innerHTML = '<label><input type="checkbox" id="housingOnly" role="switch">Solo vacantes con vivienda documentada</label>' +
      '<p><span class="gc-housing-square" aria-hidden="true"></span>Cuadrado: pabellones o viviendas acreditados. No significa que haya alojamiento libre.</p>' +
      '<p id="housingStatus" role="status" aria-live="polite"></p>' +
      '<p>Los círculos indican falta de confirmación, no ausencia de vivienda. Solo se marcan municipios con vacantes 2026 positivas.</p>';
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
      if (gcHasHousing(g)) {
        var options = Object.assign({}, marker.options.icon.options);
        options.html = options.html.replace('class="num"', 'class="num gc-has-housing"');
        marker.setIcon(L.divIcon(options));
        var tooltip = marker.getTooltip();
        if (tooltip) tooltip.setContent(tooltip.getContent() + ' · Vivienda documentada (disponibilidad no verificada)');
      }
    }
    return result;
  };
  var originalRefresh = window.refresh;
  window.refresh = function () {
    originalRefresh();
    draw();
    gcHousingStats();
  };
  ['search', 'vac', 'bq', 'zero'].forEach(function (id) {
    $(id).removeEventListener('input', originalRefresh);
    $(id).addEventListener('input', window.refresh);
  });
  $('housingOnly').addEventListener('change', window.refresh);
  if (audit.loaded && missing().some(function (g) {
    return ['alicante', 'castellon'].includes(prov(g.provincia));
  })) load();
})();
