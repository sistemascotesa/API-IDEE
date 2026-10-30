# Entrega de ShareMap fase 1 — alcance revisado (14/10/2026)

Este documento clasifica **todos los archivos locales modificados o nuevos**, expandiendo las carpetas sin seguimiento. No se ha hecho staging, commit, cambio de rama ni operación contra remotos. Los bundles de dist y el WAR de target se generan con las tareas del proyecto y no se editan ni se añaden a esta selección manualmente.

## Qué incluir ahora

Inventario actual: **75 archivos**. Las categorías A y B suman **41 archivos de funcionamiento**; A por sí sola contiene 40. Recomiendo incluir también C, D y E: **49 archivos**, sin los ejemplos manuales ni la documentación. La documentación G es recomendable para explicar y mantener la entrega. F no es necesaria para que funcione el plugin.

El núcleo y ShareMap se deben compilar y desplegar juntos. El plugin nuevo requiere el contrato getRestLayer; ya no genera cadenas por tipo si el núcleo es antiguo. El receptor debe tener los lectores actualizados, especialmente para deflate~. No basta con actualizar el plugin origen ni con abrir los enlaces nuevos en el servidor público que aún tenga otra versión.

A no es un mínimo para una sola WMS: es el conjunto necesario para conservar todo el alcance de tipos, datos locales, grupos, estado y ambos motores implementado en esta fase. Si se omite la fachada de un tipo, no se garantiza su configuración específica al compartirlo. No se han añadido dependencias ni cambiado versiones.

B es necesario en la galería que estás utilizando: si se omite, el plugin podrá serializar, pero el JSP volverá a añadir sus WMS de ejemplo y no ofrecerá todas las capas actuales en el filtro. Estas correcciones pertenecen al JSP, no a LayerSwitcher.

C puede entregarse como corrección independiente si se exige que esta subida solo contenga ShareMap/núcleo/REST. Sin C, ShareMap sigue funcionando con las capas que ya estén en el mapa y con REST/constructores, pero reaparece el error de función inexistente al importar ciertos archivos remotos por el diálogo (incluido GPX) y SHP/ZIP. También se conserva una corrección puntual del reconocimiento KML sin atributos. Son tres sustituciones pequeñas; el importador, sus argumentos, estilos y tipo Vector se mantienen.

D no es una dependencia en tiempo de ejecución. Conserva la copia asíncrona completa y permite el ensamblado focalizado. Si se omite, hay que verificar mediante la compilación completa que las copias dist/plugins realmente coinciden con los bundles recién compilados antes de generar el WAR; no debe seguirse la orden focalizada de esta guía con el script antiguo.

E no se necesita en el navegador, pero sí recomiendo que acompañe al código como protección de las regresiones corregidas. F son demos/fixtures y puede aplazarse íntegramente. Si se omite F, el catálogo de G debe leerse como recursos disponibles solo en el entorno local de pruebas, no como URL desplegadas.

## LayerSwitcher: cambios apartados

Se han retirado del archivo activo estas ampliaciones:

1. Detección prioritaria de GPX y MBTiles mediante la extensión del pathname, incluyendo mayúsculas y query.
2. Cargador nativo GPX, espera de extensión, centrado y limpieza al fallar. Cambiaba la clase obtenida de Vector a GPX y evitaba el importador de etiquetas/estilos existente.
3. Detección de MBTiles ráster/vectorial con IDEE.Tile, cargador remoto/local, gestión de errores, limpieza, centrado y aceptación del archivo en el selector.
4. Atajo para /collections y normalización global de raíz OGC, cambios en los probes, en la validación de listados y en la URL de la colección seleccionada.
5. Sus tres claves de traducción en es/en/ca y cambios de formato ajenos. Esos JSON ya no aparecen modificados.
6. Pruebas específicas de las ampliaciones MBTiles y OGC. Los casos GPX se han adaptado al importador existente y al constructor público, conservando las regresiones propias de ShareMap.

