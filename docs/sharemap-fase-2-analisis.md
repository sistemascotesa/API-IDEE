# Fase 2 de ShareMap: análisis de la capa base activa

Estado: análisis inicial del 14/10/2026. Contrato de fondo vacío actualizado el 21/10/2026: si no hay fondo activo se omite el GET y el destino aplica su configuración habitual. La implementación vigente se describe en sharemap-fase-2-implementacion.md.

## Recomendación

Añadir un parámetro GET general `baselayer` y una función pública del mapa, propuesta como `map.getRestBaseLayer()`. Reutilizar `layer.getRestLayer()` para serializar el fondo seleccionado. El receptor REST y los visualizadores deben aplicar el mismo contrato del núcleo.

No recomiendo `getBasePath()` en cada capa para obtener todo el contexto del mapa. El fondo activo depende del mapa y de su selector; una capa puede existir sin mapa. Obtener centro, zoom, controles, plugins y todas las capas sería una función distinta y más amplia, por ejemplo un futuro `map.getRestMap()`. El requisito de esta fase no obliga a serializar todo ese contexto ni a duplicar esa responsabilidad en cada tipo de capa.

El nombre implementado en la fase 1 es **getRestLayer**, no getLayerRest. Es público y puede utilizarse sin ShareMap:

```js
const capa = map.getLayers().find(layer => layer.name === 'mi-capa');
const entrada = capa.getRestLayer(); // TYPE*name=...;url=...;...
const destino = new URL('http://localhost:8080/api-idee/');
destino.searchParams.set('layers', entrada);
console.log(destino.href);
```

La cadena describe la carga de esa capa; no es necesariamente solo la URL del archivo ni un enlace completo. Puede contener estado, opciones, estilos o datos vectoriales incrustados. Para recursos asíncronos que deban aportar datos/estilo ya cargados, esperar su carga antes de serializar.

Ejemplo propuesto de la fase 2, todavía no disponible:

```js
const fondo = map.getRestBaseLayer();
const destino = new URL('http://localhost:8080/api-idee/');
if (fondo !== undefined) destino.searchParams.set('baselayer', fondo);
```

También se debe poder restaurar por constructor, por ejemplo `IDEE.map({ container: 'mapa', baseLayer: fondo })`. El nombre JavaScript `baseLayer` se corresponde con el GET `baselayer`; no se cambia globalmente IDEE.config.baseLayer para todos los mapas. Los nombres y el contrato definitivo se confirmarían al implementar.

## Qué ocurre hoy

- `map.getBaseLayers()` existe y consulta las fachadas con `isBase === true`. Es una base útil, pero no basta para identificar todas las piezas de un fondo compuesto de un selector.
- ShareMap con `urlAPI=false` y `shareLayer=true` llama a `getLayersInLayerswitcher()`, que exige `isBase === false`. El enlace no lleva un parámetro general que identifique el fondo activo. El JSP de destino inicializa su selector/default.
- Con `urlAPI=true`, `getLayers()` puede incluir capas base y `getControls()` serializa el índice/visibilidad de BackgroundLayers. BackImgLayer dispone de su propio `getAPIRest()`. Hay mecanismos parciales dependientes de la configuración de cada selector; no constituyen un contrato general fiable entre visualizadores diferentes.
- `getControls()` cachea `controlsPromise_` con el resultado ya calculado. Si la selección cambia después de abrir Compartir una vez, hay que evitar reutilizar estado antiguo al generar el siguiente enlace. Puede conservarse la caché de capacidades del servidor, pero el estado actual debe releerse.
- Las dos WMS administrativas de `sharemap.jsp` son capas de ejemplo superpuestas, no capas base. Se añaden cuando la URL no trae `layers`; con el JSP corregido no se añaden de nuevo a un enlace que sí lleva capas.
- BackgroundLayers usa `activeLayer`, `visible` y `layers[index].layers`. BackImgLayer tiene `activeLayer`, `visible`, una lista equivalente y un evento `backimglayer:activeChanges`.
- Ambos selectores quitan/añaden capas al activarse. La restauración no puede limitarse a añadir una base al principio: la inicialización del selector podría quitarla después.
- Híbrido ya es un LayerGroup con imagen y etiquetas. BackImgLayer permite varias capas en una entrada, incluidas piezas que no necesariamente tienen `isBase=true`.

