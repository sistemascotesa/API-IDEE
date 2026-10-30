# ShareMap: fase 2 — fondo activo

## Contrato

- GET `baselayer`: cadena REST del fondo activo. Puede representar una capa o una composición `LayerGroup`. Ausencia del parámetro: configuración habitual del destino. No hay un valor especial para transmitir un fondo vacío.
- Constructor JavaScript: `IDEE.map({ container: 'map', baseLayer: cadena })`.
- Lectura pública: `map.getRestBaseLayer()`, independiente de ShareMap. Devuelve `undefined` si no hay fondo activo. No devuelve una URL completa ni captura todo el contexto del mapa. `layer.getRestLayer()` sigue describiendo una capa individual.
- ShareMap añade `baselayer` a URL e iframe únicamente con `shareBaseLayer: true` y un fondo activo, con `urlAPI` verdadero o falso. Sin fondo activo, con `false` o sin definir omite el parámetro y utiliza el fondo por defecto del destino. `shareLayer` y `filterLayers` controlan las capas informativas de forma independiente.
- Los componentes del fondo se excluyen de `layers` por identidad del objeto. Una capa informativa con el mismo nombre no se elimina por esa coincidencia.
- No se guarda el número de botón como identidad del fondo. Se guarda su definición REST, incluidas las piezas de un híbrido.

## Archivos de producción

| Archivo | Cambio y motivo |
| --- | --- |
| `api-idee-js/src/facade/js/util/RestBaseLayerStore.js` (nuevo) | Guarda y consulta las capas recibidas por mapa mediante WeakMap. No interpreta REST, no carga capas ni modifica selectores. El plugin accede a la misma instancia exportada por el núcleo. |
| `api-idee-js/src/facade/js/builder/builder.js` | Construye el fondo con el parser y las clases existentes. Cesium descompone LayerGroup en capas raíz; el método devuelve las instancias, sin añadirlas al mapa. |
| `api-idee-js/src/facade/js/util/RestLayer.js` | Serializa un fondo simple o compuesto. La comparación de recursos queda encapsulada en BackgroundLayers, donde se utiliza. |
| `api-idee-js/src/facade/js/Map.js` | Aplica un `baseLayer` explícito antes de crear los controles e impide que el fondo por defecto lo sobrescriba. API pública: `getRestBaseLayer()` y `getActiveBaseLayers()`. Las dos consultas públicas leen las instancias presentes y visibles y reutilizan la serialización REST. No gestiona catálogos ni botones. `getBaseLayers()` conserva su comportamiento anterior. |
| `api-idee-js/src/facade/js/parameter/Parameters.js` | Conserva la opción del constructor y rechaza tipos distintos de cadena. Omitido, null o cadena vacía conservan el fondo habitual. No toma automáticamente parámetros globales para cada mapa auxiliar. |
| `api-idee-js/src/configuration.js` | Lee exclusivamente el nuevo GET y lo expone como `IDEE.config.MAP_VIEWER_BASE_LAYER`. El visualizador decide qué mapa lo recibe. |
| `api-idee-rest/src/main/java/es/api_idee/parameter/parser/ParametersParser.java` | Una línea traduce GET `baselayer` a la propiedad JavaScript `baseLayer`, reutilizando `addValue`. Reutiliza Parameters.java. El ajuste posterior de compatibilidad Base64 del generador se detalla al final. |
| `api-idee-js/src/facade/js/control/BackgroundLayers.js` | Informa de las capas de su selección. Solo en mapas con `baseLayer` explícito evita borrar/restablecer el fondo durante su inicialización, adapta la selección y permite sustituirla después. |
| `api-idee-js/src/plugins/backimglayer/src/facade/js/backimglayercontrol.js` | Delega la preparación del catálogo y el cálculo de la selección en BackgroundLayers; mantiene su plantilla, previsualizaciones, eventos y actualización visual. No modifica su constructor público ni su formato REST anterior. |
| `api-idee-js/src/plugins/backimglayer/src/facade/js/backimglayer.js` | Al destruir el plugin retira primero sus controles con map.removeControls, para que su destroy desregistre los listeners. El panel por sí solo no destruye sus controles. |
| `api-idee-js/src/plugins/sharemap/src/facade/js/sharemapcontrol.js` | Añade el fondo antes de validar/acortar la URL; excluye sus piezas de las capas informativas. Cachea el catálogo de controles del servidor, pero vuelve a consultar la selección del mapa en cada apertura. El iframe incluye también el SRS, igual que el enlace. |
| Traducciones es/en/ca del núcleo, BackImgLayer y ShareMap | Etiqueta «Compartida» para un fondo ausente del catálogo y aviso si el fondo no se puede serializar. |
| `api-idee-rest/src/main/webapp/sharemap.jsp` | Entrega el GET al mapa principal. Si llega un mapa compartido, no añade las dos WMS de demostración. |
| `api-idee-rest/src/main/webapp/backgroundlayers.jsp` y `backimglayer.jsp` | Una línea en cada mapa principal permite probar también el GET en las demostraciones de ambos selectores. |
| `api-idee-rest/src/main/webapp/data/swagger/map.json` (nuevo), `swagger-ui.html`, `data/rest.json` | Documentación OpenAPI del GET y ejemplo de fondo OSM. |

