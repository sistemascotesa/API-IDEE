/* eslint-disable no-param-reassign */
/* eslint-disable no-use-before-define */
import { map as Mmap } from 'IDEE/api-idee';
import Timeline from 'IDEE/control/Timeline';

const map = Mmap({
  container: 'map',
  controls: ['rotate'],
  projection: 'EPSG:3857',
  center: [-467062.8225, 4683459.6216],
  zoom: 6,
});

let ctrl;

const create = (propiedades) => {
  ctrl = new Timeline(propiedades);
  map.addControls(ctrl);
};

const remove = () => {
  map.removeControls(ctrl);
  ctrl = null;
};

const inputIntervals = document.getElementById('inputIntervals');
const selectIntervals = document.getElementById('selectIntervals');
const selectAnimation = document.getElementById('selectAnimation');
const inputSpeed = document.getElementById('inputSpeed');
const selectPosicion = document.getElementById('selectPosicion');
const position = selectPosicion.options[selectPosicion.selectedIndex].value;

const inputTooltip = document.getElementById('inputTooltip');
const selectCollapsible = document.getElementById('selectCollapsible');
const selectCollapsed = document.getElementById('selectCollapsed');
const inputOrder = document.getElementById('inputOrder');

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
  create({
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
  create({
    timelineType: typeTimeLine.options[typeTimeLine.selectedIndex].value,
    position,
    intervals,
  });
}

const changeTestFormsDisplay = (formValue = typeTimeLine) => {
  const isDynamic = formValue.value === 'absolute' || formValue.value === 'relative';

  document.querySelectorAll('.dynamic').forEach((el) => {
    el.style.display = isDynamic ? 'flex' : 'none';
  });

  document.querySelectorAll('.origin').forEach((el) => {
    el.style.display = isDynamic ? 'none' : 'flex';
  });
};

// Dinamic
const elementTime = document.getElementById('time');
const elementSpeedDate = document.getElementById('speedDate');
const elementParamsDate = document.getElementById('paramsDate');
const elementStepValue = document.getElementById('stepValue');
const elementSizeWidth = document.getElementById('sizeWidthDinamic');
const elementFormatValue = document.getElementById('formatValueDinamic');
const elementFormatMove = document.getElementById('formatMove');

[
  selectPosicion, inputIntervals, selectAnimation, inputSpeed,
  elementTime, elementSpeedDate, elementParamsDate, elementStepValue,
  elementSizeWidth, elementFormatValue, elementFormatMove,
  inputTooltip, selectCollapsible, selectCollapsed, inputOrder,
].forEach((el) => { el.addEventListener('change', changeTest); });

selectIntervals.addEventListener('change', () => {
  inputIntervals.value = selectIntervals.value;
  changeTest();
});

typeTimeLine.addEventListener('change', (event) => {
  if (event.target) {
    changeTestFormsDisplay(event.target);
    changeTest();
  }
});

changeTestFormsDisplay();

function changeTest() {
  if (ctrl) remove();
  const options = {};

  const selectPosition = selectPosicion.options[selectPosicion.selectedIndex].value;
  if (selectPosition !== '') options.position = selectPosition;

  if (inputTooltip.value !== '') options.tooltip = inputTooltip.value;

  const collapsible = selectCollapsible.options[selectCollapsible.selectedIndex].value;
  if (collapsible !== '') options.collapsible = (collapsible === 'true');

  const collapsed = selectCollapsed.options[selectCollapsed.selectedIndex].value;
  if (collapsed !== '') options.collapsed = (collapsed === 'true');

  if (inputOrder.value !== undefined) options.order = Number(inputOrder.value);

  if (typeTimeLine.value === 'absolute' || typeTimeLine.value === 'relative') {
    options.timelineType = typeTimeLine.options[typeTimeLine.selectedIndex].value;
    options.intervals = elementTime.value !== '' ? elementTime.value : time;
    options.speedDate = elementSpeedDate.value >= 1 ? Number(elementSpeedDate.value) : 1;
    options.paramsDate = elementParamsDate.options[elementParamsDate.selectedIndex].value;
    options.stepValue = elementStepValue.value >= 1 ? Number(elementStepValue.value) : 1;
    options.sizeWidthDinamic = elementSizeWidth.options[elementSizeWidth.selectedIndex].value;
    options.formatValue = elementFormatValue.options[elementFormatValue.selectedIndex].value;
    options.formatMove = elementFormatMove.options[elementFormatMove.selectedIndex].value;
  } else {
    options.timelineType = typeTimeLine.options[typeTimeLine.selectedIndex].value;
    options.intervals = inputIntervals.value !== '' ? inputIntervals.value : intervals;
    const animation = selectAnimation.options[selectAnimation.selectedIndex].value;
    if (animation !== '') options.animation = animation === 'true';
    if (inputSpeed.value !== '') options.speed = Number(inputSpeed.value);
  }
  create(options);
}

const removeButton = document.getElementById('removeButton');
removeButton.addEventListener('click', () => {
  remove();
});
