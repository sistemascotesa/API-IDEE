import MaxExtZoom from 'facade/maxextzoom';

const map = IDEE.map({
  container: 'mapjs',
});

window.map = map;

const mp = new MaxExtZoom({
  position: 'TL',
});


map.addPlugin(mp);
