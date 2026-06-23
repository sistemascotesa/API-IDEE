/* eslint-disable max-len */
/* eslint-disable no-unused-vars */
/* eslint-disable no-param-reassign */
/* eslint-disable no-use-before-define */
import { map as Mmap } from 'IDEE/api-idee';
import Timeline from 'IDEE/control/Timeline';
import { setLang } from '../../../src/facade/js/i18n/language';

const intervals64 = 'W1siTkFDSU9OQUwgMTk4MS0xOTg2IiwiMTk4NiIsIldNUypOQUNJT05BTF8xOTgxLTE5ODYqaHR0cHM6Ly93d3cuaWduLmVzL3dtcy9wbm9hLWhpc3RvcmljbypOQUNJT05BTF8xOTgxLTE5ODYiXSxbIk9MSVNUQVQiLCIxOTk4IiwiV01TKk9MSVNUQVQqaHR0cHM6Ly93d3cuaWduLmVzL3dtcy9wbm9hLWhpc3RvcmljbypPTElTVEFUIl0sWyJTSUdQQUMiLCIyMDAzIiwiV01TKlNJR1BBQypodHRwczovL3d3dy5pZ24uZXMvd21zL3Bub2EtaGlzdG9yaWNvKlNJR1BBQyJdLFsiUE5PQSAyMDA0IiwiMjAwNCIsIldNUypwbm9hMjAwNCpodHRwczovL3d3dy5pZ24uZXMvd21zL3Bub2EtaGlzdG9yaWNvKnBub2EyMDA0Il0sWyJQTk9BIDIwMDUiLCIyMDA1IiwiV01TKnBub2EyMDA1Kmh0dHBzOi8vd3d3Lmlnbi5lcy93bXMvcG5vYS1oaXN0b3JpY28qcG5vYTIwMDUiXSxbIlBOT0EgMjAwNiIsIjIwMDYiLCJXTVMqcG5vYTIwMDYqaHR0cHM6Ly93d3cuaWduLmVzL3dtcy9wbm9hLWhpc3Rvcmljbypwbm9hMjAwNiJdLFsiUE5PQSAyMDEwIiwiMjAxMCIsIldNUypwbm9hMjAxMCpodHRwczovL3d3dy5pZ24uZXMvd21zL3Bub2EtaGlzdG9yaWNvKnBub2EyMDEwIl1d';

const urlParams = new URLSearchParams(window.location.search);
setLang('en');

const map = Mmap({
  container: 'map',
  controls: ['rotate'],
  // controls: ['timeline*collapsible=false;tooltip=Tooltip de ejemplo;position=down'],
  // controls: ['timeline*collapsible=false;position=right;intervals=[["NACIONAL 1981-1986","1986","WMS*NACIONAL_1981-1986*https://www.ign.es/wms/pnoa-historico*NACIONAL_1981-1986"],["OLISTAT","1998","WMS*OLISTAT*https://www.ign.es/wms/pnoa-historico*OLISTAT"],["SIGPAC","2003","WMS*SIGPAC*https://www.ign.es/wms/pnoa-historico*SIGPAC"],["PNOA 2004","2004","WMS*pnoa2004*https://www.ign.es/wms/pnoa-historico*pnoa2004"],["PNOA 2005","2005","WMS*pnoa2005*https://www.ign.es/wms/pnoa-historico*pnoa2005"],["PNOA 2006","2006","WMS*pnoa2006*https://www.ign.es/wms/pnoa-historico*pnoa2006"],["PNOA 2010","2010","WMS*pnoa2010*https://www.ign.es/wms/pnoa-historico*pnoa2010"]]'],
  // controls: [`timeline*collapsible=false;position=right;intervals=base64~${intervals64}`],
  projection: 'EPSG:3857',
  center: [-467062.8225, 4683459.6216],
  zoom: 6,
});

const create = (options) => {
  if (!map.hasControl(Timeline.NAME)) {
    map.addControls(new Timeline(options));
  }
};

const remove = () => {
  const ctrls = map.getControls(Timeline.NAME);
  if (ctrls.length === 1) map.removeControls(ctrls);
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
  ['SIGPAC', '1998', 'WMS*SIGPAC*https://www.ign.es/wms/pnoa-historico*SIGPAC'],
  // ['SIGPAC', '2003', 'WMS*SIGPAC*https://www.ign.es/wms/pnoa-historico*SIGPAC'],
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
const title = inputTooltip.value;

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
    title,
  });
} else {
  create({
    timelineType: typeTimeLine.options[typeTimeLine.selectedIndex].value,
    position,
    intervals,
    title,
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
  remove();
  const options = {};

  const selectPosition = selectPosicion.options[selectPosicion.selectedIndex].value;
  if (selectPosition !== '') options.position = selectPosition;

  if (inputTooltip.value !== '') options.tooltip = inputTooltip.value;

  const collapsibleVal = selectCollapsible.value === 'true';
  if (selectCollapsible.value !== '') options.collapsible = collapsibleVal;

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
