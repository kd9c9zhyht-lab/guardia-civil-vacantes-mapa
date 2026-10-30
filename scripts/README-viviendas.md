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

## Inventario oficial de 2017 (dato histórico)

Es una capa separada de las confirmaciones actuales. En el mapa se marca con un contorno discontinuo, tiene su propio interruptor en el panel izquierdo y aparece en el popup como «Dato histórico · 2017», debajo de la ficha de vivienda actual.

- **Fuente:** [respuesta del Gobierno al Congreso de 06/10/2017](https://www.congreso.es/entradap/l12p/e5/e_0050224_n_000.pdf), con 2.097 unidades y 33.843 pabellones. Los subtotales provinciales cuadran con el cuadro oficial, salvo en inhabitables: la suma provincial es 1.828 y la fila TOTAL del documento indica 534.
- **Clasificación:** [Orden General 5/2005, art. 5 y anexo I](https://www.pactiolegal.es/wp-content/uploads/2023/09/004-Orden-General-num.-5-de-19-de-mayo-de-2005-sobre-regulacion-de-pabellones-oficiales-de-la-Guardia-Civil.pdf). De cada unidad se restan sus pabellones de cargo: Comandante de Puesto (uno por puesto, aunque figure en varias filas), Jefe de Comandancia, Coronel Jefe de Zona, Jefe de Tráfico, Director de centro o Jefe de unidad con cupo propio. Se excluyen las academias de oficiales y los puestos cuyo único pabellón es el de cargo.
- **Límite:** el anexo no desglosa los grupos de pabellones de unidad (oficiales, suboficiales, y cabos y guardias). La cifra «C. y G.» es por tanto un máximo, no un recuento exacto.
- **Cruce:** primero por nombre de la unidad que tiene la vacante y después por municipio, más una tabla manual de equivalencias revisada (por ejemplo JATIVA → Xàtiva). Solo se marcan municipios con vacantes 2026 positivas.

Archivos: `datos/inventario_2017_anexo_unidades.json` (anexo transcrito), `datos/inventario_2017_provincias.json` (cuadro provincial), `datos/pabellones_inventario_2017.json` (clasificado y cruzado). Para regenerarlos: `node scripts/classify-inventario-2017.mjs && node scripts/build-housing.mjs`.
