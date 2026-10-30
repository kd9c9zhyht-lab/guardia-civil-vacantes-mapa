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
