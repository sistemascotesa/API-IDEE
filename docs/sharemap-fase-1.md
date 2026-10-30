# ShareMap: fase 1

> Alcance vigente (14/10/2026): ver [inventario de entrega](sharemap-entrega-fase-1.md). Las ampliaciones de carga GPX/MBTiles y normalización OGC de LayerSwitcher descritas más abajo se han apartado; esas secciones conservan el registro histórico. LayerSwitcher mantiene las dos correcciones del namespace IDEE.loadFiles y, tras el diagnóstico posterior, una corrección puntual de reconocimiento KML.

## Alcance

Cada fachada de capa dispone de `getRestLayer()`. Devuelve una entrada de la sintaxis nombrada existente de API-REST (OpenAPI), por ejemplo `WMS*name=...;url=...;visibility=false`, sin incluir `layers=`. Los valores complejos se codifican con el prefijo `base64~` que ya entiende el parser. Se usa Base64 compatible con URL para que `&`, `=`, `;`, `,`, acentos y contenido GeoJSON no rompan la consulta.

La fachada describe la capa y su estado; `Map.getLayerByString()` sigue utilizando los constructores existentes; ShareMap delega la serialización en la capa. Se mantiene la sintaxis posicional y la ruta anterior del plugin para núcleos antiguos o capas externas sin el nuevo método.

La fase 2 sigue pendiente: seleccionar y restaurar la capa base activa mediante un parámetro GET general, incluidos BackgroundLayers y BackImgLayer. Esta fase conserva `isBase`, pero no cambia la selección global del fondo.

## Archivos, uno por uno

Las rutas de esta tabla son relativas a la raíz del repositorio.

