const cesiumMap = IDEE.map({ container: 'map' });
const cesiumWms = new IDEE.layer.WMS({ name: 'test', url: 'https://example.com/wms' }, {}, {});
const cesiumScale = new IDEE.control.Scale({});

cesiumMap.addLayers([cesiumWms]);
window.IDEE = IDEE;

void cesiumScale;
