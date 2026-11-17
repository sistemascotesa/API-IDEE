/**
 * Marcadores 3D de Cesium: convierte la etiqueta de cualquier estilo del API en un
 * LabelGraphics y las opciones solo-3D (marker3D) en condiciones de visualización.
 *
 * @module IDEE/impl/cesium/scene/markers
 */
import {
  Cartesian2,
  Cartesian3,
  Color,
  DistanceDisplayCondition,
  HorizontalOrigin,
  LabelGraphics,
  LabelStyle,
  NearFarScalar,
  VerticalOrigin,
} from 'cesium';
import { LabelMarkerBuilder } from 'IDEE/scene/contracts';

const HORIZONTAL_ORIGINS = {
  left: HorizontalOrigin.LEFT,
  start: HorizontalOrigin.LEFT,
  center: HorizontalOrigin.CENTER,
  justify: HorizontalOrigin.CENTER,
  right: HorizontalOrigin.RIGHT,
  end: HorizontalOrigin.RIGHT,
};

const VERTICAL_ORIGINS = {
  top: VerticalOrigin.TOP,
  hanging: VerticalOrigin.TOP,
  middle: VerticalOrigin.CENTER,
  center: VerticalOrigin.CENTER,
  alphabetic: VerticalOrigin.BASELINE,
  baseline: VerticalOrigin.BASELINE,
  bottom: VerticalOrigin.BOTTOM,
  ideographic: VerticalOrigin.BOTTOM,
};

const isSet = (value) => value !== undefined && value !== null && value !== '';

const toNumbers = (values, length) => (Array.isArray(values) && values.length === length
  && values.every((value) => Number.isFinite(Number(value))) ? values.map(Number) : null);

/**
 * Traduce las opciones solo-3D de un marcador (etiqueta o icono) a Cesium.
 * - alwaysOnTop (verdadero por defecto): no lo tapa el terreno.
 * - distance: [mínima, máxima] distancia de cámara en metros a la que se muestra.
 * - scaleByDistance: [cerca, escala cerca, lejos, escala lejos].
 * @param {Object} [marker3D] Opciones solo-3D.
 * @returns {Object} Opciones de Cesium para LabelGraphics o BillboardGraphics.
 */
export const markerDisplayOptions = (marker3D) => {
  const settings = isSet(marker3D) ? marker3D : {};
  const options = {
    disableDepthTestDistance: settings.alwaysOnTop === false ? 0 : Number.POSITIVE_INFINITY,
  };
  const distance = toNumbers(settings.distance, 2);
  if (distance) {
    options.distanceDisplayCondition = new DistanceDisplayCondition(distance[0], distance[1]);
  }
  const scale = toNumbers(settings.scaleByDistance, 4);
  if (scale) {
    options.scaleByDistance = new NearFarScalar(...scale);
  }
  return options;
};

/**
 * Opciones de Cesium comunes a los iconos (billboard) de cualquier estilo del API:
 * las solo-3D de "marker3D" y "rotate" (el icono gira con la vista, orientado al norte).
 * @param {Object} icon Opciones de icono del estilo.
 * @param {function(*): *} [resolve] Resuelve los valores con funciones o atributos.
 * @returns {Object} Opciones de Cesium para BillboardGraphics.
 */
export const iconDisplayOptions = (icon, resolve = (value) => value) => ({
  ...markerDisplayOptions(icon?.marker3D),
  alignedAxis: resolve(icon?.rotate) === true ? Cartesian3.UNIT_Z : Cartesian3.ZERO,
});

const LABEL_PRIMITIVE_PROPERTIES = [
  'font', 'scale', 'pixelOffset', 'fillColor', 'horizontalOrigin', 'verticalOrigin', 'style',
  'outlineColor', 'outlineWidth', 'heightReference', 'disableDepthTestDistance',
  'distanceDisplayCondition', 'scaleByDistance',
];

/**
 * Valores de un LabelGraphics para copiarlos en una etiqueta primitiva (p. ej. la
 * de un clúster). Solo devuelve las propiedades definidas.
 * @param {Cesium.LabelGraphics} graphics Etiqueta.
 * @param {Cesium.JulianDate} time Instante en que se evalúan las propiedades.
 * @returns {Object} Valores de la etiqueta.
 */
export const labelPrimitiveOptions = (graphics, time) => Object.fromEntries(
  LABEL_PRIMITIVE_PROPERTIES
    .map((name) => [name, graphics?.[name]?.getValue?.(time)])
    .filter(([, value]) => value !== undefined),
);

/**
 * Constructor de etiquetas de Cesium a partir de la parte "label" de un estilo del API.
 */
export class CesiumLabelMarkerBuilder extends LabelMarkerBuilder {
  /**
   * @param {Object} label Opciones de etiqueta del estilo.
   * @param {Object} [context] Contexto.
   * @param {function(*): *} [context.resolve] Resuelve los valores con funciones o
   * atributos del objeto geográfico.
   * @param {Cesium.HeightReference} [context.heightReference] Referencia de altura de la
   * geometría.
   * @param {Cesium.VerticalOrigin} [context.defaultBaseline] Origen vertical por defecto.
   * @returns {Cesium.LabelGraphics|undefined} Etiqueta, o nada si no hay opciones.
   */
  buildLabel(label, {
    resolve = (value) => value,
    heightReference,
    defaultBaseline = VerticalOrigin.CENTER,
  } = {}) {
    if (!isSet(label)) return undefined;
    const text = resolve(label.text);
    const align = String(resolve(label.align) || '').toLowerCase();
    const baseline = String(resolve(label.baseline) || '').toLowerCase();
    const offset = Array.isArray(label.offset) ? label.offset : [];
    const options = {
      text: text === undefined ? undefined : String(text),
      font: resolve(label.font) || '10px sans-serif',
      scale: resolve(label.scale) || 1,
      pixelOffset: new Cartesian2(resolve(offset[0]) || 0, resolve(offset[1]) || 0),
      fillColor: Color.fromCssColorString(resolve(label.color) || '#000000'),
      horizontalOrigin: HORIZONTAL_ORIGINS[align] ?? HorizontalOrigin.CENTER,
      verticalOrigin: VERTICAL_ORIGINS[baseline] ?? defaultBaseline,
      style: LabelStyle.FILL,
      ...markerDisplayOptions(label.marker3D),
    };
    if (heightReference !== undefined) options.heightReference = heightReference;
    if (isSet(label.stroke)) {
      options.outlineColor = Color.fromCssColorString(resolve(label.stroke.color) || '#000000');
      options.outlineWidth = resolve(label.stroke.width) || 1;
      options.style = LabelStyle.FILL_AND_OUTLINE;
    }
    return new LabelGraphics(options);
  }
}

/**
 * Instancia compartida por los estilos de Cesium.
 * @const
 * @type {CesiumLabelMarkerBuilder}
 */
export const labelMarkerBuilder = new CesiumLabelMarkerBuilder();