| Archivo | Cambio y finalidad |
|---|---|
| `api-idee-js/src/facade/js/util/RestLayer.js` | Nuevo helper interno: codificación, estado común, opciones serializables, resolución de URL y asociación de tablas GeoPackage con su contenedor mediante WeakMap. No crea un registro alternativo de tipos. |
| `api-idee-js/src/facade/js/layer/Layer.js` | Contrato `getRestLayer()` y métodos comunes para completar el estado y validar URL; las fachadas concretas aportan sus parámetros. |
| `api-idee-js/src/facade/js/layer/WMS.js` | Servicio, versión, teselado, estilos, SLD, filtro CQL, consulta y capabilities. Lee los estilos según las capacidades de la implementación OL/Cesium. |
| `api-idee-js/src/facade/js/layer/WMTS.js` | Matriz, formato, consulta y capabilities, además del estado común. |
| `api-idee-js/src/facade/js/layer/WFS.js` | Namespace, versión, geometría, identificadores y CQL. |
| `api-idee-js/src/facade/js/layer/OGCAPIFeatures.js` | Colección y parámetros limit, bbox, id, offset, format y conditional. |
| `api-idee-js/src/facade/js/layer/DataIDEE.js` | Lo anterior más CQL y filtros CQL2 de vendorOpts, incluidos filtros JSON y filterLang. |
| `api-idee-js/src/facade/js/layer/OSM.js` | Serialización mediante su tipo público y estado común. |
| `api-idee-js/src/facade/js/layer/XYZ.js` | URL de teselas y tileGridMaxZoom. |
| `api-idee-js/src/facade/js/layer/TMS.js` | URL de teselas, tileGridMaxZoom y crossOrigin. |
| `api-idee-js/src/facade/js/layer/Vector.js` | Instantánea GeoJSON de las entidades cargadas, con coordenadas EPSG:4326 y estilo serializable. |
| `api-idee-js/src/facade/js/layer/GeoJSON.js` | Conserva la URL de una fuente remota; comparte entidades cargadas cuando la fuente es local. |
| `api-idee-js/src/facade/js/layer/GPX.js` | Comparte fuentes remotas por URL y archivos/XML locales como instantánea GeoJSON. |
| `api-idee-js/src/facade/js/layer/KML.js` | Conserva los parámetros de KML remoto; utiliza GeoJSON para fuentes locales cargadas. |
| `api-idee-js/src/facade/js/layer/KMZ.js` | Reutiliza la política KML, manteniendo KMZ para las fuentes remotas. |
| `api-idee-js/src/facade/js/layer/GeoTIFF.js` | Exige URL compartible y conserva proyección, normalize y opciones de bandas/representación. |
| `api-idee-js/src/facade/js/layer/MBTiles.js` | Comparte la base de teselas por URL; rechaza una fuente exclusiva del navegador. |
| `api-idee-js/src/facade/js/layer/MBTilesVector.js` | Comparte por URL y conserva el modo; no incrusta la base binaria en el enlace. |
| `api-idee-js/src/facade/js/layer/MVT.js` | Conserva URL, proyección, modo y estilo serializable. |
| `api-idee-js/src/facade/js/layer/MapLibre.js` | Conserva el estilo MapLibre y disableBackgroundColor. |
| `api-idee-js/src/facade/js/layer/LayerGroup.js` | Serialización recursiva de las capas hijas. Conserva también display=false al reconstruir. |
| `api-idee-js/src/facade/js/layer/WMC.js` | Referencia al contexto remoto y estado selected. |
| `api-idee-js/src/facade/js/layer/GeoPackage.js` | Conserva origen remoto, selección de tablas y configuración actual por tabla; acepta tableNames en la reconstrucción. Un paquete local exclusivamente vectorial se representa mediante sus vectores; las teselas locales requieren URL. |
| `api-idee-js/src/facade/js/layer/GeoPackageTile.js` | Reconstruye la tabla desde la URL del paquete de origen, conservando su selección. |
| `api-idee-js/src/facade/js/layer/GenericRaster.js` | Pide al motor una descripción de la fuente nativa y la serializa como una fachada estándar. |
| `api-idee-js/src/facade/js/layer/GenericVector.js` | Comparte las entidades actuales mediante GeoJSON. |
| `api-idee-js/src/facade/js/layer/Tiles3D.js` | Método público de serialización de la fuente 3D y sus opciones. |
| `api-idee-js/src/facade/js/layer/Terrain.js` | Método público de serialización del proveedor de terreno. |
| `api-idee-js/src/impl/ol/js/layer/GenericRaster.js` | Adaptadores de fuentes TileWMS/ImageWMS, WMTS y XYZ a los tipos públicos. |
| `api-idee-js/src/impl/cesium/js/layer/GenericRaster.js` | Adaptadores de proveedores WMS, WMTS y UrlTemplate. |
| `api-idee-js/src/impl/cesium/js/layer/Tiles3D.js` | Permite obtener el estilo configurado antes de cargar el tileset; evita un acceso a null durante la serialización. |
| `api-idee-js/src/facade/js/util/Utils.js` | Admite Base64 compatible con URL y separa clave/valor por el primer signo igual, conservando los restantes. |
| `api-idee-js/src/facade/js/parameter/parameter.js` | Conserva el estado REST y las opciones que faltan en el resultado del parser, respetando los valores ya normalizados. Mantiene los parsers posicionales. |
| `api-idee-js/src/facade/js/Map.js` | Normaliza también las cadenas anidadas, entrega opciones al constructor correspondiente y restaura CQL2/estado. No añade capas de configuración global a las instancias del mapa; el visualizador las incorpora explícitamente. |
| `api-idee-js/src/configuration.js` | Compara las claves GET exactas y lee layers preservando el Base64 y las URLs internas de enlaces posicionales antiguos. Decodifica el contenedor cuando la sintaxis REST viene codificada. |
| `api-idee-rest/src/main/java/es/api_idee/api/BuilderWS.java` | Usa ParametersParser.parseLayers para conservar los grupos posicionales al preparar las capas para JavaScript. |
| `api-idee-js/src/plugins/sharemap/src/facade/js/sharemapcontrol.js` | Delega en getRestLayer, mantiene fallback anterior, avisa por capa no compartible, evita duplicación al recompartir visualizadores e incluye implementation=cesium en enlaces REST/iframe Cesium. Se conserva el cambio GPX que ya existía localmente. |
| `api-idee-js/src/plugins/sharemap/src/facade/js/i18n/es.json` | Avisos en castellano para binario local y fuente no reconstruible. |
| `api-idee-js/src/plugins/sharemap/src/facade/js/i18n/en.json` | Los mismos avisos en inglés. |
| `api-idee-js/src/plugins/sharemap/src/facade/js/i18n/ca.json` | Los mismos avisos en catalán. |
| `api-idee-js/src/plugins/sharemap/test/playwright/ol/sharemap-ol.html` | Prueba existente del plugin conectada al núcleo local en lugar del servidor beta. |
| `api-idee-js/playwright-config/playwright-sharemap.config.js` | Suite focalizada Chromium para OL, Cesium y la prueba existente del plugin. |
| `api-idee-js/test/playwright/ol/PLAY-rest-layers.spec.js` | Reconstrucción, caracteres especiales, filtros, vectores/GPX locales, GeoPackage remoto/local, grupos, genéricos, enlaces/iframe y visualizadores. |
| `api-idee-js/test/playwright/cesium/PLAY-rest-layers.spec.js` | Reconstrucción 3D, estilos Tiles3D, genérico WMTS y matriz de formatos remotos soportados. |
| `docs/sharemap-fase-1.md` | Esta explicación y procedimiento de prueba. |

## Qué se conserva y límites

