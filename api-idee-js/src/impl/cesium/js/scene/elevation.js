/**
 * Colocación en altura de las entidades de Cesium según las opciones de elevación
 * ({ mode, offset, heightSystem }) de la capa y del estilo. Guarda las coordenadas de
 * origen de cada entidad para que volver a colocarla no acumule desplazamientos y para
 * que la geometría del objeto geográfico conserve su Z.
 *
 * @module IDEE/impl/cesium/scene/elevation
 */
import {
  Cartesian3,
  Cartographic,
  HeightReference,
  JulianDate,
  Math as CesiumMath,
  PolygonHierarchy,
} from 'cesium';
import { getValue } from 'IDEE/i18n/language';
import { normalizeElevation } from 'IDEE/scene/options';
import { createElevationPolicy, isDefaultElevation } from '../../../common/scene/elevationPolicies';
import GeoidHeightConverter from '../../../common/scene/GeoidHeightConverter';
import ImplUtils from '../util/Utils';

const sources = new WeakMap();
const dimensions = new WeakMap();
const requests = new WeakMap();
let geoid = null;

const valueOf = (property, time) => (property && typeof property.getValue === 'function'
  ? property.getValue(time) : property);

const toCoordinate = (cartesian) => {
  const { longitude, latitude, height } = Cartographic.fromCartesian(cartesian);
  return [CesiumMath.toDegrees(longitude), CesiumMath.toDegrees(latitude), height];
};

const readHierarchy = (hierarchy) => ({
  positions: (hierarchy?.positions || []).map(toCoordinate),
  holes: (hierarchy?.holes || []).map(readHierarchy),
});

const hierarchyCoordinates = (tree) => tree.positions
  .concat(...tree.holes.map(hierarchyCoordinates));

const readSource = (entity, time) => {
  if (entity.polygon) {
    const tree = readHierarchy(valueOf(entity.polygon.hierarchy, time));
    return { type: 'Polygon', tree, coordinates: hierarchyCoordinates(tree) };
  }
  if (entity.polyline) {
    const coordinates = (valueOf(entity.polyline.positions, time) || []).map(toCoordinate);
    return { type: 'LineString', coordinates };
  }
  const position = valueOf(entity.position, time);
  return position ? { type: 'Point', coordinates: [toCoordinate(position)] } : null;
};

const geoidConverter = () => {
  const url = IDEE.config.GEOID_GRID_URL || '';
  if (!geoid || geoid.url !== url) {
    geoid = new GeoidHeightConverter({
      url,
      // eslint-disable-next-line no-console
      warn: (message) => console.warn(message),
      missingMessage: getValue('exception').geoid_grid,
    });
  }
  return geoid;
};

const toCartesian = ([lon, lat, height], toHeight) => Cartesian3
  .fromDegrees(lon, lat, toHeight(lon, lat, height || 0));

const buildHierarchy = (tree, toHeight) => new PolygonHierarchy(
  tree.positions.map((coordinate) => toCartesian(coordinate, toHeight)),
  tree.holes.map((hole) => buildHierarchy(hole, toHeight)),
);

const setReference = (graphics, reference) => {
  if (graphics) {
    // eslint-disable-next-line no-param-reassign
    graphics.heightReference = reference;
  }
};

const place = (entity, source, placement, toHeight) => {
  const target = entity;
  const reference = HeightReference[placement.heightReference];
  if (source.type === 'Polygon') {
    target.polygon.hierarchy = buildHierarchy(source.tree, toHeight);
    target.polygon.perPositionHeight = placement.perPositionHeight;
    if (placement.mode === 'clamp') {
      target.polygon.height = undefined;
      target.polygon.heightReference = undefined;
    } else if (!placement.perPositionHeight) {
      target.polygon.height = placement.offset;
      target.polygon.heightReference = reference;
    } else {
      target.polygon.height = undefined;
      target.polygon.heightReference = undefined;
    }
  } else if (source.type === 'LineString') {
    target.polyline.positions = source.coordinates
      .map((coordinate) => toCartesian(coordinate, toHeight));
    target.polyline.clampToGround = placement.clampToGround;
  } else {
    target.position = toCartesian(source.coordinates[0], toHeight);
    [target.point, target.billboard, target.model].forEach((graphics) => {
      setReference(graphics, reference);
    });
  }
  if (target.label) {
    if (source.type !== 'Point') {
      target.position = ImplUtils.getCenter(source.type === 'Polygon' ? target.polygon : target.polyline);
    }
    setReference(target.label, source.type === 'LineString' && placement.mode === 'relative'
      ? HeightReference.NONE : reference);
  }
};