También se adapta la página de desarrollo de ShareMap (`test/test.js` y el banco local `test/rest-layer.html`) y se añaden pruebas de navegador OL/Cesium y JUnit. `test/dev.html` y `tasks/build-plugins.js` ya tenían cambios locales anteriores a esta fase.

## Por qué se adaptan los selectores

Aunque Map restaure la capa, ambos selectores borraban las bases existentes al inicializarse y activaban su opción inicial. Sin esos pequeños puntos de integración, el enlace se reconstruiría bien y el selector lo sobrescribiría inmediatamente. La nueva rama solo se activa con `baseLayer` explícito.

Si el fondo coincide con un recurso del catálogo, se conservan el botón, su título y su previsualización, y se usan las instancias recibidas. Si no coincide, se añade una entrada temporal a una copia del catálogo de ese control. El título utiliza la leyenda o el nombre de las capas y solo recurre a «Compartida» si faltan ambos; para un grupo sintético usa los nombres de sus componentes. El REST no transporta la previsualización del selector de origen. Un selector añadido tarde consulta el fondo actual, no vuelve al valor recibido originalmente. Los clics siguientes usan sus manejadores habituales.

La coordinación no depende de ShareMap: también se ejecuta al usar `IDEE.map({ baseLayer: cadena })` o al abrir un GET `baselayer` directamente. Sin parámetro explícito se mantiene la inicialización habitual de cada selector.

BackgroundLayers centraliza la búsqueda de una entrada equivalente (`findBaseLayer`), la integración del fondo en el catálogo (`syncRestBaseLayer`) y el cálculo del índice y visibilidad (`updateBaseLayerState`) mediante métodos estáticos que utilizan ambos selectores. Cada selector conserva únicamente su actualización de botones (`updateBaseLayerSelection`), porque sus plantillas y clases CSS son distintas. Los eventos existentes ADDED_LAYER y REMOVED_LAYER actualizan solo la vista: nunca recargan el fondo ni restituyen el valor inicial durante un cambio. Los listeners se registran únicamente en mapas con baseLayer explícito y se retiran al destruir el selector. Los tres métodos privados de enlace de Map se han eliminado.

No se modifica LayerSwitcher, LoadFiles, los parsers de los formatos de capas ni las implementaciones de los motores OL/Cesium en esta fase. Desactivar el fondo desde el selector no elimina las capas informativas. Al compartir ese estado se omite el fondo y el destino usa su configuración habitual.

## Prueba manual en el visualizador real

1. Desplegar el WAR actualizado en Tomcat y recargar con la caché desactivada. Actualizar juntos núcleo, ShareMap y BackImgLayer: un plugin nuevo con un núcleo antiguo no contiene los métodos de esta fase.
2. Abrir `http://localhost:8080/api-idee/sharemap.jsp?language=es`.
3. Activar `shareBaseLayer: true`, seleccionar Imagen, compartir con `shareLayer: false` y `filterLayers` vacío; abrir el enlace. Debe mantener Imagen y no añadir las WMS de demostración.
4. Repetir con Híbrido. Deben conservarse sus componentes y no duplicarse en las capas informativas.
5. Cargar una capa informativa, activar `shareLayer: true` y repetir. El enlace debe contener `layers` y `baselayer` con responsabilidades separadas.
6. Abrir Compartir, cerrar, cambiar a Callejero y volver a abrir. URL e iframe deben describir Callejero, no la selección anterior.
7. Con `shareBaseLayer: true`, desactivar el fondo haciendo clic sobre la opción activa. URL e iframe deben omitir `baselayer`; al abrirlos, el destino debe usar su fondo habitual. Repetir con urlAPI false/true y comprobar que las capas informativas se conservan según shareLayer/filterLayers.
8. Con BackImgLayer, repetir con una entrada que contenga varias capas. Al cambiar de fondo deben retirarse todos sus componentes.
9. Probar `http://localhost:8080/api-idee/?baselayer=OSM*name=osm;isBase=true;visibility=true&controls=backgroundlayers`. Debe cargar OSM y añadirlo al catálogo si falta. Probar el mismo GET en `/api/js` y comprobar que genera la propiedad baseLayer.
10. Abrir también `backgroundlayers.jsp` y `backimglayer.jsp` con esa definición en `baselayer`: sus selectores deben marcar el fondo recibido y permitir elegir otro después.
11. Repetir una URL sin `baselayer`: mantiene los valores iniciales anteriores.

