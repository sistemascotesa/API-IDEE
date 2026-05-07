<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<%@ page import="es.api_idee.plugins.PluginsManager"%>
<%@ page import="java.util.Map"%>

<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0">
    <meta http-equiv="X-UA-Compatible" content="IE=edge" />
    <meta name="idee" content="yes">
    <title>Visor base</title>
    <link type="text/css" rel="stylesheet" href="assets/css/apiidee.ol.min.css">
    <link href="plugins/storymap/storymap.ol.min.css" rel="stylesheet" />
    <%
      Map<String, String[]> parameterMap = request.getParameterMap();
      PluginsManager.init (getServletContext());
      String[] cssfiles = PluginsManager.getCSSFiles(parameterMap);
      for (int i = 0; i < cssfiles.length; i++) {
         String cssfile = cssfiles[i];
   %>
    <link type="text/css" rel="stylesheet" href="plugins/<%=cssfile%>">
    </link>
    <%
      } %>
</head>

<body>

    <div class="m-api-idee-test-form-frame">
        <div class="m-test-form">
            <div>
                <label for="selectPosition" title="Posición del plugin sobre el mapa. Por defecto: right">Posición "position"</label>
                <select name="position" id="selectPosition">
                    <option value="" selected="selected"></option>
                    <option value="left">Izquierda</option>
                    <option value="right">Derecha</option>
                </select>
            </div>
            <div>
                <label for="selectCollapsed" title="Indica si el plugin viene colapsado de entrada (true/false). Por defecto: false">Colapsado "collapsed"</label>
                <select name="collapsedValue" id="selectCollapsed">
                    <option value="" selected="selected"></option>
                    <option value="true">true</option>
                    <option value="false">false</option>
                </select>
            </div>
            <div>
                <label for="inputOrder" title="Define en que posición del panel debe aparecer en el conjunto de controles o plugins">Orden entre controles / plugins "order"</label>
                <input type="number" name="order" id="inputOrder" list="orderSug" value="-1">
            </div>
            <div>
                <label for="inputTooltip" title="Texto que se muestra al dejar el ratón encima del plugin. Por defecto: StoryMap">Título de la herramienta "tooltip"</label>
                <input type="text" name="tooltip" id="inputTooltip" list="tooltipSug" value="Storymap">
                <datalist id="tooltipSug">
                    <option value="Storymap"></option>
                </datalist>
            </div>
            <div>
                <label for="inputDelay" title="Tiempo en milisegundos entre animaciones de scroll al usar el reproductor. Por defecto: 2000">Retardo de reproducción "delay"</label>
                <input type="number" name="delay" id="inputDelay" list="delaySug" value="2000">
            </div>
            <div>
                <label for="inputContent" title="Objeto JSON con el contenido del StoryMap por idioma. Estructura: {es: {head, cap: [{title, subtitle, steps: [{html, js}]}]}}. Si no se define, se usará el contenido por defecto del fichero JSON correspondiente al idioma usado en el momento">Contenido "content"</label>
                <input type="text" name="content" id="inputContent" list="contentSug">
                <datalist id="contentSug">
                    <option></option>
                </datalist>
            </div>
            <div>
                <label for="inputIndexInContent" title="Objeto JSON con el índice del StoryMap. Estructura: {title, subtitle, js}. Usar false para deshabilitar. Por defecto: false">Índice de contenidos "indexInContent"</label>
                <input type="text" name="indexInContent" id="inputIndexInContent" list="indexSug">
                <datalist id="indexSug">
                    <option></option>
                    <option value="false"></option>
                </datalist>
            </div>
        </div>
        <div class="m-test-buttons">
            <button name="eliminar" class="m-test-button" id="removeButton">Eliminar Plugin</button>
        </div>
    </div>

    <div id="mapjs" class="m-container"></div>
    <script type="text/javascript" src="vendor/browser-polyfill.js"></script>
    <script type="text/javascript" src="js/apiidee.ol.min.js"></script>
    <script type="text/javascript" src="js/configuration.js"></script>
    <script type="text/javascript" src="plugins/storymap/storymap.ol.min.js"></script>
    <%
      String[] jsfiles = PluginsManager.getJSFiles(parameterMap);
      for (int i = 0; i < jsfiles.length; i++) {
         String jsfile = jsfiles[i];
   %>
    <script type="text/javascript" src="plugins/<%=jsfile%>"></script>

    <%
      }
   %>
    <script type="text/javascript">
        const urlParams = new URLSearchParams(window.location.search);
		const defaultContent = `{"es": {"head": {"title": "StoryMap"},"cap": [{"title": "Capítulo 0 Un recorrido por el Madrid cervantino.","subtitle": "Subtítulo capítulo 0","steps": [{"html": "<br><h3>Ejemplo Step 1</h3> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <br><br><br><br><br> <br>","js": "console.log('cap0 - step 1'); let impl = map.getImpl().getMapImpl();let view = impl.getView();view.animate({zoom: 16,center: [-412400.86, 4926815.10],duration: 2000,});"},{"html": "<br><h3>Ejemplo Step 2</h3> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <br> <br><br><br><br><br>","js": "console.log('cap0 - step 2'); let impl = map.getImpl().getMapImpl();let view = impl.getView();view.animate({zoom: 16,center: [-412400.86, 4926815.10],duration: 2000,});"}]},{"title": "Capítulo 1.- Vistazo a la ciudad del Siglo XVII","subtitle": "Subtítulo capítulo 2","steps": [{"html": "<br><h3>Ejemplo Step 1</h3> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <br><br><br><br><br><br><br><br>","js": "console.log('cap1 - step 1'); let impl = map.getImpl().getMapImpl();let view = impl.getView();view.animate({zoom: 16,center: [-412400.86, 4926815.10],duration: 2000,});"},{"html": "<br><h3>Ejemplo Step 1</h3> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <br> <br><br><br><br><br><br> <br>","js": "console.log('cap1 - step 2'); let impl = map.getImpl().getMapImpl();let view = impl.getView();view.animate({zoom: 16,center: [-412400.86, 4926815.10],duration: 2000,});"}]}]}}`;
		const defaultIndexInContent = `{"title": "Indice StoryMap","subtitle": "Visualizador de Cervantes y el Madrid del siglo XVII","js": "console.log('Índice de StoryMap cargado')"}`;
        
        IDEE.language.setLang(urlParams.get('language') || 'es');

        const map = IDEE.map({
            container: 'mapjs',
            zoom: 5,
            maxZoom: 20,
            minZoom: 2,
            center: [-467062.8225, 4783459.6216],
            });
            window.map = map;

            let mp = null;

            const createPlugin = (options) => {
                mp = new IDEE.plugin.StoryMap(options);
                window.mp = mp;
                map.addPlugin(mp);
            };

            const removePlugin = () => {
                if (mp) map.removePlugins(mp);
            };

            const removeButton = document.getElementById('removeButton');
            removeButton.addEventListener('click', () => { removePlugin(); });

            const selectPosition = document.getElementById('selectPosition');
            const selectCollapsed = document.getElementById('selectCollapsed');
            const inputOrder = document.getElementById('inputOrder');
            const inputTooltip = document.getElementById('inputTooltip');
            const inputDelay = document.getElementById('inputDelay');
            const inputContent = document.getElementById('inputContent');
            const inputIndexInContent = document.getElementById('inputIndexInContent');

            inputContent.value = defaultContent;
            inputIndexInContent.value = defaultIndexInContent;
            document.querySelector('#contentSug option').value = defaultContent;
            document.querySelector('#indexSug option').value = defaultIndexInContent;

            const updatePlugin = () => {
                const options = {};
                options.position = selectPosition.options[selectPosition.selectedIndex].value;
                options.collapsed = selectCollapsed.options[selectCollapsed.selectedIndex].value === '' || selectCollapsed.options[selectCollapsed.selectedIndex].value === 'true';
                options.order = Number(inputOrder.value);
                options.tooltip = inputTooltip.value;
                options.delay = Number(inputDelay.value);

                if (inputContent.value.trim() !== '') {
                    try { options.content = JSON.parse(inputContent.value); } catch (e) { options.content = undefined; }
                } else {
                    options.content = undefined;
                }

                const idxVal = inputIndexInContent.value.trim();
                if (idxVal === 'false') {
                    options.indexInContent = false;
                } else if (idxVal !== '') {
                    try { options.indexInContent = JSON.parse(idxVal); } catch (e) { options.indexInContent = undefined; }
                } else {
                    options.indexInContent = undefined;
                }

                removePlugin();
                createPlugin(options);
            };

            [
                selectPosition,
                selectCollapsed,
                inputOrder,
                inputTooltip,
                inputDelay,
                inputContent,
                inputIndexInContent,
            ].forEach((ctrl) => {
                ctrl.addEventListener('change', updatePlugin);
            });

            updatePlugin();
    </script>
</body>

<!-- Global site tag (gtag.js) - Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-19NTRSBP21"></script>
<script>
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', 'G-19NTRSBP21');
</script>

</html>
