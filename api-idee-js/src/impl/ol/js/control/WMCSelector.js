/**
 * @module IDEE/impl/control/WMCSelector
 */
import Control from './Control';

/**
 * @classdesc
 * Hereda de {@link module:IDEE/impl/control/Control|Control}.
 * Selector de contextos de mapas WMC (Web Map Context). Permite cargar y cambiar entre
 * diferentes contextos de mapas guardados, restaurando las capas, estilos y extensión
 * del mapa seleccionado.
 *
 * @api
 * @extends {module:IDEE/impl/control/Control}
 */
class WMCSelector extends Control {
  /**
   * Este método agrega el control al mapa.
   *
   * @public
   * @function
   * @param {IDEE.Map} map Mapa
   * @param {function} template Plantilla del control.
   * @api stable
   */
  addTo(map, element) {
    const select = element.getElementsByTagName('select')[0];
    select.addEventListener('change', (e) => {
      const selectedWMCLayer = map.getWMC(e.target.options[e.target.selectedIndex].text)[0];
      const zoom = map.getZoom();
      selectedWMCLayer.select();
      map.setZoom(zoom);
    });
    super.addTo(map, element);
  }
}

export default WMCSelector;