`urlAPI: true` debe apuntar mediante `baseUrl` al despliegue actualizado. La instalación pública de componentes.idee.es no recibe automáticamente estos cambios locales.

## Uso sin ShareMap

```js
const fondo = map.getRestBaseLayer();
const url = new URL('http://localhost:8080/api-idee/');
if (fondo !== undefined) url.searchParams.set('baselayer', fondo);
url.searchParams.set('center', '-400000,4800000');
url.searchParams.set('zoom', '6');
console.log(url.href);

// En otro contenedor de la aplicación:
const copia = IDEE.map({ container: 'otroMapa', baseLayer: fondo });
```

En un visualizador propio que construya el mapa directamente, añadir `baseLayer: IDEE.config.MAP_VIEWER_BASE_LAYER` únicamente al mapa principal. El visualizador REST `/api-idee/` ya lo recibe mediante `/api/js`.

Sin GET `baselayer`, `MAP_VIEWER_BASE_LAYER` vale `undefined`: dejar esa propiedad en el constructor o quitarla produce el mismo resultado. Para probar otra base sin ShareMap puede usarse `baseLayer: IDEE.getQuickLayers('BASE_PNOA_MA_TMS').getRestLayer()`; el selector reconocerá Imagen y la marcará como activa. Para probar un recurso externo, pasar `nuevaCapa.getRestLayer()`: se incorporará a las opciones del selector si no existe.

## Comprobación automatizada

Desde `api-idee-js`:

```bash
npx playwright test --config=playwright-config/playwright-sharemap.config.js --reporter=line
```

Los casos nuevos comprueban la selección, la presencia de las capas, la serialización y la reconstrucción con recursos locales. No garantizan disponibilidad de servicios externos. La prueba del manejador móvil invoca el manejador directamente: el CSS previo oculta los botones de BackgroundLayers en móvil y su botón único está comentado; corregir esa interfaz es una tarea separada.

Los límites anteriores de ShareMap siguen vigentes: binarios locales sin URL no son transportables mediante el enlace y un enlace demasiado largo se rechaza antes de copiarlo. No se ha incorporado almacenamiento de mapas ni de archivos.

## Revisión de nombres y API (20/10/2026)

- `BaseLayerState.js` pasa a `RestBaseLayerState.js`; `getBaseLayerSelection()` pasa a `getActiveBaseLayers()`. Se actualizan ShareMap, ambos selectores y las pruebas que utilizaban el nombre anterior.
- `hasExplicitBaseLayer()`, `syncBaseLayerSelector()` y `removeActiveBaseLayers()` se documentan con `@private`, sin `@api`. Siguen accesibles entre los bundles del núcleo y BackImgLayer para utilizar un único estado por mapa; no son métodos privados `#` de JavaScript.
- El booleano `restored` pasa a `hasExplicitBaseLayer`: indica que se debe respetar el fondo recibido. La limpieza de la composición se concentra también en el módulo común.
- Las entradas nuevas utilizan leyenda o nombre; las entradas equivalentes mantienen el título y la previsualización configurados. No se amplía el GET con metadatos nuevos.
- Se reactiva en `test/test.js` el paso de `MAP_VIEWER_BASE_LAYER` al mapa principal, que estaba comentado.
- Validación: lint del núcleo afectado y de los dos plugins correcto; compilados núcleo OL/Cesium y ambos plugins; 38 casos OL y 6 Cesium correctos. Los cuatro casos de validación Cesium lanzados antes de terminar su compilación fallaron por falta del bundle y pasaron al repetirlos con el bundle disponible. La generación previa muestra diagnósticos de JSDoc sobre tipos de OpenLayers y los builds avisos de tamaño y dependencias.
- No se ha ejecutado la batería general completa ni se ha generado/desplegado un nuevo WAR en esta revisión. Los bundles nuevos requieren actualizar juntos núcleo, ShareMap y BackImgLayer. No se han realizado operaciones de escritura en Git.

