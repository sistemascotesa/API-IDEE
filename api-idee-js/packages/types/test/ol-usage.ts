const olMap = IDEE.map({ container: 'map' });
const olWms = new IDEE.layer.WMS({ name: 'test', url: 'https://example.com/wms' }, {}, {});
const olScale = new IDEE.control.Scale({});

olMap.addLayers([olWms]);
window.IDEE = IDEE;

void olScale;