- Se conservan las opciones públicas de carga serializables y el estado común aplicable: nombre/leyenda, visibilidad, opacidad, isBase, orden, estilo, consulta, atribución y refresco.
- Los vectores locales se comparten una vez cargados. El enlace contiene datos; al abrirlo no necesita el archivo original. Los vectores remotos se vuelven a consultar desde su URL.
- GeoTIFF, MBTiles y las teselas de GeoPackage necesitan URL HTTP(S) accesible desde el equipo receptor. Una URL blob: no es una URL pública. El plugin muestra un aviso y excluye la entrada afectada; no sube archivos a ningún almacenamiento.
- Las capas genéricas se convierten a formatos públicos equivalentes cuando su fuente lo permite. No se pueden reconstruir funciones JavaScript, proveedores arbitrarios, estilos nativos no serializables o una fuente sin datos/URL. El soporte de GenericRaster cubre los proveedores estándar indicados; los restantes generan aviso.
- La disponibilidad de cada tipo depende del motor: esta fase no implementa las clases vacías de Cesium, como GeoTIFF, MVT, MapLibre, WMC, LayerGroup o GeoPackageTile. Un enlace debe abrirse con un motor que admita sus capas.
- Incrustar muchos vectores puede producir enlaces largos y superar límites del navegador o servidor. No se incorpora un servicio de almacenamiento en esta fase.
- No cambian plantillas, CSS, posición ni limpieza de controles. Los avisos utilizan el sistema toast e i18n existente. La relación GeoPackage-tabla usa WeakMap y la deduplicación de avisos usa WeakSet para no retener capas retiradas.

## Prueba automática

Desde WSL y con Node disponible, en `/home/pablolr/API-IDEE/api-idee-js`:

```sh
npm run prebuild
npm run build:core
cd src/plugins/sharemap
npm run check
npm run build
cd ../../..
npx playwright test --config=playwright-config/playwright-sharemap.config.js
```

La suite usa el puerto 8081. Requiere el Chromium de Playwright instalado. No necesita Tomcat ni servicios cartográficos externos para sus aserciones; utiliza recursos pequeños interceptados y no publica enlaces en redes sociales.

## Prueba manual

1. Desde `api-idee-js`, ejecutar `npm run start:test -- --entry ./test/configuration_filtered.js`. Abrir `http://localhost:8081/src/plugins/sharemap/test/playwright/ol/sharemap-ol.html`.
2. En la consola del navegador crear el mapa y activar compartir capas:

```js
window.mapjs = IDEE.map({ container: 'mapjs', layers: [], controls: [] });
window.share = new IDEE.plugin.ShareMap({
  urlAPI: false,
  shareLayer: true,
});
mapjs.addPlugin(share);
const vector = new IDEE.layer.Vector({ name: 'Local; España' });
mapjs.addLayers(vector);
vector.addFeatures(new IDEE.Feature('p1', {
  type: 'Feature',
  geometry: { type: 'Point', coordinates: [-3, 40] },
  properties: { nombre: 'Punto de prueba' },
}));
```

3. Cambiar visibilidad/estilo/opacidad y abrir ShareMap. Comprobar que aparece una entrada `GeoJSON*name=...` y que tanto URL como HTML contienen la misma capa. Para probar solo la reconstrucción, obtener `const rest = vector.getRestLayer()`, retirar el original con `mapjs.removeLayers(vector)` y ejecutar `mapjs.addLayers(rest)`; deben mantenerse la entidad y sus atributos.
4. Cargar un GPX local real mediante el flujo habitual, esperar a que se dibuje y repetir. El resultado se comparte como GeoJSON.
5. Con un GeoPackage remoto de varias tablas, compartir una sola tabla; debe reconstruirse esa tabla con su visibilidad/opacidad. Un paquete local vectorial debe compartir sus vectores; uno con teselas locales debe avisar de que necesita URL.
6. Probar una capa WMS con filtro y una WMTS/XYZ/TMS; verificar sus parámetros tras reconstruir. Probar un grupo con otro grupo dentro.
7. Para una prueba de apertura completa en visualizador, el HTML de destino debe crear su mapa como hace la aplicación real: la fixture de Playwright solo carga scripts y requiere ejecutar el código del paso 2. Usar el visualizador propio o Tomcat ya actualizado para comprobar una nueva pestaña y el iframe.
8. Para REST, tras generar y desplegar el WAR actualizado, usar ShareMap con `{ baseUrl: 'http://localhost:8080/api-idee/', urlAPI: true, shareLayer: true }`. Abrir el enlace en una nueva pestaña y comprobar las capas. Repetir en Cesium para los tipos disponibles en ese motor.

El empaquetado completo habitual es `mvn clean package -DskipTests -P local` desde `api-idee-parent`. La compilación Java aislada y Playwright no sustituyen esta comprobación de WAR y Tomcat.

## Validación de esta intervención