## Retirada del fondo vacío por REST (21/10/2026)

- Se elimina el valor especial `none`. `getRestBaseLayer()` devuelve `undefined` cuando no hay fondo activo y ShareMap omite `baselayer` en URL e iframe; el destino aplica su fondo habitual. Una cadena que no describe una capa sigue la validación normal del núcleo.
- También se omite la elección del selector BackgroundLayers y el catálogo de BackImgLayer cuando no hay fondo activo, para no trasladar por otra vía una selección desactivada. El control BackgroundLayers se conserva con su configuración habitual. Las capas informativas y el encuadre mantienen su flujo.
- Los selectores conservan la posibilidad de desactivar el fondo en el mapa original. Se mantienen las comprobaciones de selección vacía, la coordinación de fondos recibidos y el soporte de composiciones OL/Cesium.
- Actualizados comentarios de API, README, ayuda es/en/ca, OpenAPI, ejemplo de la galería y pruebas. No se modifican los motores ni los selectores en esta revisión.
- Validación: lint del núcleo afectado y ShareMap correcto; compilados núcleo y ShareMap para OL/Cesium; 37 casos OL y 2 Cesium correctos. La prueba nueva de BackImgLayer requirió abrir el panel y pulsar la opción restaurada antes de verificar la URL.
- Los 2 casos JUnit de parámetros pasan compilando el test actualizado y ejecutando JUnitCore con las clases backend existentes, cuya fuente no ha cambiado. El intento Maven aislado en modo offline no pudo resolver los artefactos hermanos del reactor; no se ha generado un WAR ni ejecutado el reactor completo.

## Resultado de la validación (15/10/2026)

- ESLint de los archivos del núcleo modificados: correcto. `npm run check` de ShareMap y BackImgLayer: correcto.
- Batería Playwright específica: **52 pruebas correctas** (45 OL y 7 Cesium; 15 casos nuevos de fase 2).
- JUnit `BaseLayerParameterTest`: **2 pruebas correctas**, también ejecutadas por Maven al empaquetar.
- Núcleo OL/Cesium y todos los plugins compilados. Webpack mantiene avisos previos de tamaño de bundles, GeomUtils/cspline y better-sqlite3. No se han cambiado dependencias ni versiones.
- WAR generado: `api-idee-rest/target/api-idee.war`. Se han comparado sus bundles con los recién compilados.
- Empaquetado del reactor: `mvn package -P local -Dskip.npm=true -Dskip.installnodenpm=true -Dtest=BaseLayerParameterTest -DfailIfNoTests=false`. Esos saltos evitan repetir la compilación frontend ya realizada; no omiten los tests Java indicados. El intento offline inicial necesitó descargar el proveedor JUnit de Surefire ya definido por el proyecto; la ejecución posterior terminó correctamente.
- Tomcat 9.0.41 temporal en 18082: reconstrucción de Híbrido en ShareMap y en el visualizador REST y compartición de BackImgLayer mediante URL API: correctos. También se verificó entonces el contrato de fondo vacío, retirado posteriormente en la revisión del 21/10/2026. El Tomcat temporal se detuvo al terminar.
- No se ejecutó toda la batería general de la aplicación. No se reinició ni se publicó manualmente sobre el Tomcat habitual de 8080.

Para usarlo en 8080, volver a desplegar/publicar el WAR anterior desde Community Server Connector y recargar con la caché desactivada. Verificar en consola `typeof IDEE.Map.prototype.getRestBaseLayer === 'function'` para confirmar que el núcleo servido contiene esta fase. No basta con sustituir solo el bundle de ShareMap.

## Ajuste funcional del 16/10/2026

`shareBaseLayer` es una opción booleana del plugin, independiente del GET general `baselayer`:

| Opción | Enlace generado |
| --- | --- |
| Omitida o false | Sin `baselayer`. Se usa la configuración de fondo del destino. |
| true, con fondo visible | `baselayer` contiene la cadena REST del fondo. |
| true, sin fondo visible | Sin `baselayer`. Se usa la configuración de fondo del destino. |

