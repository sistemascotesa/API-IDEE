/**
 * @module IDEE/control/GeorefImageEpsgControl
 */
import Georefimage2ControlImpl from 'impl/georefimageepsgcontrol';
import { adjustExtentForSquarePixels } from 'impl/utils';
import georefimage2HTML from '../../templates/georefimageepsg';
import { getValue } from './i18n/language';
import {
  createWLD, createZipFile, generateTitle, createLoadingSpinner,
} from './utils';
import { DPI_OPTIONS, GEOREFIMAGEEPSG_FORMAT } from '../../constants';

// DEFAULTS PARAMS
const FILE_EXTENSION_GEO = '.wld';
const FILE_EXTENSION_IMG = '.'.concat(GEOREFIMAGEEPSG_FORMAT);
const TYPE_SAVE = '.zip';
const ID_GEOREFIMAGEEPSG_PRINT_BUTTON = '#m-georefimageepsg-print';

export default class GeorefImageEpsgControl extends IDEE.Control {
  /**
    * @classdesc
    * Constructor de la clase de tercer control de impresión
    *
    * @constructor
    * @extends {IDEE.Control}
    * @api stable
    */
  constructor({ order, layers, defaultDpiOptions }, map) {
    if (IDEE.utils.isUndefined(Georefimage2ControlImpl)
      || (IDEE.utils.isObject(Georefimage2ControlImpl)
      && IDEE.utils.isNullOrEmpty(Object.keys(Georefimage2ControlImpl)))) {
      IDEE.exception(getValue('exception.impl'));
    }
    const impl = new Georefimage2ControlImpl(map);
    super('georefimage2control', impl);

    /**
     * Instancia del mapa
     * @private
     * @type {IDEE.Map}
     */
    this.map_ = map;

    /**
     * Capas a elegir para imprimir
     * @private
     * @type {Array.<Object>}
     */
    this.layers_ = layers || [
      {
        url: 'http://www.ign.es/wms-inspire/mapa-raster?',
        name: 'mtn_rasterizado',
        format: 'image/jpeg',
        legend: 'Mapa ETRS89 UTM',
      },
      {
        url: 'http://www.ign.es/wms-inspire/pnoa-ma?',
        name: 'OI.OrthoimageCoverage',
        format: 'image/jpeg',
        legend: 'Imagen (PNOA) ETRS89 UTM',
      },
    ];

    /**
      * Formato de la imagen a descargar
      * @private
      * @type {HTMLElement}
      */
    this.format_ = GEOREFIMAGEEPSG_FORMAT;

    /**
      * Opciones de DPI a elegir
      * @private
      * @type {HTMLElement}
      */
    this.dpisOptions_ = defaultDpiOptions || DPI_OPTIONS;

    /**
     * Imagen por defecto a descargar si no hay ninguna capa seleccionada
     * @private
     * @type {HTMLElement}
     */
    this.documentRead_ = document.createElement('img');

    /**
     * Orden para mostrar los elementos
     * @private
     * @type {number}
     */
    this.order = order >= -1 ? order : null;

    /**
     * Elemento SVG de carga
     * @private
     * @type {HTMLElement}
     */
    this.loadingOverlay_ = null;
  }

  /**
   * Activa el control
   * @param {HTMLElement} html HTML del contenedor del control
   *
   * @private
   * @function
   * @api stable
   */
  active(html) {
    this.html_ = html;
    const button = this.html_.querySelector('#m-printviewmanagement-georefImageEpsg');

    const template = new Promise((resolve, reject) => {
      this.template_ = IDEE.template.compileSync(georefimage2HTML, {
        jsonp: true,
        vars: {
          dpis: this.dpisOptions_,
          translations: {
            selectLayer: getValue('selectLayer'),
            selectDpi: getValue('selectDPI'),
            download: getValue('download'),
            image: getValue('image'),
            nameTitle: getValue('title_list'),
          },
          layers: this.layers_,
        },
      });
      resolve(this.template_);
    });

    template.then((t) => {
      if (!button.classList.contains('activated')) {
        this.html_.querySelector('#m-printviewmanagement-controls').appendChild(t);
      } else {
        document.querySelector('.m-georefimageepsg-container').remove();
      }
      button.classList.toggle('activated');

      const printButton = t.querySelector(ID_GEOREFIMAGEEPSG_PRINT_BUTTON);
      if (printButton) {
        printButton.addEventListener('click', (evt) => {
          this.printClick(evt);
        });
      }
    });

    this.accessibilityTab(html);
  }

