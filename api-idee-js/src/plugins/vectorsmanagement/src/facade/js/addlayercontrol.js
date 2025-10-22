/**
 * @module IDEE/control/AddLayer
 */
import AddLayerImplControl from 'impl/addlayercontrol';
import { getValue } from './i18n/language';

/**
 * @classdesc
 * Add layer api-idee control.
 * This control can create vector layers.
 */
export default class AddLayerControl extends IDEE.Control {
  /**
   * @classdesc
   * Main constructor of the class. Creates a PluginControl
   * control
   *
   * @constructor
   * @extends {IDEE.Control}
   * @api stable
   */
  constructor(map) {
    // 1. checks if the implementation can create PluginControl
    if (IDEE.utils.isUndefined(AddLayerImplControl) || (IDEE.utils.isObject(AddLayerImplControl)
      && IDEE.utils.isNullOrEmpty(Object.keys(AddLayerImplControl)))) {
      IDEE.exception(getValue('exception.impl_addlayercontrol'));
    }

    // 2. implementation of this control
    const impl = new AddLayerImplControl();
    super(impl, 'Help');

    this.map_ = map;
  }

  /**
   * This functions active control
   *
   * @public
   * @function
   * @param {Node} html
   * @api
   */
  active(html) {
    this.layerBtnClick();
  }

  /**
   * This function show a modal to set name and legend of the new layer.
   *
   * @public
   * @function
   * @api stable
   */
  layerBtnClick() {
    this.showLayerDialog();
  }

  /**
   * This function show a modal to set name and legend of the new layer.
   *
   * @public
   * @function
   * @api stable
   */
  showLayerDialog() {
    IDEE.dialog.info(
      `<div 
        id="chooseLayerName" 
        style="display: flex; flex-direction: column; align-items: flex-start; justify-content: space-between; row-gap: .5rem;"
      >
        <label 
          for="layer-name" 
          style="width: 93px;"
        >
          ${getValue('layerName')}
        </label>
        <input 
          type="text" 
          id="layer-name"
          style="width: calc(14rem - 8px); margin: 0; border-radius: 2px; border: 1px solid #ced4da"
        >
      </div>
      <hr/ 
        style="width: 100%; margin:1rem 0 0 0; border: none; border-bottom: 1px solid #ced4da"
      >
      `,
      getValue('title_new_layer'),
    );

    const color = '#71a7d3';
    const dialog = document.querySelector('.m-dialog > div.m-modal > div.m-content');
    dialog.style['min-width'] = '16rem';
    dialog.style.padding = '0';
    const message = dialog.querySelector('.m-message');
    message.style.padding = '1rem 1rem 0 1rem';
    const buttons = dialog.querySelector('.m-button');
    buttons.style.padding = '1rem 1rem 1.5rem';
    const cancel = document.createElement('button');
    cancel.type = 'button';
    cancel.innerHTML = getValue('cancel');
    cancel.style.width = 'auto';
    cancel.style.backgroundColor = '#71a7d3';
    buttons.appendChild(cancel);
    const title = document.querySelector('.m-modal .m-title');
    title.style.height = '41px';
    title.style.backgroundColor = color;
    title.style.color = 'white';
    title.style['border-radius'] = '4px 4px 0 0';
    const btn = document.querySelector('.m-button button');
    const inputName = document.querySelector('div.m-modal input#layer-name');
    btn.style.backgroundColor = color;

    btn.addEventListener('click', () => {
      this.addLayer(inputName.value);
      IDEE.toast.info(getValue('creationLayer_done'), null, 6000);
      const layerSelector = document.querySelector('#m-vectorsmanagement-layer-selector');
      layerSelector.classList.remove('disabled');
      const changeEvent = new CustomEvent('selectLayer', {
        detail: { selected: layerSelector.children[1].firstChild },
        bubbles: true,
      });
      layerSelector.dispatchEvent(changeEvent);
    });

    cancel.addEventListener('click', () => {
      const modal = document.querySelector('.m-dialog');
      const parent = modal.parentNode;
      parent.removeChild(modal);
      this.deactivate();
    });
  }

  /**
   * This function create a layer, add to map and deactivate
   *
   * @public
   * @function
   * @param {String} name
   * @param {String} legend
   * @api stable
   */
  addLayer(name) {
    const newVector = new IDEE.layer.Vector({
      name: name || `vector_${Math.floor(Math.random() * 9000) + 1000}`,
      legend: name || `Vector_${Math.floor(Math.random() * 9000) + 1000}`,
    });
    this.map_.addLayers(newVector);
    this.deactivate();
  }

  /**
   * This function destroys this control
   *
   * @public
   * @function
   * @api stable
   */
  destroy() { }

  /**
   * This function is called on the control activation
   *
   * @public
   * @function
   * @api stable
   */
  activate() {
    super.activate();
  }

  /**
   * This function is called on the control deactivation
   *
   * @public
   * @function
   * @api stable
   */
  deactivate() {
    document.querySelector('#layerdrawing').classList.remove('activated');
  }

  /**
   * This function compares controls
   *
   * @public
   * @function
   * @param {IDEE.Control} control to compare
   * @api stable
   */
  equals(control) {
    // eslint-disable-next-line no-undef
    return control instanceof AddLayerControl;
  }
}
