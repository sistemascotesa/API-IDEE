<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8" %>
    <%@ page import="es.api_idee.plugins.PluginsManager" %>
        <%@ page import="java.util.Map" %>

            <!DOCTYPE html>
            <html lang="en">

            <head>
                <meta charset="UTF-8">
                <meta name="viewport"
                    content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0">
                <meta http-equiv="X-UA-Compatible" content="IE=edge" />
                <meta name="idee" content="yes">
                <title>Visor base</title>
                <link type="text/css" rel="stylesheet" href="assets/css/apiidee.ol.min.css">
                <link href="plugins/locatorscn/locatorscn.ol.min.css" rel="stylesheet" />
                <link href="plugins/sharemap/sharemap.ol.min.css" rel="stylesheet" />
                <% Map<String, String[]> parameterMap = request.getParameterMap();
                    PluginsManager.init (getServletContext());
                    String[] cssfiles = PluginsManager.getCSSFiles(parameterMap);
                    for (int i = 0; i < cssfiles.length; i++) { String cssfile=cssfiles[i]; %>
                        <link type="text/css" rel="stylesheet" href="plugins/<%=cssfile%>">
                        </link>
                        <% } %>
                <style rel="stylesheet">
                    html,
                    body {
                        margin: 0;
                        padding: 0;
                        height: 100%;
                        overflow: hidden;
                    }
                </style>
            </head>

            <body>
                <div class="m-api-idee-test-form-frame">
                    <div class="m-test-form">
                        <div>
                            <label for="selectPosition" title="Posición del plugin sobre el mapa">Posición "position"</label>
                            <select name="position" id="selectPosition">
                                <option value="" selected="selected"></option>
                                <option value="left">Izquierda</option>
                                <option value="right">Derecha</option>
                            </select>
                        </div>
                        <div>
                            <label for="selectCollapsed"
                                title="Indica si el plugin viene colapsado de entrada (true/false). Por defecto: true">Colapsado
                                "collapsed"</label>
                            <select name="collapsed" id="selectCollapsed">
                                <option value=""></option>
                                <option value="true" selected="selected">true</option>
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
                            <label for="inputTooltip"
                                title="Texto que se muestra al dejar el ratón encima del plugin.">Título
                                de la herramienta "tooltip"</label>
                            <input type="text" name="tooltip" id="inputTooltip" list="tooltipSug">
                            <datalist id="tooltipSug">
                                <option value="Localizador"></option>
                            </datalist>
                        </div>
                        <div>
                            <label for="inputZoom"
                                title="Nivel de zoom al que se centrará el mapa al seleccionar un resultado. Por defecto: 16">Zoom
                                al localizar "zoom"</label>
                            <input type="number" id="inputZoom" value="16" min="1" max="20" step="1">
                        </div>
                        <div>
                            <label for="selectPointStyle"
                                title="Estilo del icono que se muestra al seleccionar un resultado puntual. Valores: pinAzul, pinRojo, pinMorado. Por defecto: pinAzul">Estilo
                                del punto "pointStyle"</label>
                            <select name="pointStyle" id="selectPointStyle">
                                <option value="pinAzul" selected="selected">pinAzul</option>
                                <option value="pinRojo">pinRojo</option>
                                <option value="pinMorado">pinMorado</option>
                            </select>
                        </div>
                        <div>
                            <label for="inputSearchOptions"
                                title="Opciones de búsqueda. Objeto JSON con propiedades: reverse, resultVisibility, urlAutocomplete, urlReverse, sources, size, layers, radius, addendum, peliasCoords. Escribe false para desactivar">Opciones
                                de búsqueda "searchOptions"</label>
                            <input type="text" id="inputSearchOptions" list="searchOptionsSug">
                            <datalist id="searchOptionsSug">
                                <option value='{"reverse":true,"resultVisibility":true,"size":10,"layers":"address,street,venue","radius":200}'></option>
                            </datalist>
                        </div>
                        <div>
                            <label for="selectUseProxy"
                                title="Indica si se utiliza proxy en las peticiones (true/false). Por defecto: valor global de IDEE.useproxy">Usar
                                proxy "useProxy"</label>
                            <select name="useProxy" id="selectUseProxy">
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
                <script type="text/javascript" src="plugins/locatorscn/locatorscn.ol.min.js"></script>
                <script type="text/javascript" src="plugins/sharemap/sharemap.ol.min.js"></script>
                <% String[] jsfiles=PluginsManager.getJSFiles(parameterMap); for (int i=0; i < jsfiles.length; i++) {
                    String jsfile=jsfiles[i]; %>
                    <script type="text/javascript" src="plugins/<%=jsfile%>"></script>
                    <% } %>
                        <script type="text/javascript">
                            const urlParams = new URLSearchParams(window.location.search);
                            IDEE.language.setLang(urlParams.get('language') || 'es');

                            const map = IDEE.map({
                                container: 'mapjs',
                                zoom: 5,
                                maxZoom: 20,
                                minZoom: 4,
                                center: [-467062.8225, 4783459.6216],
                            });

                            const layerinicial = new IDEE.layer.WMS({
                                url: 'http://www.ign.es/wms-inspire/unidades-administrativas?',
                                name: 'AU.AdministrativeBoundary',
                                legend: 'Limite administrativo',
                                tiled: false,
                            }, {});

                            map.addLayers([layerinicial]);

                            let mp;

                            const createPlugin = (options) => {
                                mp = new IDEE.plugin.Locatorscn(options);
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
                            const inputZoom = document.getElementById('inputZoom');
                            const selectPointStyle = document.getElementById('selectPointStyle');
                            const inputSearchOptions = document.getElementById('inputSearchOptions');
                            const selectUseProxy = document.getElementById('selectUseProxy');

                            const safeParseJSON = (val, fallback) => {
                                try { return val ? JSON.parse(val) : fallback; } catch (e) { return fallback; }
                            };

                            const updatePlugin = () => {
                                const options = {};
                                options.position = selectPosition.options.value;
                                options.collapsed = selectCollapsed.options[selectCollapsed.selectedIndex].value === '' || selectCollapsed.options[selectCollapsed.selectedIndex].value === 'true';
                                options.order = Number(inputOrder.value);
                                options.tooltip = inputTooltip.value;
                                options.zoom = Number(inputZoom.value);
                                options.pointStyle = selectPointStyle.value;
                                options.searchOptions = safeParseJSON(inputSearchOptions.value, {});
                                if (selectUseProxy.value !== '') options.useProxy = selectUseProxy.value === 'true';

                                removePlugin();
                                createPlugin(options);
                            };

                            [
                                selectPosition,
                                selectCollapsed,
                                inputOrder,
                                inputTooltip,
                                inputZoom,
                                selectPointStyle,
                                inputSearchOptions,
                                selectUseProxy,
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
                function gtag() { dataLayer.push(arguments); }
                gtag('js', new Date());
                gtag('config', 'G-19NTRSBP21');
            </script>

            </html>
