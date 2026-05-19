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
    <link href="plugins/layerswitcher/layerswitcher.ol.min.css" rel="stylesheet" />
    <link href="plugins/sharemap/sharemap.ol.min.css" rel="stylesheet" />
    </link>
    <style type="text/css">
        html,
        body {
            margin: 0;
            padding: 0;
            height: 100%;
            overflow: auto;
        }
    </style>
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
                <label for="selectCollapsed" title="Indica si el plugin viene colapsado de entrada (true/false). Por defecto: true">Colapsado "collapsed"</label>
                <select name="collapsedValue" id="selectCollapsed">
                    <option value="" selected="selected"></option>
                    <option value="true">true</option>
                    <option value="false">false</option>
                </select>
            </div>
            <div>
                <label for="inputOrder"
                    title="Define en que posición del panel debe aparecer en el conjunto de controles o plugins">Orden
                    entre controles / plugins "order"</label>
                <input type="number" name="order" id="inputOrder" list="orderSug" value="-1">
            </div>
            <div>
                <label for="inputTooltip" title="Texto que se muestra al dejar el ratón encima del plugin. Por defecto: Gestor de capas">Título de la herramienta "tooltip"</label>
                <input type="text" name="tooltip" id="inputTooltip" list="tooltipSug">
                <datalist id="tooltipSug">
                    <option value="Gestor de capas"></option>
                </datalist>
            </div>
            <div>
                <label for="selectStatusLayers" title="Permite añadir la funcionalidad de mostrar/ocultar todas las capas. Solo aplica cuando modeSelectLayers es 'eyes'. Por defecto: true">Estado de capas "statusLayers"</label>
                <select name="statusValue" id="selectStatusLayers">
                    <option value="" selected="selected"></option>
                    <option value="true">true</option>
                    <option value="false">false</option>
                </select>
            </div>
            <div>
                <label for="selectAddLayers" title="Permite insertar la funcionalidad de añadir capas. Por defecto: true">Añadir capas "addLayers"</label>
                <select name="addValue" id="selectAddLayers">
                    <option value="" selected="selected"></option>
                    <option value="true">true</option>
                    <option value="false">false</option>
                </select>
            </div>
            <div>
                <label for="inputTools" title="Lista de herramientas disponibles para cada capa separadas por coma. Valores: transparency, zoom, legend, information, style, delete">Herramientas "tools"</label>
                <input type="text" name="tools" id="inputTools" list="toolsSug" value="transparency, zoom, legend, information, style, delete">
                <datalist id="toolsSug">
                    <option value="transparency, zoom, legend, information, style, delete"></option>
                    <option value="transparency, zoom, legend, information"></option>
                    <option value="transparency, zoom"></option>
                </datalist>
            </div>
            <div>
                <label for="isMoveLayers" title="Permite reordenar las capas arrastrándolas en el panel. Por defecto: false">Mover capas "isMoveLayers"</label>
                <select name="moveLayerValue" id="isMoveLayers">
                    <option value="" selected="selected"></option>
                    <option value="true">true</option>
                    <option value="false">false</option>
                </select>
            </div>
            <div>
                <label for="modeSelectLayers" title="Modo de selección de capas: eyes (visibilidad múltiple) o radio (selección única). Por defecto: eyes">Modo de selección "modeSelectLayers"</label>
                <select name="modeSelectLayersValue" id="modeSelectLayers">
                    <option value="" selected="selected"></option>
                    <option value="eyes">eyes</option>
                    <option value="radio">radio</option>
                </select>
            </div>
            <div>
                <label for="inputPrecharged" title="Objeto JSON con servicios y grupos precargados en el catálogo de capas. Si se deja vacío se usan los servicios por defecto">Servicios precargados "precharged"</label>
                <input type="text" name="precharged" id="inputPrecharged" list="prechargedSug">
                <datalist id="prechargedSug">
                    <option value='{"services": [{"type":"WMS","name":"Camino de Santiago","url":"https://www.ign.es/wms-inspire/camino-santiago"}],"groups":[{"name":"Cartografía","services":{"type":"WMTS","name": "Mapas","url":"https://www.ign.es/wmts/mapa-raster?"}}]}'></option>
                </datalist>
            </div>
            <div>
                <label for="isHttp" title="Permite añadir capas con URL HTTP en el catálogo. Por defecto: true">HTTP "http"</label>
                <select name="isHttpValue" id="isHttp">
                    <option value="" selected="selected"></option>
                    <option value="true">true</option>
                    <option value="false">false</option>
                </select>
            </div>
            <div>
                <label for="isHttps" title="Permite añadir capas con URL HTTPS en el catálogo. Por defecto: true">HTTPS "https"</label>
                <select name="isHttpsValue" id="isHttps">
                    <option value="" selected="selected"></option>
                    <option value="true">true</option>
                    <option value="false">false</option>
                </select>
            </div>
            <div>
                <label for="isShowCatalog" title="Muestra el botón de catálogo para buscar y añadir servicios externos. Por defecto: false">Mostrar catálogo "showCatalog"</label>
                <select name="isShowCatalogValue" id="isShowCatalog">
                    <option value="" selected="selected"></option>
                    <option value="true">true</option>
                    <option value="false">false</option>
                </select>
            </div>
            <div>
                <label for="selectProxy" title="Utiliza proxy para las peticiones de capas. Por defecto: true">Proxy "useProxy"</label>
                <select name="proxyValue" id="selectProxy">
                    <option value="" selected="selected"></option>
                    <option value="true">true</option>
                    <option value="false">false</option>
                </select>
            </div>
            <div>
                <label for="selectDisplay" title="Muestra la etiqueta con el tipo de capa (WMS, TMS, GeoJSON...). Por defecto: false">Etiqueta de tipo "displayLabel"</label>
                <select name="displayValue" id="selectDisplay">
                    <option value="" selected="selected"></option>
                    <option value="true">true</option>
                    <option value="false">false</option>
                </select>
            </div>
            <div>
                <label for="selectUseAttributions" title="Muestra las atribuciones de las nuevas capas añadidas desde el catálogo o desde los servicios precargados. Es necesario haber instanciado e insertado el control 'attributions' en el mapa. Por defecto: false">Atribuciones "useAttributions"</label>
                <select name="attributionsValue" id="selectUseAttributions">
                    <option value="" selected="selected"></option>
                    <option value="true">true</option>
                    <option value="false">false</option>
                </select>
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
    <script type="text/javascript" src="plugins/layerswitcher/layerswitcher.ol.min.js"></script>
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

        const map = IDEE.map({
            container: 'mapjs',
            zoom: 5,
            maxZoom: 20,
            minZoom: 2,
            center: [-467062.8225, 4783459.6216],
            controls: ['attributions']
        });
        window.map = map;

        const PRECHARGED = {
            services: [{
                type: 'WMS', name: 'Camino de Santiago',
                url: 'https://www.ign.es/wms-inspire/camino-santiago',
            }, {
                type: 'WMS', name: 'Redes Geodésicas',
                url: 'https://www.ign.es/wms-inspire/redes-geodesicas',
            }, {
                type: 'WMS', name: 'Planimetrías',
                url: 'https://www.ign.es/wms/minutas-cartograficas',
            }, {
                type: 'MapLibre', name: 'Mapa Libre', legend: 'Mapa Libre',
                url: 'https://vt-mapabase.idee.es/files/styles/mapaBase_scn_color1_CNIG.json',
            }],
            groups: [{
                name: 'Cartografía',
                services: [{
                    type: 'WMTS', name: 'Mapas',
                    url: 'https://www.ign.es/wmts/mapa-raster?',
                }, {
                    type: 'WMTS', name: 'Callejero',
                    url: 'https://www.ign.es/wmts/ign-base?',
                }, {
                    type: 'WMTS', name: 'Primera edición MTN y Minutas de 1910-1970',
                    url: 'https://www.ign.es/wmts/primera-edicion-mtn?',
                }, {
                    type: 'WMS', name: 'Planimetrías (1870 y 1950)',
                    url: 'https://www.ign.es/wms/minutas-cartograficas?',
                }, {
                    type: 'WMTS', name: 'Planos de Madrid (1622 - 1960)',
                    url: 'https://www.ign.es/wmts/planos?',
                }, {
                    type: 'WMS', name: 'Hojas kilométricas (Madrid - 1860)',
                    url: 'https://www.ign.es/wms/hojas-kilometricas?',
                }, {
                    type: 'WMS', name: 'Cuadrículas Mapa Topográfico Nacional',
                    url: 'https://www.ign.es/wms-inspire/cuadriculas?',
                }],
            }, {
                name: 'Imágenes',
                services: [{
                    type: 'WMTS', name: 'Ortofotos máxima actualidad PNOA',
                    url: 'https://www.ign.es/wmts/pnoa-ma?',
                }, {
                    type: 'WMS', name: 'Ortofotos históricas y PNOA anual',
                    url: 'https://www.ign.es/wms/pnoa-historico?',
                }, {
                    type: 'WMS', name: 'Ortofotos provisionales PNOA',
                    url: 'https://wms-pnoa.idee.es/pnoa-provisionales?',
                }, {
                    type: 'WMS', name: 'Mosaicos de satélite',
                    url: 'https://wms-satelites-historicos.idee.es/satelites-historicos?',
                }, {
                    type: 'WMS', name: 'Fototeca (Consulta de fotogramas históricos y PNOA)',
                    url: 'https://wms-fototeca.idee.es/fototeca?',
                }],
            }, {
                name: 'Información geográfica de referencia y temática',
                services: [{
                    type: 'WMS', name: 'Catastro',
                    url: 'https://ovc.catastro.meh.es/Cartografia/WMS/ServidorWMS.aspx?',
                }, {
                    type: 'WMS', name: 'Unidades administrativas',
                    url: 'https://www.ign.es/wms-inspire/unidades-administrativas?',
                }, {
                    type: 'WMS', name: 'Nombres geográficos (Nomenclátor Geográfico Básico NGBE)',
                    url: 'https://www.ign.es/wms-inspire/ngbe?',
                }, {
                    type: 'WMS', name: 'Redes de transporte',
                    url: 'https://servicios.idee.es/wms-inspire/transportes?',
                }, {
                    type: 'WMS', name: 'Hidrografía',
                    url: 'https://servicios.idee.es/wms-inspire/hidrografia?',
                }, {
                    type: 'WMS', name: 'Direcciones y códigos postales',
                    url: 'https://www.cartociudad.es/wms-inspire/direcciones-ccpp?',
                }, {
                    type: 'WMTS', name: 'Ocupación del suelo (Corine y SIOSE)',
                    url: 'https://servicios.idee.es/wmts/ocupacion-suelo?',
                }, {
                    type: 'WMS', name: 'Ocupación del suelo Histórico (Corine y SIOSE)',
                    url: 'https://servicios.idee.es/wms-inspire/ocupacion-suelo-historico?',
                }, {
                    type: 'WMS', name: 'Copernicus Land Monitoring Service',
                    url: 'https://servicios.idee.es/wms/copernicus-landservice-spain?',
                }, {
                    type: 'WMS', name: 'Información sísmica (terremotos)',
                    url: 'https://www.ign.es/wms-inspire/geofisica?',
                }, {
                    type: 'WMS', name: 'Red de vigilancia volcánica',
                    url: 'https://wms-volcanologia.ign.es/volcanologia?',
                }, {
                    type: 'WMS', name: 'Redes geodésicas',
                    url: 'https://www.ign.es/wms-inspire/redes-geodesicas?',
                }],
            }, {
                name: 'Modelos digitales de elevaciones',
                services: [{
                    type: 'WMTS', name: 'Modelo Digital de Superficies (Sombreado superficies y consulta de elevaciones edificios y vegetación)',
                    url: 'https://wmts-mapa-lidar.idee.es/lidar?',
                }, {
                    type: 'WMTS', name: 'Modelo Digital del Terreno (Sombreado terreno y consulta de altitudes)',
                    url: 'https://servicios.idee.es/wmts/mdt?',
                    white_list: ['EL.ElevationGridCoverage'],
                }, {
                    type: 'WMS', name: 'Curvas de nivel y puntos acotados',
                    url: 'https://servicios.idee.es/wms-inspire/mdt?',
                    white_list: ['EL.ContourLine', 'EL.SpotElevation'],
                }],
            }],
        };

        const capaGeoJSON = new IDEE.layer.GeoJSON({
            name: 'Capa GeoJSON',
            url: 'https://www.ign.es/resources/geodesia/GNSS/SPTR_geo.json',
            extract: false,
        });

        map.addLayers(capaGeoJSON);

        const capaWMS = new IDEE.layer.WMS({
            url: 'https://www.ign.es/wms-inspire/unidades-administrativas?',
            name: 'AU.AdministrativeUnit',
            legend: 'Capa WMS',
        });

        map.addLayers(capaWMS);

        let mp = null;

        const createPlugin = (options) => {
            mp = new IDEE.plugin.Layerswitcher(options);
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
        const inputTooltip = document.getElementById('inputTooltip');
        const inputOrder = document.getElementById('inputOrder');
        const selectAdd = document.getElementById('selectAddLayers');
        const selectStatus = document.getElementById('selectStatusLayers');
        const inputTools = document.getElementById('inputTools');
        const selectMoveLayer = document.getElementById('isMoveLayers');
        const selectModeSelectLayers = document.getElementById('modeSelectLayers');
        const inputPrecharged = document.getElementById('inputPrecharged');
        const selectHttp = document.getElementById('isHttp');
        const selectHttps = document.getElementById('isHttps');
        const selectShowCatalog = document.getElementById('isShowCatalog');
        const selectProxy = document.getElementById('selectProxy');
        const selectDisplay = document.getElementById('selectDisplay');
        const selectUseAttributions = document.getElementById('selectUseAttributions');

        const boolVal = (select, defaultVal = true) => {
            const v = select.options[select.selectedIndex].value;
            if (v === '') return defaultVal;
            return v === 'true';
        };

        const updatePlugin = () => {
            const options = {};
            options.position = selectPosition.options[selectPosition.selectedIndex].value;
            options.collapsed = selectCollapsed.options[selectCollapsed.selectedIndex].value === '' || selectCollapsed.options[selectCollapsed.selectedIndex].value === 'true';
            options.order = Number(inputOrder.value);
            options.addLayers = boolVal(selectAdd, true);
            options.statusLayers = boolVal(selectStatus, true);
            options.tooltip = inputTooltip.value || '';
            options.tools = inputTools.value !== '' ? inputTools.value.split(', ') : [];
            options.isMoveLayers = boolVal(selectMoveLayer, false);
            options.modeSelectLayers = selectModeSelectLayers.options[selectModeSelectLayers.selectedIndex].value || 'eyes';
            if (inputPrecharged.value.trim() !== '') {
                try { options.precharged = JSON.parse(inputPrecharged.value); } catch (e) { options.precharged = inputPrecharged.value; }
            } else {
                options.precharged = PRECHARGED;
            }
            options.http = boolVal(selectHttp, true);
            options.https = boolVal(selectHttps, true);
            options.showCatalog = boolVal(selectShowCatalog, false);
            options.useProxy = boolVal(selectProxy, true);
            options.displayLabel = boolVal(selectDisplay, false);
            options.useAttributions = boolVal(selectUseAttributions, false);

            removePlugin();
            createPlugin(options);
        };

        [
            selectPosition,
            selectCollapsed,
            inputOrder,
            inputTooltip,
            selectAdd,
            selectStatus,
            inputTools,
            selectMoveLayer,
            selectModeSelectLayers,
            inputPrecharged,
            selectHttp,
            selectHttps,
            selectShowCatalog,
            selectProxy,
            selectDisplay,
            selectUseAttributions,
        ].forEach((ctrl) => {
            ctrl.addEventListener('change', updatePlugin);
        });

        updatePlugin();
        const mp2 = new IDEE.plugin.ShareMap({
            baseUrl: window.location.href.substring(0, window.location.href.indexOf('api-idee')) + "api-idee/",
            position: "right",
        });
        map.addPlugin(mp2);
    </script>
</body>

<!-- Global site tag (gtag.js) - Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-19NTRSBP21"></script>
<script>
    window.dataLayer = window.dataLayer || [];

    function gtag() {
        dataLayer.push(arguments);
    }
    gtag('js', new Date());
    gtag('config', 'G-19NTRSBP21');
</script>

</html>
