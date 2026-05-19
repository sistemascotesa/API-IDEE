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
                <link href="plugins/mousesrs/mousesrs.ol.min.css" rel="stylesheet" />
                <link href="plugins/sharemap/sharemap.ol.min.css" rel="stylesheet" />
                </link>
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
                                title="Posición del plugin sobre el mapa. Por defecto: down">Posición "position"</label>
                            <select name="position" id="selectPosition">
                                <option value="" selected="selected"></option>
                                <option value="left">Izquierda</option>
                                <option value="right">Derecha</option>
                                <option value="down">Abajo</option>
                                <option value="center-top-left">Esquina superior izquierda</option>
                                <option value="center-top-right">Esquina superior derecha</option>
                                <option value="center-bottom-left">Esquina inferior izquierda</option>
                                <option value="center-bottom-right">Esquina inferior derecha</option>
                            </select>
                        </div>
                        <div>
                            <label for="inputOrder"
                                title="Define en qué posición del panel debe aparecer en el conjunto de controles o plugins">Orden
                                entre controles / plugins "order"</label>
                            <input type="number" name="order" id="inputOrder" list="orderSug" value="1">
                        </div>
                        <div>
                            <label for="inputTooltip"
                                title="Texto que se muestra al dejar el ratón encima del plugin. Por defecto: Coordenadas">Título
                                de la herramienta "tooltip"</label>
                            <input type="text" name="tooltip" id="inputTooltip" list="tooltipSug">
                            <datalist id="tooltipSug">
                                <option value="Coordenadas"></option>
                            </datalist>
                        </div>
                        <div>
                            <label for="inputSrs"
                                title="Código EPSG del SRS sobre el que se mostrarán las coordenadas del ratón. Por defecto: EPSG:4326">SRS
                                "srs"</label>
                            <input type="text" name="srs" id="inputSrs" list="srsSug">
                            <datalist id="srsSug">
                                <option value="EPSG:4326"></option>
                                <option value="EPSG:4083"></option>
                                <option value="EPSG:25829"></option>
                                <option value="EPSG:25830"></option>
                                <option value="EPSG:25831"></option>
                                <option value="EPSG:4258"></option>
                                <option value="EPSG:3857"></option>
                            </datalist>
                        </div>
                        <div>
                            <label for="inputLabel"
                                title="Etiqueta descriptiva del SRS que se muestra junto a las coordenadas. Por defecto: WGS84">Etiqueta
                                "label"</label>
                            <input type="text" name="label" id="inputLabel" list="labelSug">
                            <datalist id="labelSug">
                                <option value="WGS84"></option>
                            </datalist>
                        </div>
                        <div>
                            <label for="inputPrecision"
                                title="Número de decimales por defecto cuando no se especifica geoDecimalDigits ni utmDecimalDigits. Por defecto: 4">Precisión
                                decimal "precision"</label>
                            <input type="number" name="precision" id="inputPrecision" list="precisionSug" value="4">
                        </div>
                        <div>
                            <label for="inputGeoDecimalDigits"
                                title="Número de decimales para coordenadas geográficas (p. ej. EPSG:4326, EPSG:4083, EPSG:4258). No tiene valor por defecto">Decimales
                                geográficos "geoDecimalDigits"</label>
                            <input type="number" name="geoDecimalDigits" id="inputGeoDecimalDigits"
                                list="geoDecimalDigitsSug">
                        </div>
                        <div>
                            <label for="inputUtmDecimalDigits"
                                title="Número de decimales para coordenadas UTM (p. ej. EPSG:25829, EPSG:25830, EPSG:25831). No tiene valor por defecto">Decimales
                                UTM "utmDecimalDigits"</label>
                            <input type="number" name="utmDecimalDigits" id="inputUtmDecimalDigits"
                                list="utmDecimalDigitsSug">
                        </div>
                        <div>
                            <label for="selectActiveZ"
                                title="Añade la altitud (eje Z) a las coordenadas mostradas. Por defecto: false">Altitud
                                activa "activeZ"</label>
                            <select name="activeZ" id="selectActiveZ">
                                <option value="" selected="selected"></option>
                                <option value="true">true</option>
                                <option value="false">false</option>
                            </select>
                        </div>
                        <div>
                            <label for="selectEpsgFormat"
                                title="Muestra el nombre descriptivo del sistema de referencia en lugar del código SRS del EPSG. Por defecto: false">Formato
                                EPSG "epsgFormat"</label>
                            <select name="epsgFormat" id="selectEpsgFormat">
                                <option value="" selected="selected"></option>
                                <option value="true">true</option>
                                <option value="false">false</option>
                            </select>
                        </div>
                        <div>
                            <label for="selectMode"
                                title="Modo de obtención de la altitud: wcs (servicio WCS) u ogcapicoverage (OGC API Coverages). Por defecto: wcs">Modo
                                de altitud "mode"</label>
                            <select name="mode" id="selectMode">
                                <option value="" selected="selected"></option>
                                <option value="wcs">wcs</option>
                                <option value="ogcapicoverage">ogcapicoverage</option>
                            </select>
                        </div>
                        <div>
                            <label for="inputCoveragePrecissions"
                                title="Array JSON con objetos que definen la URL del servicio de cobertura y los rangos de zoom (minzoom, maxzoom) para cada nivel de precisión. Propiedades: url (string), minzoom (number), maxzoom(number)">Precisión
                                cobertura "coveragePrecissions"</label>
                            <input type="text" name="coveragePrecissions" id="inputCoveragePrecissions"
                                list="coveragePrecissionsSug"
                                value='[{"url":"https://api-coverages.idee.es/collections/EL.ElevationGridCoverage_4326_1000/coverage","minzoom":0,"maxzoom":11},{"url":"https://api-coverages.idee.es/collections/EL.ElevationGridCoverage_4326_500/coverage","minzoom":12,"maxzoom":28}]'>
                            <datalist id="coveragePrecissionsSug">
                                <option
                                    value='[{"url":"https://api-coverages.idee.es/collections/EL.ElevationGridCoverage_4326_1000/coverage","minzoom":0,"maxzoom":11},{"url":"https://api-coverages.idee.es/collections/EL.ElevationGridCoverage_4326_500/coverage","minzoom":12,"maxzoom":28}]'>
                                </option>
                            </datalist>
                        </div>
                        <div>
                            <label for="inputHelpUrl"
                                title="URL de la página de ayuda. Si no se indica, no se muestra el botón de ayuda">URL
                                de ayuda "helpUrl"</label>
                            <input type="text" name="helpUrl" id="inputHelpUrl" list="helpUrlSug">
                            <datalist id="helpUrlSug">
                                <option value="https://www.ign.es/"></option>
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
                <script type="text/javascript" src="plugins/mousesrs/mousesrs.ol.min.js"></script>
                <script type="text/javascript" src="plugins/sharemap/sharemap.ol.min.js"></script>
                <% String[] jsfiles=PluginsManager.getJSFiles(parameterMap); for (int i=0; i < jsfiles.length; i++) {
                    String jsfile=jsfiles[i]; %>
                    <script type="text/javascript" src="plugins/<%=jsfile%>"></script>

                    <% } %>
                        <script type="text/javascript">
                            const urlParams = new URLSearchParams(window.location.search);
                            IDEE.language.setLang(urlParams.get('language') || 'es');
                            const MouseSRS = IDEE.plugin.MouseSRS;

                            const map = IDEE.map({
                                container: 'mapjs',
                                zoom: 5,
                                maxZoom: 20,
                                minZoom: 4,
                                center: [-467062.8225, 4783459.6216],
                                controls: ['scale', 'rotate'],
                            });
                            window.map = map;

                            let mp = null;

                            const createPlugin = (options) => {
                                mp = new MouseSRS(options);
                                window.mp = mp;
                                map.addPlugin(mp);
                            };

                            const removePlugin = () => {
                                if (mp) map.removePlugins(mp);
                            };

                            const removeButton = document.getElementById('removeButton');
                            removeButton.addEventListener('click', () => { removePlugin(); });

                            const selectPosition = document.getElementById('selectPosition');
                            const inputTooltip = document.getElementById('inputTooltip');
                            const inputSrs = document.getElementById('inputSrs');
                            const inputLabel = document.getElementById('inputLabel');
                            const inputPrecision = document.getElementById('inputPrecision');
                            const inputGeoDecimalDigits = document.getElementById('inputGeoDecimalDigits');
                            const inputUtmDecimalDigits = document.getElementById('inputUtmDecimalDigits');
                            const selectActiveZ = document.getElementById('selectActiveZ');
                            const selectEpsgFormat = document.getElementById('selectEpsgFormat');
                            const selectMode = document.getElementById('selectMode');
                            const inputCoveragePrecissions = document.getElementById('inputCoveragePrecissions');
                            const inputHelpUrl = document.getElementById('inputHelpUrl');
                            const inputOrder = document.getElementById('inputOrder');

                            const boolVal = (select, defaultVal = true) => {
                                const v = select.options[select.selectedIndex].value;
                                if (v === '') return defaultVal;
                                return v === 'true';
                            };

                            const updatePlugin = () => {
                                const options = {};
                                options.position = selectPosition.options[selectPosition.selectedIndex].value;
                                options.tooltip = inputTooltip.value;
                                options.srs = inputSrs.value;
                                options.label = inputLabel.value;
                                options.precision = Number(inputPrecision.value);
                                options.geoDecimalDigits = inputGeoDecimalDigits.value !== '' ? Number(inputGeoDecimalDigits.value) : undefined;
                                options.utmDecimalDigits = inputUtmDecimalDigits.value !== '' ? Number(inputUtmDecimalDigits.value) : undefined;
                                options.activeZ = boolVal(selectActiveZ, false);
                                options.epsgFormat = boolVal(selectEpsgFormat, false);
                                options.mode = selectMode.options[selectMode.selectedIndex].value;
                                if (inputCoveragePrecissions.value.trim()) {
                                    try {
                                        options.coveragePrecissions = JSON.parse(inputCoveragePrecissions.value);
                                    } catch (e) {
                                        options.coveragePrecissions = inputCoveragePrecissions.value;
                                    }
                                }
                                options.helpUrl = inputHelpUrl.value;
                                options.order = Number(inputOrder.value);

                                removePlugin();
                                createPlugin(options);
                            };

                            [
                                selectPosition,
                                inputTooltip,
                                inputSrs,
                                inputLabel,
                                inputPrecision,
                                inputGeoDecimalDigits,
                                inputUtmDecimalDigits,
                                selectActiveZ,
                                selectEpsgFormat,
                                selectMode,
                                inputCoveragePrecissions,
                                inputHelpUrl,
                                inputOrder,
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