- Suite focalizada: 18 pruebas aprobadas en Chromium (14 OL, 3 Cesium y la prueba existente de ShareMap). Incluye matrices de 18 tipos remotos OL y 15 Cesium; estas matrices comprueban construcción y reconstrucción, no la disponibilidad de cada servicio externo.
- Lint de los archivos JavaScript modificados y `npm run check` de ShareMap: correctos.
- `npm run prebuild` ejecutado. El generador emitió diagnósticos JSDoc de tipos de OpenLayers y advertencias de documentación; aun así generó los entrypoints y la compilación posterior de ambos motores terminó correctamente.
- Núcleo OL/Cesium y ShareMap OL/Cesium: compilación minificada correcta. Persisten advertencias de tamaño y dependencias/exportaciones ajenas a esta modificación (GeomUtils/cspline en OL y better-sqlite3 en Cesium).
- BuilderWS: compilación con javac y comprobación de separación de grupos posicionales junto con entradas nombradas, utilizando las dependencias del WAR ya existente: correctas.
- `mvn -o test -P local` desde el módulo REST: bloqueado por artefactos internos no instalados en el repositorio Maven local. No se ha generado un nuevo WAR ni actualizado Tomcat. Queda pendiente validar el empaquetado completo y abrir los enlaces en ese despliegue.
- No se ha ejecutado toda la batería del repositorio ni pruebas en Firefox/WebKit. La validación está centrada en los flujos afectados.
- No se han realizado commits ni operaciones contra remotos; los artefactos se han generado mediante sus scripts, sin edición manual de dist/target.


## Prueba manual preparada y diagnóstico del visor antiguo

Abrir `http://localhost:8081/src/plugins/sharemap/test/rest-layer.html` con el servidor `npm run start:test -- --entry ./test/configuration_filtered.js` activo desde `api-idee-js`. Esta página carga el núcleo y ShareMap desde sus `dist` locales, crea OSM y un vector local y expone `mapjs`, `mp` y `ctrl` en consola. No modifica el WAR desplegado.

- Por defecto: `urlAPI=false`, `shareLayer=true`. El enlace vuelve a esta misma página, que reconstruye las capas del parámetro `layers`; permite comprobar la nueva serialización y la apertura del enlace sin actualizar Tomcat.
- `shareLayer=false` y filtro vacío: no se seleccionan capas y no se llama a `layerToParam`. Es el comportamiento existente, no un fallo de la refactorización.
- `shareLayer=false` y filtro `puntos-locales`: solo se serializa el vector.
- `urlAPI=true`: se genera un enlace REST al 8080. Su apertura completa requiere generar y desplegar el WAR nuevo; el WAR antiguo no demuestra la compatibilidad de extremo a extremo.

En DevTools, Sources, abrir `sharemapcontrol.js` del bundle servido desde el 8081 y poner el breakpoint en `return layer.getRestLayer()` de `layerToParam`. Buscar también `Vector.js`, su `getRestLayer` y `RestLayer.js`. El recorrido es `buildURL/buildHtml` → selección de capas → `layerToParam` → `getRestLayer`. URL y HTML serializan las capas por separado.

El `sharemap.jsp` del 8080 utiliza los JS empaquetados en el WAR, no los archivos editados del repositorio. Además, su formulario inicia `urlAPI=false`, `shareLayer=false` y filtro vacío. Para activar el recorrido de capas en esa página, seleccionar `shareLayer=true` o escribir un nombre real en `filterLayers`. Eso activa el serializador de la versión desplegada, que continúa siendo la anterior hasta actualizar el WAR.

Si cambian las fuentes, recompilar núcleo OL con `npm run build:ol-core` desde `api-idee-js` y ShareMap con `npm run build` desde `api-idee-js/src/plugins/sharemap`, y recargar con la caché desactivada. `start:test` sirve archivos estáticos y no recompila esos bundles. No ejecutar `prebuild` aisladamente: limpia el `dist` del núcleo y debe ir seguido de la compilación.

Comprobación manual automatizada en Chromium de esta página: botón real con serialización nombrada, mismas capas en URL e iframe y reconstrucción del vector al reabrir el enlace; filtro vacío sin llamadas; filtro por nombre con dos llamadas; URL REST con OSM y vector (cuatro llamadas). No se ha validado la apertura de ese enlace REST en un WAR nuevo.


## Corrección de duplicados y sugerencias del filtro en los visores de prueba

`api-idee-rest/src/main/webapp/sharemap.jsp` añade sus WMS de ejemplo únicamente cuando la URL no contiene `layers`. Con enlaces compartidos, el JSP añade MAP_VIEWER_LAYERS explícitamente a su mapa principal mediante addLayers; no vuelve a añadir sus ejemplos ni modifica el estado restaurado. Los mapas auxiliares no reciben esas capas automáticamente. Un enlace filtrado tampoco incorpora WMS que no se compartieron.