Con false no se serializa el fondo. Si no hay fondo activo, se aplica el mismo resultado. En ambos casos tampoco se exporta la elección del control BackgroundLayers ni el parámetro del plugin BackImgLayer del origen: ambos transportaban la selección por otra vía e impedían usar el fondo por defecto del destino. El resto de controles y plugins mantiene su flujo habitual. En una URL del propio visualizador, el selector definido por esa página se sigue creando con su configuración inicial.

La nueva opción se incorpora al constructor público, al control, al último campo REST (posición 14, sin desplazar los anteriores), a los formularios publicado/de desarrollo y al banco local. Se documenta en README y en la ayuda es/en/ca.

Se corrige además el encuadre de ShareMap: su JSP y su página de desarrollo fijaban siempre centro y zoom de ejemplo. Ahora el mapa principal toma `center`, `zoom` y `srs` de su URL si están presentes. `zoom` se convierte con Number y conserva sus decimales. Sin esos parámetros, conserva los valores de ejemplo anteriores. Este ajuste no modifica el núcleo, configuration.js ni los selectores.

Prueba principal: mover el mapa, aplicar un zoom fraccionario, activar `shareBaseLayer: true`, compartir y abrir URL e iframe. Comparar `map.getCenter()` y `map.getZoom()` con los del origen. Repetir con false y con la opción vacía: el encuadre debe conservarse y el fondo debe ser el inicial del destino. Las capas informativas siguen dependiendo solo de shareLayer/filterLayers.

Compatibilidad REST de la opción: se ha añadido en JSBuilder.java una condición que excluye `base64=` de la detección de parámetros nombrados. Antes, esa detección interceptaba el formato reservado y generaba `{base64: "..."}` en lugar de decodificar las opciones. La guarda conserva la ruta Base64 que ya existía y no altera la rama de parámetros nombrados. Se comprueban formato Base64, nombrado, posicional y URL antigua sin el campo nuevo con pruebas JUnit.

### Validación del ajuste del 16/10/2026

- `npm run check` de ShareMap: correcto. Bundles OL/Cesium recompilados.
- Playwright específico: **64 pruebas correctas** (12 nuevas para este ajuste), incluidas equivalencia false/omitido, independencia de shareLayer, URL/iframe, fondo vacío, selección del destino y centro/zoom fraccionario.
- Maven: **5 pruebas JUnit correctas** (2 de baselayer y 3 de formatos de parámetros), reactor empaquetado correctamente. Se reutilizó el frontend ya compilado con `-Dskip.npm=true -Dskip.installnodenpm=true`.
- WAR actualizado y verificado contra los bundles/api.json compilados.
- Tomcat 9.0.41 temporal, puerto 18082: se abrieron enlaces generados desde el JSP real con urlAPI false/true y shareBaseLayer omitido/false/true. Los seis conservaron centro (-567890.375, 4789012.625), zoom 9.625 y capa informativa; solo true conservó Imagen, el resto recuperó IGNBaseTodo del destino.
- Iframe real: mismo centro, zoom 9.625 y fondo Imagen.
- Peticiones reales `/api/js`: parámetros nombrados true/false, Base64 true/false y URL antigua sin la opción: correctos. El posicional con el campo nuevo se comprobó además abriendo los enlaces REST generados.
- El primer ensayo REST completo con el catálogo de demostración y datos incrustados alcanzó el límite de longitud ya existente del enlace. Para verificar el transporte se usó un mapa con una sola capa informativa y sin exportar ese catálogo de prueba. No se ha cambiado el límite ni añadido almacenamiento.
- El servidor temporal se detuvo al terminar. No se ha publicado manualmente en 8080 ni realizado operaciones de escritura en Git.


## Reparto de responsabilidades (21/10/2026)

Esta revisión sustituye la organización interna de la sección histórica «Revisión de nombres y API»:

1. Parameters comprueba el tipo de baseLayer. null, undefined y cadenas vacías significan ausencia; objetos, arrays, números y booleanos se rechazan.
2. Map pide al builder las instancias, las guarda en RestBaseLayerStore y las añade antes de crear los selectores y de fijar centro/zoom. Se conserva el orden de inicialización de esta fase para evitar cambios de encuadre o una selección inicial que sobrescriba el fondo recibido.
3. Cada selector consulta el fondo actual del mapa, compara recursos y prepara su propio catálogo. Si el recurso ya existe conserva su título y previsualización; si falta añade una entrada local con la leyenda o nombre.
4. Al elegir otro fondo, el selector retira todos los componentes del anterior y ejecuta su flujo habitual. Los eventos actualizan los botones de los selectores; una pausa sin capas entre retirada y alta no provoca una carga por defecto.
5. Map mantiene getActiveBaseLayers y getRestBaseLayer porque también se usan sin controles ni ShareMap. No se trasladan a BackgroundLayers: excluiría mapas con BackImgLayer o sin selector.
6. ShareMap sigue utilizando las mismas consultas públicas. El GET baselayer, shareBaseLayer y la parte del QR no cambian. No se modifica LayerSwitcher ni los motores.

RestBaseLayerStore es un almacén, no una clase que controla la carga. Su nombre utiliza Store (almacén), en lugar de State (estado más comportamiento) o Stored (almacenado). BackImgLayer usa la instancia exportada por el núcleo, para no crear otro WeakMap en su bundle.

Validación de esta revisión:

- Lint correcto en los seis archivos del núcleo modificados y en ambos plugins (ShareMap y BackImgLayer).
- npm run prebuild y compilación del núcleo y ambos plugins para OL/Cesium correctos. Persisten avisos del build sobre tamaño, exports de GeomUtils/cspline y dependencias de better-sqlite3.
- 51 casos específicos comprobados: fondos OL/Cesium, fondos compuestos, selector tardío, limpieza y recreación, inicialización sin REST, entradas vacías/tipos inválidos, opciones de compartir, visualizador y validación de capas.
- La prueba de limpieza detectó que retirar el panel de BackImgLayer no destruía su control. Se añadió map.removeControls(this.controls) a destroy del plugin; se volvió a comprobar con y sin baseLayer explícito y sin controles residuales.
- No se ejecutó la batería general completa ni se generó/desplegó un WAR. No se realizaron escrituras en Git ni se alteró el staging existente.


## Eliminación de duplicación (22/10/2026)

- BackgroundLayers contiene una única implementación de findBaseLayer, syncRestBaseLayer y updateBaseLayerState. Son métodos estáticos: el plugin puede utilizarlos sin crear otro selector ni heredar su constructor.
- La comparación de recursos pasa de RestLayer a métodos estáticos internos de BackgroundLayers. La lista de propiedades visuales excluidas se crea una sola vez mediante Set.
- BackImgLayer llama a los métodos comunes y conserva el pintado de su propia plantilla. Se actualizan sus tres referencias al nombre vigente getRestBaseLayers del almacén, sin revertir el cambio de nombres realizado en Map y en el propio almacén.
- ShareMap centraliza en getShareURL_ la construcción y validación que repetían buildURL y buildHtml. Se conserva la lectura del estado actual en cada llamada; no se introduce una caché del mapa. El QR sigue utilizando el enlace validado por buildURL.
- No se modifica la carga del constructor de Map, el builder, Parameters, el almacén, LayerSwitcher ni las implementaciones de los motores.
- Balance de esta revisión: 52 líneas netas menos entre los cuatro archivos de código modificados.
- Validación: lint correcto en núcleo y ambos plugins; prebuild y bundles OL/Cesium del núcleo, BackImgLayer y ShareMap correctos (con los avisos previos del núcleo). Las 95 pruebas específicas de ShareMap pasan: fondos, opciones, GPX, validación, visualizador, QR y descarga PNG, con casos OL/Cesium. No se ha ejecutado la batería general completa ni generado o desplegado otro WAR.
- El staging se ha conservado sin cambios y no se han realizado commits ni operaciones contra remotos.


## Integración de los auxiliares en la clase (22/10/2026)

resource y getBaseLayerResourceKey pasan a ser métodos estáticos internos de BackgroundLayers, junto a findBaseLayer y syncRestBaseLayer. Se actualizan sus llamadas y la recursión sin cambiar la normalización ni la búsqueda. visualProperties sigue siendo una constante privada del módulo, compartida por todas las llamadas. BackImgLayer conserva su delegación y no necesita modificaciones.

Validación de la integración de auxiliares: lint y prebuild correctos; núcleos y plugins OL/Cesium compilados; 25 pruebas específicas correctas; reactor Maven y WAR actualizados. No se ejecutó la batería general completa ni se realizaron escrituras en Git.