La copia recuperable está fuera del repositorio, en `C:/Users/pablolopez/Documents/ChatGPT/TEUNESCO/sharemap-layerswitcher-pendiente-20261014/`. Contiene `layerswitcher-ampliaciones.patch` contra la versión que conserva las dos correcciones de namespace y las pruebas anteriores. No está aplicada. Antes de recuperarla para otra subida, revisar los riesgos detectados: consumidores que distinguen Vector de GPX (comparators, stylemanager, incicarto), etiquetas del importador, parámetros query/auth del servicio OGC y selección de colecciones mixtas. No se debe restaurar todo el archivo GPX de pruebas sobre las pruebas actuales.

## ShareMap: limpieza realizada

- layerToParam(layer) solo delega en layer.getRestLayer(). Si falta el método o falla, avisa y omite la capa no serializable. restWarnings_ evita duplicar avisos para la misma capa al construir URL e iframe.
- Se elimina el argumento parent: los grupos los serializa IDEE.layer.LayerGroup con sus hijos.
- Se eliminan los 12 serializadores específicos antiguos: getGPX, getKML, getGeoJSON, getOGCAPIFeatures, getMapLibre, getVector, getMVT, getWMS, getGeoTIFF, getWFS, getWMTS y getLayerGroup, además de normalizeString. Se elimina también getGeneric comentado. No tenían llamadas desde otros archivos a la instancia de ShareMap; los métodos homónimos de Map y otros plugins permanecen.
- buildURL y buildHtml dejan de concatenar MAP_VIEWER_LAYERS: el visualizador incorpora esas entradas explícitamente al mapa principal y ShareMap comparte las instancias actuales según el filtro.
- Se mantienen getLayers, getLayersInLayerswitcher, getLayersInfilterLayers, getControls, getPlugins y los métodos del modal: siguen participando en los flujos existentes.
- Se conserva el lector de cadenas posicionales antiguas en el núcleo: eliminar los emisores antiguos del plugin no requiere impedir la apertura de enlaces anteriores.

No se han centralizado los dos constructores de URL ni cambiado sus reglas de selección en esta limpieza; la petición era retirar código obsoleto sin alterar otros comportamientos.

## Qué se puede probar antes de actualizar LayerSwitcher

| Caso | En esta entrega | Pendiente para LayerSwitcher |
| --- | --- | --- |
| WMS/WMTS/WFS y formatos que ya reconoce el diálogo | Carga existente y enlace nuevo; WFS conserva formato/opciones | Ninguna ampliación de carga incluida |
| GPX por el diálogo | Importación existente como Vector; ShareMap incrusta GeoJSON comprimido | Conservar la URL mediante una capa nativa GPX |
| GPX por constructor o REST | Capa GPX con URL; ShareMap referencia esa URL | No depende de LayerSwitcher |
| MBTiles/MBTilesVector por constructor o REST | Compartibles con URL accesible y motor compatible | Detección/carga en el buscador y selector local |
| OGCAPIFeatures/DataIDEE | Compartir instancias válidas creadas por REST/constructor; detección antigua del diálogo | Aceptar indistintamente raíz, /collections y query en el buscador |
| Vectores locales importados | Compartir entidades como GeoJSON; presupuesto final de 7.000 bytes | No hay almacén de archivos ni garantía de que todo archivo cabe |
| Binarios locales sin URL pública | Aviso de que no se pueden reconstruir en otra sesión | Añadir carga a la UI no los hace compartibles sin alojamiento |
| GenericRaster | Fuentes/proveedores compatibles se convierten a parámetros de fachada | No se serializa cualquier código/función arbitraria del motor |
| Terrain/Tiles3D | Constructor o REST Cesium con URL | El diálogo OL no adquiere capacidades 3D |

La fase 2 (GET general para restaurar la capa base activa tanto desde control como desde plugin) continúa pendiente. Las restricciones de cada motor se conservan; esta refactorización no incorpora implementaciones Cesium que antes no existían.

## Inventario archivo a archivo

### A. Imprescindibles del flujo completo getRestLayer / ShareMap / REST — 40 archivos