El `datalist` de `filterLayers` se genera con los nombres actuales de las capas de usuario. Se actualiza mediante `IDEE.evt.ADDED_LAYER`, `IDEE.evt.REMOVED_LAYER` y al enfocar el campo. Excluye capas base e internas, elimina nombres repetidos y ofrece también la combinación de todos los nombres disponibles. No altera lo que se ha escrito en el filtro ni cambia los parámetros del plugin al actualizar las sugerencias.

El ejemplo de desarrollo (`test/dev.html` y `test/test.js` de ShareMap) aplica el mismo comportamiento a su capa de ejemplo y a sus sugerencias.

Validación de esta corrección:

- Tres pruebas de regresión en Chromium usando el formulario y script reales del JSP con los bundles locales: altas/bajas de sugerencias conservando el filtro, WMS y GeoJSON compartidos sin duplicados preservando visibilidad/opacidad y carga de entidades, y enlace filtrado sin ejemplos adicionales.
- Comprobación en Chromium del ejemplo de desarrollo: sugerencias tras añadir/quitar capas y apertura con `layers` sin volver a añadir su polígono de ejemplo.
- `npm run check` de ShareMap, lint específico de `test/test.js` y `git diff --check`: correctos.
- Reactor Maven empaquetado con `mvn -o package -DskipTests -P local -Dskip.npm=true -Dskip.installnodenpm=true`: BUILD SUCCESS. Se han reutilizado los bundles existentes; no se ha recompilado JavaScript. Comprobados los cambios del JSP y los bundles de la refactorización dentro de `api-idee-rest/target/api-idee.war`.
- El WAR generado queda listo para republicarse en Tomcat. No se ha desplegado en esta intervención ni se han realizado operaciones de Git.

Para comprobarlo después de republicar: abrir `sharemap.jsp` sin parámetros y comprobar las dos WMS iniciales; añadir una capa y verificar su nombre en las sugerencias; compartir con `shareLayer=true` y abrir el enlace, comprobando una sola instancia de cada capa; filtrar solo la añadida y comprobar que el destino no vuelve a añadir las WMS de ejemplo.

Las incidencias de longitud de URL y codificación del catálogo de LayerSwitcher quedan fuera de estas dos correcciones.

## Corrección posterior: GPX remoto y tamaño del enlace

Las incidencias anteriores de longitud y codificación se abordan en esta intervención:

- `layerswitchercontrol.js`: el cargador de archivos pertenece a `IDEE.loadFiles`, no a `IDEE.utils`. Se corrigen las llamadas de texto y SHP/ZIP. Para GPX remoto se utiliza el constructor existente `IDEE.layer.GPX`: conserva la URL y evita convertir un recurso remoto en todos sus vectores incrustados. Se reconocen extensiones en mayúsculas y URL con query; se espera la lectura antes de centrar/cerrar el diálogo y se limpian la capa y el estado de carga si falla.
- `RestLayer.js`: los valores grandes se comprimen sin pérdida con pako, dependencia existente, únicamente cuando reduce el tamaño. Se mantiene `base64~` y se añade `deflate~` con Base64 seguro para URL. Las llaves de las plantillas de teselas se codifican como valores para evitar caracteres inválidos en la petición.
- `Utils.js`: se reconstruyen ambos formatos, preservando tipos, texto Unicode y las entidades originales. La aplicación receptora necesita el núcleo actualizado para interpretar `deflate~`.
- `sharemapcontrol.js`: se codifican los parámetros REST de los plugins, incluido el JSON del catálogo de LayerSwitcher, y se aplica la misma codificación a URL e iframe. Se valida un presupuesto de 7.000 bytes en la URL final; si se supera, se informa y se desactiva copiar/compartir. No se eliminan capas silenciosamente ni se envía esa URL a TinyURL. El límite deja margen respecto a las cabeceras HTTP normales; no garantiza la configuración de cualquier servidor.
- Traducciones `es/en/ca` de ShareMap y LayerSwitcher: avisos de tamaño excesivo y fallo al leer una URL de archivo.
- `tasks/build-plugins.js`: se espera la copia de los bundles y se admiten nombres de plugins para ensamblar solo los afectados. Se mantiene la compilación completa sin argumentos. Esto evita empaquetar las copias anteriores de los plugins desde el `dist` del núcleo.
- `PLAY-sharemap-gpx.spec.js`: carga mediante el botón real, errores y reintento, reconstrucción de vectores comprimidos, límite de longitud y codificación del catálogo. Se añade también una comprobación de valores largos en Cesium.
- `api-idee-rest/src/main/webapp/test-data/sharemap/` y `docs/sharemap-capas-prueba.md`: recursos pequeños y un catálogo manual para los 26 tipos, con instrucciones y limitaciones por motor. No se han incorporado los archivos del usuario.