  /**
   * Función que se ejecuta al hacer click en el botón de imprimir
   * @param {Event} evt Evento del click
   *
   * @public
   * @function
   * @api stable
   */
  printClick(evt) {
    evt.preventDefault();

    const DEFAULT_EPSG = this.map_.getProjection().code;
    const ID_IMG_EPSG = '#m-georefimageepsg-select';
    const value = this.template_.querySelector(ID_IMG_EPSG).selectedIndex;
    const {
      url, name, format, EPSG: epsg, version, legend,
    } = this.layers_[value];
    const dateNow = new Date();
    const date = dateNow.toLocaleDateString().replaceAll('/', '');
    const hour = dateNow.toLocaleTimeString().replaceAll(':', '');
    let title = legend || name;

    title = `${title}_${date}_${hour}`;

    const mapBbox = this.map_.getBbox();
    const size = this.map_.getMapImpl().getSize();
    const dpi = Number(this.template_.querySelector('#m-georefimageepsg-dpi').value);
    const scaleFactor = dpi / 72;
    const scaledSize = [
      Math.round(size[0] * scaleFactor),
      Math.round(size[1] * scaleFactor),
    ];

    let extWLD = [];

    if (epsg) {
      const projection = epsg;
      let ext = false;
      if (DEFAULT_EPSG === projection) {
        ext = IDEE.utils.ObjectToArrayExtent(mapBbox, DEFAULT_EPSG);
        extWLD = ext;
      } else if (version === '1.1.1' || version === '1.1.0') {
        const transformBbox = [mapBbox.x.min, mapBbox.y.min, mapBbox.x.max, mapBbox.y.max];
        ext = ol.proj.transformExtent(transformBbox, DEFAULT_EPSG, projection);

        extWLD = adjustExtentForSquarePixels(ext, size);
      } else {
        const transformBbox = IDEE.utils.ObjectToArrayExtent(mapBbox, DEFAULT_EPSG);
        ext = ol.proj.transformExtent(transformBbox, DEFAULT_EPSG, projection);
        extWLD = adjustExtentForSquarePixels(ext, size);
        ext = this.transformExtentOL(ext, projection);
      }

      const extString = ext.join(',');

      const urlLayer = this.generateURLLayer_(
        url,
        projection,
        scaledSize,
        extString,
        format,
        name,
        version,
      );
      this.downloadPrint(urlLayer, extWLD, true, scaledSize, title);
    } else {
      const projection = this.map_.getProjection().code;

      const v = this.map_.getMapImpl().getView();
      let ext = v.calculateExtent(size);

      ext = ol.proj.transformExtent(ext, DEFAULT_EPSG, projection);
      ext = adjustExtentForSquarePixels(ext, size);

      const urlLayer = this.generateURLLayer_(
        url,
        projection,
        scaledSize,
        ext,
        format,
        name,
        version,
      );
      this.downloadPrint(urlLayer, ext, false, scaledSize, title);
    }
  }

  /**
   * Transforma la extensión de coordenadas a formato EPSG:4326 si el servicio WMS lo requiere
   * @param {ol.Extent} extent Extensión a transformar
   * @param {ol.proj.Projection} projection Proyección del servicio WMS
   * @returns {ol.Extent} Extensión transformada
   *
   * @private
   * @function
   * @api stable
   */
  transformExtentOL(extent, projection) {
    const { def } = IDEE.impl.ol.js.projections.getSupportedProjs()
      .find((proj) => proj.codes.includes(projection));
    const typeCoordinates = def.includes('+proj=longlat');

    if (typeCoordinates) {
      return [extent[1], extent[0], extent[3], extent[2]];
    }

    return extent;
  }