| Archivo | Cometido / decisión |
| --- | --- |
| `api-idee-js/src/configuration.js` | Lee layers de los enlaces del visualizador sin confundir claves ni cortar valores. |
| `api-idee-js/src/facade/js/Map.js` | Reconstruye parámetros nombrados, opciones y estado. El visualizador añade sus capas explícitamente; los mapas auxiliares no heredan capas de la URL. |
| `api-idee-js/src/facade/js/layer/DataIDEE.js` | Añade o integra getRestLayer y los parámetros específicos de esta fachada. |
| `api-idee-js/src/facade/js/layer/GPX.js` | Añade o integra getRestLayer y los parámetros específicos de esta fachada. |
| `api-idee-js/src/facade/js/layer/GenericRaster.js` | Añade o integra getRestLayer y los parámetros específicos de esta fachada. |
| `api-idee-js/src/facade/js/layer/GenericVector.js` | Añade o integra getRestLayer y los parámetros específicos de esta fachada. |
| `api-idee-js/src/facade/js/layer/GeoJSON.js` | Añade o integra getRestLayer y los parámetros específicos de esta fachada. |
| `api-idee-js/src/facade/js/layer/GeoPackage.js` | Añade o integra getRestLayer y los parámetros específicos de esta fachada. |
| `api-idee-js/src/facade/js/layer/GeoPackageTile.js` | Añade o integra getRestLayer y los parámetros específicos de esta fachada. |
| `api-idee-js/src/facade/js/layer/GeoTIFF.js` | Añade o integra getRestLayer y los parámetros específicos de esta fachada. |
| `api-idee-js/src/facade/js/layer/KML.js` | Añade o integra getRestLayer y los parámetros específicos de esta fachada. |
| `api-idee-js/src/facade/js/layer/KMZ.js` | Añade o integra getRestLayer y los parámetros específicos de esta fachada. |
| `api-idee-js/src/facade/js/layer/Layer.js` | Añade o integra getRestLayer y los parámetros específicos de esta fachada. |
| `api-idee-js/src/facade/js/layer/LayerGroup.js` | Añade o integra getRestLayer y los parámetros específicos de esta fachada. |
| `api-idee-js/src/facade/js/layer/MBTiles.js` | Añade o integra getRestLayer y los parámetros específicos de esta fachada. |
| `api-idee-js/src/facade/js/layer/MBTilesVector.js` | Añade o integra getRestLayer y los parámetros específicos de esta fachada. |
| `api-idee-js/src/facade/js/layer/MVT.js` | Añade o integra getRestLayer y los parámetros específicos de esta fachada. |
| `api-idee-js/src/facade/js/layer/MapLibre.js` | Añade o integra getRestLayer y los parámetros específicos de esta fachada. |
| `api-idee-js/src/facade/js/layer/OGCAPIFeatures.js` | Añade o integra getRestLayer y los parámetros específicos de esta fachada. |
| `api-idee-js/src/facade/js/layer/OSM.js` | Añade o integra getRestLayer y los parámetros específicos de esta fachada. |
| `api-idee-js/src/facade/js/layer/TMS.js` | Añade o integra getRestLayer y los parámetros específicos de esta fachada. |
| `api-idee-js/src/facade/js/layer/Terrain.js` | Añade o integra getRestLayer y los parámetros específicos de esta fachada. |
| `api-idee-js/src/facade/js/layer/Tiles3D.js` | Añade o integra getRestLayer y los parámetros específicos de esta fachada. |
| `api-idee-js/src/facade/js/layer/Vector.js` | Añade o integra getRestLayer y los parámetros específicos de esta fachada. |
| `api-idee-js/src/facade/js/layer/WFS.js` | Añade o integra getRestLayer y los parámetros específicos de esta fachada. |
| `api-idee-js/src/facade/js/layer/WMC.js` | Añade o integra getRestLayer y los parámetros específicos de esta fachada. |
| `api-idee-js/src/facade/js/layer/WMS.js` | Añade o integra getRestLayer y los parámetros específicos de esta fachada. |
| `api-idee-js/src/facade/js/layer/WMTS.js` | Añade o integra getRestLayer y los parámetros específicos de esta fachada. |
| `api-idee-js/src/facade/js/layer/XYZ.js` | Añade o integra getRestLayer y los parámetros específicos de esta fachada. |
| `api-idee-js/src/facade/js/parameter/parameter.js` | Completa estado y opciones ausentes sin sobrescribir la normalización de cada constructor. |
| `api-idee-js/src/facade/js/util/RestLayer.js` | Nuevo serializador común, compresión y gestión de las referencias a recursos remotos. |
| `api-idee-js/src/facade/js/util/Utils.js` | Decodifica base64~ y deflate~ y conserva signos igual en los valores. |
| `api-idee-js/src/impl/cesium/js/layer/GenericRaster.js` | Obtiene parámetros REST de los proveedores ráster compatibles en Cesium. |
| `api-idee-js/src/impl/cesium/js/layer/Tiles3D.js` | Permite obtener el estilo antes de inicializar la capa Cesium durante su serialización. |
| `api-idee-js/src/impl/ol/js/layer/GenericRaster.js` | Obtiene parámetros REST de las fuentes ráster nativas compatibles en OL. |
| `api-idee-js/src/plugins/sharemap/src/facade/js/i18n/ca.json` | Traduce avisos de capas no compartibles y enlaces que exceden el presupuesto de longitud. |
| `api-idee-js/src/plugins/sharemap/src/facade/js/i18n/en.json` | Traduce avisos de capas no compartibles y enlaces que exceden el presupuesto de longitud. |
| `api-idee-js/src/plugins/sharemap/src/facade/js/i18n/es.json` | Traduce avisos de capas no compartibles y enlaces que exceden el presupuesto de longitud. |
| `api-idee-js/src/plugins/sharemap/src/facade/js/sharemapcontrol.js` | Delega exclusivamente en getRestLayer; genera URL/iframe codificados y gestiona avisos y tamaño. |
| `api-idee-rest/src/main/java/es/api_idee/api/BuilderWS.java` | Usa el parser existente de listas de capas también al generar JavaScript REST; conserva grupos posicionales antiguos. |

