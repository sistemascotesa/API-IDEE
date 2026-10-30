# Capas para probar ShareMap

Los 26 tipos de `layer/Type.js` se recogen aquí. `Layer`, `Section` y `Type` son bases o utilidades, no capas adicionales que se puedan cargar por URL. GML, SHP/ZIP, DXF y DGN son formatos de importación: su resultado se comparte por el flujo de Vector.

## Preparación

Republicar el WAR actualizado y abrir `http://localhost:8080/api-idee/sharemap.jsp?language=es`. Los recursos de prueba se empaquetan bajo `test-data/sharemap/`; son pequeños, sintéticos o reutilizados de las fixtures del repositorio, y no contienen los archivos del usuario.

Para añadir tipos que no tienen detección directa por URL en el diálogo de LayerSwitcher, ejecutar en DevTools:

```js
await new Promise((resolve, reject) => {
  const script = document.createElement('script');
  script.src = '/api-idee/test-data/sharemap/examples.js';
  script.onload = resolve;
  script.onerror = reject;
  document.head.appendChild(script);
});

sharemapSamples.types; // los 26 tipos
const capa = await sharemapSamples.add('GPX', map);
await capa.calculateMaxExtent().then(extent => map.setBbox(extent));
console.log(capa.getRestLayer());
```

Cambiar `GPX` por el tipo de la tabla. Añadir una capa cada vez: varias capas ráster opacas pueden taparse entre sí. Para las teselas sintéticas, usar `map.setCenter([0, 0]); map.setZoom(0)`. Para GeoTIFF, MBTiles o GeoPackage, esperar a que termine la carga antes de compartir. Los nombres que se ofrecen en `filterLayers` son los nombres reales de las capas y de las tablas incorporadas, no necesariamente el nombre del archivo.

## Catálogo

La base de las URL locales es `http://localhost:8080/api-idee/test-data/sharemap/`. El script anterior contiene constructores completos y resuelve esa base desde su propia URL.

| Tipo | Recurso o prueba | Motor del ejemplo |
| --- | --- | --- |
| WMS | `https://www.ign.es/wms-inspire/unidades-administrativas?`, capa `AU.AdministrativeBoundary` | OL/Cesium |
| WMTS | `https://www.ign.es/wmts/ign-base?`, capa `IGNBaseTodo`, matriz `GoogleMapsCompatible` | OL/Cesium |
| WFS | `https://demo.mapserver.org/cgi-bin/wfs?service=WFS&count=10`, capa `ms:cities`, formato `geojson` | OL/Cesium |
| OGCAPIFeatures | `https://demo.pygeoapi.io/master/collections/`, colección `lakes` | OL/Cesium |
| DataIDEE | La misma colección OGC de prueba; no requiere un backend privado Data-IDEE | OL/Cesium |
| OSM | Constructor OSM, `isBase:false` para probar compartirla como capa de información | OL/Cesium |
| XYZ | `tile.png`, tesela sintética constante | OL/Cesium |
| TMS | `tile.png`, tesela sintética constante; para cartografía real: `https://tms-ign-base.idee.es/1.0.0/IGNBaseTodo/{z}/{x}/{-y}.jpeg` | OL/Cesium |
| GeoJSON | `puntos.geojson` | OL/Cesium |
| KML | `puntos.kml` | OL/Cesium |
| KMZ | `puntos.kmz` | OL/Cesium |
| GPX | `ruta.gpx`; público: `https://openlayers.org/en/latest/examples/data/gpx/fells_loop.gpx` | OL/Cesium |
| Vector | Entidad local que crea el script; probar también importar el GPX descargado | OL/Cesium |
| GeoTIFF | `raster.tif`, proyección EPSG:3857 | OL |
| MVT | `point.pbf`, una tesela vectorial sintética | OL |
| MBTiles | `raster.mbtiles` | OL/Cesium |
| MBTilesVector | `vector.mbtiles` | OL |
| MapLibre | `style.json`, con su GeoJSON en el mismo WAR | OL |
| GeoPackage | `mixto.gpkg`, con una tabla vectorial y otra ráster | OL |
| GeoPackageTile | El script carga `raster.gpkg` y devuelve la tabla de teselas ya añadida | OL |
| WMC | `contexto.wmc`, contexto de mapa que referencia el WMS público del IGN | OL |
| LayerGroup | Grupo con GeoJSON y GPX que crea el script | OL/Cesium |
| GenericVector | Envuelve `ol.layer.Vector` o `Cesium.CustomDataSource`; se comparte como GeoJSON | OL/Cesium |
| GenericRaster | Envuelve `ol.layer.Tile` o `Cesium.ImageryLayer`; este ejemplo se reconstruye como XYZ | OL/Cesium |
| Terrain | `terrain/`, terreno heightmap plano de altura 0 | Cesium |
| Tiles3D | `tiles3d/tileset.json`, un triángulo sintético sobre Madrid | Cesium |

