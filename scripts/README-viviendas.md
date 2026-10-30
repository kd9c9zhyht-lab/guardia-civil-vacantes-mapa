# Mantenimiento de viviendas y pabellones

La extensión modifica únicamente `mapa_favoritos2.html`. Los datos de vacantes, los históricos de los gráficos y los contactos existentes no se sustituyen.

## Archivos

- **Datos aceptados:** `datos/viviendas_confirmadas_2026.json`, con municipio, provincia, instalación, existencia, cantidad, restricciones, evidencias, enlaces, fechas y disponibilidad.
- **Revisión completa:** `datos/revision_viviendas_2026.json`, con los 420 municipios/provincias con vacantes positivas y el motivo de cada resultado.
- **Informe:** `VIVIENDAS_2026.md`, con criterios, limitaciones, fichas y tabla completa de la revisión.
- **Interfaz:** `scripts/housing-popup.js`, embebida en el HTML principal para conservarla también en las descargas.

## Actualizar

Modificar los datos aceptados solo tras comprobar las fuentes y conservar las fechas. El nombre del municipio y de la provincia debe coincidir con los del mapa; el constructor del mapa también exige vacantes positivas y el estado `confirmed` antes de mostrar una ficha o un cuadrado.

```sh
node scripts/build-housing.mjs
```

El proceso valida los campos básicos y las URLs, comprueba la sintaxis del código y sustituye únicamente el bloque de vivienda. Después deben revisarse el informe y el registro de revisión para mantenerlos coherentes.

## Precauciones

- **Disponibilidad:** no deducir viviendas libres de la resta entre inventario y ocupación. Exigir confirmación de la unidad o comandancia antes de cambiar “No verificada”.
- **Uso:** no equiparar residencias de descanso, viviendas sociales en antiguos cuarteles o edificios proyectados con alojamiento residencial para ese destino.
- **Cantidades:** diferenciar viviendas, residentes, familias y unidades incluidas en obras parciales.
- **Ámbito:** no asignar al municipio de la capital todas las viviendas de una comandancia provincial.
- **Pruebas:** comprobar filtros combinados, círculos y cuadrados, las dos gráficas, fuentes, favoritos, direcciones guardadas, exportación HTML/CSV y tamaños de escritorio y móvil.

La publicación se realiza en la rama `main` del sitio existente de GitHub Pages. No es necesario modificar el dashboard independiente.

## Pabellones de Cabos y Guardias 2017 (documento oficial verificado)

Capa separada de las confirmaciones actuales. En el mapa se marca con un contorno discontinuo y tiene su propio interruptor en el panel izquierdo («Pabellones de Cabos y Guardias 2017 (verificado)»), con un subfiltro «Solo con pabellones libres y habitables en 2017». En el popup aparece como «Verificado · documento oficial 2017», debajo de la ficha de vivienda actual.

- **Fuente:** respuesta del Gobierno a la solicitud de informe 186/657 (Congreso de los Diputados), fechada en Madrid el 06/11/2017 (registro de entrada 54162, 1.137 páginas). Copia en [`datos/fuentes/pabellones_gc_186-657_2017-11-06.pdf`](https://kd9c9zhyht-lab.github.io/guardia-civil-vacantes-mapa/datos/fuentes/pabellones_gc_186-657_2017-11-06.pdf). Detalla cada pabellón con provincia, unidad, estado, tipo (Unidad, Cargo, Representación) y empleo (Cabo a Guardia, Suboficial, Capitán a Alférez, Coronel a Comandante, Oficial General).
  - Anexo I: efectivos disponibles por provincia a 30/04/2017 (76.806) y por empleo a 31/12/2016 (77.134). El anexo no tiene fila para Tarragona; la diferencia entre el total y la suma de filas es 568.
  - Anexo II: 33.843 pabellones existentes. Estado: 19.461 bueno, 10.122 regular, 302 deficiente, 2.124 malo, 1.828 no utilizables o inhabitables, 6 sin estado. Tipo: 31.063 de Unidad, 2.711 de Cargo, 4 de Representación, 65 sin indicar.
  - Anexo III: 26.053 pabellones ocupados (21.251 de Cabo a Guardia).
  - Anexo IV: gasto en conservación de pabellones (concepto 212) por comandancia, 2012–2016: 4.451.600,02 €, 3.450.511,51 €, 3.901.909,40 €, 4.558.183,68 € y 3.052.274,62 €. El documento indica que no dispone del desglose de obras por tipo de pabellón.
- **Comprobación:** los recuentos provinciales de existentes, ocupados e inhabitables coinciden con el cuadro de la respuesta de 06/10/2017. Los 2.096 nombres de unidad coinciden con su anexo por municipios, y los totales por unidad también, salvo MOTA DEL MARQUÉS, que en octubre figura en dos filas (6 + 1). La fila TOTAL de inhabitables de octubre (534) es un error: la suma real es 1.828.
- **Qué se cuenta como Cabos y Guardias:** pabellones de tipo Unidad y empleo Cabo a Guardia (27.486 en España, 25.819 habitables). Los 253 pabellones de Cargo de empleo Cabo a Guardia (ligados a un mando, como el Comandante de Puesto) se muestran aparte y no se computan.
- **Libres y habitables:** C. y G. no inhabitables menos los ocupados no inhabitables de la misma unidad (4.799 en España). Es la foto de 2017, no la disponibilidad actual, y los pabellones inhabitables no se adjudican hasta repararse.
- **Mapa:** 398 municipios con vacantes 2026 tienen unidades en el documento; 395 tenían pabellones habitables de Cabos y Guardias (contorno discontinuo) y 229 al menos uno libre y habitable. El cruce de unidad a municipio es el revisado para la capa anterior (`scripts/classify-inventario-2017.mjs`).

Archivos: `datos/inventario_2017_detalle_filas.csv` (59.896 filas de los anexos II y III, con página del PDF), `datos/inventario_2017_anexos_I_IV.json`, `datos/pabellones_cyg_2017_verificado.json` (agregado por unidad, municipio y provincia). Para regenerarlos: `python3 scripts/parse-pabellones-2017.py && python3 scripts/inventario-2017-verificado.py && node scripts/build-housing.mjs` (requiere PyMuPDF). Sustituye a la estimación anterior basada en la Orden General 5/2005.