### B. Necesario para los dos comportamientos solicitados en sharemap.jsp — 1 archivos

| Archivo | Cometido / decisión |
| --- | --- |
| `api-idee-rest/src/main/webapp/sharemap.jsp` | Evita duplicar las WMS de ejemplo y actualiza las sugerencias de filterLayers al añadir/quitar capas. |

### C. Corrección mínima de carga en LayerSwitcher, recomendada pero independiente de ShareMap — 1 archivos

| Archivo | Cometido / decisión |
| --- | --- |
| `api-idee-js/src/plugins/layerswitcher/src/facade/js/layerswitchercontrol.js` | Dos llamadas pasan de IDEE.utils.loadFeaturesFromSource a IDEE.loadFiles.loadFeaturesFromSource; una tercera sustitución permite reconocer tanto <kml> como <kml con atributos. No añade cargadores ni cambia el importador. |

### D. Herramienta de ensamblado, recomendada para empaquetar bundles actualizados — 1 archivos

| Archivo | Cometido / decisión |
| --- | --- |
| `api-idee-js/tasks/build-plugins.js` | Espera compilación y copia de bundles; admite ensamblar solo los plugins afectados. |

### E. Pruebas automatizadas, recomendadas para entregar y mantener el cambio — 6 archivos

| Archivo | Cometido / decisión |
| --- | --- |
| `api-idee-js/playwright-config/playwright-sharemap.config.js` | Configura la suite focalizada de ShareMap y reconstrucción REST OL/Cesium. |
| `api-idee-js/src/plugins/sharemap/test/playwright/ol/PLAY-sharemap-gpx.spec.js` | Regresiones de GPX mediante importador Vector y constructor GPX, compresión, tamaño y catálogo. |
| `api-idee-js/src/plugins/sharemap/test/playwright/ol/PLAY-sharemap-viewer.spec.js` | Regresiones del JSP: sugerencias dinámicas, ausencia de duplicados, filtros y formato WFS. |
| `api-idee-js/src/plugins/sharemap/test/playwright/ol/sharemap-ol.html` | Carga bundles locales del núcleo y plugin en la fixture Playwright. |
| `api-idee-js/test/playwright/cesium/PLAY-rest-layers.spec.js` | Regresiones de serialización y reconstrucción en Cesium. |
| `api-idee-js/test/playwright/ol/PLAY-rest-layers.spec.js` | Regresiones de tipos, parámetros, grupos, datos locales y delegación de ShareMap en OL. |

### F. Ejemplos manuales y recursos, opcionales para el funcionamiento — 22 archivos