Validación:

- Suite focalizada OL/Cesium/ShareMap: 27 pruebas aprobadas en Chromium. Incluye cinco nuevas regresiones de GPX/longitud/codificación y una de compresión en Cesium. No se ha ejecutado toda la batería del repositorio ni Firefox/WebKit.
- El enlace GPX local adjunto medía 31.818 bytes. Reconstruyendo su capa y volviendo a compartirla con el código actualizado, pasó a 6.791 bytes; Tomcat respondió HTTP 200 y se restauraron sus 87 entidades. Para verificar la decodificación se sustituyó en el navegador únicamente el bundle del núcleo por el local actualizado y se bloquearon destinos externos. Esta prueba no republicó Tomcat ni persistió sus geometrías en el repositorio.
- Se comprobó construcción, serialización y reconstrucción de 17 tipos del catálogo local en OL. Se comprobó lectura del contexto WMC y metadatos de Terrain/Tiles3D en Cesium. No equivale a una revisión visual completa de los 26 tipos ni a validar todos los servicios externos.
- `npm run check` de ambos plugins y lint específico del núcleo: correctos. El lint del script de ensamblado permite dependencias de desarrollo, porque utiliza `fs-extra` desde una herramienta de build.
- `npm run prebuild`, compilación del núcleo OL/Cesium y `npm run build:plugins -- sharemap layerswitcher`: correctos, con las advertencias existentes de documentación, dependencias y tamaño de bundles.
- Empaquetado final Maven con bundles ya compilados: BUILD SUCCESS. Se ha verificado que el WAR contiene exactamente el núcleo y ambos plugins OL/Cesium actualizados, además de todos los recursos del catálogo. No se ha republicado este WAR en Tomcat; la comprobación de HTTP 200 anterior utilizó el bundle actualizado interceptado en el navegador. No se han realizado commits ni operaciones contra remotos.

Para actualizar los plugins antes de un empaquetado que reutilice los bundles:

```bash
cd /home/pablolr/API-IDEE/api-idee-js
npm run build:plugins -- sharemap layerswitcher
cd ../api-idee-parent
mvn -o package -DskipTests -P local -Dskip.npm=true -Dskip.installnodenpm=true
```

Estos flags solo son adecuados cuando el núcleo y los plugins ya están compilados. El comando habitual completo sigue siendo `mvn clean package -DskipTests -P local`. Tras generar el WAR, republicarlo en Community Server Connector y recargar sin caché. Los recursos de prueba y los nuevos decodificadores no aparecen en el despliegue anterior por editar las fuentes.

No se ha añadido almacenamiento de mapas o archivos ni se han cambiado los límites de Tomcat. Para vectores que siguen excediendo el presupuesto después de comprimir, utilizar una URL accesible; el catálogo incluye también un GPX pequeño para probar la importación local. Los binarios locales continúan necesitando una URL remota.

## Corrección posterior: WFS compartida, endpoint OGC y ejemplos públicos (14/10/2026)

- `WFS.js`: `getRestLayer()` conserva `getFeatureOutputFormat`, `describeFeatureTypeOutputFormat` y los parámetros `vendor` de las peticiones. LayerSwitcher había seleccionado `geojson` según GetCapabilities, pero el enlace lo perdía y volvía a `application/json`. MapServer rechaza este último formato con HTTP 400 y una excepción XML, que el lector JSON no podía interpretar. La corrección utiliza las opciones existentes del constructor en OL/Cesium; no cambia el formato predeterminado de otras WFS.
- `layerswitchercontrol.js`: normaliza la raíz del servicio y su listado `/collections` antes de validar, generar el formulario o construir la URL de carga. El endpoint recibido ya no se convierte en `/collections/collections`. Los listados explícitos se consultan directamente como OGC; se gestionan listas vacías y colecciones mixtas, y se limpia el spinner si falla el formulario. El flujo anterior de filtros/selección se mantiene.
- `MapLibre.js`: el serializador conserva la URL del estilo remoto sin incrustar también su JSON descargado, que la implementación vuelve a cargar por URL. Los estilos locales sin URL siguen serializándose. Esta duplicación se detectó al comprobar el nuevo ejemplo público: su entrada pasó de aproximadamente 11.713 a 190 caracteres.
- `test-data/sharemap/examples.js`: añade `publicURLs` y `addPublic(tipo, mapa)`, además de las muestras del WAR. Incluye 19 tipos con referencias públicas; el WFS de ejemplo utiliza `ms:cities`, formato `geojson` y límite 10 para evitar una descarga de continentes de unos 100 MB. El GeoPackage público permite probar también su tabla `rivers_tiles`.
- `docs/sharemap-capas-prueba.md`: catálogo de URL públicas y método de carga por tipo. Explica el encuadre de la TMS y la extensión del GeoTIFF público; distingue constructores de formatos detectados en el diálogo.
- Pruebas `PLAY-sharemap-viewer.spec.js`, `PLAY-sharemap-ogc.spec.js` y `PLAY-rest-layers.spec.js` OL/Cesium: regresiones de formato WFS, parámetros adicionales, raíz/listado OGC con query, lista vacía, restauración de entidades y estilos MapLibre remotos/locales.

