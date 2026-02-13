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
                <link href="plugins/sharemap/sharemap.ol.min.css" rel="stylesheet" />
                </link>
                <style type="text/css">
                    html,
                    body {
                        margin: 0;
                        padding: 0;
                        height: 100%;
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

            <body style="display: flex; flex-direction: column;">
                <div>
                    <label for="selectPosicion">Selector de posición del plugin</label>
                    <select name="position" id="selectPosicion">
                        <option value="left">Izquierda (left)</option>
                        <option value="right">Derecha (right)</option>
                        <option value="center-top-left">Centro superior izquierdo (center-top-left)</option>
                        <option value="center-top-right">Centro superior derecho (center-top-right)</option>
                        <option value="center-bottom-left">Centro inferior izquierdo (center-bottom-left)</option>
                        <option value="center-bottom-right">Centro inferior derecho (center-bottom-right)</option>
                        <option value="down" selected="selected">Abajo (down)</option>
                    </select>

                    <label for="inputZoom">Parámetro Zoom</label>
                    <input type="number" name="ratio" id="inputZoom" list="tooltipSug" min="0" max="22" step="1"
                        value="3">

                    <label for="selectFixed">Selector Fixed</label>
                    <select name="fixedValue" id="selectFixed">
                        <option value=true selected="selected">true</option>
                        <option value=false>false</option>
                    </select>

                    <label for="inputBaseLayer">Parámetro baseLayer</label>
                    <input type="text" name="baseLayer" id="inputBaseLayer" list="baseLayerSug">
                    <datalist id="baseLayerSug">
                        <option
                            value="WMTS*http://www.ign.es/wmts/ign-base?*IGNBaseTodo*GoogleMapsCompatible*Mapa IGN*false*image/jpeg*false*false*true">
                        </option>
                    </datalist>

                    <label for="selectCollapsed">Parámetro de collapsed</label>
                    <select name="collapsed" id="selectCollapsed">
                        <option value=''></option>
                        <option value="true">true</option>
                        <option value="false" selected="selected">false</option>
                    </select>

                    <label for="selectCollapsible">Selector de collapsible</label>
                    <select name="collapsible" id="selectCollapsible">
                        <option value=''></option>
                        <option value="true" selected="selected">true</option>
                        <option value="false">false</option>
                    </select>

                    <label for="inputTooltip">Parámetro tooltip</label>
                    <input type="text" name="tooltip" id="inputTooltip" list="tooltipSug"
                        value="Mapa">
                </div>
                <div>
                    <button id="removeButton">Eliminar Control</button>
                </div>
                <div id="mapjs" class="m-container"></div>
                <script type="text/javascript" src="vendor/browser-polyfill.js"></script>
                <script type="text/javascript" src="js/apiidee.ol.min.js"></script>
                <script type="text/javascript" src="js/configuration.js"></script>
                <script type="text/javascript" src="plugins/sharemap/sharemap.ol.min.js"></script>
                <% 
                    String[] jsfiles=PluginsManager.getJSFiles(parameterMap); 
                    for (int i=0; i < jsfiles.length; i++) {
                        String jsfile=jsfiles[i]; %>
                    <script type="text/javascript" src="plugins/<%=jsfile%>"></script>

                    <% } %>
                        <script type="text/javascript">
                            const urlParams = new URLSearchParams(window.location.search);
                            IDEE.language.setLang(urlParams.get('language') || 'es');
                            const map = IDEE.map({
                                container: 'mapjs',
                                zoom: 6,
                                maxZoom: 20,
                                minZoom: 5,
                                center: [-467062.8225, 4783459.6216],
                            });

                            let ctrl;

                            const create = (options) => {
                                ctrl = new IDEE.control.OverviewMap(options);
                                map.addControls(ctrl);
                            };

                            const remove = () => {
                                map.removeControls(ctrl);
                                ctrl = null;
                            };

                            const selectPosition = document.getElementById('selectPosicion');
                            const inputZoom = document.getElementById('inputZoom');
                            const selectFixed = document.getElementById('selectFixed');
                            const inputBaseLayer = document.getElementById('inputBaseLayer');
                            const selectCollapsed = document.getElementById('selectCollapsed');
                            const selectCollapsible = document.getElementById('selectCollapsible');
                            const inputTooltip = document.getElementById('inputTooltip');

                            const recreate = () => {
                                if (ctrl) remove();
                                const options = {};

                                options.position = selectPosition.options[selectPosition.selectedIndex].value;
                                if (inputZoom.value) options.zoom = Number(inputZoom.value);

                                const fixed = selectCollapsible.options[selectCollapsible.selectedIndex].value;
                                if (fixed !== '') options.fixed = (fixed === 'true');

                                options.baseLayer = inputBaseLayer.value;

                                const collapsible = selectCollapsible.options[selectCollapsible.selectedIndex].value;
                                if (collapsible !== '') options.collapsible = (collapsible === 'true');

                                const collapsed = selectCollapsed.options[selectCollapsed.selectedIndex].value;
                                if (collapsed !== '') options.collapsed = (collapsed === 'true');

                                if (inputTooltip.value !== '') options.tooltip = inputTooltip.value;
                                create(options);
                            };

                            selectPosition.addEventListener('change', recreate);
                            selectFixed.addEventListener('change', recreate);
                            inputBaseLayer.addEventListener('change', recreate);
                            inputZoom.addEventListener('change', recreate);
                            selectCollapsed.addEventListener('change', recreate);
                            selectCollapsible.addEventListener('change', recreate);
                            inputTooltip.addEventListener('change', recreate);

                            const removeButton = document.getElementById('removeButton');
                            removeButton.addEventListener('click', () => {
                                remove();
                            });

                            recreate();

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