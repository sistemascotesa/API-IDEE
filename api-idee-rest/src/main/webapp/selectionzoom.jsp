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
    <link href="plugins/selectionzoom/selectionzoom.ol.min.css" rel="stylesheet" />
    <link href="plugins/sharemap/sharemap.ol.min.css" rel="stylesheet" />
    </link>
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
                <label for="selectPosition" title="Posición del plugin sobre el mapa. Por defecto: izquierda">Posición "position"</label>
                <select name="position" id="selectPosition">
                    <option value="" selected="selected"></option>
                    <option value="left">Izquierda</option>
                    <option value="right">Derecha</option>
                </select>
            </div>
            <div>
                <label for="selectCollapsed" title="Indica si el plugin viene colapsado de entrada (true/false). Por defecto: true">Colapsado "collapsed"</label>
                <select name="collapsed" id="selectCollapsed">
                    <option value="" selected="selected"></option>
                    <option value="true">true</option>
                    <option value="false">false</option>
                </select>
            </div>
            <div>
                <label for="inputOrder" title="Define en qué posición del panel debe aparecer en el conjunto de controles o plugins">Orden entre controles / plugins "order"</label>
                <input type="number" name="order" id="inputOrder" list="orderSug" value="-1">
            </div>
            <div>
                <label for="inputTooltip" title="Texto que se muestra al dejar el ratón encima del plugin. Por defecto: Vistas predefinidas">Título de la herramienta "tooltip"</label>
                <input type="text" name="tooltip" id="inputTooltip" list="tooltipSug" value="Vistas predefinidas">
                <datalist id="tooltipSug">
                    <option value="Vistas predefinidas"></option>
                </datalist>
            </div>
            <div>
                <label for="inputOptions" title="Array JSON de zonas predefinidas. Cada zona puede tener: id, title, preview, bbox o (zoom + center)">Zonas predefinidas "options"</label>
                <input type="text" name="options" id="inputOptions" list="optionsSug" value='[{"id":"peninsula","title":"Peninsula","preview":"plugins/selectionzoom/images/espana.png","bbox":"-1200091.444315327, 4348955.797933925, 365338.89496508264, 5441088.058207252"},{"id":"canarias","title":"Canarias","preview":"plugins/selectionzoom/images/canarias.png","center":"-1844272.618465, 3228700.074766","zoom":8},{"id":"baleares","title":"Baleares","preview":"plugins/selectionzoom/images/baleares.png","bbox":"115720.89020469127,4658411.436032817,507078.4750247937,4931444.501067467"},{"id":"ceuta","title":"Ceuta","preview":"plugins/selectionzoom/images/ceuta.png","bbox":"-599755.2558583047, 4281734.817081453, -587525.3313326766, 4290267.100363785"},{"id":"melilla","title":"Melilla","preview":"plugins/selectionzoom/images/melilla.png","center":"-327838.4143151213, 4203788.135342773","zoom":14}]'>
                <datalist id="optionsSug">
                    <option value='[{"id":"peninsula","title":"Peninsula","preview":"plugins/selectionzoom/images/espana.png","bbox":"-1200091.444315327, 4348955.797933925, 365338.89496508264, 5441088.058207252"},{"id":"canarias","title":"Canarias","preview":"plugins/selectionzoom/images/canarias.png","center":"-1844272.618465, 3228700.074766","zoom":8},{"id":"baleares","title":"Baleares","preview":"plugins/selectionzoom/images/baleares.png","bbox":"115720.89020469127,4658411.436032817,507078.4750247937,4931444.501067467"},{"id":"ceuta","title":"Ceuta","preview":"plugins/selectionzoom/images/ceuta.png","bbox":"-599755.2558583047, 4281734.817081453, -587525.3313326766, 4290267.100363785"},{"id":"melilla","title":"Melilla","preview":"plugins/selectionzoom/images/melilla.png","center":"-327838.4143151213, 4203788.135342773","zoom":14}]'></option>
                    <option value='[{"id":"peninsula","title":"Peninsula","preview":"plugins/selectionzoom/images/espana.png","center":"-417376.27467512223, 4895021.928070588", "zoom": "6"}]'></option>
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
    <script type="text/javascript" src="plugins/selectionzoom/selectionzoom.ol.min.js"></script>
    <script type="text/javascript" src="plugins/sharemap/sharemap.ol.min.js"></script>
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
        IDEE.language.setLang(urlParams.get('language') || 'es');

        const layerinicial = new IDEE.layer.WMS({
            url: 'https://www.ign.es/wms-inspire/unidades-administrativas?',
            name: 'AU.AdministrativeBoundary',
            legend: 'Limite administrativo',
            tiled: false,
        }, {});

        const layerUA = new IDEE.layer.WMS({
            url: 'https://www.ign.es/wms-inspire/unidades-administrativas?',
            name: 'AU.AdministrativeUnit',
            legend: 'Unidad administrativa',
            tiled: false
        }, {});
        
        const map = IDEE.map({
            container: 'mapjs',
            zoom: 5,
            maxZoom: 20,
            minZoom: 2,
            center: [-467062.8225, 4783459.6216],
        });
        window.map = map;
        map.addLayers([layerinicial, layerUA]);

        const DEFAULT_OPTIONS = [
            {
                id: 'peninsula',
                title: 'Peninsula',
                preview: 'plugins/selectionzoom/images/espana.png',
                bbox: '-1200091.444315327, 4348955.797933925, 365338.89496508264, 5441088.058207252',
            },
            {
                id: 'canarias',
                title: 'Canarias',
                preview: 'plugins/selectionzoom/images/canarias.png',
                center: '-1844272.618465, 3228700.074766',
                zoom: 8,
            },
            {
                id: 'baleares',
                title: 'Baleares',
                preview: 'plugins/selectionzoom/images/baleares.png',
                bbox: '115720.89020469127,4658411.436032817,507078.4750247937,4931444.501067467',
            },
            {
                id: 'ceuta',
                title: 'Ceuta',
                preview: 'plugins/selectionzoom/images/ceuta.png',
                bbox: '-599755.2558583047, 4281734.817081453, -587525.3313326766, 4290267.100363785',
            },
            {
                id: 'melilla',
                title: 'Melilla',
                preview: 'plugins/selectionzoom/images/melilla.png',
                center: '-327838.4143151213, 4203788.135342773',
                zoom: 14,
            },
        ];

        let mp = null;

        const createPlugin = (options) => {
            mp = new IDEE.plugin.SelectionZoom(options);
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
        const inputOptions = document.getElementById('inputOptions');

        const boolVal = (select, defaultVal = true) => {
            const v = select.options[select.selectedIndex].value;
            if (v === '') return defaultVal;
            return v === 'true';
        };

        const updatePlugin = () => {
            removePlugin();
            const options = {};
            options.position = selectPosition.options[selectPosition.selectedIndex].value;
            options.collapsed = boolVal(selectCollapsed, true);
            options.order = Number(inputOrder.value);
            options.tooltip = inputTooltip.value || '';
            if (inputOptions.value.trim() !== '') {
                try { options.options = JSON.parse(inputOptions.value); } catch (e) { options.options = DEFAULT_OPTIONS; }
            } else {
                options.options = DEFAULT_OPTIONS;
            }
            createPlugin(options);
        };

        [
            selectPosition,
            selectCollapsed,
            inputOrder,
            inputTooltip,
            inputOptions,
        ].forEach((ctrl) => {
            ctrl.addEventListener('change', updatePlugin);
        });

        updatePlugin();
        const mp2 = new IDEE.plugin.ShareMap({
            baseUrl: window.location.href.substring(0, window.location.href.indexOf('api-idee')) + "api-idee/",
            position: "left",
        });
        map.addPlugin(mp2);
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