La TMS no necesitó un cambio de código: la plantilla oficial devuelve teselas JPEG HTTP 200 y se visualiza en el JSP. El enlace aportado tenía `center=58703.63772301537,0&zoom=4`, cerca del ecuador, con España fuera del encuadre. Se comprobó la visibilidad sobre España con `map.setCenter([-412000, 4920000]); map.setZoom(6)`. ShareMap conserva el encuadre original.

Validación de esta intervención:

- 34 pruebas focalizadas aprobadas en Chromium, con casos OL y Cesium; no se ha ejecutado toda la batería del repositorio ni Firefox/WebKit.
- `npm run check` de LayerSwitcher y lint específico de las fachadas y del catálogo: correctos. Compilados núcleo OL/Cesium y LayerSwitcher OL/Cesium mediante sus tareas oficiales, sin editar artefactos generados.
- Prueba con servicios reales en Tomcat: WFS MapServer, dos peticiones HTTP 200 con `outputFormat=geojson`, 10 entidades reconstruidas. OGC pygeoapi desde el botón del formulario, 10 entidades originales y 10 restauradas sin errores de peticiones. MapLibre remoto reconstruido desde la URL, con sus 8 capas de estilo y sin errores. Para estas comprobaciones se interceptaron en el navegador los bundles locales nuevos; no se republicó Tomcat.
- Verificados HTTP/CORS de las referencias públicas indicadas y carga de recursos reales GPX (87 entidades), KMZ (83), GeoTIFF (EPSG:3857), MBTiles (SQLite/tesela global), GeoPackage (tablas vectorial y ráster), WFS y OGC. No se presenta esto como una revisión visual completa de todos los tipos.
- Reactor Maven empaquetado con los bundles ya compilados: BUILD SUCCESS. La comprobación final compara el contenido del WAR con las fuentes de recursos y los bundles locales; el despliegue requiere republicar el WAR en Community Server Connector y recargar sin caché.
- No se han realizado commits, cambios de rama ni operaciones contra remotos de Git.

## Corrección posterior: MBTiles en el diálogo y pruebas Cesium (14/10/2026)

El ejemplo MBTiles anterior estaba documentado para cargar mediante constructor. Al pegarlo en el buscador, LayerSwitcher no reconocía el sufijo y seguía su detección OGC, generando una petición inválida a `plain_1.mbtiles/collections?f=json`. El archivo es válido y no requiere Cesium.

- `layerswitchercontrol.js`: reconoce `.mbtiles` antes de los probes OWS/OGC, incluyendo mayúsculas y query. Reutiliza `IDEE.Tile` para validar SQLite y leer el formato, y los constructores `MBTiles`/`MBTilesVector`. Descarga el remoto una vez para cargarlo, conserva su URL y centra tras la lectura; no publica el binario. El selector admite también archivos locales de hasta 20 MB. Se libera el proveedor temporal de metadatos y se restablecen los campos/spinner al fallar.
- Traducciones `es/en/ca`: error de paquete inválido y limitación de MBTilesVector en Cesium. El plugin LayerSwitcher actual carece de implementación Cesium; no se ha añadido en esta intervención.
- `PLAY-sharemap-mbtiles.spec.js`: cuatro regresiones de carga/reconstrucción ráster, detección PBF vectorial, importación local con necesidad de URL al compartir, y 404 con reintento sin capa vacía.
- `docs/sharemap-capas-prueba.md`: actualiza la carga directa en el diálogo y añade un enlace REST Cesium con ShareMap activado, más una tabla de diferencias entre URL y archivo local. `sharemap.jsp` sigue siendo el visor OL existente.

Validación:

