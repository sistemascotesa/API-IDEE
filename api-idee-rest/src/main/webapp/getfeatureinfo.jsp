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
    <label for="selectPosicion">Selector de posición del plugin</label>
    <select name="position" id="selectPosicion">
        <option value="left" selected="selected">Izquierda (left)</option>
        <option value="right">Derecha (right)</option>
        <option value="center-top-left">Centro superior izquierdo (center-top-left)</option>
        <option value="center-top-right">Centro superior derecho (center-top-right)</option>
        <option value="center-bottom-left">Centro inferior izquierdo (center-bottom-left)</option>
        <option value="center-bottom-right">Centro inferior derecho (center-bottom-left)</option>
        <option value="down">Abajo (down)</option>
    </select>
    </div>
        <input type="button" value="Eliminar Control" name="eliminar" id="removeButton">
    </div>
    <div id="mapjs" class="m-container"></div>
    <script type="text/javascript" src="vendor/browser-polyfill.js"></script>
    <script type="text/javascript" src="js/apiidee.ol.min.js"></script>
    <script type="text/javascript" src="js/configuration.js"></script>
    <script type="text/javascript" src="plugins/sharemap/sharemap.ol.min.js"></script>
    <%
      String[] jsfiles = PluginsManager.getJSFiles(parameterMap);
      for (int i = 0; i < jsfiles.length; i++) {
         String jsfile = jsfiles[i];
   %>
    <script type="text/javascript" src="plugins/<%=jsfile%>"></script>

                    <% } %>
                        <script type="text/javascript">
                            const urlParams = new URLSearchParams(window.location.search);
                            IDEE.language.setLang(urlParams.get('language') || 'es');
                            const map = IDEE.map({
                                container: 'mapjs',
                                // controls: ['getfeatureinfo'],
                                zoom: 5,
                                maxZoom: 20,
                                minZoom: 4,
                                center: [-467062.8225, 4683459.6216],
                            });

                            let ctrl;
                            const selectPosicion = document.getElementById('selectPosicion');

                            const createControl = (propiedades) => {
                                ctrl = new IDEE.control.GetFeatureInfo(propiedades);
                                map.addControls(ctrl);
                            };

                            const removeControl = () => {
                                map.removeControls(ctrl);
                                ctrl = null;
                            };

                            createControl();

                            const updateControl = () => {
                                if (ctrl != null) removeControl();
                                createControl({
                                    position: selectPosicion.options[selectPosicion.selectedIndex].value,
                                });
                            };

                            selectPosicion.addEventListener('change', updateControl);

                            const removeButton = document.getElementById('removeButton');
                            removeButton.addEventListener('click', () => {
                                removeControl();
                            });

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

                            const layer5 = new IDEE.layer.WMS({
                                url: 'https://servicios.ine.es/WMS/WMS_INE_SECCIONES_G01/MapServer/WMSServer?',
                                name: 'Secciones2021',
                                legend: 'Secciones censales',
                                version: '1.1.0',
                                tiled: false,
                                visibility: true,
                            }, {});

                            map.addLayers([layerinicial, layerUA, layer5]);

                            // map.addLayers(layer5);
                            // map.addLayers(layerinicial);

                            // const layerinicial = new IDEE.layer.WMS({
                            //     url: 'https://www.ign.es/wms-inspire/unidades-administrativas?',
                            //     name: 'AU.AdministrativeBoundary',
                            //     legend: 'Limite administrativo',
                            //     tiled: false,
                            // }, {});

                            // const layerUA = new IDEE.layer.WMS({
                            //     url: 'https://www.ign.es/wms-inspire/unidades-administrativas?',
                            //     name: 'AU.AdministrativeUnit',
                            //     legend: 'Unidad administrativa',
                            //     tiled: false
                            // }, {});

                            // map.addLayers([layerinicial, layerUA]);
                            let mp = new IDEE.plugin.ShareMap({
                                baseUrl: window.location.href.substring(0, window.location.href.indexOf('api-idee')) + "api-idee/",
                                position: "TR",
                            });
                            map.addPlugin(mp);
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