  /**
   * Genera la URL de la capa WMS a descargar
   * @param {string} url URL del servicio WMS
   * @param {ol.proj.Projection} projection Proyección a utilizar
   * @param {Array<number>} size Alto y ancho de la imagen
   * @param {Array<number>} bbox Extensión de la imagen en coordenadas
   * @param {string} format Formato de la imagen
   * @param {string} name Nombre de la capa
   * @param {string} version Versión del servicio WMS. Por defecto '1.3.0'
   * @returns {string} URL de la capa WMS
   *
   * @private
   * @function
   * @api stable
   */
  generateURLLayer_(url, projection, size, bbox, format, name, version = '1.3.0') {
    let urlLayer = url;
    const coord = (version === '1.1.1' || version === '1.1.0') ? 'SRS' : 'CRS';
    urlLayer += `SERVICE=WMS&VERSION=${version}&REQUEST=GetMap&${coord}=${projection}&WIDTH=${size[0]}&HEIGHT=${size[1]}`;
    urlLayer += `&BBOX=${bbox}&FORMAT=${format}&TRANSPARENT=true&STYLES=default`;
    urlLayer += `&LAYERS=${name}`;
    return urlLayer;
  }

  /**
   * Descarga la imagen georreferenciada con el formato EPSG seleccionado
   * @param {String} url URL de la imagen a descargar
   * @param {Array<number>} bbox Extensión de la imagen en coordenadas
   * @param {Boolean} epsgUser Indica si se utiliza EPSG del usuario
   * @param {Array<number>} scaledSize Tamaño de la imagen escalada
   * @param {String} title Título de la imagen a descargar
   *
   * @private
   * @function
   * @api stable
   */
  downloadPrint(url, bbox, epsgUser, scaledSize, title = '') {
    const imageUrl = url !== null ? url : this.documentRead_.src;
    const dpi = Number(this.template_.querySelector('#m-georefimageepsg-dpi').value);
    const format = this.format_;
    const originalSize = this.map_.getMapImpl().getSize();
    const sizeForWLD = epsgUser ? scaledSize : originalSize;
    this.loadingOverlay_ = createLoadingSpinner();

    const canvas = document.createElement('canvas');
    canvas.width = scaledSize[0];
    canvas.height = scaledSize[1];
    const context = canvas.getContext('2d');
    const titulo = generateTitle(title);

    const layerImage = new Image();
    layerImage.crossOrigin = 'anonymous';
    layerImage.onload = () => {
      context.setTransform(1, 0, 0, 1, 0, 0);
      context.globalAlpha = 1;
      context.drawImage(layerImage, 0, 0, scaledSize[0], scaledSize[1]);

      canvas.toBlob((blob) => {
        const reader = new window.FileReader();
        reader.onloadend = () => {
          const files = [{
            name: titulo.concat(FILE_EXTENSION_GEO),
            data: createWLD(bbox, dpi, sizeForWLD, epsgUser),
            base64: false,
          }, {
            name: titulo.concat(FILE_EXTENSION_IMG),
            data: reader.result,
            base64: false,
            binary: true,
          }];
          createZipFile(files, TYPE_SAVE, titulo);
          if (this.loadingOverlay_) {
            this.loadingOverlay_.remove();
            this.loadingOverlay_ = null;
          }
        };
        reader.readAsArrayBuffer(blob);
      }, `image/${format}`);
    };
    layerImage.src = imageUrl;
  }

  /**
   * Inicializa la accesibilidad del control.
   * @param {HTMLElement} html HTML del contenedor del control
   *
   * @private
   * @function
   * @api stable
   */
  accessibilityTab(html) {
    html.querySelectorAll('[tabindex="0"]').forEach((el) => el.setAttribute('tabindex', this.order));
  }

  /**
   * Desactiva el control
   *
   * @public
   * @function
   * @api
   */
  deactive() {
    this.template_.remove();
    // TO-DO ADD BUTTON REMOVE AND ALL EVENTS
  }

  /**
   * Destruye el control
   *
   * @public
   * @function
   * @api
   */
  destroy() {}
}