- 38 pruebas focalizadas aprobadas en Chromium, con casos OL/Cesium. `npm run check` de LayerSwitcher correcto; compilados y ensamblados los bundles OL/Cesium mediante la tarea oficial. No se ha ejecutado toda la batería del repositorio ni Firefox/WebKit.
- URL exacta de Mapbox en el JSP real con el plugin nuevo interceptado en navegador: carga HTTP 200, entrada REST de 207 caracteres y una sola MBTiles reconstruida, sin errores JavaScript ni peticiones OGC para el archivo. El despliegue no se modificó durante esta comprobación.
- MBTiles ráster en el visor REST Cesium: escena inicializada y lectura de la tesela global, imagen 256 × 256, sin errores JavaScript.
- ShareMap real en Cesium con GPX remoto: botón abre el modal, URL conserva `implementation=cesium`, reapertura HTTP 200 y 87 entidades, con centro -71,11 / 42,46. Se capturó la instancia únicamente en la prueba; la URL publicada en la guía funciona mediante los parámetros REST existentes.
- Maven empaquetado con los bundles ya compilados: BUILD SUCCESS. El WAR se verifica contra los bundles y recursos locales antes de entregar. Requiere republicarlo en Community Server Connector y recargar sin caché; no se ha republicado Tomcat ni realizado ninguna operación de escritura en Git.

La prueba por URL no sustituye a la local: los vectores importados pueden cambiar de tipo e incrustarse en el enlace, mientras que los binarios locales necesitan una URL accesible para reconstruirse en otra sesión. No se ha añadido almacenamiento de archivos.

## Ajuste de alcance y eliminación del serializador antiguo (14/10/2026)

Por petición del usuario, se limita la entrega al flujo de ShareMap/getRestLayer. LayerSwitcher mantiene exclusivamente las dos llamadas corregidas a IDEE.loadFiles.loadFeaturesFromSource. Las ampliaciones propias de carga y sus traducciones/pruebas se han guardado fuera del repositorio para una futura revisión; no se han revertido cambios ajenos ni realizado operaciones de escritura en Git.

ShareMap elimina la cadena de condiciones por tipos de layerToParam, sus doce serializadores, normalizeString y getGeneric comentado. Los grupos delegan en la fachada LayerGroup; no se necesita parent. También desaparecen los dos bloques que volvían a concatenar MAP_VIEWER_LAYERS. Se mantienen selección de capas, filtro, controles/plugins, avisos, codificación, presupuesto de longitud y lectores de enlaces antiguos del núcleo.

Las pruebas GPX verifican ahora el importador existente que produce Vector y el constructor que conserva una URL GPX. Se añade una regresión de aviso para una capa externa sin getRestLayer. Los consumidores de otros plugins que distinguen Vector de GPX no reciben un nuevo tipo de capa desde el cargador.

Validación: lint de ambos plugins correcto; 31 casos distintos Playwright verificados en Chromium con cobertura OL/Cesium. La primera ejecución tuvo 30 aprobados y un fallo por consultar demasiado pronto las entidades de la copia GPX; ajustada la espera de la prueba, su archivo completo pasó 5/5. Compilados y ensamblados ambos plugins OL/Cesium, Maven BUILD SUCCESS con bundles ya compilados y WAR verificado byte a byte. Diff sin errores. No se han ejecutado la batería completa, Firefox/WebKit ni la prueba manual tras un nuevo deployment; este WAR no se ha republicado en Tomcat.

La selección individual de los 74 archivos actuales y sus dependencias está en [sharemap-entrega-fase-1.md](sharemap-entrega-fase-1.md): 41 de funcionamiento, 8 de corrección mínima/build/pruebas recomendados, 3 de documentación y 22 de ejemplos opcionales. La fase 2 de capa base activa sigue pendiente.


## Diagnóstico posterior de KML, GeoPackage y MBTiles

El KML público de OpenLayers empieza por `<kml>` sin atributos. La detección anterior de LayerSwitcher buscaba solamente `<kml ` y dejaba el diálogo cargando. Se cambia esa única condición por `/<kml(?:\s|>)/i`: reconoce tanto la raíz sin atributos como la raíz con atributos. Se añaden dos regresiones al archivo de carga de ShareMap para comprobar que los dos casos se cargan y se reconstruyen por URL. No se recuperan las ampliaciones GPX/MBTiles/OGC apartadas.

Las tres URL públicas responden HTTP 200. KML, con el bundle corregido interceptado en el JSP, carga 1.119 entidades; GeoPackage, en el JSP desplegado sin interceptar su núcleo/plugin, añade la tabla vectorial con 357 entidades y la tabla ráster y cierra el diálogo. MBTiles carga mediante constructor; el buscador sigue sin reconocer ese formato como estaba previsto al reducir el alcance. El importador GeoPackage no cambia automáticamente el encuadre: comprobar zoom a la capa.

Validación de este ajuste: lint de LayerSwitcher correcto, once pruebas cercanas de GPX/KML/ShareMap/JSP aprobadas en Chromium y compilación de LayerSwitcher OL/Cesium correcta. Maven BUILD SUCCESS con bundles preparados; no se ha republicado Tomcat. El análisis de fase 2 se guarda en sharemap-fase-2-analisis.md, sin implementar ningún parámetro ni método nuevo de esa fase. El inventario actual contiene 75 archivos, con cuatro documentos.
