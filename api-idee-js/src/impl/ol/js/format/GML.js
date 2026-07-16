/**
 * @module IDEE/impl/format/GML
 */
import OLFormatGML from 'ol/format/GML';
// import OLFormatGML3 from 'ol/format/GML'; // Same import as OLFormatGML
import OLFormatGML2 from 'ol/format/GML2';
import OLFormatGML32 from 'ol/format/GML32';
import { isNullOrEmpty } from 'IDEE/util/Utils';
import { get as getProj } from 'ol/proj';
// import Feature from 'IDEE/feature/Feature';
import FeatureImpl from '../feature/Feature';

/**
  * @classdesc
  * Implementación del formateador GML.
  *
  * @api
  * @extends {ol.format.GML}
  */
class GML {
  /**
    * Constructor principal de la clase. Formato de los objetos geográficos para
    * leer y escribir datos en formato GML.
    *
    * @constructor
    * @param {olx.format.GMLOptions} gmlFeatures GML (XML) con objetos geográficos.
    * @param {Mx.Projection} projection Proyección del GML.
    * @api
    */
  constructor(projection, gmlVersion) {
    this.projection = projection;

    this.olFormatVersionGML_ = this.returnFormatOl_(gmlVersion);
  }

  /**
   * Este método devuelve los objetos geográficos en formato GML.
   * @public
   * @function
   * @param {Array<IDEE.Feature>} gmlFeatures XML
   * @param {Mx.Projection} projection Proyección del GML.
   * @return {Array<IDEE.Feature>} Devuelve los objetos geográficos en formato GML.
   * @api stable
   */
  read(gmlFeatures, projection) {
    let features = [];
    let dstProj = projection.code;

    if (isNullOrEmpty(dstProj)) {
      if (!isNullOrEmpty(projection.featureProjection)) {
        dstProj = getProj(projection.featureProjection.getCode());
      } else {
        dstProj = getProj(projection.getCode());
      }
    }
    const olFeature = this.olFormatVersionGML_.readFeatures(gmlFeatures);
    features = olFeature.map((geojsonFeature) => {
      const id = geojsonFeature.getId();
      const feature = FeatureImpl.feature2Facade(geojsonFeature);
      feature.setId(id);
      if (feature.getGeometry() !== null) {
        const newGeometry = feature.getImpl().getFeature().getGeometry()
          .transform(this.projection.code, dstProj);
        feature.getImpl().getFeature().setGeometry(newGeometry);
      }
      return feature;
    });
    return features;
  }

  /**
   * Este método devuelve el ol format de GML.
   * - ⚠️ Advertencia: Este método no debe ser llamado por el usuario.
   * @public
   * @function
   * @param {String} gmlVersion GML version.
   * @return {ol.format.GML} Devuelve el ol format de GML.
   * @api stable
   */
  returnFormatOl_(gmlVersion) {
    const formatGmlVersion = gmlVersion.replaceAll('"', '').trim().toLowerCase();

    const isGML2 = formatGmlVersion === 'text/xml; subtype=gml/2.1.2' || formatGmlVersion === 'gml2';
    const isGML32 = formatGmlVersion === 'text/xml; subtype=gml/3.2.1'
      || formatGmlVersion === 'gml32'
      || formatGmlVersion.includes('gml/3.2')
      || formatGmlVersion.includes('version=3.2');
    const isGML31 = formatGmlVersion === 'text/xml; subtype=gml/3.1.1' || formatGmlVersion === 'gml3';

    if (isGML2) return new OLFormatGML2();
    if (isGML32) return new OLFormatGML32();
    if (isGML31) return new OLFormatGML();
    return new OLFormatGML();
  }
}

export default GML;