Las URL locales solo son accesibles desde tu máquina. Para compartir con otra persona, desplegar esos archivos en una dirección que también pueda abrir. Las teselas sintéticas prueban el formato y la serialización; no son un servicio cartográfico multirresolución de producción.

Los servicios públicos pueden cambiar o no estar disponibles. Se han comprobado los documentos GetCapabilities de IGN y MapServer y la respuesta de la colección `lakes`; eso no equivale a haber probado todo su contenido o todas sus peticiones de mapa. Referencias: [catálogo oficial IGN](https://www.ign.es/web/es/ign/portal/ide-area-nodo-ide-ign), [MapServer WFS](https://demo.mapserver.org/cgi-bin/wfs?SERVICE=WFS&REQUEST=GetCapabilities), [colecciones pygeoapi](https://demo.pygeoapi.io/master/collections?f=html), [ejemplo GPX de OpenLayers](https://openlayers.org/en/latest/examples/gpx.html).

## Pruebas en Cesium

`sharemap.jsp` carga OpenLayers. Añadirle `implementation=cesium` no cambia sus scripts. Para los ejemplos Cesium usar la API REST con `implementation=cesium`; por ejemplo:

```text
http://localhost:8080/api-idee/?implementation=cesium&layers=Terrain*name=terrain-prueba;url=http://localhost:8080/api-idee/test-data/sharemap/terrain/
http://localhost:8080/api-idee/?implementation=cesium&layers=Tiles3D*name=tiles3d-prueba;url=http://localhost:8080/api-idee/test-data/sharemap/tiles3d/tileset.json
```

La matriz indica el motor donde está disponible este ejemplo. Las implementaciones Cesium vacías no pasan a estar soportadas por tener `getRestLayer()`. GeoPackage con tablas ráster se prueba en OL; no se presenta como un paquete multitabla compatible con ambos motores.

Para probar también el botón de ShareMap con una capa visible en Cesium:

```text
http://localhost:8080/api-idee/?implementation=cesium&plugins=sharemap&sharemap=right*1**http://localhost:8080/api-idee/*true*false***true&center=-71.11,42.46&zoom=11&layers=GPX*name=gpx-prueba;url=https://openlayers.org/en/latest/examples/data/gpx/fells_loop.gpx
```

Los parámetros posicionales de ShareMap configuran `baseUrl` local, `urlAPI=true`, `minimize=false` y `shareLayer=true`. Pulsar el icono Compartir arriba a la derecha; el enlace generado añade `implementation=cesium`. Se ha comprobado su reapertura con HTTP 200, escena Cesium y las 87 entidades del GPX, conservando el centro sobre Boston.

El plugin LayerSwitcher de esta rama carece de implementación Cesium. Por ello este enlace no lo añade: las capas Cesium se suministran por REST o constructor. Esto no impide que el núcleo Cesium cargue MBTiles ráster, GPX, GeoJSON, WMS y los demás tipos indicados en la matriz. MBTilesVector permanece disponible en OL; Terrain y Tiles3D se prueban en Cesium.

## Comprobación de cada capa

1. Cargar el recurso y comprobar que aparece en el mapa y en `filterLayers`. Para vectores, revisar también `capa.getFeatures().length`.
2. Modificar visibilidad, opacidad o estilo; compartir con `shareLayer=true` o filtrar por su nombre.
3. Abrir el enlace y el iframe. Revisar tipo, entidades, atributos y estado restaurado; contar las capas para detectar duplicados.
4. Repetir como archivo local cuando tenga sentido (GPX, KML/KMZ, GeoJSON, GeoTIFF, MBTiles o GeoPackage).
5. Vectores locales: se incluyen en el enlace, comprimidos sin pérdida cuando reduce su tamaño. Binarios locales sin URL: se avisa de que no se pueden compartir; no existe un almacén de archivos nuevo.

Los valores nombrados siguen admitiendo `base64~`; para valores grandes, la API actualizada admite también `deflate~` (DEFLATE/zlib en Base64 seguro para URL). El destino necesita el núcleo actualizado para leerlos. ShareMap valida la URL final con un presupuesto de 7.000 bytes, dejando margen para las cabeceras del navegador. Si aún excede ese tamaño, avisa y desactiva copiar/compartir: no elimina capas silenciosamente. Para mapas muy grandes se necesita una referencia remota o almacenamiento de mapas; no se ha añadido esa infraestructura.

Para REST, configurar `baseUrl=http://localhost:8080/api-idee/` y `urlAPI=true`. Si el catálogo completo de plugins hace crecer mucho el enlace, probar `minimize=true`; mantiene el comportamiento existente de generar una configuración de controles/plugins reducida.

## Ejemplos públicos, sin importar archivos desde el equipo

Las muestras del WAR ya se cargan por HTTP, aunque su servidor sea localhost. También se han añadido referencias a servidores públicos. Tras cargar `examples.js` con el código del apartado Preparación, utilizar:

```js
sharemapSamples.publicURLs; // direcciones disponibles
const capa = await sharemapSamples.addPublic('GPX', map);
await capa.calculateMaxExtent().then(extent => map.setBbox(extent));
```

Cambiar `GPX` por otro tipo de esta tabla. Este helper utiliza los constructores existentes y añade una sola capa; no modifica el encuadre automáticamente. LayerSwitcher mantiene su detección existente de WMS/WMTS/WFS y formatos reconocidos. La ampliación para MBTiles y la normalización de endpoints OGC se han apartado de esta entrega. Para MBTiles, Tiles3D y los casos que no detecte el diálogo, utilizar REST o constructor; para MVT es preferible consultar su TileJSON. La presencia de un constructor no implica detección automática de cualquier archivo en el diálogo.

| Tipo | URL pública | Observación |
| --- | --- | --- |
| WMS | [Unidades administrativas IGN](https://www.ign.es/wms-inspire/unidades-administrativas?) | Seleccionar `AU.AdministrativeBoundary` |
| WMTS | [IGN Base](https://www.ign.es/wmts/ign-base?) | `IGNBaseTodo`, matriz `GoogleMapsCompatible` |
| WFS | [MapServer con límite](https://demo.mapserver.org/cgi-bin/wfs?service=WFS&count=10) | Seleccionar `ms:cities`; no cargar continentes completos para una prueba rápida. El servidor admite `geojson`, no `application/json` |
| OGCAPIFeatures / DataIDEE | [Colecciones pygeoapi](https://demo.pygeoapi.io/master/collections/) | Usar `addPublic`, constructor o REST con colección `lakes`, límite 10. En el buscador existente usar la raíz `https://demo.pygeoapi.io/master/`; no se incluye la normalización de `/collections`. DataIDEE utiliza este endpoint OGC compatible como prueba |
| OSM / XYZ | `https://tile.openstreetmap.org/{z}/{x}/{y}.png` | Plantilla XYZ; con el diálogo se reconoce como OSM. Para probar XYZ expresamente, usar `addPublic('XYZ', map)` |
| TMS | `https://tms-ign-base.idee.es/1.0.0/IGNBaseTodo/{z}/{x}/{-y}.jpeg` | Centrar sobre España; no sustituir `{-y}` por `{y}` |
| GeoJSON | [Líneas de OpenLayers](https://openlayers.org/en/latest/examples/data/geojson/line-samples.geojson) | Centrar en la extensión de la capa |
| KML | [KML de OpenLayers](https://openlayers.org/en/latest/examples/data/kml/2012-02-10.kml) | Tiene numerosas entidades; centrar tras cargar |
| KMZ | [Islandia](https://openlayers.org/en/latest/examples/data/kmz/iceland.kmz) | Verificado: 83 entidades; encuadre sobre Islandia |
| GPX | [Fells Loop](https://openlayers.org/en/latest/examples/data/gpx/fells_loop.gpx) | Verificado: 87 entidades. Constructor/REST conservan la URL; el importador existente del diálogo convierte a Vector y comparte entidades incrustadas |
| GeoTIFF | [COG de MapLibre](https://maplibre.org/maplibre-gl-js/docs/assets/cog.tif) | Verificado EPSG:3857, área próxima a Viena; OL |
| MVT | [TileJSON MapLibre](https://demotiles.maplibre.org/tiles/tiles.json) | Plantilla `https://demotiles.maplibre.org/tiles/{z}/{x}/{y}.pbf`, subcapa `countries`, zoom 0–6; OL |
| MBTiles | [Fixture ráster Mapbox](https://raw.githubusercontent.com/mapbox/node-mbtiles/master/test/fixtures/plain_1.mbtiles) | Cargar mediante `addPublic`, constructor o REST. La detección en el diálogo queda para LayerSwitcher. Contiene una tesela global en zoom 0 y cobertura dispersa en otros niveles |
| MapLibre | [Estilo demo](https://demotiles.maplibre.org/style.json) | OL; el enlace actualizado conserva la URL sin duplicar el JSON descargado |
| GeoPackage / GeoPackageTile | [Ríos de NGA](https://ngageoint.github.io/GeoPackage/examples/rivers.gpkg) | Contiene `rivers` y `rivers_tiles`; OL. `addPublic('GeoPackageTile', map)` devuelve la tabla ráster |
| Tiles3D | [Nube de puntos Cesium](https://raw.githubusercontent.com/CesiumGS/cesium/main/Apps/SampleData/Cesium3DTiles/PointCloud/PointCloudBatched/tileset.json) | Solo Cesium; constructor, no el diálogo del JSP OL |

No se ha encontrado una muestra pública estable sin credenciales para todos los tipos restantes. MBTilesVector, WMC y Terrain mantienen sus URL HTTP del WAR. Vector y GenericVector/GenericRaster son capas creadas o envoltorios de objetos del motor; LayerGroup agrupa otras capas. No tienen necesariamente un archivo remoto propio.

Los servidores públicos pueden cambiar. Se han verificado respuesta HTTP y CORS de los recursos indicados cuando corresponde; se han cargado con las clases reales GPX, KMZ, GeoTIFF, MBTiles, GeoPackage, WFS y OGC. MVT y MapLibre requieren revisar las teselas/renderizado, no únicamente `getFeatures().length`, que puede ser 0 aunque se dibujen.

Referencias de procedencia: [OpenLayers KML](https://openlayers.org/en/latest/examples/kml.html), [OpenLayers KMZ](https://openlayers.org/en/latest/examples/drag-and-drop-custom-kmz.html), [MapLibre COG](https://maplibre.org/maplibre-gl-js/docs/examples/add-cog/), [MapLibre fuentes](https://maplibre.org/maplibre-style-spec/sources/), [GeoPackage Viewer NGA](https://ngageoint.github.io/geopackage-viewer-js/), [Cesium nube de puntos](https://github.com/CesiumGS/cesium/blob/main/Apps/SampleData/Cesium3DTiles/PointCloud/PointCloudBatched/tileset.json).

## Encuadre TMS y GeoTIFF

El enlace TMS reportado con `center=58703.63772301537,0&zoom=4` sitúa la vista cerca de 0,53° E y 0° de latitud, en el ecuador. España queda fuera del encuadre. No es una pérdida de la URL TMS al compartir: el enlace conserva la plantilla, visibilidad, opacidad y orden. En el JSP OL:

```js
map.setCenter([-412000, 4920000]);
map.setZoom(6);
```

Volver a compartir después de centrar. Para confirmar qué capa se ve, alternar su visibilidad en LayerSwitcher y revisar las peticiones a `tms-ign-base.idee.es` en Network. La capa base del JSP puede tener un aspecto muy parecido al TMS del IGN.

Para el GeoTIFF público, esperar los metadatos y usar su extensión real (en este recurso, EPSG:3857):

```js
const capa = await sharemapSamples.addPublic('GeoTIFF', map);
const vista = await capa.getImpl().getLayer().getSource().getView();
map.setBbox(vista.extent);
```

## MBTiles por URL y pruebas de archivos locales

Las ampliaciones del buscador y del selector de archivos para MBTiles se han apartado de la entrega de ShareMap. El núcleo sigue disponiendo de `IDEE.layer.MBTiles` y `IDEE.layer.MBTilesVector`: pueden cargarse mediante constructor o REST y compartirse por su URL accesible. Un archivo local sin URL no se inserta en el enlace: ShareMap avisa de esta limitación.

Para `plain_1.mbtiles`, ejecutar `await sharemapSamples.addPublic('MBTiles', map)` o utilizar el constructor con su URL. Después de cargar, usar `map.setCenter([0, 0]); map.setZoom(0)` para comprobar su tesela global; la fixture no es un mapa con cobertura completa en cada zoom. La comprobación anterior mediante el buscador correspondía a la ampliación ahora apartada.

Las pruebas remotas y locales son diferentes y deben ejecutarse por separado:

| Origen/formato | Carga y comportamiento al compartir |
| --- | --- |
| GPX, GeoJSON, KML/KMZ creados con URL por constructor/REST | El enlace conserva una referencia HTTP accesible; probar también estilos y recursos asociados |
| GPX cargado por el diálogo existente | Se importa como Vector; ShareMap incrusta sus entidades como GeoJSON, igual que un vector local |
| Vectores importados desde un archivo | El importador puede producir Vector/GeoJSON. El enlace incrusta datos comprimidos; puede alcanzar el presupuesto de longitud |
| GeoTIFF, MBTiles, MBTilesVector o GeoPackage con teselas por URL | El enlace referencia el binario accesible |
| Esos binarios solo en el equipo/navegador | Se pueden cargar cuando el motor/importador lo soporta, pero ShareMap avisa de que necesita una URL para reconstruirlos en otra sesión |
| WMS, WMTS, WFS u OGC | Son servicios; descargar una respuesta y abrirla como archivo no equivale a conservar el mismo tipo de capa o sus consultas |

Que un recurso funcione por URL no demuestra que su importación local, estilos, atributos, coordenadas y reapertura compartida sean correctos. KML/KMZ con iconos o recursos relativos requieren comprobar también esos recursos. No se ha añadido un almacén de binarios locales.


Comprobación posterior del 14/10/2026: el KML de OpenLayers usa una raíz `<kml>` sin atributos. La corrección puntual de LayerSwitcher permite detectarlo y se han cargado sus 1.119 entidades. El GeoPackage público añade `rivers:rivers` (357 entidades) y `rivers:rivers_tiles`; si no se aprecia su contenido, usar zoom a la capa porque la carga mantiene el encuadre anterior. Las tres URL KML/GeoPackage/MBTiles responden HTTP 200 en la prueba desde el navegador. MBTiles sigue documentado para constructor/REST, pues su ampliación del buscador permanece aplazada.