## Contrato GET propuesto

| Valor | Significado |
| --- | --- |
| Parámetro ausente | Mantener exactamente el comportamiento previo del visualizador. |
| `baselayer=TYPE*name=...;url=...;...` | Restaurar ese fondo con sus parámetros propios. |
| `baselayer=LayerGroup*...` | Restaurar un fondo compuesto completo, preservando orden y estado de sus piezas. |

Se reutiliza el formato nombrado y los codecs base64~/deflate~ ya implementados. No basta con enviar `baselayer=1` o el nombre de una entrada: otro visor puede tener el catálogo ordenado de otra manera, otro recurso con ese nombre o carecer de ese catálogo.

El parámetro no requiere un cambio adicional en las 26 fachadas: getRestLayer ya describe sus recursos. Para una entrada compuesta que todavía no sea un LayerGroup, el serializador del mapa puede describir un grupo sin modificar las instancias del mapa original. No se debe marcar indiscriminadamente a todos los hijos como bases: eso puede activar la exclusión mutua de bases y ocultar las etiquetas del híbrido.

`baselayer` representa el fondo y `layers` las capas compartidas de información. ShareMap excluirá de `layers` las instancias/hijos ya contenidos en `baselayer`, sin eliminar una capa distinta por coincidir solamente en el nombre. El resto del filtrado seguirá respetando shareLayer/filterLayers. El fondo puede conservarse aunque se comparta una única capa informativa o ninguna.

La opción recomendada es integrar este parámetro en el botón actual de Compartir, en URL e iframe. No hace falta otro botón ni reemplazar getRestLayer. Un nuevo ajuste opcional de ShareMap para excluir el fondo sería una decisión de producto adicional, no un requisito técnico para esta fase.

## Integración con controles y plugins

La fachada Map debería conocer una interfaz pequeña de proveedor de fondo, independiente del nombre del plugin. BackgroundLayers y BackImgLayer registrarían su selección activa, sus componentes y el estado sin fondo. Si no hay proveedor, Map puede consultar las capas base raíz realmente visibles.

La interfaz debe permitir leer la selección y aplicar una selección restaurada, además de retirar el registro al destruir el selector. Es preferible esto a introducir condiciones por nombres de plugins dentro de ShareMap o modificar todos los tipos de capa.

Al recibir el GET:

1. Leer y validar la descripción en REST o configuration.js y entregarla al mismo constructor Map.
2. Evitar el alta de la base por defecto cuando existe un fondo explícito válido.
3. Coordinar la restauración con la creación asíncrona de controles/paneles mediante su ciclo real de alta; no mediante un setTimeout fijo. Un selector que se registre durante esa inicialización debe consumir la selección pendiente y no imponer su índice predeterminado.
4. Si el selector contiene una definición equivalente, seleccionar esa entrada y sincronizar sus botones. Comparar recurso/configuración, no solo nombre o índice.
5. Si el fondo compartido no está en el catálogo del destino, conservarlo como entrada temporal «Compartida» o como selección externa reconocida por el selector. Recomiendo la entrada temporal cuando el selector permite añadirla, para que el botón seleccionado corresponda con el mapa real.
6. Terminada la restauración, las elecciones posteriores del usuario deben sustituir el fondo normalmente. No dejar un listener que vuelva a imponer eternamente el parámetro inicial.
7. Con varios mapas, mantener el estado por instancia. Si coexisten selectores, debe quedar definido cuál controla la selección actual; la última acción efectiva del usuario no debe confundirse con el alta tardía de otro selector.

