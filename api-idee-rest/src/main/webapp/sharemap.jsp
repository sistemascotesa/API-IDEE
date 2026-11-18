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
    <link href="plugins/sharemap/sharemap.ol.min.css" rel="stylesheet" />
    <link href="plugins/layerswitcher/layerswitcher.ol.min.css" rel="stylesheet" />
    <link href="plugins/backimglayer/backimglayer.ol.min.css" rel="stylesheet" />
    <style>
        .sharemap-test-panels { display: flex; flex-wrap: wrap; align-items: flex-start; gap: .5rem; }
        .sharemap-test-panels>details { flex: 1 1 24rem; min-width: 0; border: 1px solid rgb(168, 168, 168); border-radius: 4px; font-size: 13px; }
        .sharemap-test-panels summary { cursor: pointer; padding: .25rem .5rem; font-weight: bold; }
        .sharemap-test-panels summary span { font-weight: normal; }
        .sharemap-test-panels details>div { max-height: 15rem; overflow: auto; padding: 0 .5rem .5rem; }
        .sharemap-test-panels h3 { font-size: 13px; margin: .5rem 0 .15rem; }
        .sharemap-test-catalog { display: grid; grid-template-columns: repeat(auto-fill, minmax(14rem, 1fr)); gap: .1rem .75rem; }
        .sharemap-report-summary { display: flex; flex-wrap: wrap; align-items: flex-start; gap: .5rem .75rem; }
        .sharemap-report-qr { flex: 0 0 180px; }
        .sharemap-report-qr svg { width: 100% !important; max-width: 100%; }
        .sharemap-report-qr>p { margin: .25rem 0 0; font-size: 11px; }
        .sharemap-report-main { flex: 1 1 16rem; min-width: 0; display: flex; flex-direction: column; gap: .25rem; }
        .sharemap-report-main textarea { width: 100%; box-sizing: border-box; font: 11px monospace; }
        .sharemap-report-main p { margin: 0; }
        .sharemap-report-table { border-collapse: collapse; width: 100%; }
        .sharemap-report-table th, .sharemap-report-table td { border: 1px solid #ccc; padding: 1px 4px; text-align: left; vertical-align: top; }
        .sharemap-report-table code { word-break: break-all; font-size: 11px; }
        .sharemap-report-checks { list-style: none; padding: 0; margin: 0; }
        .sharemap-report-checks .ok { color: #1a7f37; }
        .sharemap-report-checks .ko { color: #c62828; }
    </style>
    <%
      Map<String, String[]> parameterMap = request.getParameterMap();
      PluginsManager.init(getServletContext());
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
        <div class="m-test-form" style="max-height: 13rem;">
            <div>
                <label for="selectPosition" title="Posición del plugin sobre el mapa. Por defecto: left">Posición "position"</label>
                <select name="position" id="selectPosition">
                    <option value="" selected="selected"></option>
                    <option value="left">Izquierda (left)</option>
                    <option value="right">Derecha (right)</option>
                </select>
            </div>
            <div>
                <label for="inputOrder" title="Define en qué posición del panel debe aparecer en el conjunto de controles o plugins">Orden entre controles / plugins "order"</label>
                <input type="number" name="order" id="inputOrder" value="1">
            </div>
            <div>
                <label for="inputTooltip" title="Texto del tooltip que aparece al pasar el ratón sobre el botón principal del plugin">Tooltip del botón del plugin "tooltip"</label>
                <input type="text" id="inputTooltip" list="tooltipSug">
                <datalist id="tooltipSug">
                    <option value="Compartir"></option>
                </datalist>
            </div>
            <div>
                <label for="inputBaseUrl" title="URL base que se usará para construir el enlace compartido. Se emplea cuando urlAPI es true">URL base "baseUrl"</label>
                <input type="text" id="inputBaseUrl" list="baseUrlSug">
                <datalist id="baseUrlSug">
                    <option value="https://componentes.idee.es/api-idee/"></option>
                    <option value="https://componentes-desarrollo.idee.es/api-idee/"></option>
                    <option value="https://componentes-beta.idee.es/api-idee/"></option>
                    <option value="http://localhost:8080/api-idee/"></option>
                </datalist>
            </div>
            <div>
                <label for="selectUrlAPI" title="Controla si se usa baseUrl (true) o la URL actual del visor (false) para generar el enlace compartido. Por defecto: false">Usar URL de API "urlAPI"</label>
                <select name="urlAPI" id="selectUrlAPI">
                    <option value=""></option>
                    <option value="true">true</option>
                    <option value="false" selected="selected">false</option>
                </select>
            </div>
            <div>
                <label for="selectMinimize" title="Solo actúa cuando urlAPI es true. Genera una URL minimizada (true) o en formato estándar (false). Por defecto: false">URL minimizada "minimize"</label>
                <select name="minimize" id="selectMinimize">
                    <option value=""></option>
                    <option value="true">true</option>
                    <option value="false" selected="selected">false</option>
                </select>
            </div>
            <div>
                <label for="inputTitle" title="Título primario del modal">Título principal del modal "title"</label>
                <input type="text" id="inputTitle" list="titleSug">
                <datalist id="titleSug">
                    <option value="Compartir URL"></option>
                </datalist>
            </div>
            <div>
                <label for="inputText" title="Texto que aparece como título de la sección de HTML embebido en el panel del plugin">Título secundario del modal "text"</label>
                <input type="text" id="inputText" list="textSug">
                <datalist id="textSug">
                    <option value="HTML embebido"></option>
                </datalist>
            </div>
            <div>
                <label for="selectShareLayer" title="Solo actúa cuando urlAPI es false. Incluye en el enlace todas las capas presentes en el mapa (true) o ninguna (false). Por defecto: false">Compartir capas "shareLayer"</label>
                <select name="shareLayer" id="selectShareLayer">
                    <option value=""></option>
                    <option value="true" selected="selected">true</option>
                    <option value="false">false</option>
                </select>
            </div>
            <div>
                <label for="inputFilterLayers" title="Lista de nombres de capas (separados por coma) que se incluirán en el enlace. Solo aplica cuando shareLayer es false o no está definido">Filtro de capas "filterLayers"</label>
                <input type="text" id="inputFilterLayers" list="filterLayersSug">
                <datalist id="filterLayersSug"></datalist>
            </div>
            <div>
                <label for="inputBtn" title="Texto del botón que cierra el panel del plugin">Texto del botón cerrar "btn"</label>
                <input type="text" id="inputBtn" list="btnSug">
                <datalist id="btnSug">
                    <option value="OK"></option>
                    <option value="Aceptar"></option>
                    <option value="Cerrar"></option>
                </datalist>
            </div>
            <div>
                <label for="inputCopyBtn" title="Texto del botón que copia la URL compartida al portapapeles">Botón copiar URL "copyBtn"</label>
                <input type="text" id="inputCopyBtn" list="copyBtnSug">
                <datalist id="copyBtnSug">
                    <option value="Copiar"></option>
                    <option value="Copiar URL"></option>
                </datalist>
            </div>
            <div>
                <label for="inputCopyBtnHtml" title="Texto del botón que copia el código HTML embebido al portapapeles">Botón copiar HTML "copyBtnHtml"</label>
                <input type="text" id="inputCopyBtnHtml" list="copyBtnHtmlSug">
                <datalist id="copyBtnHtmlSug">
                    <option value="Copiar"></option>
                    <option value="Copiar HTML"></option>
                </datalist>
            </div>
            <div>
                <label for="inputTooltipCopy" title="Mensaje que aparece como notificación emergente cuando se copia la URL o el HTML">Mensaje de confirmación "tooltipCopy"</label>
                <input type="text" id="inputTooltipCopy" list="tooltipCopySug">
                <datalist id="tooltipCopySug">
                    <option value="¡Copiado!"></option>
                    <option value="Copiado al portapapeles"></option>
                </datalist>
            </div>
            <div>
                <label for="inputQrImage" title="URL de la imagen que se muestra en el centro del código QR. Por defecto: el logo de IDEE">Imagen del QR "qrImage"</label>
                <input type="text" id="inputQrImage" list="qrImageSug">
                <datalist id="qrImageSug">
                    <option value="https://componentes.idee.es/estaticos/imagenes/logos/API_IDEE/API_2/API_2.svg"></option>
                </datalist>
            </div>
            <div>
                <label for="selectOverwriteStyles" title="Controla si se aplican los colores personalizados definidos en styles (true) o se mantienen los estilos por defecto (false). Por defecto: false">Sobreescribir estilos "overwriteStyles"</label>
                <select name="overwriteStyles" id="selectOverwriteStyles">
                    <option value=""></option>
                    <option value="true">true</option>
                    <option value="false" selected="selected">false</option>
                </select>
            </div>
            <div>
                <label for="inputPrimaryColor" title="Color primario del plugin: botón de apertura, caja y botones internos. Requiere overwriteStyles=true">Color primario "styles.primaryColor"</label>
                <input type="color" id="inputPrimaryColor" value="#71a7d3">
            </div>
            <div>
                <label for="inputSecondaryColor" title="Color secundario del plugin: fondo del panel abierto e imagen interior del botón. Requiere overwriteStyles=true">Color secundario "styles.secondaryColor"</label>
                <input type="color" id="inputSecondaryColor" value="#ffffff">
            </div>
            <div>
                <label for="selectBaseSelector" title="Quién elige la capa base que se comparte en baselayer: el control backgroundlayers o el plugin backimglayer. Recarga la página">Selector de capa base "selector"</label>
                <select id="selectBaseSelector">
                    <option value="backgroundlayers">Control backgroundlayers</option>
                    <option value="backimglayer">Plugin backimglayer</option>
                </select>
            </div>
            <div>
                <label for="selectStartBaseLayer" title="Recarga la página con el parámetro GET baselayer para arrancar con esa capa base">Capa base de arranque "baselayer"</label>
                <select id="selectStartBaseLayer"></select>
            </div>
        </div>
        <div class="m-test-buttons">
            <button name="eliminar" class="m-test-button" id="botonEliminar">Eliminar Plugin</button>
            <button type="button" class="m-test-button" id="reportButton">Generar URL y QR</button>
        </div>
        <div class="sharemap-test-panels">
            <details>
                <summary>Capas de prueba <span id="catalogCount"></span></summary>
                <div id="layerCatalog" class="sharemap-test-catalog"></div>
            </details>
            <details>
                <summary>URL y QR <span id="reportStatus"></span></summary>
                <div id="reportOutput" aria-live="polite"></div>
            </details>
        </div>
    </div>

    <div id="mapjs" class="m-container"></div>

    <script type="text/javascript" src="vendor/browser-polyfill.js"></script>
    <script type="text/javascript" src="js/apiidee.ol.min.js"></script>
    <script type="text/javascript" src="js/configuration.js"></script>
    <script type="text/javascript" src="plugins/sharemap/sharemap.ol.min.js"></script>
    <script type="text/javascript" src="plugins/layerswitcher/layerswitcher.ol.min.js"></script>
    <script type="text/javascript" src="plugins/backimglayer/backimglayer.ol.min.js"></script>
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
        const pageParams = new URLSearchParams(window.location.search);
        IDEE.language.setLang(pageParams.get('language') || 'es');

        const PLUGINS_URL = 'plugins';
        const QR_MARGIN = 4;
        const RFC3986_URL = /^(?:[A-Za-z0-9\-._~:/?@!$&'()*+,;=]|%[0-9A-Fa-f]{2})*$/;

        const START_BASE_LAYERS = [
          { value: '', label: '(sin parámetro)' },
          { value: 'none', label: 'none (sin capa base)' },
          { value: 'TMS*name=PNOA-MA;legend=Imagen;url=https://tms-pnoa-ma.idee.es/1.0.0/pnoa-ma/{z}/{x}/{-y}.jpeg;isBase=true;tileGridMaxZoom=19', label: 'TMS PNOA-MA' },
          { value: 'WMTS*name=IGNBaseTodo;legend=Callejero;url=https://www.ign.es/wmts/ign-base?;matrixSet=GoogleMapsCompatible;format=image/jpeg;isBase=true', label: 'WMTS IGNBaseTodo' },
          { value: 'QUICK*BASE_HIBRIDO_LayerGroup', label: 'Capa rápida híbrida (LayerGroup)' },
        ];

        const COSAS_POLIGONO = {
          type: 'FeatureCollection',
          crs: { type: 'name', properties: { name: 'urn:ogc:def:crs:OGC:1.3:CRS84' } },
          features: [
            { type: 'Feature', properties: { fecha_entero: 1950, fecha_fecha: '1950-01-01' }, geometry: { type: 'Polygon', coordinates: [[[-7.803961, 43.786743], [-9.241927, 43.167196], [-8.882436, 41.964781], [-6.590677, 41.819828], [0.584174, 40.716535], [1.632691, 41.214197], [3.010741, 41.730462], [3.205466, 42.486095], [-1.842394, 43.417953], [-1.842394, 43.417953], [-7.803961, 43.786743]]] } },
            { type: 'Feature', properties: { fecha_entero: 1955, fecha_fecha: '1955-01-01' }, geometry: { type: 'Polygon', coordinates: [[[-7.788982, 43.786743], [-9.226948, 43.167196], [-8.867457, 41.964781], [-8.70269, 41.135274], [-6.635614, 41.349271], [-2.965805, 40.739237], [0.134809, 40.180801], [1.647669, 41.214197], [3.02572, 41.730462], [3.220445, 42.486095], [-1.827415, 43.417953], [-1.827415, 43.417953], [-7.788982, 43.786743]]] } },
            { type: 'Feature', properties: { fecha_entero: 1960, fecha_fecha: '1960-01-01' }, geometry: { type: 'Polygon', coordinates: [[[-7.788982, 43.786743], [-9.226948, 43.167196], [-8.867457, 41.964781], [-8.70269, 41.135274], [-8.762605, 40.409295], [-4.224025, 40.203685], [-0.284597, 39.560014], [0.134809, 40.180801], [1.647669, 41.214197], [3.02572, 41.730462], [3.220445, 42.486095], [-1.827415, 43.417953], [-1.827415, 43.417953], [-7.788982, 43.786743]]] } },
            { type: 'Feature', properties: { fecha_entero: 1965, fecha_fecha: '1965-01-01' }, geometry: { type: 'Polygon', coordinates: [[[-7.788982, 43.786743], [-9.226948, 43.167196], [-8.867457, 41.964781], [-8.70269, 41.135274], [-9.032224, 39.663869], [-4.763262, 39.293901], [0.179746, 38.770311], [-0.284597, 39.560014], [0.134809, 40.180801], [1.647669, 41.214197], [3.02572, 41.730462], [3.220445, 42.486095], [-1.827415, 43.417953], [-1.827415, 43.417953], [-7.788982, 43.786743]]] } },
            { type: 'Feature', properties: { fecha_entero: 1970, fecha_fecha: '1970-01-01' }, geometry: { type: 'Polygon', coordinates: [[[-7.788982, 43.786743], [-9.226948, 43.167196], [-8.867457, 41.964781], [-8.70269, 41.135274], [-9.032224, 39.663869], [-9.451631, 38.781988], [-4.778241, 38.548076], [-0.778898, 37.628537], [0.179746, 38.770311], [-0.284597, 39.560014], [0.134809, 40.180801], [1.647669, 41.214197], [3.02572, 41.730462], [3.220445, 42.486095], [-1.827415, 43.417953], [-1.827415, 43.417953], [-7.788982, 43.786743]]] } },
            { type: 'Feature', properties: { fecha_entero: 1975, fecha_fecha: '1975-01-01' }, geometry: { type: 'Polygon', coordinates: [[[-7.788982, 43.786743], [-9.226948, 43.167196], [-8.867457, 41.964781], [-8.70269, 41.135274], [-9.032224, 39.663869], [-9.451631, 38.781988], [-8.777584, 38.325152], [-4.898072, 37.367093], [-2.126991, 36.733501], [-0.778898, 37.628537], [0.179746, 38.770311], [-0.284597, 39.560014], [0.134809, 40.180801], [1.647669, 41.214197], [3.02572, 41.730462], [3.220445, 42.486095], [-1.827415, 43.417953], [-1.827415, 43.417953], [-7.788982, 43.786743]]] } },
            { type: 'Feature', properties: { fecha_entero: 1980, fecha_fecha: '1980-01-01' }, geometry: { type: 'Polygon', coordinates: [[[-7.788982, 43.786743], [-9.226948, 43.167196], [-8.867457, 41.964781], [-8.70269, 41.135274], [-9.032224, 39.663869], [-9.451631, 38.781988], [-8.777584, 38.325152], [-8.95733, 37.033025], [-6.785402, 37.164442], [-4.478665, 36.685469], [-2.126991, 36.733501], [-0.778898, 37.628537], [0.179746, 38.770311], [-0.284597, 39.560014], [0.134809, 40.180801], [1.647669, 41.214197], [3.02572, 41.730462], [3.220445, 42.486095], [-1.827415, 43.417953], [-1.827415, 43.417953], [-7.788982, 43.786743]]] } },
            { type: 'Feature', properties: { fecha_entero: 1985, fecha_fecha: '1985-01-01' }, geometry: { type: 'Polygon', coordinates: [[[-7.788982, 43.786743], [-9.226948, 43.167196], [-8.867457, 41.964781], [-8.70269, 41.135274], [-9.032224, 39.663869], [-9.451631, 38.781988], [-8.777584, 38.325152], [-8.95733, 37.033025], [-6.785402, 37.164442], [-6.141313, 36.288055], [-5.826758, 35.997749], [-5.332457, 36.082533], [-4.478665, 36.685469], [-2.126991, 36.733501], [-0.778898, 37.628537], [0.179746, 38.770311], [-0.284597, 39.560014], [0.134809, 40.180801], [1.647669, 41.214197], [3.02572, 41.730462], [3.220445, 42.486095], [-1.827415, 43.417953], [-1.827415, 43.417953], [-7.788982, 43.786743]]] } },
          ],
        };

        const CAPITALES = {
          type: 'FeatureCollection',
          crs: { type: 'name', properties: { name: 'urn:ogc:def:crs:OGC:1.3:CRS84' } },
          features: [
            { type: 'Feature', properties: { nombre: 'Zaragoza' }, geometry: { type: 'Point', coordinates: [-0.8891, 41.6488] } },
            { type: 'Feature', properties: { nombre: 'Valencia' }, geometry: { type: 'Point', coordinates: [-0.3763, 39.4699] } },
          ],
        };

        const GPX_SOURCE = '<?xml version="1.0" encoding="UTF-8"?>'
          + '<gpx version="1.1" creator="API-IDEE" xmlns="http://www.topografix.com/GPX/1/1">'
          + '<trk><name>Madrid - Segovia - Valladolid</name><trkseg>'
          + '<trkpt lat="40.4168" lon="-3.7038"></trkpt>'
          + '<trkpt lat="40.9429" lon="-4.1088"></trkpt>'
          + '<trkpt lat="41.6523" lon="-4.7245"></trkpt>'
          + '</trkseg></trk></gpx>';

        const createPointFeature = (id, nombre, coordinates) => new IDEE.Feature(id, {
          type: 'Feature',
          properties: { nombre },
          geometry: { type: 'Point', coordinates },
        });

        const LAYER_CATALOG = [
          {
            id: 'wms',
            name: 'AU.AdministrativeBoundary',
            kind: 'ráster',
            checked: true,
            label: 'WMS · Límite administrativo',
            create: ({ name }) => new IDEE.layer.WMS({
              url: 'https://www.ign.es/wms-inspire/unidades-administrativas?',
              name,
              legend: 'Límite administrativo',
            }),
          },
          {
            id: 'wmts',
            name: 'EL.GridCoverageDSM',
            kind: 'ráster',
            checked: true,
            label: 'WMTS · MDS LiDAR (opacidad 0,5)',
            create: ({ name }) => new IDEE.layer.WMTS({
              url: 'https://wmts-mapa-lidar.idee.es/lidar',
              name,
              legend: 'Modelo Digital de Superficies LiDAR',
              matrixSet: 'GoogleMapsCompatible',
            }, { opacity: 0.5 }),
          },
          {
            id: 'tms',
            name: 'MTN',
            kind: 'ráster',
            checked: true,
            label: 'TMS · Mapa ráster (oculta)',
            create: ({ name }) => new IDEE.layer.TMS({
              url: 'https://tms-mapa-raster.ign.es/1.0.0/mapa-raster/{z}/{x}/{-y}.jpeg',
              name,
              legend: 'Mapa ráster',
              visibility: false,
            }),
          },
          {
            id: 'xyz',
            name: 'AtlasDeCresques',
            kind: 'ráster',
            checked: true,
            label: 'XYZ · Atlas de Cresques',
            create: ({ name }) => new IDEE.layer.XYZ({
              url: 'https://www.ign.es/web/catalogo-cartoteca/resources/webmaps/data/cresques/{z}/{x}/{y}.jpg',
              name,
              legend: 'Atlas de Cresques',
              projection: 'EPSG:3857',
            }),
          },
          {
            id: 'osm',
            name: 'OSM',
            kind: 'ráster',
            checked: false,
            label: 'OSM · OpenStreetMap (oculta)',
            create: ({ name }) => new IDEE.layer.OSM({ name, legend: 'OpenStreetMap', visibility: false }),
          },
          {
            id: 'geotiff',
            name: 'pnoa_cat_2021',
            kind: 'ráster',
            checked: false,
            label: 'GeoTIFF · COG PNOA Cataluña 2021',
            create: ({ name }) => new IDEE.layer.GeoTIFF({
              url: 'https://ftpcdd.cnig.es/Vuelos_2021/Vuelos_2021/catalunya_2021/Costa/01.VF/01.08_PNOA_2021_CAT_COSTA_22cm_VF_img8c_rgb_hu31/h50_0219_fot_002-0001_cog.tif',
              name,
              legend: 'COG PNOA Cataluña 2021',
            }),
          },
          {
            id: 'maplibre',
            name: 'mapa_base_vectorial',
            kind: 'vectorial',
            checked: false,
            label: 'MapLibre · Mapa base vectorial',
            create: ({ name }) => new IDEE.layer.MapLibre({
              url: 'https://vt-mapabase.idee.es/files/styles/mapaBase_scn_color1_CNIG.json',
              name,
              legend: 'Mapa base vectorial',
            }),
          },
          {
            id: 'wmc',
            name: 'Satelite',
            kind: 'ráster',
            checked: false,
            label: 'WMC · Contexto Satélite',
            create: ({ name }) => new IDEE.layer.WMC({
              url: IDEE.config.STATIC_RESOURCES_URL + '/Datos/WMC/satelite.xml',
              name,
            }),
          },
          {
            id: 'group',
            name: 'grupo_mixto',
            kind: 'grupo',
            checked: true,
            label: 'LayerGroup · WMS + GeoJSON',
            create: ({ name }) => new IDEE.layer.LayerGroup({
              name,
              legend: 'Grupo mixto (WMS + GeoJSON)',
              layers: [
                new IDEE.layer.WMS({
                  url: 'https://www.ign.es/wms-inspire/unidades-administrativas?',
                  name: 'AU.AdministrativeUnit',
                  legend: 'Unidad administrativa',
                }),
                new IDEE.layer.GeoJSON({ name: 'capitales', legend: 'Capitales', source: CAPITALES }),
              ],
            }),
          },
          {
            id: 'mbtiles',
            name: 'mbtiles_sin_url',
            kind: 'ráster',
            checked: false,
            label: 'MBTiles sin URL (no compartible)',
            create: ({ name }) => new IDEE.layer.MBTiles({
              name,
              legend: 'MBTiles sin URL',
              tileLoadFunction: () => Promise.resolve(PLUGINS_URL + '/backimglayer/images/svqmapa.png'),
            }),
          },
          {
            id: 'geojson',
            name: 'cosas1_poligono',
            kind: 'vectorial',
            checked: true,
            label: 'GeoJSON · En línea (8 polígonos)',
            create: ({ name }) => new IDEE.layer.GeoJSON({ name, source: COSAS_POLIGONO }),
          },
          {
            id: 'vector',
            name: 'puntos_vector',
            kind: 'vectorial',
            checked: true,
            label: 'Vector · 3 objetos de punto',
            create: ({ name }) => {
              const layer = new IDEE.layer.Vector({ name, legend: 'Puntos (Vector)' });
              layer.addFeatures([
                createPointFeature('madrid', 'Madrid', [-412305, 4926697]),
                createPointFeature('sevilla', 'Sevilla', [-666191, 4493482]),
                createPointFeature('barcelona', 'Barcelona', [241942, 5069311]),
              ]);
              return layer;
            },
          },
          {
            id: 'gpx',
            name: 'ruta_gpx',
            kind: 'vectorial',
            checked: true,
            label: 'GPX · Track en línea',
            create: ({ name }) => new IDEE.layer.GPX({ name, legend: 'Ruta GPX', source: GPX_SOURCE }),
          },
          {
            id: 'kml',
            name: 'las_huertas',
            kind: 'vectorial',
            checked: true,
            label: 'KML · Las Huertas',
            create: ({ name }) => new IDEE.layer.KML({
              url: 'https://componentes.idee.es/estaticos/Datos/KML/las_huertas_n1.kml',
              name,
              legend: 'Las Huertas',
              extract: true,
            }),
          },
          {
            id: 'wfs',
            name: 'RED_REGENTE',
            kind: 'vectorial',
            checked: true,
            label: 'WFS · Red geodésica REGENTE',
            create: ({ name }) => new IDEE.layer.WFS({
              url: 'https://www.ign.es/wfs/redes-geodesicas?',
              name,
              legend: 'Red Geodésica Nacional (REGENTE)',
              geometry: 'POINT',
              extract: true,
            }),
          },
          {
            id: 'ogcapif',
            name: 'falls',
            kind: 'vectorial',
            checked: true,
            label: 'OGCAPIFeatures · Cascadas (20)',
            create: ({ name }) => new IDEE.layer.OGCAPIFeatures({
              url: 'https://api-features.idee.es/collections/',
              name,
              legend: 'Cascadas',
              limit: 20,
            }),
          },
          {
            id: 'dataidee',
            name: 'nuc',
            kind: 'vectorial',
            checked: false,
            label: 'DataIDEE · Núcleos de población (100)',
            create: ({ name }) => new IDEE.layer.DataIDEE({
              url: 'https://api-features.ign.es',
              name,
              legend: 'Núcleos de población',
              limit: 100,
            }),
          },
          {
            id: 'mvt',
            name: 'sendero_gr',
            kind: 'vectorial',
            checked: true,
            label: 'MVT · Senderos GR',
            create: ({ name }) => new IDEE.layer.MVT({
              url: 'https://vt-fedme.idee.es/vt.senderogr/{z}/{x}/{y}.pbf',
              name,
              legend: 'Senderos GR',
            }),
          },
        ];

        const createBackImgLayer = () => new IDEE.plugin.BackImgLayer({
          position: 'right',
          collapsed: true,
          layerVisibility: true,
          layerId: 0,
          columnsNumber: 3,
          layerOpts: [
            {
              id: 'mapa',
              title: 'Mapa',
              preview: PLUGINS_URL + '/backimglayer/images/svqmapa.png',
              layers: [
                new IDEE.layer.WMTS({
                  url: 'https://www.ign.es/wmts/ign-base?',
                  name: 'IGNBaseTodo',
                  legend: 'Mapa',
                  matrixSet: 'GoogleMapsCompatible',
                  isBase: true,
                  displayInLayerSwitcher: false,
                  format: 'image/jpeg',
                }),
              ],
            },
            {
              id: 'imagen',
              title: 'Imagen',
              preview: PLUGINS_URL + '/backimglayer/images/svqimagen.png',
              layers: [
                new IDEE.layer.XYZ({
                  url: 'https://tms-pnoa-ma.idee.es/1.0.0/pnoa-ma/{z}/{x}/{-y}.jpeg',
                  name: 'PNOA-MA',
                  legend: 'Imagen',
                  projection: 'EPSG:3857',
                  isBase: true,
                  displayInLayerSwitcher: false,
                }),
              ],
            },
            {
              id: 'hibrido',
              title: 'Híbrido',
              preview: PLUGINS_URL + '/backimglayer/images/svqhibrid.png',
              layers: [
                new IDEE.layer.XYZ({
                  url: 'https://tms-pnoa-ma.idee.es/1.0.0/pnoa-ma/{z}/{x}/{-y}.jpeg',
                  name: 'PNOA-MA',
                  legend: 'Imagen',
                  projection: 'EPSG:3857',
                  isBase: true,
                  displayInLayerSwitcher: false,
                }),
                new IDEE.layer.WMTS({
                  url: 'https://www.ign.es/wmts/ign-base?',
                  name: 'IGNBaseOrto',
                  legend: 'Nombres',
                  matrixSet: 'GoogleMapsCompatible',
                  isBase: false,
                  displayInLayerSwitcher: false,
                  format: 'image/png',
                }),
              ],
            },
          ],
        });

        const baseSelector = pageParams.get('selector') === 'backimglayer' ? 'backimglayer' : 'backgroundlayers';
        const startBaseLayer = IDEE.config.MAP_VIEWER_BASE_LAYER;
        const sharedLayers = IDEE.config.MAP_VIEWER_LAYERS;
        const hasSharedLayers = Array.isArray(sharedLayers) && sharedLayers.length > 0;

        const mapOptions = {
          container: 'mapjs',
          zoom: Number.isFinite(IDEE.config.MAP_VIEWER_ZOOM) ? IDEE.config.MAP_VIEWER_ZOOM : 7,
          minZoom: 4,
          maxZoom: 20,
          center: Array.isArray(IDEE.config.MAP_VIEWER_CENTER)
            ? IDEE.config.MAP_VIEWER_CENTER : [144112, 4839064],
          controls: ['scale*exactScale=true', 'location'].concat(baseSelector === 'backgroundlayers' ? ['backgroundlayers'] : []),
        };
        if (hasSharedLayers) {
          mapOptions.layers = sharedLayers;
        } else if (baseSelector === 'backimglayer') {
          mapOptions.layers = [];
        }
        if (!IDEE.utils.isNullOrEmpty(startBaseLayer)) {
          mapOptions.baseLayer = startBaseLayer;
        }

        const map = IDEE.map(mapOptions);
        window.map = map;

        if (baseSelector === 'backimglayer' && IDEE.plugin.BackImgLayer) {
          map.addPlugin(createBackImgLayer());
        }
        if (IDEE.plugin.Layerswitcher) {
          map.addPlugin(new IDEE.plugin.Layerswitcher({}));
        }

        const catalogLayers = new Map();
        const catalogEntries = new WeakMap();

        const addCatalogLayer = (entry) => {
          const layer = entry.create(entry);
          catalogLayers.set(entry.id, layer);
          catalogEntries.set(layer, entry);
          map.addLayers(layer);
        };

        const removeCatalogLayer = (entry) => {
          const layer = catalogLayers.get(entry.id);
          if (layer) {
            map.removeLayers(layer);
            catalogLayers.delete(entry.id);
          }
        };

        const catalogCount = document.getElementById('catalogCount');
        const updateCatalogCount = () => {
          catalogCount.textContent = '(' + catalogLayers.size + ' de ' + LAYER_CATALOG.length + ')';
        };

        let mp;
        let currentOptions = {};

        const createElement = (tag, text, className) => {
          const element = document.createElement(tag);
          if (text !== undefined) element.textContent = text;
          if (className) element.className = className;
          return element;
        };

        const createTable = (headers, rows) => {
          const table = createElement('table', undefined, 'sharemap-report-table');
          const head = table.createTHead().insertRow();
          headers.forEach((header) => head.appendChild(createElement('th', header)));
          const body = table.createTBody();
          rows.forEach((cells) => {
            const row = body.insertRow();
            cells.forEach((cell) => {
              const td = row.insertCell();
              td.appendChild(cell instanceof window.Node ? cell : createElement('code', String(cell)));
            });
          });
          return table;
        };

        const decode = (value) => {
          try {
            return decodeURIComponent(value);
          } catch (error) {
            return value;
          }
        };

        const parseQuery = (url) => {
          const index = url.indexOf('?');
          const query = index === -1 ? '' : url.slice(index + 1);
          return query.split('&').filter((pair) => pair !== '').map((pair) => {
            const separator = pair.indexOf('=');
            return separator === -1
              ? { key: pair, raw: undefined }
              : { key: pair.slice(0, separator), raw: pair.slice(separator + 1) };
          });
        };

        const getQueryValue = (query, key) => query.find((param) => param.key === key)?.raw;

        const getLayerKind = (layer) => {
          if (catalogEntries.has(layer)) return catalogEntries.get(layer).kind;
          if (layer.type === 'LayerGroup') return 'grupo';
          return layer instanceof IDEE.layer.Vector || layer.type === 'MapLibre' ? 'vectorial' : 'ráster';
        };

        const getRestLayer = (layer) => {
          try {
            return IDEE.utils.isFunction(layer.getRestLayer) ? layer.getRestLayer() : null;
          } catch (error) {
            return null;
          }
        };

        const isSharedByOptions = (layer, { urlAPI, shareLayer, filterLayers = [] }) => {
          if (layer.isBase === true || ['__draw__', 'selectionLayer'].includes(layer.name)) return false;
          if (shareLayer === false) return filterLayers.includes(layer.name);
          if (urlAPI === true) return layer.displayInLayerSwitcher !== false;
          return shareLayer === true && layer.displayInLayerSwitcher === true;
        };

        const getBaseLayerProvider = () => {
          const provider = map.getControls()
            .find((control) => IDEE.utils.isFunction(control.getSelectedBaseLayers)
              && control.getSelectedBaseLayers().some((layer) => layer.isVisible()));
          return provider ? 'control ' + provider.name : 'capas base del mapa (getBaseLayers)';
        };

        const createCheck = (ok, text) => createElement('li', (ok ? '✔ ' : '✘ ') + text, ok ? 'ok' : 'ko');

        const describeQR = (container) => {
          const svg = container.querySelector('svg');
          if (!svg) return 'La URL no cabe en un código QR (se muestra el aviso «demasiado larga»).';
          const version = (svg.viewBox.baseVal.width - (2 * QR_MARGIN) - 17) / 4;
          const image = container.querySelector('img') ? 'con logo (nivel H, Q o M)' : 'sin logo (nivel L)';
          return 'QR versión ' + version + ', ' + image + '.';
        };

        const reportOutput = document.getElementById('reportOutput');
        const reportStatus = document.getElementById('reportStatus');
        let reportSequence = 0;

        const renderReport = () => {
          if (!mp || !mp.controls[0]) return;
          const control = mp.controls[0];
          reportSequence += 1;
          const sequence = reportSequence;
          const options = currentOptions;
          control.getShareURL().then((url) => {
            if (sequence !== reportSequence) return;
            const query = parseQuery(url);
            const layersRaw = getQueryValue(query, 'layers');
            const layersParam = layersRaw ? layersRaw.split(',').map(decode) : [];
            const baseLayerRaw = getQueryValue(query, 'baselayer');
            const baseLayerParam = baseLayerRaw === undefined ? undefined : decode(baseLayerRaw);
            const restBaseLayer = map.getRestBaseLayer();

            const layerRows = map.getLayers().map((layer) => {
              const rest = getRestLayer(layer);
              return {
                layer,
                rest,
                cells: [layer.name, layer.type, getLayerKind(layer), layer.isBase ? 'sí' : 'no', IDEE.utils.isNullOrEmpty(rest) ? 'null → no compartible' : rest],
              };
            });
            const expected = layerRows.filter(({ layer, rest }) => !IDEE.utils.isNullOrEmpty(rest)
              && isSharedByOptions(layer, options));
            const missing = expected.filter(({ rest }) => !layersParam.includes(rest));
            const unshared = layerRows.filter(({ layer, rest }) => IDEE.utils.isNullOrEmpty(rest)
              && layer.isBase !== true);
            const layersOk = missing.length === 0;
            const baseOk = restBaseLayer === undefined
              ? baseLayerParam === undefined : baseLayerParam === restBaseLayer;
            const urlOk = RFC3986_URL.test(url);
            const failures = [layersOk, baseOk, urlOk].filter((ok) => !ok).length;

            const urlBox = createElement('textarea', url);
            urlBox.readOnly = true;
            urlBox.rows = 3;
            const openLink = createElement('a', 'Abrir URL compartida');
            openLink.href = url;
            openLink.target = '_blank';
            openLink.rel = 'noopener';

            const checks = createElement('ul', undefined, 'sharemap-report-checks');
            checks.appendChild(createCheck(layersOk, layersOk
              ? 'Las ' + expected.length + ' capas compartibles según las opciones están en «layers».'
              : 'Faltan en «layers»: ' + missing.map(({ layer }) => layer.name).join(', ') + '.'));
            checks.appendChild(createCheck(baseOk, restBaseLayer === undefined
              ? 'La capa base no es representable y «baselayer» se omite.'
              : '«baselayer» coincide con map.getRestBaseLayer().'));
            checks.appendChild(createCheck(urlOk, 'La URL solo contiene caracteres RFC 3986 y %XX bien formados.'));
            if (unshared.length > 0) {
              checks.appendChild(createElement('li', 'ℹ No compartibles (aviso esperado): ' + unshared.map(({ layer }) => layer.name).join(', ') + '.'));
            }

            const qrColumn = createElement('div', undefined, 'sharemap-report-qr');
            const qr = createElement('div', undefined, 'm-plugin-sharemap-qr');
            qr.id = 'm-plugin-sharemap-qr';
            const qrInfo = createElement('p');
            qrColumn.append(qr, qrInfo);

            const baseInfo = createElement('p');
            baseInfo.append(
              createElement('strong', 'Fondo activo: '),
              (map.getActiveBaseLayers().map((layer) => layer.name).join(' + ') || '(ninguno)') + ' · aportado por ' + getBaseLayerProvider(),
            );

            const main = createElement('div', undefined, 'sharemap-report-main');
            main.append(urlBox, openLink, checks, baseInfo);
            const summary = createElement('div', undefined, 'sharemap-report-summary');
            summary.append(qrColumn, main);

            const paramRows = query.flatMap(({ key, raw }) => {
              if (raw === undefined) return [[key, '(sin valor)']];
              if (key === 'layers' || key === 'controls') {
                return raw.split(',').map((value, index) => [key + '[' + index + ']', decode(value)]);
              }
              return [[key, decode(raw)]];
            });

            reportStatus.textContent = '· ' + (options.urlAPI ? 'REST' : 'visualizador') + ' · ' + url.length + ' caracteres · ' + (failures === 0 ? '✔ todo correcto' : '✘ ' + failures + ' fallo(s)');
            reportOutput.replaceChildren(
              summary,
              createElement('h3', 'map.getRestBaseLayer()'),
              createTable(['Cadena REST de la capa base'], [[restBaseLayer === undefined ? 'undefined → no representable' : restBaseLayer]]),
              createElement('h3', 'Parámetros de la URL'),
              createTable(['Parámetro', 'Valor decodificado'], paramRows),
              createElement('h3', 'Capas del mapa'),
              createTable(['Nombre', 'Tipo', 'Clase', 'Base', 'getRestLayer()'], layerRows.map(({ cells }) => cells)),
            );

            control.buildQR(qrColumn, Promise.resolve(url)).then(() => {
              if (sequence === reportSequence) qrInfo.textContent = describeQR(qr);
            });
          });
        };

        const createPlugin = (options) => {
          mp = new IDEE.plugin.ShareMap(options);
          window.mp = mp;
          map.addPlugin(mp);
        };

        const removePlugin = () => {
          if (mp) map.removePlugins(mp);
        };

        const removeButton = document.getElementById('botonEliminar');
        removeButton.addEventListener('click', () => { removePlugin(); });

        const selectPosition = document.getElementById('selectPosition');
        const inputOrder = document.getElementById('inputOrder');
        const inputTooltip = document.getElementById('inputTooltip');
        const inputBaseUrl = document.getElementById('inputBaseUrl');
        inputBaseUrl.value = inputBaseUrl.value || new URL('.', window.location.href).href;
        const selectUrlAPI = document.getElementById('selectUrlAPI');
        const selectMinimize = document.getElementById('selectMinimize');
        const selectShareLayer = document.getElementById('selectShareLayer');
        const inputFilterLayers = document.getElementById('inputFilterLayers');
        const selectOverwriteStyles = document.getElementById('selectOverwriteStyles');
        const inputPrimaryColor = document.getElementById('inputPrimaryColor');
        const inputSecondaryColor = document.getElementById('inputSecondaryColor');
        const inputTitle = document.getElementById('inputTitle');
        const inputText = document.getElementById('inputText');
        const inputBtn = document.getElementById('inputBtn');
        const inputCopyBtn = document.getElementById('inputCopyBtn');
        const inputCopyBtnHtml = document.getElementById('inputCopyBtnHtml');
        const inputTooltipCopy = document.getElementById('inputTooltipCopy');
        const inputQrImage = document.getElementById('inputQrImage');
        const filterLayersSug = document.getElementById('filterLayersSug');
        const selectBaseSelector = document.getElementById('selectBaseSelector');
        const selectStartBaseLayer = document.getElementById('selectStartBaseLayer');
        const layerCatalog = document.getElementById('layerCatalog');
        const reportButton = document.getElementById('reportButton');

        const parseBool = (val) => {
          if (val === 'true') return true;
          if (val === 'false') return false;
          return undefined;
        };

        const updatePlugin = () => {
          const options = {};

          options.position = selectPosition.value;
          options.order = Number(inputOrder.value);
          options.tooltip = inputTooltip.value.trim();
          options.baseUrl = inputBaseUrl.value;
          options.urlAPI = parseBool(selectUrlAPI.value);
          options.minimize = parseBool(selectMinimize.value);
          options.shareLayer = parseBool(selectShareLayer.value);
          options.filterLayers = inputFilterLayers.value.trim().split(',').map((l) => l.trim());
          options.overwriteStyles = parseBool(selectOverwriteStyles.value);
          options.styles = {};
          options.styles.primaryColor = inputPrimaryColor.value.trim();
          options.styles.secondaryColor = inputSecondaryColor.value.trim();
          options.title = inputTitle.value.trim();
          options.text = inputText.value.trim();
          options.btn = inputBtn.value.trim();
          options.copyBtn = inputCopyBtn.value.trim();
          options.copyBtnHtml = inputCopyBtnHtml.value.trim();
          options.tooltipCopy = inputTooltipCopy.value.trim();
          options.qrImage = inputQrImage.value.trim();

          removePlugin();
          currentOptions = options;
          createPlugin(options);
          renderReport();
        };

        [
          selectPosition,
          inputOrder,
          inputTooltip,
          inputBaseUrl,
          selectUrlAPI,
          selectMinimize,
          selectShareLayer,
          inputFilterLayers,
          selectOverwriteStyles,
          inputPrimaryColor,
          inputSecondaryColor,
          inputTitle,
          inputText,
          inputBtn,
          inputCopyBtn,
          inputCopyBtnHtml,
          inputTooltipCopy,
          inputQrImage,
        ].forEach((ctrl) => {
          ctrl.addEventListener('change', updatePlugin);
        });

        const reloadWith = (changes) => {
          const own = { selector: baseSelector, baselayer: startBaseLayer, ...changes };
          const query = Object.keys(own)
            .filter((key) => !IDEE.utils.isNullOrEmpty(own[key]) && !(key === 'selector' && own[key] === 'backgroundlayers'))
            .map((key) => key + '=' + encodeURIComponent(own[key]))
            .join('&');
          window.location.href = window.location.pathname + (query ? '?' + query : '');
        };

        selectBaseSelector.value = baseSelector;
        selectBaseSelector.addEventListener('change', () => reloadWith({ selector: selectBaseSelector.value }));

        START_BASE_LAYERS.forEach(({ value, label }) => {
          const option = createElement('option', label);
          option.value = value;
          selectStartBaseLayer.appendChild(option);
        });
        selectStartBaseLayer.value = START_BASE_LAYERS.some(({ value }) => value === startBaseLayer) ? startBaseLayer : '';
        selectStartBaseLayer.addEventListener('change', () => reloadWith({ baselayer: selectStartBaseLayer.value }));

        LAYER_CATALOG.forEach((entry) => {
          const label = createElement('label');
          const checkbox = createElement('input');
          checkbox.type = 'checkbox';
          checkbox.checked = entry.checked && !hasSharedLayers;
          checkbox.addEventListener('change', () => {
            if (checkbox.checked) {
              addCatalogLayer(entry);
            } else {
              removeCatalogLayer(entry);
            }
            updateCatalogCount();
            renderReport();
          });
          label.append(checkbox, ' ' + entry.label + ' ', createElement('small', '(' + entry.kind + ')'));
          layerCatalog.appendChild(label);
          if (checkbox.checked) addCatalogLayer(entry);
        });
        updateCatalogCount();

        const catalogNames = LAYER_CATALOG.map((entry) => entry.name);
        [...catalogNames, catalogNames.join(',')].forEach((value) => {
          const option = createElement('option');
          option.value = value;
          filterLayersSug.appendChild(option);
        });

        reportButton.addEventListener('click', renderReport);

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
