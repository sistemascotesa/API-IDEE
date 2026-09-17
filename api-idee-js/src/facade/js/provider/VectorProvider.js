/**
 * @module IDEE/VectorProvider
 */
import AbstractProvider from './AbstractProvider';
import Exception from '../exception/exception';
import { getValue } from '../i18n/language';

/**
 * @classdesc
 * Proveedor de datos para una capa de tipo vectorial dentro de un archivo GeoPackage.
 *
 * @api
 * @extends {IDEE.AbstractProvider}
 */
class GeoPackageVector extends AbstractProvider {
  /**
   * Guarda las geometrías linealizadas durante la inicialización del conector.
   * Conserva getGeoJSON síncrono y los atributos originales de la base de datos.
   * @param {Map<Number, Object>} geometries Geometrías por FID.
   */
  setLinearGeometries(geometries) {
    this.linearGeometries_ = geometries;
  }

  /**
   * Este método genera un objeto GeoJSON con todas las entidades de la capa vectorial.
   *
   * @function
   * @public
   * @returns {Object} GeoJSON
   * @api
   */
  getGeoJSON() {
    const featureDao = this.connector_.getFeatureDao(this.getTableName());
    const { srs } = featureDao;
    const rows = featureDao.queryForAll();
    const features = rows.map((row) => featureDao.getRow(row));
    const geojsonFeatures = features.map((feature) => {
      const properties = { ...feature.values };
      delete properties[feature.geometryColumn.name];
      const data = feature.geometry;
      let geometry;
      if (!data) {
        geometry = null;
      } else if (data.geometry) {
        // Las geometrías ya compatibles conservan exactamente su conversión habitual.
        geometry = data.toGeoJSON();
      } else if (this.linearGeometries_ && this.linearGeometries_.get(feature.id)) {
        geometry = this.linearGeometries_.get(feature.id);
      } else {
        Exception(`${getValue('exception').geopackage_geometry} (${this.getTableName()}, ${feature.id}): ${data.geometryError || ''}`);
      }
      const featureGeoJSON = {
        type: 'Feature',
        geometry,
        properties,
      };
      return featureGeoJSON;
    });
    const geojson = {
      type: 'FeatureCollection',
      features: geojsonFeatures,
      crs: {
        type: 'name',
        properties: {
          name: `${srs.organization}:${srs.srs_id}`,
        },
      },
    };
    return geojson;
  }
}

export default GeoPackageVector;
