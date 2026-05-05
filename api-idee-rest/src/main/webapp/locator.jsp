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
                <link href="plugins/locator/locator.ol.min.css" rel="stylesheet" />
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
                            <label for="selectPosicion">Posición del panel "position"</label>
                            <select name="position" id="selectPosicion">
                                <option value="" selected="selected"></option>
                                <option value="left">Izquierda (left)</option>
                                <option value="right">Derecha (right)</option>
                            </select>
                        </div>
                        <div>
                            <label for="inputOrder"
                                title="Define en que posición del panel debe aparecer en el conjunto de controles o plugins">Orden
                                en la posición asignada "order"</label>
                            <input type="number" name="order" id="inputOrder" list="orderSug" value="-1">
                        </div>
                        <div>
                            <label for="inputTooltip"
                                title="Título ilustrativo que aporta información adicional">Información de la
                                herramienta
                                "tooltip"</label>
                            <input type="text" name="tooltip" id="inputTooltip" list="tooltipSug" value="">
                        </div>
                        <div>
                            <label for="selectCollapsed">Panel colapsado "collapsed"</label>
                            <select name="collapsed" id="selectCollapsed">
                                <option value=''></option>
                                <option value="true">true</option>
                                <option value="false" selected="selected">false</option>
                            </select>
                        </div>
                        <div>
                            <label for="inputZoom">Zoom "zoom"</label>
                            <input type="number" name="zoom" id="inputZoom" value="16" max="28" min="0" step="1">
                        </div>
                        <div>
                            <label for="selectPointStyle">Estilo del pin de búsqueda "pointStyle"</label>
                            <select name="pointStyle" id="selectPointStyle">
                                <option></option>
                                <option value="pinAzul">Azul</option>
                                <option value="pinRojo">Rojo</option>
                                <option value="pinMorado">Morado</option>
                            </select>
                        </div>
                        <div>
                            <label for="selectProxy">Proxy "useProxy"</label>
                            <select name="proxyValue" id="selectProxy">
                                <option value=true>true</option>
                                <option value=false>false</option>
                            </select>
                        </div>
                        <div>
                            <label for="inputByParcelCadastre">Por parcela catastral "byParcelCadastre"</label>
                            <textarea name="byParcelCadastre" id="inputByParcelCadastre" rows="4">{
                "cadastreWMS": "https://ovc.catastro.meh.es/ovcservweb/OVCSWLocalizacionRC/OVCCoordenadas.asmx/Consulta_RCCOOR",
                "CMC_url": "https://ovc.catastro.meh.es/ovcservweb/OVCSWLocalizacionRC/OVCCallejeroCodigos.asmx/ConsultaMunicipioCodigos",
                "DNPPP_url": "https://ovc.catastro.meh.es/ovcservweb/OVCSWLocalizacionRC/OVCCallejeroCodigos.asmx/Consulta_DNPPP_Codigos",
                "CPMRC_url": "https://ovc.catastro.meh.es/ovcservweb/OVCSWLocalizacionRC/OVCCoordenadas.asmx/Consulta_CPMRC"
                }</textarea>
                        </div>
                        <div>
                            <label for="inputByCoordinates">Buscar por coordenadas "byCoordinates"</label>
                            <textarea name="byCoordinates" id="inputByCoordinates" rows="4">{
                "projections": [
                    {
                        "title": "ETRS89 geographic (4258) dd",
                        "code": "EPSG:4258",
                        "units": "d"
                    },
                    {
                        "title": "ETRS89 geographic (4258) dms",
                        "code": "EPSG:4258",
                        "units": "dms"
                    }
                    ],
                    "help": "https://www.google.com/"
                }</textarea>
                        </div>
                        <div>
                            <label for="inputByPlaceAddressPostal">Buscador por lugar "byPlaceAddressPostal"</label>
                            <textarea name="byPlaceAddressPostal" id="inputByPlaceAddressPostal" rows="4">{
                 "maxResults": 20,
                 "noProcess": "poblacion",
                 "countryCode": "es",
                 "resultVisibility": true,
                 "urlCandidates": "https://www.cartociudad.es/geocoder/api/geocoder/candidatesJsonp",
                 "urlFind": "https://www.cartociudad.es/geocoder/api/geocoder/findJsonp",
                 "urlReverse": "https://www.cartociudad.es/geocoder/api/geocoder/reverseGeocode",
                 "requestStreet": "https://www.cartociudad.es/geocoder/api/geocoder/findJsonp?q=Sevilla&type=provincia&tip_via=null&id=41&portal=null&extension=null"
                }</textarea>
                        </div>
                    </div>
                    <div class="m-test-buttons">
                        <button id="removeButton">Eliminar Control</button>
                    </div>
                </div>
                <div id="mapjs" class="m-container"></div>
                <script type="text/javascript" src="vendor/browser-polyfill.js"></script>
                <script type="text/javascript" src="js/apiidee.ol.min.js"></script>
                <script type="text/javascript" src="js/configuration.js"></script>
                <script type="text/javascript" src="plugins/locator/locator.ol.min.js"></script>
                <% String[] jsfiles=PluginsManager.getJSFiles(parameterMap); for (int i=0; i < jsfiles.length; i++) {
                    String jsfile=jsfiles[i]; %>
                    <script type="text/javascript" src="plugins/<%=jsfile%>"></script>

                    <% } %>
                        <script type="text/javascript">
                            const urlParams = new URLSearchParams(window.location.search);
                            IDEE.language.setLang(urlParams.get('language') || 'es');
                            const map = IDEE.map({
                                container: 'mapjs',
                                controls: ['rotate'],
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
                            const inputZoom = document.getElementById('inputZoom');
                            const selectPointStyle = document.getElementById('selectPointStyle');
                            const selectProxy = document.getElementById('selectProxy');
                            const selectParcel = document.getElementById('inputByParcelCadastre');
                            const selectCoordinates = document.getElementById('inputByCoordinates');
                            const selectPlace = document.getElementById('inputByPlaceAddressPostal');

                            function create(propiedades) {
                                mp = new IDEE.plugin.Locator(propiedades);
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

                                if (inputZoom.value !== '') options.zoom = Number(inputZoom.value);

                                const pointStyleValue = selectPointStyle.options[selectPointStyle.selectedIndex].value;
                                if (pointStyleValue !== '') options.pointStyle = pointStyleValue;

                                const useProxySelectValue = selectProxy.options[selectProxy.selectedIndex].value;
                                if (useProxySelectValue !== '') options.useProxy = useProxySelectValue === 'true';

                                if (selectParcel.value !== '') options.byParcelCadastre = JSON.parse(selectParcel.value);
                                if (selectCoordinates.value !== '') options.byCoordinates = JSON.parse(selectCoordinates.value);
                                if (selectPlace.value !== '') options.byPlaceAddressPostal = JSON.parse(selectPlace.value);
                                create(options);
                            }

                            [
                                selectPosicion,
                                inputTooltip,
                                selectCollapsed,
                                inputOrder,
                                selectProxy,
                                inputZoom,
                                selectPointStyle,
                                selectParcel,
                                selectCoordinates,
                                selectPlace,
                            ].forEach((elm) => { elm.addEventListener('change', changeTest); });

                            const removeButton = document.getElementById('removeButton');
                            removeButton.addEventListener('click', () => { remove(); });

                            changeTest();
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