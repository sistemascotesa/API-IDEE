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
                        <link href="plugins/comparators/comparators.ol.min.css" rel="stylesheet" />
                        <!-- Necesario para compartir los plugins en el mapa -->
                        <link href="plugins/beautytoc/beautytoc.ol.min.css" rel="stylesheet" />
                        <link href="plugins/topographicprofile/topographicprofile.ol.min.css" rel="stylesheet" />
                        <link href="plugins/toc/toc.ol.min.css" rel="stylesheet" />
                        <link href="plugins/viewshed/viewshed.ol.min.css" rel="stylesheet" />
                        <link href="plugins/ignsearchlocator/ignsearchlocator.ol.min.css" rel="stylesheet" />
                        <link href="plugins/incicarto/incicarto.ol.min.css" rel="stylesheet" />
                        <link href="plugins/geometrydraw/geometrydraw.ol.min.css" rel="stylesheet" />
                        <link href="plugins/infocoordinates/infocoordinates.ol.min.css" rel="stylesheet" />
                        <link href="plugins/measurebar/measurebar.ol.min.css" rel="stylesheet" />
                        <link href="plugins/queryattributes/queryattributes.ol.min.css" rel="stylesheet" />
                        <link href="plugins/printermap/printermap.ol.min.css" rel="stylesheet" />
                        <link href="plugins/selectionzoom/selectionzoom.ol.min.css" rel="stylesheet" />
                        <link href="plugins/buffer/buffer.ol.min.css" rel="stylesheet" />
                        <link href="plugins/xylocator/xylocator.ol.min.css" rel="stylesheet" />
                        <link href="plugins/overviewmap/overviewmap.ol.min.css" rel="stylesheet" />
                        <link href="plugins/calendar/calendar.ol.min.css" rel="stylesheet" />
                        <link href="plugins/contactlink/contactlink.ol.min.css" rel="stylesheet" />
                        <link href="plugins/ignsearch/ignsearch.ol.min.css" rel="stylesheet" />
                        <link href="plugins/georefimage2/georefimage2.ol.min.css" rel="stylesheet" />
                        <link href="plugins/selectiondraw/selectiondraw.ol.min.css" rel="stylesheet" />
                        <link href="plugins/mousesrs/mousesrs.ol.min.css" rel="stylesheet" />
                        <link href="plugins/popup/popup.ol.min.css" rel="stylesheet" />
                        <link href="plugins/vectors/vectors.ol.min.css" rel="stylesheet" />
                        <link href="plugins/sharemap/sharemap.ol.min.css" rel="stylesheet" />
                        <link href="plugins/georefimage/georefimage.ol.min.css" rel="stylesheet" />
                        <link href="plugins/infocatastro/infocatastro.ol.min.css" rel="stylesheet" />
                        <link href="plugins/timeline/timeline.ol.min.css" rel="stylesheet" />
                        <link href="plugins/backimglayer/backimglayer.ol.min.css" rel="stylesheet" />
                        <link href="plugins/information/information.ol.min.css" rel="stylesheet" />
                        <link href="plugins/viewhistory/viewhistory.ol.min.css" rel="stylesheet" />
                        <link href="plugins/zoompanel/zoompanel.ol.min.css" rel="stylesheet" />
                        <link href="plugins/locator/locator.ol.min.css" rel="stylesheet" />
                        <link href="plugins/zoomextent/zoomextent.ol.min.css" rel="stylesheet" />
                        <link href="plugins/attributions/attributions.ol.min.css" rel="stylesheet" />
                        <link href="plugins/predefinedzoom/predefinedzoom.ol.min.css" rel="stylesheet" />
                        <link href="plugins/stylemanager/stylemanager.ol.min.css" rel="stylesheet" />
                        <link href="plugins/layerswitcher/layerswitcher.ol.min.css" rel="stylesheet" />
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
                                <label for="selectPosicion" title="Posición del plugin en el mapa">Posición "position"</label>
                                <select name="position" id="selectPosicion">
                                    <option value="left">Izquierda</option>
                                    <option value="right" selected="selected">Derecha</option>
                                </select>
                            </div>
                            <div>
                                <label for="selectCollapsed" title="Indica si el panel del plugin aparece colapsado al cargarse">Colapsado "collapsed"</label>
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
                                <label for="enabledKeyFunctions" title="Activa o desactiva los atajos de teclado del comparador espejo y zonal">Atajos de teclado "enabledKeyFunctions"</label>
                                <select name="enabledKeyFunctions" id="enabledKeyFunctions">
                                    <option value=""></option>
                                    <option value="true" selected="selected">true</option>
                                    <option value="false">false</option>
                                </select>
                            </div>
                            <div>
                                <label for="defaultCompareMode" title="Comparador que se activa por defecto al cargar el plugin: mirrorpanelParams, lyrcompareParams, transparecyParams, windowsyncParams o none">Modo default "defaultCompareMode"</label>
                                <select name="defaultCompareMode" id="defaultCompareMode">
                                    <option value="none" selected="selected">none</option>
                                    <option value="mirror">mirror</option>
                                    <option value="curtain">curtain</option>
                                    <option value="spyeye">spyeye</option>
                                </select>
                            </div>
                            <div>
                                <label for="listLayers" title="Lista de capas disponibles para la comparación, en formato cadena de texto">Capas disponibles "listLayers"</label>
                                <input type="text" id="listLayers" list="listLayersSug" value="['WMS*Huellas Sentinel2*https://wms-satelites-historicos.idee.es/satelites-historicos*teselas_sentinel2_espanna*true', 'WMS*Invierno 2022 falso color natural*https://wms-satelites-historicos.idee.es/satelites-historicos*SENTINEL.2022invierno_432-1184*true', 'WMS*Invierno 2022 falso color infrarrojo*https://wms-satelites-historicos.idee.es/satelites-historicos*SENTINEL.2022invierno_843*true', 'WMS*Filomena*https://wms-satelites-historicos.idee.es/satelites-historicos*Filomena*true']">
                                <datalist id="listLayersSug">
                                    <option value="['WMS*Huellas Sentinel2*https://wms-satelites-historicos.idee.es/satelites-historicos*teselas_sentinel2_espanna*true', 'WMS*Invierno 2022 falso color natural*https://wms-satelites-historicos.idee.es/satelites-historicos*SENTINEL.2022invierno_432-1184*true', 'WMS*Invierno 2022 falso color infrarrojo*https://wms-satelites-historicos.idee.es/satelites-historicos*SENTINEL.2022invierno_843*true', 'WMS*Filomena*https://wms-satelites-historicos.idee.es/satelites-historicos*Filomena*true']"></option>
                                </datalist>
                            </div>
                            <div>
                                <label for="tooltipComparator" title="Texto del tooltip que aparece al pasar el ratón sobre el botón principal del plugin">Título de la herramienta "tooltip"</label>
                                <input type="text" id="tooltipComparator" list="tooltipComparatorSug" value="tooltipComparator">
                                <datalist id="tooltipComparatorSug">
                                    <option value="tooltipComparator"></option>
                                </datalist>
                            </div>
                            <div>
                                <label for="transparencyParams" title="Objeto de configuración del comparador zonal. Propiedades: radius (30-200, def. 100), maxRadius (def. 200), minRadius (def. 30), tooltip. Escribe false para deshabilitar este comparador">Comparador zonal "transparencyParams"</label>
                                <input type="text" id="transparencyParams" list="transparencyParamsSug" value='{"radius": 50, "maxRadius": 100, "minRadius": 10, "tooltip": "Comparador zonal"}'>
                                <datalist id="transparencyParamsSug">
                                    <option value='{"radius": 50, "maxRadius": 100, "minRadius": 10, "tooltip": "Comparador zonal"}'></option>
                                </datalist>
                            </div>
                            <div>
                                <label for="lyrcompareParams" title="Objeto de configuración del comparador de cortina. Propiedades: staticDivision (0=ratón,1=punto medio,2=líneas arrastrables), defaultLyrA/B/C/D, opacityVal (0-100), tooltip, defaultCompareViz (0-3). Escribe false para deshabilitar este comparador">Comparador cortina "lyrcompareParams"</label>
                                <input type="text" id="lyrcompareParams" list="lyrcompareParamsSug" value='{"staticDivision": 2, "defaultLyrA": 3, "defaultLyrB": 2, "defaultLyrC": 1, "defaultLyrD": 0, "opacityVal": 100, "tooltip": "Comparador de cortina", "defaultCompareViz": 2}'>
                                <datalist id="lyrcompareParamsSug">
                                    <option value='{"staticDivision": 2, "defaultLyrA": 3, "defaultLyrB": 2, "defaultLyrC": 1, "defaultLyrD": 0, "opacityVal": 100, "tooltip": "Comparador de cortina", "defaultCompareViz": 2}'></option>
                                </datalist>
                            </div>
                            <div>
                                <label for="mirrorpanelParams" title="Objeto de configuración del comparador de espejo. Propiedades: showCursors, principalMap (false=izquierda,true=derecha), enabledControlsPlugins, enabledDisplayInLayerSwitcher, defaultCompareViz (0-5), modeVizTypes, tooltip. Escribe false para deshabilitar este comparador">Comparador espejo "mirrorpanelParams"</label>
                                <input type="text" id="mirrorpanelParams" list="mirrorpanelParamsSug" value='{"showCursors": true, "principalMap": true, "enabledControlsPlugins": {"map2":{"BackImgLayer":{}},"map3":{"controls":["scale"]}}, "enabledDisplayInLayerSwitcher": true, "defaultCompareViz": 2, "modeVizTypes": [0, 1, 2, 3, 4, 5], "tooltip": "Comparador espejo"}'>
                                <datalist id="mirrorpanelParamsSug">
                                    <option value='{"showCursors": true, "principalMap": true, "enabledControlsPlugins": {"map2":{"BackImgLayer":{}},"map3":{"controls":["scale"]}}, "enabledDisplayInLayerSwitcher": true, "defaultCompareViz": 2, "modeVizTypes": [0, 1, 2, 3, 4, 5], "tooltip": "Comparador espejo"}'></option>
                                </datalist>
                            </div>
                            <div>
                                <label for="windowsyncParams" title="Objeto de configuración del comparador en ventana. Propiedades: controls (array de strings), plugins (array de objetos con name y params). Escribe false para deshabilitar este comparador">Comparador ventana "windowsyncParams"</label>
                                <input type="text" id="windowsyncParams" list="windowsyncParamsSug" value='{"controls": ["scale","rotate"], "plugins": [{"name": "Layerswitcher","params": {"position": "right"}}], "tooltip": "Comparador ventana"}'>
                                <datalist id="windowsyncParamsSug">
                                    <option value='{"controls": ["scale","rotate"], "plugins": [{"name": "Layerswitcher","params": {"position": "right"}}], "tooltip": "Comparador ventana"}'></option>
                                </datalist>
                            </div>
                        </div>
                        <div class="m-test-buttons">
                            <button name="eliminar" class="m-test-button" id="botonEliminar">Eliminar Plugin</button>
                        </div>
                    </div>

                    <div id="mapjs" class="m-container"></div>

                    <script type="text/javascript" src="vendor/browser-polyfill.js"></script>
                    <script type="text/javascript" src="js/apiidee.ol.min.js"></script>
                    <script type="text/javascript" src="js/configuration.js"></script>
                    <script type="text/javascript" src="plugins/comparators/comparators.ol.min.js"></script>
                    <!-- Necesario para compartir los plugins en el mapa -->
                    <script type="text/javascript" src="plugins/beautytoc/beautytoc.ol.min.js"></script>
                    <script type="text/javascript"
                        src="plugins/topographicprofile/topographicprofile.ol.min.js"></script>
                    <script type="text/javascript" src="plugins/toc/toc.ol.min.js"></script>
                    <script type="text/javascript" src="plugins/viewshed/viewshed.ol.min.js"></script>
                    <script type="text/javascript" src="plugins/ignsearchlocator/ignsearchlocator.ol.min.js"></script>
                    <script type="text/javascript" src="plugins/incicarto/incicarto.ol.min.js"></script>
                    <script type="text/javascript" src="plugins/geometrydraw/geometrydraw.ol.min.js"></script>
                    <script type="text/javascript" src="plugins/infocoordinates/infocoordinates.ol.min.js"></script>
                    <script type="text/javascript" src="plugins/measurebar/measurebar.ol.min.js"></script>
                    <script type="text/javascript" src="plugins/queryattributes/queryattributes.ol.min.js"></script>
                    <script type="text/javascript" src="plugins/printermap/printermap.ol.min.js"></script>
                    <script type="text/javascript" src="plugins/selectionzoom/selectionzoom.ol.min.js"></script>
                    <script type="text/javascript" src="plugins/buffer/buffer.ol.min.js"></script>
                    <script type="text/javascript" src="plugins/xylocator/xylocator.ol.min.js"></script>
                    <script type="text/javascript" src="plugins/overviewmap/overviewmap.ol.min.js"></script>
                    <script type="text/javascript" src="plugins/calendar/calendar.ol.min.js"></script>
                    <script type="text/javascript" src="plugins/contactlink/contactlink.ol.min.js"></script>
                    <script type="text/javascript" src="plugins/ignsearch/ignsearch.ol.min.js"></script>
                    <script type="text/javascript" src="plugins/georefimage2/georefimage2.ol.min.js"></script>
                    <script type="text/javascript" src="plugins/selectiondraw/selectiondraw.ol.min.js"></script>
                    <script type="text/javascript" src="plugins/mousesrs/mousesrs.ol.min.js"></script>
                    <script type="text/javascript" src="plugins/popup/popup.ol.min.js"></script>
                    <script type="text/javascript" src="plugins/vectors/vectors.ol.min.js"></script>
                    <script type="text/javascript" src="plugins/sharemap/sharemap.ol.min.js"></script>
                    <script type="text/javascript" src="plugins/georefimage/georefimage.ol.min.js"></script>
                    <script type="text/javascript" src="plugins/infocatastro/infocatastro.ol.min.js"></script>
                    <script type="text/javascript" src="plugins/timeline/timeline.ol.min.js"></script>
                    <script type="text/javascript" src="plugins/backimglayer/backimglayer.ol.min.js"></script>
                    <script type="text/javascript" src="plugins/information/information.ol.min.js"></script>
                    <script type="text/javascript" src="plugins/viewhistory/viewhistory.ol.min.js"></script>
                    <script type="text/javascript" src="plugins/zoompanel/zoompanel.ol.min.js"></script>
                    <script type="text/javascript" src="plugins/locator/locator.ol.min.js"></script>
                    <script type="text/javascript" src="plugins/zoomextent/zoomextent.ol.min.js"></script>
                    <script type="text/javascript" src="plugins/attributions/attributions.ol.min.js"></script>
                    <script type="text/javascript" src="plugins/predefinedzoom/predefinedzoom.ol.min.js"></script>
                    <script type="text/javascript" src="plugins/stylemanager/stylemanager.ol.min.js"></script>
                    <script type="text/javascript" src="plugins/layerswitcher/layerswitcher.ol.min.js"></script>
                    
                    <% String[] jsfiles=PluginsManager.getJSFiles(parameterMap); for (int i=0; i < jsfiles.length; i++)
                        { String jsfile=jsfiles[i]; %>
                        <script type="text/javascript" src="plugins/<%=jsfile%>"></script>

                        <% } %>
                            <script type="text/javascript">
                                const urlParams = new URLSearchParams(window.location.search);
                                IDEE.language.setLang(urlParams.get('language') || 'es');

                                const map = IDEE.map({
                                    container: 'mapjs',
                                    center: [-467062.8225, 4683459.6216],
                                    zoom: 6,
                                });

                                let mp = null;

                                const selectPosicion = document.getElementById("selectPosicion");
                                const selectCollapsed = document.getElementById("selectCollapsed");
                                const inputOrder = document.getElementById('inputOrder');
                                const selectEnabledKeyFunctions = document.getElementById("enabledKeyFunctions");
                                const selectDefaultCompareMode = document.getElementById("defaultCompareMode");
                                const inputListLayers = document.getElementById("listLayers");
                                const inputTransparencyParams = document.getElementById("transparencyParams");
                                const inputLyrcompareParams = document.getElementById("lyrcompareParams");
                                const inputMirrorpanelParams = document.getElementById("mirrorpanelParams");
                                const inputWindowsyncParams = document.getElementById("windowsyncParams");
                                const tooltipComparatorParams = document.getElementById("tooltipComparator");
                                const botonEliminar = document.getElementById("botonEliminar");

                                const parseOrFalse = (input) => {
                                    const val = input.value.trim();
                                    return val === 'false' ? false : JSON.parse(val);
                                };

                                [
                                    selectPosicion,
                                    selectCollapsed,
                                    inputOrder,
                                    selectEnabledKeyFunctions,
                                    selectDefaultCompareMode,
                                    inputListLayers,
                                    inputTransparencyParams,
                                    inputLyrcompareParams,
                                    inputMirrorpanelParams,
                                    inputWindowsyncParams,
                                    tooltipComparatorParams,
                                ].forEach((ctrl) => ctrl.addEventListener('change', cambiarTest));

                                botonEliminar.addEventListener("click", function () {
                                    map.removePlugins(mp);
                                });

                                function cambiarTest() {
                                    if (mp !== null) {
                                        map.removePlugins(mp);
                                    }
                                    crearPlugin({
                                        position: selectPosicion.options[selectPosicion.selectedIndex].value,
                                        collapsed: selectCollapsed.options[selectCollapsed.selectedIndex].value === 'true',
                                        order: Number(inputOrder.value),
                                        defaultCompareMode: selectDefaultCompareMode.options[selectDefaultCompareMode.selectedIndex].value,
                                        listLayers: JSON.parse(inputListLayers.value.replace(/'/g, "\"")),
                                        tooltip: tooltipComparatorParams.value,
                                        enabledKeyFunctions: selectEnabledKeyFunctions.options[selectEnabledKeyFunctions.selectedIndex].value === 'true',
                                        transparencyParams: parseOrFalse(inputTransparencyParams),
                                        lyrcompareParams: parseOrFalse(inputLyrcompareParams),
                                        mirrorpanelParams: parseOrFalse(inputMirrorpanelParams),
                                        windowsyncParams: parseOrFalse(inputWindowsyncParams),
                                    });
                                }

                                function crearPlugin(propiedades) {
                                    mp = new IDEE.plugin.Comparators(propiedades);
                                    map.addPlugin(mp);
                                }
                                cambiarTest();
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