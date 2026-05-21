/**
 * @module IDEE/ui/panels/PluginSidePanel
 */
import 'assets/css/plugin_panel';
import SidePanel from './SidePanel';

/**
 * @classdesc
 * Panel lateral para herramientas.
 * Se pueden colocar en el lado derecho o izquierdo del mapa.
 *
 * @property {String} name Nombre del panel.
 * @property {String} options Opciones de configuración del panel.
 *
 * @api
 * @extends SidePanel
 */
class PluginSidePanel extends SidePanel {
  constructor(name, options = {}) {
    super(name, {
      ...options,
      cssName: 'plugin',
    });
  }
}

export default PluginSidePanel;
