/**
 * Conversión de alturas ortométricas (sobre el geoide) a alturas sobre el elipsoide con
 * una rejilla de ondulación del geoide en GeoTIFF (p. ej. la rejilla EGM08-REDNAP del
 * IGN en formato PROJ, es_ign_egm08-rednap.tif). La rejilla se descarga la primera vez
 * que se necesita y se interpola de forma bilineal. Independiente del motor.
 *
 * @module IDEE/impl/common/scene/GeoidHeightConverter
 */
import { fromArrayBuffer } from 'geotiff';
import { HeightConverter } from '../../../facade/js/scene/contracts';

const PIXEL_IS_POINT = 2;

/**
 * Descarga una rejilla GeoTIFF de una banda en grados.
 * @param {string} url URL de la rejilla.
 * @returns {Promise<Object>} Rejilla ({ width, height, x0, y0, dx, dy, values, noData }),
 * con (x0, y0) en el centro de la primera celda.
 */
export const loadGeoTiffGrid = async (url) => {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`${response.status} ${url}`);
  const tiff = await fromArrayBuffer(await response.arrayBuffer());
  const image = await tiff.getImage();
  const [originX, originY] = image.getOrigin();
  const [dx, dy] = image.getResolution();
  const isPoint = image.getGeoKeys()?.GTRasterTypeGeoKey === PIXEL_IS_POINT;
  const [values] = await image.readRasters();
  const noData = image.getGDALNoData();
  return {
    width: image.getWidth(),
    height: image.getHeight(),
    x0: isPoint ? originX : originX + dx / 2,
    y0: isPoint ? originY : originY + dy / 2,
    dx,
    dy,
    values,
    noData: noData === null ? undefined : noData,
  };
};

/**
 * Valor bilineal de una rejilla en unas coordenadas.
 * @param {Object} grid Rejilla.
 * @param {number} lon Longitud en grados.
 * @param {number} lat Latitud en grados.
 * @returns {number|undefined} Valor, o undefined fuera de la rejilla o sin dato.
 */
export const interpolateGrid = (grid, lon, lat) => {
  const span = grid.dx * (grid.width - 1);
  let x = lon;
  if (x < grid.x0) x += 360;
  if (x > grid.x0 + span) x -= 360;
  const col = (x - grid.x0) / grid.dx;
  const row = (lat - grid.y0) / grid.dy;
  if (!(col >= 0 && row >= 0 && col <= grid.width - 1 && row <= grid.height - 1)) {
    return undefined;
  }
  const c0 = Math.min(Math.floor(col), Math.max(0, grid.width - 2));
  const r0 = Math.min(Math.floor(row), Math.max(0, grid.height - 2));
  const c1 = Math.min(c0 + 1, grid.width - 1);
  const r1 = Math.min(r0 + 1, grid.height - 1);
  const fx = col - c0;
  const fy = row - r0;
  const corners = [
    [r0, c0, (1 - fx) * (1 - fy)],
    [r0, c1, fx * (1 - fy)],
    [r1, c0, (1 - fx) * fy],
    [r1, c1, fx * fy],
  ].filter(([, , weight]) => weight > 0);
  const values = corners.map(([r, c]) => grid.values[r * grid.width + c]);
  if (values.some((value) => !Number.isFinite(value) || value === grid.noData)) {
    return undefined;
  }
  return corners.reduce((sum, [, , weight], index) => sum + weight * values[index], 0);
};

/**
 * Convierte alturas sobre el geoide a alturas sobre el elipsoide: h = H + N.
 */
export default class GeoidHeightConverter extends HeightConverter {
  /**
   * @param {Object} options Opciones.
   * @param {string} options.url URL de la rejilla (IDEE.config.GEOID_GRID_URL).
   * @param {function(string): Promise<Object>} [options.loadGrid] Carga de la rejilla.
   * @param {function(string): void} [options.warn] Aviso si no hay rejilla.
   * @param {string} [options.missingMessage] Mensaje del aviso.
   */
  constructor({
    url, loadGrid = loadGeoTiffGrid, warn = () => {}, missingMessage = '',
  } = {}) {
    super();
    this.url = url;
    this.loadGrid_ = loadGrid;
    this.warn_ = warn;
    this.missingMessage_ = missingMessage;
    this.grid_ = null;
    this.ready_ = null;
  }

  /**
   * Descarga la rejilla la primera vez. Si no hay URL o falla, avisa una vez y las
   * alturas se dejan sobre el elipsoide.
   * @returns {Promise<Boolean>} Verdadero si hay rejilla.
   */
  ready() {
    if (!this.ready_) {
      this.ready_ = (this.url ? this.loadGrid_(this.url) : Promise.reject(new Error('no url')))
        .then((grid) => {
          this.grid_ = grid;
          return true;
        })
        .catch((error) => {
          this.warn_(`${this.missingMessage_} ${this.url ? error.message : ''}`.trim());
          return false;
        });
    }
    return this.ready_;
  }

  /**
   * Ondulación del geoide (N) en unas coordenadas.
   * @param {number} lon Longitud en grados.
   * @param {number} lat Latitud en grados.
   * @returns {number|undefined} Ondulación en metros.
   */
  undulation(lon, lat) {
    return this.grid_ ? interpolateGrid(this.grid_, lon, lat) : undefined;
  }

  /**
   * @param {number} lon Longitud en grados.
   * @param {number} lat Latitud en grados.
   * @param {number} height Altura ortométrica.
   * @returns {number} Altura sobre el elipsoide (la misma si no hay ondulación).
   */
  toEllipsoidal(lon, lat, height) {
    const undulation = this.undulation(lon, lat);
    return Number.isFinite(undulation) ? height + undulation : height;
  }
}