Los controles/plugins externos que compongan fondos podrán implementar el mismo contrato. Una capa base simple registrada en el mapa seguirá siendo identificable por la vía estándar. Un plugin externo que solo dibuje objetos nativos opacos, sin fachadas ni indicar sus componentes, no puede ofrecer automáticamente una descripción REST completa.

## Archivos que previsiblemente cambiarían

Las rutas siguientes son relativas a la raíz del repositorio. Son previsión de cambios, no archivos ya modificados para la fase 2.

| Archivo | Cambio previsto |
| --- | --- |
| `api-idee-js/src/facade/js/Map.js` | API pública de lectura/restauración de fondo, estado por mapa, resolución de componentes, coordinación con el selector y precedencia sobre la base por defecto. |
| `api-idee-js/src/facade/js/parameter/Parameters.js` | Leer baseLayer del constructor; su ausencia mantiene la configuración habitual del destino. |
| `api-idee-js/src/configuration.js` | Leer el GET baselayer en visualizadores, decodificarlo y trasladarlo al núcleo. |
| `api-idee-js/src/facade/js/control/BackgroundLayers.js` | Integrar el proveedor de fondo, restauración inicial, estado sin fondo, botones escritorio/móvil y limpieza. |
| `api-idee-js/src/plugins/backimglayer/src/facade/js/backimglayercontrol.js` | Integrar el proveedor y preservar la selección completa, incluidas composiciones. Desactivar el fondo en origen no se transmite como un fondo vacío al compartir. |
| `api-idee-js/src/plugins/backimglayer/src/facade/js/backimglayer.js` | Coordinar el estado público/REST del plugin con el restaurado y retirar registros/listeners al destruirlo. |
| `api-idee-js/src/plugins/sharemap/src/facade/js/sharemapcontrol.js` | Añadir baselayer a URL/iframe, evitar duplicar sus componentes en layers y leer el estado actual en cada apertura. |
| `api-idee-rest/src/main/java/es/api_idee/parameter/parser/ParametersParser.java` | Recoger el nuevo GET general y pasarlo al modelo de parámetros. |
| `api-idee-rest/src/main/java/es/api_idee/parameter/Parameters.java` | Incorporar el valor baseLayer al JSON enviado a IDEE.map, con la misma convención que los demás parámetros generales. |

La lógica común podría extraerse a un nuevo utilitario `api-idee-js/src/facade/js/util/BaseLayerState.js` si su tamaño lo justifica; no es necesario imponer un archivo nuevo de antemano.

Archivos a verificar y modificar solo si lo exige la solución concreta:

- `api-idee-js/src/facade/js/layer/LayerGroup.js`, `src/impl/ol/js/Map.js` y `src/impl/cesium/js/Map.js`: comprobar visibilidad/orden y ausencia de duplicados. OL ajusta automáticamente visibilidad al añadir capas base. Intentar resolver la coordinación en fachada antes de cambiar reglas generales de los motores.
- `api-idee-js/src/facade/js/util/RestLayer.js`: reutilizar su serialización; ampliar solo si la composición elegida requiere un helper.
- `api-idee-rest/src/main/java/es/api_idee/builder/JSBuilder.java` y `api/BuilderWS.java`: verificar GET, orden de alta de plugins y POST existente. JSBuilder ya pasa parameters.toJSON() al constructor, por lo que no necesariamente necesitarán cambios de producción si el nuevo parámetro queda encapsulado en el modelo/núcleo.
- `api-idee-js/src/plugins/sharemap/src/api.json`, el constructor público y las traducciones: solo habría nuevos parámetros de plugin si se decide añadir una opción de interfaz, lo que no recomiendo como requisito inicial. El GET baselayer pertenece a la API general.
- `api-idee-rest/src/main/webapp/sharemap.jsp` y ejemplos de desarrollo: ampliar las pruebas para fondo activo y enlace sin overlays. No introducir allí la restauración central, pues dejaría fuera otros visualizadores.

