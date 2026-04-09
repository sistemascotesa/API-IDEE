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
    </link>
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
        <div class="m-test-form">
            <div>
                <label for="selectPosicion" title="Posición del Control">Posición del panel "position"</label>
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
            <div>
                <label for="order" title="Define en que posición del panel en la que debe aparecer en el conjunto de controles o plugins">Posición en el panel "order"</label>
                <input type="number" order="tooltip" id="inputOrder" list="orderSug" value="-1">
            </div>
            <div>
                <label for="inputTooltip">Título "tooltip"</label>
                <input type="text" name="tooltip" id="inputTooltip" list="tooltipSug" value="Título de control">
            </div>
            <div>
                <label for="selectTraking" title="Seguimieento">Seguimiento "traking"</label>
                <select name="traking" id="selectTraking">
                    <option value=true>true</option>
                    <option value=false>false</option>
                </select>
            </div>
            <div>
                <label for="selectHighAccuracy" title="Alta precisiónd e seguimiento">Alta precisión "highAccuracy"</label>
                <select name="highAccuracy" id="selectHighAccuracy">
                    <option value=true>true</option>
                    <option value=false selected="selected">false</option>
                </select>
            </div>
            <div>
                <label for="inputMaximunAge" 
                title="Antigüedad máxima en milisegundos de una posible posición almacenada en cache">
                Antigüedad máxima en ms "maximunAge"</label>
                <input type="number" order="tooltip" id="inputMaximunAge" min="0" value="60000" step="1000">
            </div>
        </div>
        <div class="m-test-buttons">
            <button name="eliminar control" class="m-test-button" id="removeButton">Eliminar Control</button>
        </div>
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
    <%
      }
   %>
    <script type="text/javascript">
        const urlParams = new URLSearchParams(window.location.search);
        IDEE.language.setLang(urlParams.get('language') || 'es');
        const map = IDEE.map({
            container: 'mapjs',
            controls: ['rotate'],
            zoom: 5,
            maxZoom: 20,
            minZoom: 4,
            center: [-467062.8225, 4683459.6216],
        });
        const Location = IDEE.control.Location;

        const selectPosition = document.getElementById('selectPosicion');
        const inputTooltip = document.getElementById('inputTooltip');
        const inputOrder = document.getElementById('inputOrder');
        const selectTraking = document.getElementById('selectTraking');
        const selectHighAccuracy = document.getElementById('selectHighAccuracy');
        const inputMaximunAge = document.getElementById('inputMaximunAge');

        const create = (options) => {
          if (!map.hasControl(Location.NAME)) {
            map.addControls(new Location(options));
          }
        };

        const remove = () => {
          const ctrls = map.getControls(Location.NAME);
          if (ctrls.length === 1) map.removeControls(ctrls[0]);
        };

        const recreate = () => {
          remove();
        
          const options = {};
          options.position = selectPosition.options[selectPosition.selectedIndex].value;
        
          if (inputOrder.value !== undefined) options.order = Number(inputOrder.value);
        
          if (inputTooltip.value !== '') options.tooltip = inputTooltip.value;
        
          options.traking = (selectTraking.options[selectTraking.selectedIndex].value === 'true');
          options.highAccuracy = (selectHighAccuracy.options[selectHighAccuracy.selectedIndex].value === 'true');
        
          if (inputMaximunAge.value !== undefined) options.maximunAge = Number(inputMaximunAge.value);
        
          create(options);
        };

        [
          selectPosition,
          inputTooltip,
          inputOrder,
          selectTraking,
          selectHighAccuracy,
          inputMaximunAge,
        ].forEach((ctrl) => {
          ctrl.addEventListener('change', recreate);
        });

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
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', 'G-19NTRSBP21');
</script>

</html>