| Archivo | Cometido / decisión |
| --- | --- |
| `api-idee-js/src/plugins/sharemap/test/dev.html` | Formulario de desarrollo: sugerencias actuales y descripción correcta de shareLayer. |
| `api-idee-js/src/plugins/sharemap/test/rest-layer.html` | Página manual 8081 para probar núcleo y plugin locales sin desplegar Tomcat. |
| `api-idee-js/src/plugins/sharemap/test/test.js` | Script de desarrollo: sugerencias dinámicas y ausencia de capas de ejemplo duplicadas. |
| `api-idee-rest/src/main/webapp/test-data/sharemap/README.md` | Recurso opcional del catálogo manual de pruebas; no interviene en el serializador. |
| `api-idee-rest/src/main/webapp/test-data/sharemap/contexto.wmc` | Recurso opcional del catálogo manual de pruebas; no interviene en el serializador. |
| `api-idee-rest/src/main/webapp/test-data/sharemap/examples.js` | Recurso opcional del catálogo manual de pruebas; no interviene en el serializador. |
| `api-idee-rest/src/main/webapp/test-data/sharemap/mixto.gpkg` | Recurso opcional del catálogo manual de pruebas; no interviene en el serializador. |
| `api-idee-rest/src/main/webapp/test-data/sharemap/point.pbf` | Recurso opcional del catálogo manual de pruebas; no interviene en el serializador. |
| `api-idee-rest/src/main/webapp/test-data/sharemap/puntos.geojson` | Recurso opcional del catálogo manual de pruebas; no interviene en el serializador. |
| `api-idee-rest/src/main/webapp/test-data/sharemap/puntos.kml` | Recurso opcional del catálogo manual de pruebas; no interviene en el serializador. |
| `api-idee-rest/src/main/webapp/test-data/sharemap/puntos.kmz` | Recurso opcional del catálogo manual de pruebas; no interviene en el serializador. |
| `api-idee-rest/src/main/webapp/test-data/sharemap/raster.gpkg` | Recurso opcional del catálogo manual de pruebas; no interviene en el serializador. |
| `api-idee-rest/src/main/webapp/test-data/sharemap/raster.mbtiles` | Recurso opcional del catálogo manual de pruebas; no interviene en el serializador. |
| `api-idee-rest/src/main/webapp/test-data/sharemap/raster.tif` | Recurso opcional del catálogo manual de pruebas; no interviene en el serializador. |
| `api-idee-rest/src/main/webapp/test-data/sharemap/ruta.gpx` | Recurso opcional del catálogo manual de pruebas; no interviene en el serializador. |
| `api-idee-rest/src/main/webapp/test-data/sharemap/style.json` | Recurso opcional del catálogo manual de pruebas; no interviene en el serializador. |
| `api-idee-rest/src/main/webapp/test-data/sharemap/terrain/flat.terrain` | Recurso opcional del catálogo manual de pruebas; no interviene en el serializador. |
| `api-idee-rest/src/main/webapp/test-data/sharemap/terrain/layer.json` | Recurso opcional del catálogo manual de pruebas; no interviene en el serializador. |
| `api-idee-rest/src/main/webapp/test-data/sharemap/tile.png` | Recurso opcional del catálogo manual de pruebas; no interviene en el serializador. |
| `api-idee-rest/src/main/webapp/test-data/sharemap/tiles3d/tileset.json` | Recurso opcional del catálogo manual de pruebas; no interviene en el serializador. |
| `api-idee-rest/src/main/webapp/test-data/sharemap/tiles3d/triangle.gltf` | Recurso opcional del catálogo manual de pruebas; no interviene en el serializador. |
| `api-idee-rest/src/main/webapp/test-data/sharemap/vector.mbtiles` | Recurso opcional del catálogo manual de pruebas; no interviene en el serializador. |

### G. Documentación, recomendada para la revisión y el mantenimiento — 4 archivos

| Archivo | Cometido / decisión |
| --- | --- |
| `docs/sharemap-capas-prueba.md` | Catálogo manual de tipos, URL de prueba y límites según origen y motor. |
| `docs/sharemap-entrega-fase-1.md` | Este inventario individual y las decisiones de alcance de la entrega. |
| `docs/sharemap-fase-1.md` | Registro de implementación y validaciones; los apartados anteriores son históricos. |
| `docs/sharemap-fase-2-analisis.md` | Análisis de la futura capa base activa y diagnóstico de cargas; no implementa la fase 2. |

## Compilación y comprobación

