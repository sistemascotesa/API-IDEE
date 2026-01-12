import { map as Mmap } from 'IDEE/api-idee';
import TimeLine from 'IDEE/control/TimeLine';
// import * as Position from 'IDEE/ui/position';

const map = Mmap({
  container: 'map',
  // controls: ['timeline'],
});

const timeline = new TimeLine({
  timelineType: 'relative',
  order: 2,
  // position: Position.RIGHT,
});

map.addControls(timeline);

// timeline.on('added:map', () => {
//   map.removeControls(timeline);
//   map.addControls(
//     new TimeLine({
//       timelineType: 'relative',
//       order: 2,
//       position: Position.RIGHT,
//     }),
//   );
// });
