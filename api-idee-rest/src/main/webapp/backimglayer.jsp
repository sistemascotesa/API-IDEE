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
                <link href="plugins/backimglayer/backimglayer.ol.min.css" rel="stylesheet" />
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
                            <label for="selectPosicion" title="Posición del Plugin / Control">Posición
                                "position"</label>
                            <select name="position" id="selectPosicion">
                                <option value="left">Izquierda</option>
                                <option value="right" selected="selected">Derecha</option>
                            </select>
                        </div>
                        <div>
                            <label for="inputTooltip">Título de la Herramienta "tooltip"</label>
                            <input type="text" name="tooltip" id="inputTooltip" list="tooltipSug"
                                value="Capas de fondo">
                            <datalist id="tooltipSug">
                                <option value="Capas de fondo"></option>
                            </datalist>
                        </div>
                        <div>
                            <label for="inputOrder"
                                title="Define en que posición del panel debe aparecer en el conjunto de controles o plugins">Orden
                                entre controles / plugins "order"</label>
                            <input type="number" name="order" id="inputOrder" list="orderSug" value="-1">
                        </div>
                        <div>
                            <label for="ncolumn"
                                title="Número de columnas que tendrá el UI de capas, el valor mínimo deberá ser 1 o superior">Número
                                de columnas "columnsNumber"</label>
                            <input type="number" id="ncolumn" name="ncolumn" value="1" min="1">
                        </div>
                        <div>
                            <label for="selectCollapsed" title="Muestra el panel desplegado o colapsado">Colapsado
                                "collapsed"</label>
                            <select name="httpValue" id="selectCollapsed">
                                <option value=true>true</option>
                                <option value=false>false</option>
                            </select>
                        </div>
                        <div>
                            <label for="selectVisibility">Capas visibles "layerVisibility"</label>
                            <select name="httpValue" id="selectVisibility">
                                <option value=true>true</option>
                                <option value=false>false</option>
                            </select>
                        </div>
                        <div>
                            <label for="selectEmpty" title="Opción de selección sin capa base">Seleccionar sin capa
                                "empty"</label>
                            <select name="empty" id="selectEmpty">
                                <option value=true>true</option>
                                <option value=false selected="selected">false</option>
                            </select>
                        </div>
                        <div>
                            <label for="selectEnableLayerOpts"
                                title="Esta opción deshabilita el uso de 'ids', 'previews' y 'layers', cargando una configuración completa">Precarga
                                de capas "layerOpts"</label>
                            <select name="empty" id="selectEnableLayerOpts">
                                <option value=true selected="selected">true</option>
                                <option value=false>false</option>
                            </select>
                        </div>
                        <div>
                            <label for="inputIds"
                                title="Títulos de las capas, pasadas por parametros, tienen efecto cuando layerOpts no está activo">Ids
                                de capas "ids"</label>
                            <input type="text" name="ids" id="inputIds" list="idsSug" value="mapa,hibrido">
                            <datalist id="idsSug">
                                <option value="mapa,hibrido"></option>
                            </datalist>
                        </div>
                        <div>
                            <label for="inputTitles"
                                title="Títulos de las capas, pasadas por parametros, tienen efecto cuando layerOpts no está activo">Títulos
                                de las capas "titles"</label>
                            <input type="text" name="titles" id="inputTitles" list="titlesSug" value="Mapa,Hibrido">
                            <datalist id="titlesSug">
                                <option value="Mapa,Hibrido"></option>
                            </datalist>
                        </div>
                        <div>
                            <label for="inputPreviews"
                                title="Enlaces a las vistas de las capas cargadas, tienen efecto cuando layerOpts no está activo">Vistas
                                de las capas "previews"</label>
                            <input type="text" name="previews" id="inputPreviews" list="previewsSug"
                                value="plugins/backimglayer/images/svqmapa.png,plugins/backimglayer/images/svqimagen.png">
                            <datalist id="previewsSug">
                                <option
                                    value="plugins/backimglayer/images/svqmapa.png,plugins/backimglayer/images/svqimagen.png">
                                </option>
                            </datalist>
                        </div>
                        <div>
                            <label for="inputLayers"
                                title="Campo capas, funcionan con ids y previews para cargar cada capa con su apariencia, tienen efecto cuando layerOpts no está activo">Capas
                                por parámetro "layers"</label>
                            <input type="text" name="layers" id="inputLayers" list="layersSug"
                                value="WMTS*https://www.ign.es/wmts/ign-base?*IGNBaseTodo*GoogleMapsCompatible*Mapa IGN*false*image/jpeg*false*false*true,WMTS*https://www.ign.es/wmts/pnoa-ma?*OI.OrthoimageCoverage*GoogleMapsCompatible*Imagen (PNOA)*false*image/png*false*false*true"">
                <datalist id=" layersSug">
                            <option
                                value="WMTS*https://www.ign.es/wmts/ign-base?*IGNBaseTodo*GoogleMapsCompatible*Mapa IGN*false*image/jpeg*false*false*true,WMTS*https://www.ign.es/wmts/pnoa-ma?*OI.OrthoimageCoverage*GoogleMapsCompatible*Imagen (PNOA)*false*image/png*false*false*true">
                            </option>
                            </datalist>
                        </div>
                    </div>
                    <div class="m-test-buttons">
                        <button name="eliminar" class="m-test-button" id="removeButton">Eliminar Plugin</button>
                        <!-- <button name="eliminar" class="m-test-button" id="codeExample">Ver Ejemplo</button> -->
                    </div>
                </div>
                <div id="mapjs" class="m-container"></div>
                <script type="text/javascript" src="vendor/browser-polyfill.js"></script>
                <script type="text/javascript" src="js/apiidee.ol.min.js"></script>
                <script type="text/javascript" src="js/configuration.js"></script>
                <script type="text/javascript" src="plugins/backimglayer/backimglayer.ol.min.js"></script>
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
                                controls: ['rotate'],
                                // layers: ['OSM'],
                                zoom: 5,
                                maxZoom: 20,
                                minZoom: 4,
                                center: [-467062.8225, 4683459.6216],
                            });
                            let mp;

                            const createPlugin = (options) => {
                                mp = new IDEE.plugin.BackImgLayer(options);
                                window.mp = mp;
                                window.BackImgLayer = IDEE.plugin.BackImgLayer.BackImgLayer;
                                map.addPlugin(mp);
                            };

                            const removePlugin = () => {
                                if (mp) map.removePlugins(mp);
                            };

                            const removeButton = document.getElementById('removeButton');
                            removeButton.addEventListener('click', () => { removePlugin(); });

                            const selectPosicion = document.getElementById('selectPosicion');
                            const inputTooltip = document.getElementById('inputTooltip');
                            const ncolumn = document.getElementById('ncolumn');
                            const selectCollapsed = document.getElementById('selectCollapsed');
                            const inputOrder = document.getElementById('inputOrder');
                            const selectVisibility = document.getElementById('selectVisibility');
                            const selectEmpty = document.getElementById('selectEmpty');
                            const selectEnableLayerOpts = document.getElementById('selectEnableLayerOpts');
                            const inputIds = document.getElementById('inputIds');
                            const inputTitles = document.getElementById('inputTitles');
                            const inputPreviews = document.getElementById('inputPreviews');
                            const inputLayers = document.getElementById('inputLayers');

                            const updatePlugin = () => {
                                const options = {};
                                options.position = selectPosicion.options[selectPosicion.selectedIndex].value;
                                options.tooltip = inputTooltip.value !== '' ? options.tooltip = inputTooltip.value : '';
                                options.columnsNumber = ncolumn.value ?? 2;

                                options.collapsed = (selectCollapsed.options[selectCollapsed.selectedIndex].value === 'true');
                                if (inputOrder.value !== undefined) options.order = Number(inputOrder.value);
                                options.layerVisibility = (selectVisibility.options[selectVisibility.selectedIndex].value === 'true');
                                options.empty = (selectEmpty.options[selectEmpty.selectedIndex].value === 'true');

                                options.selectEnableLayerOpts = (selectEnableLayerOpts.options[selectEnableLayerOpts.selectedIndex].value === 'true');

                                if (inputIds.value !== '') options.ids = inputIds.value;
                                if (inputPreviews.value !== '') options.previews = inputPreviews.value;
                                if (inputTitles.value !== '') options.titles = inputTitles.value;
                                if (inputLayers.value !== '') options.layers = inputLayers.value;

                                if ((selectEnableLayerOpts.options[selectEnableLayerOpts.selectedIndex].value === 'true')) {
                                    const wmtsLayer1 = 'WMTS*https://www.ign.es/wmts/ign-base?*IGNBaseTodo*GoogleMapsCompatible*Mapa IGN*false*image/jpeg*false*false*true';
                                    const wmtsLayer2 = 'WMTS*https://www.ign.es/wmts/pnoa-ma?*OI.OrthoimageCoverage*GoogleMapsCompatible*Imagen (PNOA)*false*image/png*false*false*true';
                                    const wmtsLayer3 = 'WMTS*https://www.ign.es/wmts/ign-base?*IGNBaseOrto*GoogleMapsCompatible*Mapa IGN*true*image/jpeg*false*false*true';
                                    const restLayer4 = 'WMTS*https://www.ign.es/wmts/ign-base?*IGNBaseTodo*GoogleMapsCompatible*Mapa IGN*false*image/jpeg*false*false*true,WMTS*https://www.ign.es/wmts/pnoa-ma?*OI.OrthoimageCoverage*GoogleMapsCompatible*Imagen (PNOA)*false*image/png*false*false*truesumarWMTS*https://www.ign.es/wmts/ign-base?*IGNBaseOrto*GoogleMapsCompatible*Mapa IGN*true*image/jpeg*false*false*true';

                                    const pwImg1 = 'plugins/backimglayer/images/svqimagen.png';
                                    const pwImg2 = 'https://www.ign.es/iberpix/static/media/raster.c7a904f3.png';
                                    const pwImg3 = 'plugins/backimglayer/images/svqmapa.png';
                                    const pwImg4 = 'plugins/backimglayer/images/svqhibrid.png';
                                    options.layerOpts = [
                                        {
                                            id: 'raster',
                                            preview: pwImg1,
                                            title: 'Mapa',
                                            layers: [
                                                new IDEE.layer.WMTS({
                                                    url: 'https://www.ign.es/wmts/mapa-raster?',
                                                    name: 'MTN',
                                                    legend: 'Mapa',
                                                    matrixSet: 'GoogleMapsCompatible',
                                                    isBase: true,
                                                    displayInLayerSwitcher: false,
                                                    queryable: false,
                                                    visible: true,
                                                    format: 'image/jpeg',
                                                }),
                                            ],
                                        },
                                        {
                                            id: 'imagen',
                                            preview: pwImg2,
                                            title: 'Imagen',
                                            layers: [
                                                new IDEE.layer.XYZ({
                                                    url: 'https://tms-pnoa-ma.idee.es/1.0.0/pnoa-ma/{z}/{x}/{-y}.jpeg',
                                                    name: 'PNOA-MA',
                                                    legend: 'Imagen',
                                                    projection: 'EPSG:3857',
                                                    isBase: true,
                                                    displayInLayerSwitcher: false,
                                                    queryable: false,
                                                    visible: true,
                                                    maxZoom: 19,
                                                }),
                                                new IDEE.layer.WMTS({
                                                    url: 'https://www.ign.es/wmts/pnoa-ma?',
                                                    name: 'OI.OrthoimageCoverage',
                                                    matrixSet: 'GoogleMapsCompatible',
                                                    legend: 'Imagen',
                                                    isBase: false,
                                                    displayInLayerSwitcher: false,
                                                    queryable: false,
                                                    visible: true,
                                                    format: 'image/jpeg',
                                                    minZoom: 19,
                                                }),
                                            ],
                                        },
                                        {
                                            id: 'mapa',
                                            preview: pwImg3,
                                            title: 'Callejero',
                                            layers: [
                                                new IDEE.layer.WMTS({
                                                    url: 'https://www.ign.es/wmts/ign-base?',
                                                    name: 'IGNBaseTodo',
                                                    legend: 'Callejero',
                                                    matrixSet: 'GoogleMapsCompatible',
                                                    isBase: true,
                                                    displayInLayerSwitcher: false,
                                                    queryable: false,
                                                    visible: true,
                                                    format: 'image/jpeg',
                                                }),
                                            ],
                                        },
                                        {
                                            id: 'hibrido',
                                            title: 'Híbrido',
                                            preview: pwImg4,
                                            layers: [
                                                new IDEE.layer.XYZ({
                                                    url: 'https://tms-pnoa-ma.idee.es/1.0.0/pnoa-ma/{z}/{x}/{-y}.jpeg',
                                                    name: 'PNOA-MA',
                                                    legend: 'Imagen',
                                                    projection: 'EPSG:3857',
                                                    isBase: true,
                                                    displayInLayerSwitcher: false,
                                                    queryable: false,
                                                    visible: true,
                                                    maxZoom: 19,
                                                }),
                                                new IDEE.layer.WMTS({
                                                    url: 'https://www.ign.es/wmts/pnoa-ma?',
                                                    name: 'OI.OrthoimageCoverage',
                                                    matrixSet: 'GoogleMapsCompatible',
                                                    legend: 'Imagen',
                                                    isBase: false,
                                                    displayInLayerSwitcher: false,
                                                    queryable: false,
                                                    visible: true,
                                                    format: 'image/jpeg',
                                                    minZoom: 19,
                                                }),
                                                new IDEE.layer.WMTS({
                                                    url: 'https://www.ign.es/wmts/ign-base?',
                                                    name: 'IGNBaseOrto',
                                                    matrixSet: 'GoogleMapsCompatible',
                                                    legend: 'Topónimos',
                                                    isBase: false,
                                                    displayInLayerSwitcher: false,
                                                    queryable: false,
                                                    visible: true,
                                                    format: 'image/png',
                                                }),
                                            ],
                                        },
                                        {
                                            id: 'lidar',
                                            preview: 'https://wmts-mapa-lidar.idee.es/lidar?layer=EL.GridCoverageDSM&style=default&tilematrixset=GoogleMapsCompatible&Service=WMTS&Request=GetTile&Version=1.0.0&Format=image%2Fpng&TileMatrix=15&TileCol=16138&TileRow=12559',
                                            title: 'LiDAR',
                                            layers: [
                                                new IDEE.layer.WMTS({
                                                    url: 'https://wmts-mapa-lidar.idee.es/lidar?',
                                                    name: 'EL.GridCoverageDSM',
                                                    legend: 'LiDAR',
                                                    matrixSet: 'GoogleMapsCompatible',
                                                    isBase: true,
                                                    displayInLayerSwitcher: false,
                                                    queryable: false,
                                                    visible: true,
                                                    format: 'image/png',
                                                }),
                                            ],
                                        },
                                        {
                                            id: 'ocupacion-suelo',
                                            preview: 'https://servicios.idee.es/wmts/ocupacion-suelo?layer=LC.LandCoverSurfaces&style=LC.LandCoverSurfaces.Default&tilematrixset=GoogleMapsCompatible&Service=WMTS&Request=GetTile&Version=1.0.0&Format=image%2Fpng&TileMatrix=17&TileCol=64554&TileRow=50237',
                                            title: 'Ocupación',
                                            layers: [
                                                new IDEE.layer.WMTS({
                                                    url: 'https://servicios.idee.es/wmts/ocupacion-suelo?',
                                                    name: 'LC.LandCoverSurfaces',
                                                    legend: 'Ocupación',
                                                    matrixSet: 'GoogleMapsCompatible',
                                                    isBase: true,
                                                    displayInLayerSwitcher: false,
                                                    queryable: false,
                                                    visible: true,
                                                    format: 'image/png',
                                                }),
                                            ],
                                        },
                                        {
                                            id: 'historicos',
                                            preview: 'https://www.ign.es/wmts/primera-edicion-mtn?layer=mtn50-edicion1&style=default&tilematrixset=GoogleMapsCompatible&Service=WMTS&Request=GetTile&Version=1.0.0&Format=image%2Fjpeg&TileMatrix=14&TileCol=8071&TileRow=6278',
                                            title: 'Históricos',
                                            layers: [
                                                new IDEE.layer.WMTS({
                                                    url: 'https://www.ign.es/wmts/primera-edicion-mtn?',
                                                    name: 'mtn50-edicion1',
                                                    legend: 'Históricos',
                                                    matrixSet: 'GoogleMapsCompatible',
                                                    isBase: true,
                                                    displayInLayerSwitcher: false,
                                                    queryable: false,
                                                    visible: true,
                                                    format: 'image/jpeg',
                                                }),
                                            ],
                                        },
                                    ];
                                }

                                removePlugin();
                                createPlugin(options);
                            };

                            [
                                selectPosicion,
                                inputTooltip,
                                ncolumn,
                                selectCollapsed,
                                inputOrder,
                                selectVisibility,
                                selectEmpty,
                                selectEnableLayerOpts,
                                inputIds,
                                inputTitles,
                                inputPreviews,
                                inputLayers,
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