/**
 * Anota si los datos de origen de una entidad tienen Z (los datos 2D se leen con altura 0
 * y no se pueden distinguir después).
 * @param {Cesium.Entity} entity Entidad.
 * @param {boolean} hasZ Verdadero si las coordenadas tienen tercera componente.
 */
export const markHasZ = (entity, hasZ) => {
  if (entity) dimensions.set(entity, !!hasZ);
};

/**
 * Coordenadas de origen de una entidad que se ha colocado con otras opciones de elevación.
 * @param {Cesium.Entity} entity Entidad.
 * @returns {Object|undefined} Geometría GeoJSON con la Z de los datos.
 */
export const getSourceGeometry = (entity) => {
  const source = entity ? sources.get(entity) : undefined;
  if (!source) return undefined;
  if (source.type === 'Polygon') {
    return {
      type: 'Polygon',
      coordinates: [source.tree.positions, ...source.tree.holes.map((hole) => hole.positions)],
    };
  }
  if (source.type === 'LineString') return { type: 'LineString', coordinates: source.coordinates };
  return { type: 'Point', coordinates: source.coordinates[0] };
};

/**
 * Olvida las coordenadas de origen de una entidad (p. ej. al cambiar su geometría).
 * @param {Cesium.Entity} entity Entidad.
 */
export const forgetSource = (entity) => {
  if (entity) sources.delete(entity);
};

/**
 * Coloca una entidad en altura. Con las opciones por defecto no cambia nada, salvo que
 * antes se hubiera colocado con otras (entonces la devuelve a su posición original).
 * @param {Cesium.Entity} entity Entidad.
 * @param {Object|string|undefined} elevation Opciones de elevación.
 * @returns {Promise<void>} Se resuelve al colocarla.
 */
export const placeEntity = async (entity, elevation) => {
  if (!entity) return;
  const options = normalizeElevation(elevation);
  if (isDefaultElevation(options) && !sources.has(entity)) return;
  const token = {};
  requests.set(entity, token);
  if (!sources.has(entity)) {
    const source = readSource(entity, JulianDate.now());
    if (!source) return;
    sources.set(entity, source);
  }
  const source = sources.get(entity);
  const hasZ = dimensions.has(entity) ? dimensions.get(entity)
    : source.coordinates.some(([, , height]) => Math.abs(height || 0) > 1e-6);
  const placement = createElevationPolicy(options).resolve(source.type, hasZ);
  let toHeight = () => 0;
  if (placement.mode !== 'clamp') {
    const converter = options.heightSystem === 'geoid' && placement.mode === 'absolute' && hasZ
      ? geoidConverter() : null;
    if (converter) await converter.ready();
    if (requests.get(entity) !== token) return;
    toHeight = (lon, lat, height) => (converter ? converter.toEllipsoidal(lon, lat, height)
      : height) + placement.offset;
  }
  place(entity, source, placement, toHeight);
};

/**
 * Referencia de altura de la etiqueta de una línea o un polígono: pegada al terreno si la
 * geometría lo está.
 * @param {Cesium.Entity} entity Entidad.
 * @returns {Cesium.HeightReference} Referencia de altura.
 */
export const groundLabelReference = (entity) => {
  const time = JulianDate.now();
  if (entity?.polygon) {
    const onGround = valueOf(entity.polygon.height, time) === undefined
      && valueOf(entity.polygon.extrudedHeight, time) === undefined
      && !valueOf(entity.polygon.perPositionHeight, time);
    return onGround ? HeightReference.CLAMP_TO_GROUND : HeightReference.NONE;
  }
  if (entity?.polyline) {
    return valueOf(entity.polyline.clampToGround, time)
      ? HeightReference.CLAMP_TO_GROUND : HeightReference.NONE;
  }
  return HeightReference.NONE;
};

export { isDefaultElevation };
