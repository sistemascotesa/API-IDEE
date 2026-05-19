/**
 * @module IDEE/ui/buttons/PanelButton
 */

import OverviewMapButton from './OverviewMapButton';

/**
 * @classdesc
 * Botón con panel asociado. Provee hooks `openPanel` y `closePanel` vacíos para
 * que subclases concretas (por ejemplo, `SidePanelButton`) implementen el modo
 * de apertura/cierre. Si `this.panel` está definido, los hooks se disparan al
 * activar/desactivar el botón.
 *
 * @extends {IDEE.ui.buttons.OverviewMapButton}
 * @api
 */
class PanelButton extends OverviewMapButton {
  constructor(name, options = {}) {
    super(name, options);

    /**
     * @type {IDEE.ui.Panel}
     * @expose
     */
    this.panel = options.panel ?? null;
  }

  /**
   * Amplía el comportamiento de la base disparando `openPanel` cuando hay panel.
   */
  activate() {
    super.activate();
    if (this.panel) this.openPanel();
  }

  /**
   * Amplía el comportamiento de la base disparando `closePanel` cuando hay panel.
   */
  deactivate() {
    super.deactivate();
    if (this.panel) this.closePanel();
  }

  /**
   * Hook vacío. Sobrescribir en subclases para implementar la apertura del panel.
   */
  openPanel() { }

  /**
   * Hook vacío. Sobrescribir en subclases para implementar el cierre del panel.
   */
  closePanel() { }
}

export default PanelButton;