Después de cambiar módulos/entrypoints, ejecutar prebuild. Para obtener un despliegue nuevo completo desde fuentes, la orden habitual es:

```bash
cd /home/pablolr/API-IDEE/api-idee-parent
mvn clean package -DskipTests -P local
```

Para este ajuste, los bundles del núcleo ya estaban compilados con getRestLayer y sus lectores. Se recompilan ambos plugins con:

```bash
cd /home/pablolr/API-IDEE/api-idee-js
npm --prefix src/plugins/sharemap run check
npm --prefix src/plugins/layerswitcher run check
npm run build:plugins -- sharemap layerswitcher
node node_modules/@playwright/test/cli.js test --config=playwright-config/playwright-sharemap.config.js
cd ../api-idee-parent
mvn -o package -DskipTests -P local -Dskip.npm=true -Dskip.installnodenpm=true
```

Los flags skip.npm y skip.installnodenpm solo sirven si ya se han compilado y ensamblado núcleo/plugins. -DskipTests no sustituye a las pruebas Playwright. El WAR resultante debe republicarse en Community Server Connector y el navegador debe recargar sin caché. Esta intervención no realiza la publicación en Tomcat.

Prueba manual del JSP: abrir sin layers, cargar una WFS o un GeoJSON, seleccionar shareLayer=true y volver a abrir el enlace. Comprobar una instancia por capa, entidades, visibilidad y opacidad. Repetir con shareLayer=false y el nombre de una capa añadida; comprobar que solo se restaura esa capa y que las WMS de ejemplo no vuelven a añadirse. Probar también un vector local pequeño y un binario sin URL para comprobar el aviso. Para comparar GPX: diálogo produce Vector; constructor con url produce GPX.

Resultado de validación actual:

- Lint de ShareMap y LayerSwitcher: correcto.
- Playwright: 31 casos distintos verificados en Chromium, con cobertura OL/Cesium. La primera ejecución aprobó 30; la comprobación GPX reconstruida consultaba sus entidades antes de completar la carga asíncrona. Se corrigió la espera de esa prueba y se repitió su archivo completo: 5/5 aprobados. No se cambió código de producción para resolverlo. No se ha ejecutado toda la batería del repositorio ni Firefox/WebKit.
- Compilación y ensamblado oficial de ambos plugins OL/Cesium: correcto, con advertencias existentes de tamaño de bundles.
- Maven: BUILD SUCCESS con el núcleo previamente compilado y los plugins recién ensamblados. No es una compilación clean completa ni prueba de que toda la batería del repositorio haya pasado.
- WAR: comprobados byte a byte núcleo OL/Cesium, ShareMap OL/Cesium, LayerSwitcher OL/Cesium y sharemap.jsp contra los artefactos/fuentes locales. Los bundles empaquetados ya no contienen los cargadores GPX/MBTiles ni la normalización OGC apartados.
- Diff: sin errores de espacios; En la revisión de reducción de alcance, LayerSwitcher equivalía a HEAD más las dos sustituciones del namespace. La revisión posterior añade exclusivamente la corrección puntual de detección KML. Sus tres JSON de i18n siguen coincidiendo con HEAD.
- Inventario: comprobado contra todos los nombres de archivos modificados/nuevos de Git, sin entradas omitidas.
- Deployment: el nuevo WAR no se ha republicado en Tomcat. La prueba del formulario JSP se ejecuta con su HTML/script reales y bundles locales dentro de Playwright. Falta la comprobación manual tras republicar en Community Server Connector.
- Git: ninguna operación de escritura, staging, commit ni publicación.


Actualización de cargas posterior (14/10/2026): se corrige una condición de detección KML para aceptar `<kml>` sin atributos, conservando el caso con namespace. Once pruebas cercanas de carga GPX/KML, compresión, filtro y JSP aprobadas en Chromium; lint de LayerSwitcher correcto. Se comprueban el KML público (1.119 entidades, con bundle local interceptado), el GeoPackage público (357 entidades y tabla ráster, sin reproducir el fallo de carga) y MBTiles mediante constructor. Maven BUILD SUCCESS; WAR local pendiente de republicar. El nuevo documento de fase 2 añade análisis, no implementación: inventario actual de 75 archivos; A–F mantienen sus cantidades y G pasa a 4.
