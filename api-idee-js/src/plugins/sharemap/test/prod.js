const map = IDEE.map({
  container: 'mapjs',
});
const mp = new IDEE.plugin.ShareMap({
  baseUrl: 'https://api-ideedes.grupotecopy.es/',
});
map.addPlugin(mp);

window.mp = mp;
