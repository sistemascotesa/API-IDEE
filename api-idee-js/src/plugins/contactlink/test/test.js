import ContactLink from 'facade/contactlink';
// import ShareMap from 'facade/sharemap';

window.IDEE.plugin.ContactLink = ContactLink;
// window.IDEE.plugin.ShareMap = ShareMap;

IDEE.language.setLang('es');

const map = IDEE.map({
  container: 'mapjs',
  zoom: 5,
  center: [-467062.8225, 4783459.6216],
});
window.map = map;

let mp;

const createPlugin = (options) => {
  mp = new IDEE.plugin.ContactLink(options);
  window.mp = mp;
  map.addPlugin(mp);
};

const removePlugin = () => {
  if (mp) map.removePlugins(mp);
};

const botonEliminar = document.getElementById('botonEliminar');
botonEliminar.addEventListener('click', () => { removePlugin(); });

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

  window.location.href = `${window.location.href.substring(0, window.location.href.indexOf('api-idee'))}api-idee/?contactlink=${posicion}*${descargascnig}*${fototeca}*${visualizador3d}*${pnoa}*${twitter}*${instagram}*${pinterest}*${youtube}*${mail}`;
});

/* const mp2 = new IDEE.plugin.ShareMap({
  baseUrl: window.location.href.substring(0, window.location.href.indexOf('api-idee')) + 'api-idee/',
  position: 'TR',
});
map.addPlugin(mp2); */

updatePlugin();
