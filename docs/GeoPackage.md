# GeoPackage: constructor e inicialización 2D

`IDEE.layer.GeoPackage` representa un contenedor de capas vectoriales y ráster.
El conector abre el fichero completo en el navegador. Una URL no es un servicio
de teselas: se descarga el `.gpkg` y se procesa localmente, sujeto a CORS.

## Parámetros y compatibilidad

```js
// Firma histórica: se conservan los nombres de tabla y las opciones existentes.
const legacy = new IDEE.layer.GeoPackage(file, {
  roads: { legend: 'Carreteras', visibility: false },
});

// Firma normalizada: exactamente uno de source o url.
const gpkg = new IDEE.layer.GeoPackage({
  source: file,
  name: 'reference',
  legend: 'Datos de referencia',
}, {
  opacity: 0.8,
  visibility: true,
  tables: {
    roads: {
      legend: 'Carreteras',
      opacity: 0.6,
      style: new IDEE.style.Generic({ line: { stroke: { color: 'red', width: 2 } } }),
    },
  },
});

// Alternativa remota; no se combina url con source.
const remote = new IDEE.layer.GeoPackage({
  url: '/data/reference.gpkg',
  name: 'remote-reference',
  legend: 'Referencia remota',
});
```

`source` admite `File`, `Response`, `ArrayBuffer` y `Uint8Array`, incluidas vistas
con desplazamiento. Las respuestas HTTP fallidas, fuentes vacías/no admitidas y
errores de lectura o construcción rechazan la inicialización.

En la firma normalizada, el segundo argumento contiene opciones comunes y
`tables[tableName]` contiene sus sobrescrituras. Los nombres de las capas hijas
son `packageName:tableName` salvo sobrescritura; su leyenda por defecto es el
nombre de tabla. El nombre del paquete se genera si no se proporciona.
`getLayer(tableName)` siempre busca por el nombre original de la tabla.

Las opciones `tile[tableName]` y `vector[tableName]` siguen destinadas a los
proveedores y no se mezclan con las opciones de visualización. La firma histórica
mantiene las opciones de capa directamente en el segundo argumento, no en `tables`.

Los registros y arrays de configuración se copian; se conservan las instancias
de fuentes y estilos. `false` y `opacity: 0` son valores explícitos. Los estilos
se pasan al constructor vectorial y se aplican cuando carga sus entidades, como
en las demás capas de API-IDEE.

## Inicialización y eventos

```js
try {
  // No requiere añadir el paquete al mapa y devuelve siempre la misma promesa.
  await gpkg.whenReady();
  const roads = gpkg.getLayer('roads');

  gpkg.once(IDEE.evt.LOAD_LAYERS, (layersByTable) => {
    console.log(layersByTable.roads === roads);
  });
  map.addGeoPackage(gpkg);
} catch (error) {
  // Tratamiento propio del consumidor para la lectura/construcción.
  console.error(error);
}
```

`whenReady()` resuelve con el paquete cuando existen sus proveedores y capas
hijas, no cuando se han pintado las entidades o imágenes. La colección se publica
una vez construidas todas las capas. Un paquete válido sin tablas también resuelve.

`addTo(map, addLayer = true)` devuelve una promesa que permite esperar la adición
y observar sus errores. Mantiene `ADDED_TO_MAP` y emite `LOAD_LAYERS` con la
colección indexada por tabla después de la adición, no durante `whenReady()`.
Los consumidores mediante `map.addGeoPackage()` conservan su API síncrona;
los fallos asíncronos de carga se muestran mediante el diálogo existente.

Los grupos usan `addTo(map, false)` y consumen su promesa para añadir las capas
hijas o informar del error, sin esperar indefinidamente un evento de éxito.

## Verificación

Las pruebas `PLAY-14-GeoPackage*.spec.js` generan paquetes pequeños en memoria
con la dependencia existente `sql.js`, sin descargar ficheros de muestra externos.

Para probar el código actual sin modificar `dist`:

```sh
cd api-idee-js
./node_modules/.bin/webpack --config webpack-config/webpack.production-ol-core.config.js --output-path /tmp/apiidee-geopackage-build
API_IDEE_TEST_BUILD=/tmp/apiidee-geopackage-build ./node_modules/.bin/playwright test --config playwright-config/playwright-ol.config.js 'PLAY-14-GeoPackage' --project='Google Chrome'
```

Sin `API_IDEE_TEST_BUILD`, las pruebas utilizan el bundle de `dist`, como el resto
de las pruebas Playwright. Es necesario que esté actualizado.

## Fuera de este cambio

No se añaden carga vectorial teselada, límites configurables, `toJson()`, integración
en la fábrica genérica/REST, cambios en plugins ni soporte 3D. Tampoco se rediseña
la cancelación, eliminación durante la carga, readición o cierre del paquete.
