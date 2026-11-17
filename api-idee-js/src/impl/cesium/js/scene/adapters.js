/**
 * Adaptadores de Cesium para las políticas de visualización independientes del motor:
 * traducen la cámara y las entidades del visor a las funciones que reciben las políticas.
 *
 * @module IDEE/impl/cesium/scene/adapters
 */
import {
  Cartographic, JulianDate, Math as CesiumMath,
} from 'cesium';
import { zoomForHeight } from 'IDEE/scene/options';

/**
 * Crea la vista que usa una política de rango de zoom a partir de la cámara del visor.
 * La suscripción solo avisa cuando cambia la altura de la cámara.
 * @param {Cesium.Viewer} viewer Visor.
 * @param {Object<String, Number>} zoomTable Altura en metros de cada nivel de zoom del mapa.
 * @param {function(): void} [afterRender] Se ejecuta tras cada fotograma.
 * @returns {{getZoom: function(): Number, onChange: function(Function): Function}} Vista.
 */
export const createCameraView = (viewer, zoomTable, afterRender = () => {}) => ({
  getZoom: () => zoomForHeight(viewer.camera.positionCartographic.height, zoomTable),
  onChange: (callback) => {
    let lastHeight;
    return viewer.scene.postRender.addEventListener(() => {
      const height = viewer.camera.positionCartographic.height;
      if (height !== lastHeight) {
        lastHeight = height;
        callback();
      }
      afterRender();
    });
  },
});

/**
 * Coordenadas [longitud, latitud] en grados de las geometrías de una entidad.
 * @param {Cesium.Entity} entity Entidad.
 * @param {Cesium.JulianDate} time Instante en que se evalúan las propiedades.
 * @returns {Array<Array<Number>>} Coordenadas.
 */
export const entityCoordinates = (entity, time) => {
  const positions = [];
  const point = entity.position?.getValue?.(time);
  if (point) positions.push(point);
  const line = entity.polyline?.positions?.getValue?.(time);
  if (Array.isArray(line)) positions.push(...line);
  const hierarchy = entity.polygon?.hierarchy?.getValue?.(time);
  if (Array.isArray(hierarchy?.positions)) positions.push(...hierarchy.positions);
  return positions.map((position) => Cartographic.fromCartesian(position))
    .filter((cartographic) => cartographic !== undefined)
    .map(({ longitude, latitude }) => [
      CesiumMath.toDegrees(longitude), CesiumMath.toDegrees(latitude),
    ]);
};

/**
 * Crea el acceso a las entidades de una fuente de datos que usa una política de recorte.
 * @param {function(): Cesium.DataSource} getDataSource Devuelve la fuente de datos actual.
 * @returns {{list: Function, coordinates: Function, setShown: Function}} Acceso.
 */
export const createEntityItems = (getDataSource) => ({
  list: () => getDataSource()?.entities?.values || [],
  coordinates: (entity) => entityCoordinates(entity, JulianDate.now()),
  setShown: (entity, shown) => {
    const target = entity;
    target.show = shown;
  },
});
