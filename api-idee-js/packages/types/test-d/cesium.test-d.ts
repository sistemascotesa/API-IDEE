import '../dist/cesium';
import { expectAssignable, expectType } from 'tsd';

const map = IDEE.map({ container: 'map' });
const layer = new IDEE.layer.WMS({ name: 'test', url: 'https://example.com/wms' }, {}, {});
const scale = new IDEE.control.Scale({});

expectType<IDEE.Map>(map);
expectAssignable<IDEE.layer.WMS>(layer);
expectAssignable<IDEE.control.Scale>(scale);
