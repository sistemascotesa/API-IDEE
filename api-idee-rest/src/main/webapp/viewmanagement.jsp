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
                <link type="text/css" rel="stylesheet" href="assets/css/apiidee.ol.min.css" />
                <link href="plugins/viewmanagement/viewmanagement.ol.min.css" rel="stylesheet" />
                <link href="plugins/sharemap/sharemap.ol.min.css" rel="stylesheet" />
                <style type="text/css">
                    html,
                    body {
                        margin: 0;
                        padding: 0;
                        height: 100%;
                        overflow: auto;
                    }
                </style>
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
                    <div class="m-test-form" style="max-height: 14.2rem;">
                        <div>
                            <label for="selectPosicion" title="Posición del plugin sobre el mapa. Por defecto: left">Posición del panel "position"</label>
                            <select name="position" id="selectPosicion">
                                <option value="" selected="selected"></option>
                                <option value="left">Izquierda (left)</option>
                                <option value="right">Derecha (right)</option>
                            </select>
                        </div>
                        <div>
                            <label for="inputOrder" title="Define en que posición del panel debe aparecer en el conjunto de controles o plugins">Orden en la posición asignada "order"</label>
                            <input type="number" name="order" id="inputOrder" value="-1">
                        </div>
                        <div>
                            <label for="inputTooltip"  title="Texto que se muestra al dejar el ratón encima del plugin">Información de la herramienta "tooltip"</label>
                            <input type="text" name="tooltip" id="inputTooltip" value="">
                        </div>
                        <div>
                            <label for="selectCollapsed" title="Indica si el plugin viene colapsado de entrada (true/false). Por defecto: true">Panel colapsado "collapsed"</label>
                            <select name="collapsed" id="selectCollapsed">
                                <option value='' selected="selected"></option>
                                <option value="true">true</option>
                                <option value="false">false</option>
                            </select>
                        </div>
                        <div>
                            <label for="inputPredefinedZoom" title="Habilita el control que define los niveles de zoom predefinidos (true | false | JSON array)">Zoom predefinido "predefinedZoom"</label>
                            <input type="text" name="predefinedZoom" id="inputPredefinedZoom" value='[{"name": "Zoom con CENTER", "center": [-428106.866, 4334472.253], "zoom": 4},{"name": "Zoom con BBOX", "bbox": [-2392173.2372, 3033021.2824, 1966571.8637, 6806768.1648]}]'>
                            <datalist id="tooltipSug">
                                <option value=""></option>
                                <option value='[{"name": "Zoom con CENTER", "center": [-428106.866, 4334472.253], "zoom": 4},{"name": "Zoom con BBOX", "bbox": [-2392173.2372, 3033021.2824, 1966571.8637, 6806768.1648]}]'></option>
                            </datalist>
                        </div>
                        <div>
                            <label for="selectZoomExtent" title="Habilita el control que muestra las opciones de centrar la vista del mapa en un recuadro dibujado. Por defecto: true">Zoom a extensión total "zoomExtent"</label>
                            <select name="zoomExtent" id="selectZoomExtent">
                                <option value='' selected="selected"></option>
                                <option value="true">true</option>
                                <option value="false">false</option>
                            </select>
                        </div>
                        <div>
                            <label for="selectViewhistory" title="Habilita el control que muestra las opciones de visualizar el historial de zooms. Por defecto: true">Historial de vistas "viewhistory"</label>
                            <select name="viewhistory" id="selectViewhistory">
                                <option value='' selected="selected"></option>
                                <option value="true">true</option>
                                <option value="false">false</option>
                            </select>
                        </div>
                        <div>
                            <label for="selectZoompanel" title="Habilita el control que muestra las opciones de modificar el zoom a través del panel. Por defecto: true">Panel de zoom "zoompanel"</label>
                            <select name="zoompanel" id="selectZoompanel">
                                <option value='' selected="selected"></option>
                                <option value="true">true</option>
                                <option value="false">false</option>
                            </select>
                        </div>
                    </div>
                    <div class="m-test-buttons">
                        <button id="removeButton">Eliminar plugin</button>
                    </div>
                </div>
                <div id="mapjs" class="m-container"></div>
                <script type="text/javascript" src="vendor/browser-polyfill.js"></script>
                <script type="text/javascript" src="js/apiidee.ol.min.js"></script>
                <script type="text/javascript" src="js/configuration.js"></script>
                <script type="text/javascript" src="plugins/viewmanagement/viewmanagement.ol.min.js"></script>
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
                            let mp = null;

                            const selectPosicion = document.getElementById('selectPosicion');
                            const inputOrder = document.getElementById('inputOrder');
                            const inputTooltip = document.getElementById('inputTooltip');
                            const selectCollapsed = document.getElementById('selectCollapsed');
                            const inputPredefinedZoom = document.getElementById('inputPredefinedZoom');
                            const selectZoomExtent = document.getElementById('selectZoomExtent');
                            const selectViewhistory = document.getElementById('selectViewhistory');
                            const selectZoompanel = document.getElementById('selectZoompanel');

                            function create(propiedades) {
                                mp = new IDEE.plugin.ViewManagement(propiedades);
                                map.addPlugin(mp);
                            }

                            function remove() {
                                if (mp) map.removePlugin(mp);
                                mp = null;
                            }

                            function changeTest() {
                                remove();
                                const options = {};

                                const selectPosition = selectPosicion.options[selectPosicion.selectedIndex].value;
                                if (selectPosition !== '') options.position = selectPosition;

                                if (inputTooltip.value !== '') options.tooltip = inputTooltip.value;

                                const collapsed = selectCollapsed.options[selectCollapsed.selectedIndex].value;
                                if (collapsed !== '') options.collapsed = (collapsed === 'true');

                                if (inputOrder.value !== undefined) options.order = Number(inputOrder.value);

                                if (inputPredefinedZoom.value !== '') options.predefinedZoom = JSON.parse(inputPredefinedZoom.value);

                                const zoomExtent = selectZoomExtent.options[selectZoomExtent.selectedIndex].value;
                                if (zoomExtent !== '') options.zoomExtent = (zoomExtent === 'true');

                                const viewhistory = selectViewhistory.options[selectViewhistory.selectedIndex].value;
                                if (viewhistory !== '') options.viewhistory = (viewhistory === 'true');

                                const zoompanel = selectZoompanel.options[selectZoompanel.selectedIndex].value;
                                if (zoompanel !== '') options.zoompanel = (zoompanel === 'true');

                                create(options);
                            }

                            [
                                selectPosicion,
                                inputTooltip,
                                selectCollapsed,
                                inputOrder,
                                inputPredefinedZoom,
                                selectZoomExtent,
                                selectViewhistory,
                                selectZoompanel,
                            ].forEach((elm) => { elm.addEventListener('change', changeTest); });

                            const removeButton = document.getElementById('removeButton');
                            removeButton.addEventListener('click', () => { remove(); });

                            changeTest();
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
                function gtag() { dataLayer.push(arguments); }
                gtag('js', new Date());
                gtag('config', 'G-19NTRSBP21');
            </script>

            </html>