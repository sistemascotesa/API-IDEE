/* eslint-disable no-use-before-define */
import { map as Mmap } from 'IDEE/api-idee';
import Timeline from 'IDEE/control/Timeline';
import * as Position from 'IDEE/ui/position';

const map = Mmap({
  container: 'map',
  projection: 'EPSG:3857',
  center: [-467062.8225, 4683459.6216],
  zoom: 6,
});

let ctrl;

const createControl = (propiedades) => {
  ctrl = new Timeline(propiedades);
  map.addControls(ctrl);
};

const removeControl = () => {
  map.removeControls(ctrl);
  ctrl = null;
};

const position = Position.LEFT;
const intervals = [
  ['NACIONAL 1981-1986', '1986', 'WMS*NACIONAL_1981-1986*https://www.ign.es/wms/pnoa-historico*NACIONAL_1981-1986'],
  ['OLISTAT', '1998', 'WMS*OLISTAT*https://www.ign.es/wms/pnoa-historico*OLISTAT'],
  ['SIGPAC', '2003', 'WMS*SIGPAC*https://www.ign.es/wms/pnoa-historico*SIGPAC'],
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

// Type
const typeTimeLine = document.getElementById('typeTimeLine');

if (typeTimeLine.value === 'absolute' || typeTimeLine.value === 'relative') {
  createControl({
    timelineType: typeTimeLine.options[typeTimeLine.selectedIndex].value,
    intervals: time,
    speedDate,
    paramsDate,
    stepValue,
    formatMove,
    formatValue,
    sizeWidthDinamic,
  });
} else {
  createControl({
    timelineType: typeTimeLine.options[typeTimeLine.selectedIndex].value,
    position,
    intervals,
  });
}

// Original
const selectPosicion = document.getElementById('selectPosicion');
const inputIntervals = document.getElementById('inputIntervals');
const selectIntervals = document.getElementById('selectIntervals');
const selectAnimation = document.getElementById('selectAnimation');
const inputSpeed = document.getElementById('inputSpeed');

typeTimeLine.addEventListener('change', ({ target }) => {
  if (target.value === 'absolute' || target.value === 'relative') {
    document.querySelector('#dinamic').style.display = 'block';
    document.querySelector('#origin').style.display = 'none';
  } else {
    document.querySelector('#dinamic').style.display = 'none';
    document.querySelector('#origin').style.display = 'block';
  }
  changeTest();
});

selectPosicion.addEventListener('change', changeTest);
inputIntervals.addEventListener('change', changeTest);
selectIntervals.addEventListener('change', () => {
  inputIntervals.value = selectIntervals.value;
  changeTest();
});

selectAnimation.addEventListener('change', changeTest);
inputSpeed.addEventListener('change', changeTest);

// Dinamic
const elementTime = document.getElementById('time');
const elementSpeedDate = document.getElementById('speedDate');
const elementParamsDate = document.getElementById('paramsDate');
const elementStepValue = document.getElementById('stepValue');
const elementSizeWidthDinamic = document.getElementById('sizeWidthDinamic');
const elementFormatValue = document.getElementById('formatValueDinamic');
const elementFormatMove = document.getElementById('formatMove');

[elementTime, elementSpeedDate, elementParamsDate, elementStepValue,
  elementSizeWidthDinamic, elementFormatMove, elementFormatValue].forEach((el) => el.addEventListener('change', changeTest));

if (typeTimeLine.value === 'absolute' || typeTimeLine.value === 'relative') {
  document.querySelector('#dinamic').style.display = 'block';
  document.querySelector('#origin').style.display = 'none';
} else {
  document.querySelector('#dinamic').style.display = 'none';
  document.querySelector('#origin').style.display = 'block';
}

function changeTest() {
  if (ctrl) removeControl();
  const options = {};
  options.position = selectPosicion.options[selectPosicion.selectedIndex].value;

  if (typeTimeLine.value === 'absolute' || typeTimeLine.value === 'relative') {
    options.timelineType = typeTimeLine.options[typeTimeLine.selectedIndex].value;
    options.intervals = elementTime.value !== '' ? elementTime.value : time;
    options.speedDate = elementSpeedDate.value >= 1 ? elementSpeedDate.value : 1;
    options.paramsDate = elementParamsDate.options[elementParamsDate.selectedIndex].value;
    options.stepValue = elementStepValue.value >= 1 ? elementStepValue.value : 1;
    options.sizeWidthDinamic = elementSizeWidthDinamic
      .options[elementSizeWidthDinamic.selectedIndex].value;
    options.formatValue = elementFormatValue.options[elementFormatValue.selectedIndex].value;
    options.formatMove = elementFormatMove.options[elementFormatMove.selectedIndex].value;
  } else {
    options.timelineType = typeTimeLine.options[typeTimeLine.selectedIndex].value;
    options.intervals = inputIntervals.value !== '' ? inputIntervals.value : intervals;
    // const animationValor = selectAnimation.options[selectAnimation.selectedIndex].value;
  }
  createControl(options);
}

const removeButton = document.getElementById('removeButton');
removeButton.addEventListener('click', () => {
  removeControl();
});