Documentación y pruebas de la fase 2:

- `api-idee-rest/src/main/webapp/data/rest.json`: ejemplo general de baselayer.
- Nuevo esquema general en `api-idee-rest/src/main/webapp/data/swagger/` y su referencia en `swagger-ui.html`, o ampliar el esquema general que se decida mantener. Actualmente esa carpeta solo ofrece esquemas de Layerswitcher y Timeline; el GET global no debería documentarse como un parámetro exclusivo de esos plugins.
- JSDoc de Map/Parameters y documentación funcional del nuevo contrato.
- Pruebas OL/Cesium de parámetros generales y fondos; ampliar `test/playwright/ol/PLAY-27-baseLayers.spec.js`, las regresiones REST existentes y las pruebas del JSP/ShareMap. Añadir casos específicos de BackgroundLayers y BackImgLayer con el mismo contrato.

## Diferencias de API y pruebas de aceptación

| Operación | Responsable | Depende de ShareMap |
| --- | --- | --- |
| `capa.getRestLayer()` | Cada fachada serializa una capa concreta. Ya implementado. | No |
| `map.getRestBaseLayer()` | El mapa resuelve y serializa el fondo realmente activo. Propuesto. | No |
| `IDEE.map({ baseLayer: ... })` / GET baselayer | El núcleo restaura el fondo. Propuesto. | No |
| Botón Compartir | Compone centro/zoom/proyección, fondo y capas seleccionadas; ofrece URL/iframe. | Es la interfaz del plugin |
| Serializar todo el contexto de cualquier mapa | API más amplia, no necesaria para esta fase. | Podría existir aparte en el futuro |

Casos mínimos: sin parámetro se conserva el comportamiento anterior; Callejero/Imagen/Híbrido por control; fondo simple/compuesto/vacío por BackImgLayer; mapa sin selector; selección que no existe en el catálogo del destino; fondo con igual nombre y distinto recurso; apertura con y sin capas informativas; mismo contenido en URL/iframe; compartir después de cambiar el fondo tras una primera apertura del modal; carga asíncrona; escritorio/móvil; OL/Cesium según soporte; destrucción/recreación del selector; varios mapas sin contaminación entre instancias; enlaces antiguos sin baselayer.

La dificultad principal es determinar y restaurar una selección coherente entre mapa y selectores. Generar la cadena REST ya está resuelto en buena parte por la fase 1.

## Diagnóstico de cargas realizado en esta revisión

- KML de OpenLayers: HTTP 200, 802.509 bytes. Su raíz es `<kml>` y el detector solo buscaba `<kml `; el resultado no entraba en ningún caso y dejaba el spinner activo. Se corrige exclusivamente esa condición para reconocer `>` o espacio/blanco después de kml. Con el bundle corregido interceptado en el JSP real: 1.119 entidades, enlace de capa KML de 776 caracteres y sin error JavaScript.
- GeoPackage NGA rivers: HTTP 200, 8.858.624 bytes. En el JSP desplegado se reproducen correctamente la carga y el cierre del diálogo; se añaden `rivers:rivers` (357 entidades) y `rivers:rivers_tiles`. No se ha reproducido un fallo de carga. El importador mantiene el centro anterior; usar zoom a la capa para revisar su cobertura. Si persiste el spinner en otra sesión, hace falta contrastar Network/Console de esa sesión para determinar si es una descarga, un recurso WASM o un bundle/cache diferente.
- MBTiles Mapbox: HTTP 200, 561.152 bytes. El diálogo actual no lo reconoce; su ampliación se apartó expresamente. La misma URL carga mediante IDEE.layer.MBTiles y produce una entrada REST que referencia el archivo. No se ha reintroducido su cargador UI.

La única corrección de código productivo de esta revisión es la condición KML en LayerSwitcher. La fase 2 queda sin implementar. Se han añadido dos regresiones de KML (raíz sin atributos y raíz con namespace), con carga y reconstrucción compartida.
