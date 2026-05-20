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
                <link type="text/css" rel="stylesheet" href="assets/css/apiidee.ol.min.css" />
                <link href="plugins/contactlink/contactlink.ol.min.css" rel="stylesheet" />
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
                            <label for="selectPosicion"
                                title="Posición del plugin sobre el mapa">Posición del plugin "position"</label>
                            <select name="position" id="selectPosicion">
                                <option value="" selected="selected"></option>
                                <option value="left">Izquierda</option>
                                <option value="right">Derecha</option>
                            </select>
                        </div>
                        <div>
                            <label for="selectCollapsed"
                                title="Indica si el plugin aparece colapsado al inicio (true/false). Por defecto: true">Colapsado al inicio "collapsed"</label>
                            <select name="collapsed" id="selectCollapsed">
                                <option value="" selected="selected"></option>
                                <option value="true">true</option>
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
                                title="Texto que se muestra al pasar el ratón sobre el botón del plugin.">Título de la herramienta "tooltip"</label>
                            <input type="text" name="tooltip" id="inputTooltip" list="tooltipSug" value="Enlaces y contacto IGN">
                            <datalist id="tooltipSug">
                                <option value="Enlaces y contacto IGN"></option>
                            </datalist>
                        </div>
                        <div>
                            <label for="inputDescargascnig"
                                title="URL del enlace al Centro de Descargas del CNIG. Si se omite, muestra el enlace al centro de descargas del CNIG">Enlace a CNIG "descargascnig"</label>
                            <input type="text" name="descargascnig" id="inputDescargascnig" list="descargascnigSug" value="http://centrodedescargas.cnig.es/CentroDescargas/index.jsp">
                            <datalist id="descargascnigSug">
                                <option value="http://centrodedescargas.cnig.es/CentroDescargas/index.jsp"></option>
                            </datalist>
                        </div>
                        <div>
                            <label for="inputPnoa"
                                title="URL del enlace al comparador PNOA del IGN. Si se omite, muestra el enlace al comparador PNOA del CNIG">Enlace a comparador PNOA "pnoa"</label>
                            <input type="text" name="pnoa" id="inputPnoa" list="pnoaSug" value="https://www.ign.es/web/comparador_pnoa/index.html">
                            <datalist id="pnoaSug">
                                <option value="https://www.ign.es/web/comparador_pnoa/index.html"></option>
                            </datalist>
                        </div>
                        <div>
                            <label for="inputVisualizador3d"
                                title="URL del enlace al visualizador 3D estereoscópico del IGN. Si se omite, muestra el enlace al visualizador 3D del CNIG">Enlace a visualizador 3D "visualizador3d"</label>
                            <input type="text" name="visualizador3d" id="inputVisualizador3d" list="visualizador3dSug" value="https://visualizadores.ign.es/estereoscopico/">
                            <datalist id="visualizador3dSug">
                                <option value="https://visualizadores.ign.es/estereoscopico/"></option>
                            </datalist>
                        </div>
                        <div>
                            <label for="inputFototeca"
                                title="URL del enlace a la Fototeca Nacional del CNIG. Si se omite, muestra el enlace a la fototeca del CNIG">Enlace a Fototeca Nacional "fototeca"</label>
                            <input type="text" name="fototeca" id="inputFototeca" list="fototecaSug" value="https://fototeca.cnig.es/">
                            <datalist id="fototecaSug">
                                <option value="https://fototeca.cnig.es/"></option>
                            </datalist>
                        </div>
                        <div>
                            <label for="inputTwitter"
                                title="URL del perfil de Twitter/X. Si se omite, muestra el enlace al perfil del CNIG">Enlace a Twitter/X "twitter"</label>
                            <input type="text" name="twitter" id="inputTwitter" list="twitterSug" value="https://twitter.com/IGNSpain">
                            <datalist id="twitterSug">
                                <option value="https://twitter.com/IGNSpain"></option>
                            </datalist>
                        </div>
                        <div>
                            <label for="inputInstagram"
                                title="URL del perfil de Instagram. Si se omite, muestra el enlace al perfil del CNIG">Enlace a Instagram "instagram"</label>
                            <input type="text" name="instagram" id="inputInstagram" list="instagramSug" value="https://www.instagram.com/ignspain/">
                            <datalist id="instagramSug">
                                <option value="https://www.instagram.com/ignspain/"></option>
                            </datalist>
                        </div>
                        <div>
                            <label for="inputFacebook"
                                title="URL del perfil de Facebook. Si se omite, muestra el enlace al perfil del CNIG">Enlace a Facebook "facebook"</label>
                            <input type="text" name="facebook" id="inputFacebook" list="facebookSug" value="https://www.facebook.com/IGNSpain/">
                            <datalist id="facebookSug">
                                <option value="https://www.facebook.com/IGNSpain/"></option>
                            </datalist>
                        </div>
                        <div>
                            <label for="inputPinterest"
                                title="URL del perfil de Pinterest. Si se omite, muestra el enlace al perfil del CNIG">Enlace a Pinterest "pinterest"</label>
                            <input type="text" name="pinterest" id="inputPinterest" list="pinterestSug" value="https://www.pinterest.es/IGNSpain/">
                            <datalist id="pinterestSug">
                                <option value="https://www.pinterest.es/IGNSpain/"></option>
                            </datalist>
                        </div>
                        <div>
                            <label for="inputYoutube"
                                title="URL del canal de YouTube. Si se omite, muestra el enlace al canal del CNIG">Enlace a YouTube "youtube"</label>
                            <input type="text" name="youtube" id="inputYoutube" list="youtubeSug" value="https://www.youtube.com/user/IGNSpain">
                            <datalist id="youtubeSug">
                                <option value="https://www.youtube.com/user/IGNSpain"></option>
                            </datalist>
                        </div>
                        <div>
                            <label for="inputMail"
                                title="Dirección de correo electrónico de contacto. Se añade el prefijo mailto: automáticamente. Si se omite, utiliza el correo oficial del CNIG">Correo electrónico de contacto "mail"</label>
                            <input type="text" name="mail" id="inputMail" list="mailSug" value="consulta@cnig.es">
                            <datalist id="mailSug">
                                <option value="consulta@cnig.es"></option>
                            </datalist>
                        </div>
                        <input type="hidden" id="buttonAPI" value="API Rest" />
                    </div>
                    <div class="m-test-buttons">
                        <button name="eliminar" class="m-test-button" id="botonEliminar">Eliminar Plugin</button>
                    </div>
                </div>
                <div id="mapjs" class="m-container"></div>
                <script type="text/javascript" src="vendor/browser-polyfill.js"></script>
                <script type="text/javascript" src="js/apiidee.ol.min.js"></script>
                <script type="text/javascript" src="js/configuration.js"></script>
                <script type="text/javascript" src="plugins/contactlink/contactlink.ol.min.js"></script>
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

                            const selectPosicion = document.getElementById('selectPosicion');
                            const selectCollapsed = document.getElementById('selectCollapsed');
                            const inputOrder = document.getElementById('inputOrder');
                            const inputTooltip = document.getElementById('inputTooltip');
                            const inputDescargascnig = document.getElementById('inputDescargascnig');
                            const inputPnoa = document.getElementById('inputPnoa');
                            const inputVisualizador3d = document.getElementById('inputVisualizador3d');
                            const inputFototeca = document.getElementById('inputFototeca');
                            const inputTwitter = document.getElementById('inputTwitter');
                            const inputInstagram = document.getElementById('inputInstagram');
                            const inputFacebook = document.getElementById('inputFacebook');
                            const inputPinterest = document.getElementById('inputPinterest');
                            const inputYoutube = document.getElementById('inputYoutube');
                            const inputMail = document.getElementById('inputMail');
                            const buttonApi = document.getElementById('buttonAPI');
                            const botonEliminar = document.getElementById('botonEliminar');

                            const createPlugin = (options) => {
                                mp = new IDEE.plugin.ContactLink(options);
                                window.mp = mp;
                                map.addPlugin(mp);
                            };

                            const removePlugin = () => {
                                if (mp) map.removePlugins(mp);
                            };

                            const updatePlugin = () => {
                                const options = {};
                                options.position = selectPosicion.options[selectPosicion.selectedIndex].value;
                                options.collapsed = selectCollapsed.options[selectCollapsed.selectedIndex].value === '' || selectCollapsed.options[selectCollapsed.selectedIndex].value === 'true';
                                options.order = Number(inputOrder.value);
                                options.tooltip = inputTooltip.value;
                                options.descargascnig = inputDescargascnig.value;
                                options.pnoa = inputPnoa.value;
                                options.visualizador3d = inputVisualizador3d.value;
                                options.fototeca = inputFototeca.value;
                                options.twitter = inputTwitter.value;
                                options.instagram = inputInstagram.value;
                                options.facebook = inputFacebook.value;
                                options.pinterest = inputPinterest.value;
                                options.youtube = inputYoutube.value;
                                options.mail = 'mailto:' + inputMail.value;
                                removePlugin();
                                createPlugin(options);
                            };

                            [
                                selectPosicion,
                                selectCollapsed,
                                inputOrder,
                                inputTooltip,
                                inputDescargascnig,
                                inputPnoa,
                                inputVisualizador3d,
                                inputFototeca,
                                inputTwitter,
                                inputInstagram,
                                inputFacebook,
                                inputPinterest,
                                inputYoutube,
                                inputMail,
                            ].forEach((ctrl) => {
                                ctrl.addEventListener('change', updatePlugin);
                            });

                            buttonApi.addEventListener('click', () => {
                                const posicion = selectPosicion.options[selectPosicion.selectedIndex].value;
                                const descargascnig = inputDescargascnig.value;
                                const pnoa = inputPnoa.value;
                                const visualizador3d = inputVisualizador3d.value;
                                const fototeca = inputFototeca.value;
                                const twitter = inputTwitter.value;
                                const instagram = inputInstagram.value;
                                const facebook = inputFacebook.value;
                                const pinterest = inputPinterest.value;
                                const youtube = inputYoutube.value;
                                const mail = inputMail.value;

                                window.location.href = 'https://api-ideedes.grupotecopy.es/api-idee/?contactlink=' + posicion + '*' + descargascnig + '*' + fototeca + '*' + visualizador3d + '*' + pnoa +
                                    '*' + twitter + '*' + instagram + '*' + pinterest + '*' + youtube + '*' + mail;
                            });

                            botonEliminar.addEventListener('click', removePlugin);

                            const mp2 = new IDEE.plugin.ShareMap({
                                baseUrl: window.location.href.substring(0, window.location.href.indexOf('api-idee')) + "api-idee/",
                                position: "right",
                            });
                            map.addPlugin(mp2);

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