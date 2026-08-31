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
                    <div class="m-test-form" style="min-height: 12.15rem;">
                        <div>
                            <label for="selectPosicion">Posición del panel "position"</label>
                            <select name="position" id="selectPosicion">
                                <option value="" selected="selected"></option>
                                <option value="left">Izquierda (left)</option>
                                <option value="right">Derecha (right)</option>
                                <option value="center-top-left">Centro superior izquierdo (center-top-left)</option>
                                <option value="center-top-right">Centro superior derecho (center-top-right)</option>
                                <option value="center-bottom-left">Centro inferior izquierdo (center-bottom-left)
                                </option>
                                <option value="center-bottom-right">Centro inferior derecho (center-bottom-right)
                                </option>
                                <option value="down">Abajo (down)</option>
                            </select>
                        </div>
                        <div>
                            <label for="inputOrder"
                                title="Define en que posición del panel debe aparecer en el conjunto de controles o plugins">Orden
                                entre controles / plugins "order"</label>
                            <input type="number" name="order" id="inputOrder" list="orderSug" value="-1">
                        </div>
                        <div>
                            <label for="inputTooltip" title="Título ilustrativo que aporta información adicional">Título
                                "tooltip"</label>
                            <input type="text" name="tooltip" id="inputTooltip" list="tooltipSug"
                                value="Series Temporales">
                        </div>
                        <div>
                            <label for="selectCollapsed">Panel colapsado "collapsed"</label>
                            <select name="collapsed" id="selectCollapsed">
                                <option value='' selected="selected"></option>
                                <option value="true">true</option>
                                <option value="false">false</option>
                            </select>
                        </div>
                        <div>
                            <label for="selectCollapsible">Panel colapsable "collapsible"</label>
                            <select name="collapsible" id="selectCollapsible">
                                <option value='' selected="selected"></option>
                                <option value="true">true</option>
                                <option value="false">false</option>
                            </select>
                        </div>
                        <div>
                            <label for="typeTimeLine">Tipo de línea de tiempo "timelineType"</label>
                            <select name="typeTimeLine" id="typeTimeLine">
                                <option value="absoluteSimple" selected="selected">absoluteSimple</option>
                                <option value="absolute">absolute</option>
                                <option value="relative">relative</option>
                            </select>
                        </div>
                        <div class="origin">
                            <label for="selectIntervals">Selección de intervalos "intervals"</label>
                            <select name="intervals" id="selectIntervals">
                                <option selected></option>
                                <option
                                    value='[["NACIONAL 1981-1986","1986","WMS*NACIONAL_1981-1986*https://www.ign.es/wms/pnoa-historico*NACIONAL_1981-1986"],["OLISTAT","1998","WMS*OLISTAT*https://www.ign.es/wms/pnoa-historico*OLISTAT"],["SIGPAC","2003","WMS*SIGPAC*https://www.ign.es/wms/pnoa-historico*SIGPAC"],["PNOA 2004","2004","WMS*pnoa2004*https://www.ign.es/wms/pnoa-historico*pnoa2004"],["PNOA 2005","2005","WMS*pnoa2005*https://www.ign.es/wms/pnoa-historico*pnoa2005"],["PNOA 2006","2006","WMS*pnoa2006*https://www.ign.es/wms/pnoa-historico*pnoa2006"],["PNOA 2010","2010","WMS*pnoa2010*https://www.ign.es/wms/pnoa-historico*pnoa2010"]]'>
                                    Ej: 7 Capas</option>
                                <option
                                    value='[["NACIONAL 1981-1986","1986","WMS*NACIONAL_1981-1986*https://www.ign.es/wms/pnoa-historico*NACIONAL_1981-1986"],["OLISTAT","1998","WMS*OLISTAT*https://www.ign.es/wms/pnoa-historico*OLISTAT"],["SIGPAC","2003","WMS*SIGPAC*https://www.ign.es/wms/pnoa-historico*SIGPAC"],["PNOA 2004","2004","WMS*pnoa2004*https://www.ign.es/wms/pnoa-historico*pnoa2004"],["PNOA 2005","2005","WMS*pnoa2005*https://www.ign.es/wms/pnoa-historico*pnoa2005"],["PNOA 2006","2006","WMS*pnoa2006*https://www.ign.es/wms/pnoa-historico*pnoa2006"],["PNOA 2007","2007","WMS*pnoa2007*https://www.ign.es/wms/pnoa-historico*pnoa2007"],["PNOA 2008","2008","WMS*pnoa2008*https://www.ign.es/wms/pnoa-historico*pnoa2008"],["PNOA 2009","2009","WMS*pnoa2009*https://www.ign.es/wms/pnoa-historico*pnoa2009"],["PNOA 2010","2010","WMS*pnoa2010*https://www.ign.es/wms/pnoa-historico*pnoa2010"],["PNOA 2011","2011","WMS*pnoa2011*https://www.ign.es/wms/pnoa-historico*pnoa2011"],["PNOA 2012","2012","WMS*pnoa2012*https://www.ign.es/wms/pnoa-historico*pnoa2012"],["PNOA 2013","2013","WMS*pnoa2013*https://www.ign.es/wms/pnoa-historico*pnoa2013"],["PNOA 2014","2014","WMS*pnoa2014*https://www.ign.es/wms/pnoa-historico*pnoa2014"],["PNOA 2015","2015","WMS*pnoa2015*https://www.ign.es/wms/pnoa-historico*pnoa2015"],["PNOA 2016","2016","WMS*pnoa2016*https://www.ign.es/wms/pnoa-historico*pnoa2016"],["PNOA 2017","2017","WMS*pnoa2017*https://www.ign.es/wms/pnoa-historico*pnoa2017"],["PNOA 2018","2018","WMS*pnoa2018*https://www.ign.es/wms/pnoa-historico*pnoa2018"]]'>
                                    Ej: 18 capas</option>
                            </select>
                        </div>
                        <div class="origin">
                            <label for="inputIntervals">Intervalos "intervals"</label>
                            <input type="text" name="intervals" id="inputIntervals">
                        </div>
                        <div class="origin">
                            <label for="selectAnimation">Seleccionar "animation"</label>
                            <select name="animation" id="selectAnimation">
                                <option value=""></option>
                                <option value="true" selected="selected">true</option>
                                <option value="false">false</option>
                            </select>
                        </div>
                        <div class="origin">
                            <label for="inputSpeed">Velocidad de animacion (s) "speed"</label>
                            <input type="number" min="0.2" max="5" step="0.1" name="speed" step="any" id="inputSpeed">
                        </div>
                        <div class="origin">
                            <label for="selectSnapMode">Modo de ajuste de acercamiento "snapMode"</label>
                            <select name="snapMode" id="selectSnapMode">
                                <option value="bySpep">bySpep</option>
                                <option value="byStepIntersection" selected="selected">byStepIntersection</option>
                            </select>
                        </div>
                        <div class="dynamic">
                            <label for="time">Capas disponibles "intervals"</label>
                            <input type="text" name="time" id="time">
                        </div>

                        <div class="dynamic">
                            <label for="speedDate">Velocidad por segundo "speedDate"</label>
                            <input type="number" min="1" name="speedDate" id="speedDate">
                        </div>

                        <div class="dynamic">
                            <label for="paramsDate">Unidad de tiempo del paso "paramsDate"</label>
                            <select name="paramsDate" id="paramsDate">
                                <option value="yr">Años (yr)</option>
                                <option value="mos">Meses (mos)</option>
                                <option value="day">Días (day)</option>
                                <option value="hrs">Horas (hrs)</option>
                                <option value="min">Minutos (min)</option>
                                <option value="sec">Segundos (sec)</option>
                            </select>
                        </div>

                        <div class="dynamic">
                            <label for="stepValue">Valor del step "stepValue"</label>
                            <input type="number" min="1" name="stepValue" id="stepValue">
                        </div>

                        <div class="dynamic">
                            <label for="sizeWidthDinamic">Tamaño plugin "sizeWidthDinamic"</label>
                            <select name="sizeWidthDinamic" id="sizeWidthDinamic">
                                <option value="">Pequeño ("")</option>
                                <option value="sizeWidthDinamic_medium">Mediano ("sizeWidthDinamic_medium")</option>
                                <option value="sizeWidthDinamic_big">Grande ("sizeWidthDinamic_big")</option>
                            </select>
                        </div>

                        <div class="dynamic">
                            <label for="formatValueDinamic">Representación de los datos "formatValue"</label>
                            <select name="formatValueDinamic" id="formatValueDinamic">
                                <option value="logarithmic">Logarítmica ("logarithmic")</option>
                                <option value="exponential">Exponencial ("exponential")</option>
                                <option value="linear">Lineal ("linear")</option>
                            </select>
                        </div>

                        <div class="dynamic">
                            <label for="formatMove">Movimiento en pasos "formatMove"</label>
                            <select name="formatMove" id="formatMove">
                                <option value="continuous">continuous ("continuous")</option>
                                <option value="discrete">discrete ("discrete")</option>
                            </select>
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
                                center: [-467062.8225, 4683459.6216],
                                zoom: 6,
                            });

                            const Timeline = IDEE.control.Timeline;

                            const create = (options) => {
                                if (!map.hasControl(Timeline.NAME)) {
                                    map.addControls(new Timeline(options));
                                }
                            };

                            const remove = () => {
                                const ctrls = map.getControls(Timeline.NAME);
                                if (ctrls.length === 1) map.removeControls(ctrls);
                            };

                            const inputIntervals = document.getElementById('inputIntervals');
                            const selectIntervals = document.getElementById('selectIntervals');
                            const selectAnimation = document.getElementById('selectAnimation');
                            const inputSpeed = document.getElementById('inputSpeed');
                            const selectPosicion = document.getElementById('selectPosicion');
                            const position = selectPosicion.options[selectPosicion.selectedIndex].value;

                            const inputTooltip = document.getElementById('inputTooltip');
                            const selectCollapsible = document.getElementById('selectCollapsible');
                            const selectCollapsed = document.getElementById('selectCollapsed');
                            const inputOrder = document.getElementById('inputOrder');
                            const selectSnapMode = document.getElementById('selectSnapMode');

                            const intervals = [
                                ['NACIONAL 1981-1986', '1986', 'WMS*NACIONAL_1981-1986*https://www.ign.es/wms/pnoa-historico*NACIONAL_1981-1986'],
                                ['OLISTAT', '1998', 'WMS*OLISTAT*https://www.ign.es/wms/pnoa-historico*OLISTAT'],
                                ['SIGPAC', '1998', 'WMS*SIGPAC*https://www.ign.es/wms/pnoa-historico*SIGPAC'],
                                // ['SIGPAC', '2003', 'WMS*SIGPAC*https://www.ign.es/wms/pnoa-historico*SIGPAC'],
                                ['PNOA 2004', '2004', 'WMS*pnoa2004*https://www.ign.es/wms/pnoa-historico*pnoa2004'],
                                ['PNOA 2005', '2005', 'WMS*pnoa2005*https://www.ign.es/wms/pnoa-historico*pnoa2005'],
                                ['PNOA 2006', '2006', 'WMS*pnoa2006*https://www.ign.es/wms/pnoa-historico*pnoa2006'],
                                ['PNOA 2010', '2010', 'WMS*pnoa2010*https://www.ign.es/wms/pnoa-historico*pnoa2010'],
                            ];
                            const time = [
                                {
                                    id: '1',
                                    init: '1990-05-12T23:39:58.767Z',
                                    end: '2015-05-29T20:22:26.001Z',
                                    layer: 'WMS*Eventos sísmicos*https://www.ign.es/wms-inspire/geofisica*NZ.ObservedEvent',
                                    attributeParam: 'date',
                                },
                                {
                                    id: '2',
                                    init: '1990-05-12T23:39:58.767Z',
                                    end: '2015-05-29T20:22:26.001Z',
                                    // grupo: 'vectorWMS_GRUPO',
                                    layer: 'WMS*Eventos sísmicos*https://www.ign.es/wms-inspire/geofisica*NZ.ObservedEvent',
                                    attributeParam: 'date',
                                    grupo: 'NZ.ObservedEvent - equalsTimeLine',
                                },
                            ];
                            const speedDate = 2;
                            const paramsDate = 'yr';
                            const stepValue = 5;
                            const formatValue = 'logarithmic';
                            const sizeWidthDinamic = 'sizeWidthDinamic_medium';
                            const formatMove = 'continuous';
                            const title = inputTooltip.value;

                            // Type
                            const typeTimeLine = document.getElementById('typeTimeLine');
                            if (typeTimeLine.value === 'absoluteSimple') {
                                create({
                                    timelineType: typeTimeLine.options[typeTimeLine.selectedIndex].value,
                                    snapMode: selectSnapMode.options[selectSnapMode.selectedIndex].value,
                                    position,
                                    intervals,
                                    title,
                                });
                            } else {
                                create({
                                    timelineType: typeTimeLine.options[typeTimeLine.selectedIndex].value,
                                    intervals: time,
                                    speedDate,
                                    paramsDate,
                                    stepValue,
                                    formatMove,
                                    formatValue,
                                    sizeWidthDinamic,
                                    title,
                                });
                            }

                            const changeTestFormsDisplay = (formValue = typeTimeLine) => {
                                const isDynamic = formValue.value === 'absolute' || formValue.value === 'relative';

                                document.querySelectorAll('.dynamic').forEach((el) => {
                                    el.style.display = isDynamic ? 'flex' : 'none';
                                });

                                document.querySelectorAll('.origin').forEach((el) => {
                                    el.style.display = isDynamic ? 'none' : 'flex';
                                });
                            };

                            // Dinamic
                            const elementTime = document.getElementById('time');
                            const elementSpeedDate = document.getElementById('speedDate');
                            const elementParamsDate = document.getElementById('paramsDate');
                            const elementStepValue = document.getElementById('stepValue');
                            const elementSizeWidth = document.getElementById('sizeWidthDinamic');
                            const elementFormatValue = document.getElementById('formatValueDinamic');
                            const elementFormatMove = document.getElementById('formatMove');

                            [
                                selectPosicion, inputIntervals, selectAnimation, inputSpeed,
                                elementTime, elementSpeedDate, elementParamsDate, elementStepValue,
                                elementSizeWidth, elementFormatValue, elementFormatMove,
                                inputTooltip, selectCollapsible, selectCollapsed, inputOrder,
                                selectSnapMode,
                            ].forEach((el) => { el.addEventListener('change', changeTest); });

                            selectIntervals.addEventListener('change', () => {
                                inputIntervals.value = selectIntervals.value;
                                changeTest();
                            });

                            typeTimeLine.addEventListener('change', (event) => {
                                if (event.target) {
                                    changeTestFormsDisplay(event.target);
                                    changeTest();
                                }
                            });

                            changeTestFormsDisplay();

                            function changeTest() {
                                remove();
                                const options = {};

                                const selectPosition = selectPosicion.options[selectPosicion.selectedIndex].value;
                                if (selectPosition !== '') options.position = selectPosition;

                                if (inputTooltip.value !== '') options.tooltip = inputTooltip.value;

                                const collapsible = selectCollapsible.options[selectCollapsible.selectedIndex].value;
                                if (collapsible !== '') options.collapsible = (collapsible === 'true');

                                const collapsed = selectCollapsed.options[selectCollapsed.selectedIndex].value;
                                if (collapsed !== '') options.collapsed = (collapsed === 'true');

                                if (inputOrder.value !== undefined) options.order = Number(inputOrder.value);

                                options.timelineType = typeTimeLine.options[typeTimeLine.selectedIndex].value;

                                if (typeTimeLine.value === 'absoluteSimple') {
                                    if (snapMode !== '') options.snapMode = snapMode;
                                    options.intervals = inputIntervals.value !== '' ? inputIntervals.value : intervals;
                                    const animation = selectAnimation.options[selectAnimation.selectedIndex].value;
                                    if (animation !== '') options.animation = animation === 'true';
                                    if (inputSpeed.value !== '') options.speed = Number(inputSpeed.value);
                                    const snapMode = selectSnapMode.options[selectSnapMode.selectedIndex].value;
                                } else {
                                    options.intervals = elementTime.value !== '' ? elementTime.value : time;
                                    options.speedDate = elementSpeedDate.value >= 1 ? Number(elementSpeedDate.value) : 1;
                                    options.paramsDate = elementParamsDate.options[elementParamsDate.selectedIndex].value;
                                    options.stepValue = elementStepValue.value >= 1 ? Number(elementStepValue.value) : 1;
                                    options.sizeWidthDinamic = elementSizeWidth.options[elementSizeWidth.selectedIndex].value;
                                    options.formatValue = elementFormatValue.options[elementFormatValue.selectedIndex].value;
                                    options.formatMove = elementFormatMove.options[elementFormatMove.selectedIndex].value;
                                }
                                create(options);
                            }

                            const removeButton = document.getElementById('removeButton');
                            removeButton.addEventListener('click', () => {
                                remove();
                            });

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