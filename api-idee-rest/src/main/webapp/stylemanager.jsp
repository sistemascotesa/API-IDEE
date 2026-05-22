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
    <link href="plugins/stylemanager/stylemanager.ol.min.css" rel="stylesheet" />
    <link href="plugins/vectors/vectors.ol.min.css" rel="stylesheet" />
    <link href="plugins/layerswitcher/layerswitcher.ol.min.css" rel="stylesheet" />
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
        <div class="m-test-form" style="max-height: 8rem;">
            <div>
                <label for="selectPosicion" title="Posición del plugin en el mapa">Posición del panel "position"</label>
                <select name="position" id="selectPosicion">
                    <option value="" selected="selected"></option>
                    <option value="left">Izquierda</option>
                    <option value="right">Derecha</option>
                </select>
            </div>
            <div>
                <label for="selectCollapsed" title="Indica si el panel del plugin aparece colapsado al cargarse">Panel colapsado "collapsed"</label>
                <select name="collapsed" id="selectCollapsed">
                    <option value=''></option>
                    <option value="true" selected="selected">true</option>
                    <option value="false">false</option>
                </select>
            </div>
            <div>
                <label for="inputOrder" title="Define en que posición del panel debe aparecer en el conjunto de controles o plugins">Orden en la posición asignada "order"</label>
                <input type="number" name="order" id="inputOrder" list="orderSug" value="-1">
            </div>
            <div>
                <label for="inputTooltip" title="Título ilustrativo que aporta información adicional">Información de la herramienta "tooltip"</label>
                <input type="text" name="tooltip" id="inputTooltip" list="tooltipSug" value="">
                <datalist id="tooltipSug">
                    <option value="Gestor de estilos"></option>
                </datalist>
            </div>
            <div>
                <label for="selectLayer" title="Capa pre seleccionada que se cargará en el plugin. Debe de estar definida en el mapa. Por defecto ninguna">Capa pre seleccionada "layer"</label>
                <select name="layer" id="selectLayer">
                    <option value="" selected="selected"></option>
                    <option value="points">points</option>
                    <option value="polygons">polygons</option>
                    <option value="allgeoms">allgeoms</option>
                </select>
            </div>
        </div>
        <div class="m-test-buttons">
            <button id="removeButton">Eliminar Plugin</button>
        </div>
    </div>
    <div id="mapjs" class="m-container"></div>
    <script type="text/javascript" src="vendor/browser-polyfill.js"></script>
    <script type="text/javascript" src="js/apiidee.ol.min.js"></script>
    <script type="text/javascript" src="js/configuration.js"></script>
    <script type="text/javascript" src="plugins/stylemanager/stylemanager.ol.min.js"></script>
    <script type="text/javascript" src="plugins/vectors/vectors.ol.min.js"></script>
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
        });
        const points = new IDEE.layer.WFS({
            url: 'https://www.ign.es/wfs/redes-geodesicas',
            name: 'RED_REGENTE',
            legend: 'RED_REGENTE',
            geometry: 'MPOINT',
        });
        map.addLayers(points);


        const polygons = new IDEE.layer.WFS({
            url: "https://hcsigc.juntadeandalucia.es/geoserver/wfs?",
            namespace: "IECA",
            name: "sigc_provincias_1724753768757",
            legend: "Provincias",
            geometry: 'MPOLYGON',
        });
        map.addLayers(polygons);

        const allgeoms = new IDEE.layer.GeoJSON({
            name: "allgeoms",
            legend: 'geometrias',
            source: {
                "type": "FeatureCollection",
                "features": [{
                        "type": "Feature",
                        "id": "temp_1671099227379.1671099241598",
                        "geometry": {
                            "type": "Point",
                            "coordinates": [
                                -3.9550781249999925,
                                48.283192895483495,
                                0
                            ]
                        },
                        "properties": {
                            "alumnos": 3955,
                            "colegios": 41
                        }
                    },
                    {
                        "type": "Feature",
                        "id": "temp_1671099378275.1671099397755",
                        "geometry": {
                            "type": "LineString",
                            "coordinates": [
                                [
                                    7.382812500000008,
                                    43.802818719047195,
                                    0
                                ],
                                [
                                    8.129882812500007,
                                    46.8301336404474,
                                    0
                                ]
                            ]
                        },
                        "properties": {
                            "alumnos": 73828,
                            "colegios": 3500
                        }
                    },
                    {
                        "type": "Feature",
                        "id": "temp_1671099558770.1671099570826",
                        "geometry": {
                            "type": "Polygon",
                            "coordinates": [
                                [
                                    [
                                        1.076660156250006,
                                        45.92058734473366,
                                        0
                                    ],
                                    [
                                        3.911132812500006,
                                        48.70546289579056,
                                        0
                                    ],
                                    [
                                        4.504394531250007,
                                        47.546871598922365,
                                        0
                                    ],
                                    [
                                        3.229980468750008,
                                        46.27103747280259,
                                        0
                                    ],
                                    [
                                        0.9448242187500056,
                                        44.30812668488613,
                                        0
                                    ],
                                    [
                                        1.1206054687500069,
                                        45.95114968669142,
                                        0
                                    ],
                                    [
                                        1.076660156250006,
                                        45.92058734473366,
                                        0
                                    ]
                                ]
                            ]
                        },
                        "properties": {
                            "alumnos": 20342,
                            "colegios": 100
                        }
                    }
                ]
            }
        });
        map.addLayers(allgeoms);

        map.addPlugin(new IDEE.plugin.Layerswitcher({}));

        let mp = null;

        const selectPosicion = document.getElementById('selectPosicion');
        const inputOrder = document.getElementById('inputOrder');
        const inputTooltip = document.getElementById('inputTooltip');
        const selectCollapsed = document.getElementById('selectCollapsed');
        const selectLayer = document.getElementById("selectLayer");

        function create(propiedades) {
            mp = new IDEE.plugin.StyleManager(propiedades);
            map.addPlugin(mp);
        }

        function remove() {
            if (mp) map.removePlugin(mp);
            mp = null;
        }

        function getLayer(name) {
            if (name === 'points') {
                return points;
            } else if (name === 'polygons') {
                return polygons;
            } else if (name === 'allgeoms') {
                return allgeoms;
            } else {
                return null;
            }
        }

        function changeTest() {
            remove();
            const options = {};

            const selectPosition = selectPosicion.options[selectPosicion.selectedIndex].value;
            if (selectPosition !== '') options.position = selectPosition;

            if (inputOrder.value !== undefined) options.order = Number(inputOrder.value);

            if (inputTooltip.value !== '') options.tooltip = inputTooltip.value;

            const collapsed = selectCollapsed.options[selectCollapsed.selectedIndex].value;
            if (collapsed !== '') options.collapsed = (collapsed === 'true');

            options.layer = getLayer(selectLayer.options[selectLayer.selectedIndex].value);

            create(options);
        }

        [
            selectPosicion,
            inputOrder,
            inputTooltip,
            selectCollapsed,
            selectLayer,
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

    function gtag() {
        dataLayer.push(arguments);
    }
    gtag('js', new Date());
    gtag('config', 'G-19NTRSBP21');
</script>

</html>
