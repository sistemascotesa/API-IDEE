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
                <link href="plugins/modal/modal.ol.min.css" rel="stylesheet" />
                <link href="plugins/sharemap/sharemap.ol.min.css" rel="stylesheet" />
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
                            <label for="selectPosicion">Posición "position"</label>
                            <select name="position" id="selectPosicion">
                                <option value="left" selected="selected">Izquierda (left)</option>
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
                            <label for="selectCollapsed">Colapsado "collapsed"</label>
                            <select name="collapsed" id="selectCollapsed">
                                <option value=''></option>
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
                            <label for="inputTooltip"
                                title="Texto que se muestra al dejar el ratón encima del plugin.">Título
                                de la herramienta "tooltip"</label>
                            <input type="text" name="tooltip" id="inputTooltip" list="tooltipSug">
                            <datalist id="tooltipSug">
                                <option value="Impresión del mapa"></option>
                            </datalist>
                        </div>
                        <div>
                            <label for="selectCollapsible">Selector "collapsible"</label>
                            <select name="collapsibleValue" id="selectCollapsible">
                                <option value=true selected>true</option>
                                <option value=false>false</option>
                            </select>
                        </div>
                        <div>
                            <label for="buttonIconInput">Icono de botón "svgPath"</label>
                            <input type="text" name="buttonIcon" id="buttonIconInput" list="buttonIconSug">
                            <datalist id="buttonIconSug">
                                <option
                                    value="https://componentes.idee.es/estaticos/Simbologia/svg/icons_cota/icn_modal.svg"
                                    selected></option>
                                <option
                                    value="https://componentes.idee.es/estaticos/Simbologia/svg/icons_cota/icn_mapStan.svg">
                                </option>
                            </datalist>
                        </div>
                        <div>
                            <label for="htmlContent">Contenido "content"</label>
                            <textarea id="htmlContent" name="htmlContent" rows="10" cols="40"
                                style="height: fit-content;" list="htmlContentSug"></textarea>
                        </div>
                        <div>
                            <label for="urlInput">Cargar url "url_es"</label>
                            <input type="text" name="urlEsp" id="urlInput" list="urlInputSug">
                            <datalist id="urlInputSug">
                                <option value="https://www.cnig.es/home"></option>
                                <option
                                    value="https://www.coruna.gal/hacienda/es/tramites-y-gestiones/pic?argIdioma=es">
                                </option>
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
                <script type="text/javascript" src="plugins/modal/modal.ol.min.js"></script>
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
                                zoom: 5,
                                maxZoom: 20,
                                minZoom: 4,
                                center: [-467062.8225, 4783459.6216],
                            });

                            let mp;

                            const createControl = (options) => {
                                mp = new IDEE.plugin.Modal({
                                    // eslint-disable-next-line object-property-newline
                                    url_en: 'template_en',
                                    url_es: 'template_es',
                                    // url_en: 'https://www.ign.es/iberpix/ayuda/en.html', url_es: 'https://www.ign.es/iberpix/ayuda/es.html',
                                    // helpLink: { en: 'https://www.ign.es/iberpix/ayuda/en.html', es: 'https://www.ign.es/iberpix/ayuda/es.html'},
                                    ...options,
                                });
                                map.addPlugin(mp);
                                window.mp = mp;
                            };

                            const removePlugin = () => {
                                if (mp) {
                                    map.removePlugin(mp);
                                    mp = null;
                                }
                            };

                            const selectPosition = document.getElementById('selectPosicion');
                            const selectCollapsed = document.getElementById('selectCollapsed');
                            const selectCollapsible = document.getElementById('selectCollapsible');
                            const inputOrder = document.getElementById('inputOrder');
                            const inputTooltip = document.getElementById('inputTooltip');
                            const inputButtonIcon = document.getElementById('buttonIconInput');
                            const textAreaHtmlContent = document.getElementById('htmlContent');
                            const urlEspInput = document.getElementById('urlInput');

                            const recreatePlugin = () => {
                                removePlugin();
                                const options = {};
                                options.position = selectPosition.options[selectPosition.selectedIndex].value;
                                options.collapsed = selectCollapsed.options[selectCollapsed.selectedIndex].value === 'true';
                                options.collapsible = selectCollapsible.options[selectCollapsible.selectedIndex].value === 'true';
                                options.order = Number(inputOrder.value);
                                if (inputTooltip.value !== '' && inputTooltip.value) {
                                    options.tooltip = inputTooltip.value;
                                }
                                if (inputButtonIcon.value !== '' && inputButtonIcon.value) {
                                    options.svgPath = inputButtonIcon.value;
                                }
                                if (textAreaHtmlContent.value !== '' && textAreaHtmlContent.value) {
                                    options.content = textAreaHtmlContent.value;
                                }
                                if (urlEspInput.value !== '' && urlEspInput.value) {
                                    options.url_es = urlEspInput.value;
                                }
                                createControl(options);
                            };

                            [
                                selectPosition,
                                selectCollapsed,
                                selectCollapsible,
                                inputOrder,
                                inputTooltip,
                                inputButtonIcon,
                                textAreaHtmlContent,
                                urlEspInput,
                            ].forEach((field) => {
                                field.addEventListener('change', recreatePlugin);
                            });

                            const removeButton = document.getElementById('removeButton');
                            removeButton.addEventListener('click', () => {
                                removePlugin();
                            });

                            recreatePlugin();

                            let mp2 = new IDEE.plugin.ShareMap({
                                baseUrl: window.location.href.substring(0, window.location.href.indexOf('api-idee')) + "api-idee/",
                                position: "TR",
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