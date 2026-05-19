<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8" %>
    <%@ page import="es.api_idee.plugins.PluginsManager" %>
        <%@ page import="java.util.Map" %>

            <!DOCTYPE html>
            <html lang="es">

            <head>
                <meta charset="UTF-8">
                <meta name="viewport"
                    content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0">
                <meta http-equiv="X-UA-Compatible" content="IE=edge" />
                <meta name="idee" content="yes">
                <title>Basic TEST</title>
                <link type="text/css" rel="stylesheet" href="assets/css/apiidee.ol.min.css" />
                <link href="plugins/basic/basic.ol.min.css" rel="stylesheet" />
                <link href="plugins/sharemap/sharemap.ol.min.css" rel="stylesheet" />
                <% Map<String, String[]> parameterMap = request.getParameterMap();
                    PluginsManager.init (getServletContext());
                    String[] cssfiles = PluginsManager.getCSSFiles(parameterMap);
                    for (int i = 0; i < cssfiles.length; i++) { String cssfile=cssfiles[i]; %>
                        <link type="text/css" rel="stylesheet" href="plugins/<%=cssfile%>">
                        </link>
                        <% } %>
            </head>

            <body>
                <div class="m-api-idee-test-form-frame">
                    <div class="m-test-form">
                        <div>
                            <label for="selectPosition"
                                title="Posición del plugin sobre el mapa. Por defecto: right">Posición del plugin "position"</label>
                            <select name="position" id="selectPosition">
                                <option value="" selected="selected"></option>
                                <option value="left">Izquierda (left)</option>
                                <option value="right">Derecha (right)</option>
                            </select>
                        </div>
                        <div>
                            <label for="selectCollapsed"
                                title="Indica si el plugin aparece colapsado al inicio (true/false). Por defecto: true">Colapsado al inicio "collapsed"</label>
                            <select name="collapsed" id="selectCollapsed">
                                <option value="" selected="selected"></option>
                                <option value="true">true</option>
                                <option value="false">false</option>
                            </select>
                        </div>
                        <div>
                            <label for="inputOrder"
                                title="Define en qué posición del panel debe aparecer en el conjunto de controles o plugins">Orden
                                entre controles / plugins "order"</label>
                            <input type="number" name="order" id="inputOrder" list="orderSug" value="-1">
                        </div>
                        <div>
                            <label for="inputTooltip"
                                title="Información emergente que se muestra al dejar el ratón encima del plugin.">Tooltip del plugin "tooltip"</label>
                            <input type="text" name="tooltip" id="inputTooltip" list="tooltipSug">
                            <datalist id="tooltipSug">
                                <option value="Plantilla plugin"></option>
                            </datalist>
                        </div>
                        <input type="hidden" id="buttonAPI" value="API Rest" />
                    </div>
                    <div class="m-test-buttons">
                        <button name="eliminar" class="m-test-button" id="botonEliminar">Eliminar Plugin</button>
                    </div>
                </div>
                <div id="mapjs" class="m-container"></div>
                <script type="text/javascript" src="vendor/browser-polyfill.js"></script>
                <script type="text/javascript" src="js/apiidee.ol.min.js"></script>
                <script type="text/javascript" src="js/configuration.js"></script>
                <script type="text/javascript" src="plugins/basic/basic.ol.min.js"></script>
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
                            });

                            let mp;

                            const selectPosition = document.getElementById('selectPosition');
                            const selectCollapsed = document.getElementById('selectCollapsed');
                            const inputOrder = document.getElementById('inputOrder');
                            const inputTooltip = document.getElementById('inputTooltip');
                            const botonEliminar = document.getElementById('botonEliminar');

                            const parseBool = (val) => {
                                if (val === 'true') return true;
                                if (val === 'false') return false;
                                return undefined;
                            };

                            const createPlugin = (options) => {
                                mp = new IDEE.plugin.Basic(options);
                                window.mp = mp;
                                map.addPlugin(mp);
                            };

                            const removePlugin = () => {
                                if (mp) map.removePlugins(mp);
                            };

                            const updatePlugin = () => {
                                const options = {};
                                options.position = selectPosition.value;
                                options.collapsed = parseBool(selectCollapsed.value);
                                options.order = Number(inputOrder.value);
                                options.tooltip = inputTooltip.value;
                                removePlugin();
                                createPlugin(options);
                            };

                            [
                                selectPosition,
                                selectCollapsed,
                                inputOrder,
                                inputTooltip,
                            ].forEach((ctrl) => {
                                ctrl.addEventListener('change', updatePlugin);
                            });

                            botonEliminar.addEventListener('click', removePlugin);

                            const mp2 = new IDEE.plugin.ShareMap({
                                baseUrl: window.location.href.substring(0, window.location.href.indexOf('api-idee')) + "api-idee/",
                                position: "right",
                            });
                            map.addPlugin(mp2);

                            updatePlugin();
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
