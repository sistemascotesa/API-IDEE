/**
 * @module IDEE/ui/buttons/SidePanelButton
 */

import PanelButton from './PanelButton';
import * as Position from '../position';
import * as Dialog from '../../dialog';
import { getValue } from '../../i18n/language';

/**
 * @classdesc
 * Botón que abre y cierra un panel lateral del mapa. Implementa los hooks
 * `openPanel` y `closePanel` delegando en la API del `Map`
 * (`deactivateSidePanelButtons`, `closeSidePanels`, `openSidePanel`).
 *
 * @extends {IDEE.ui.buttons.PanelButton}
 * @api
 */
class SidePanelButton extends PanelButton {
  /**
   * Sobrescribe el método heredado para limitar las posiciones admitidas a
   * LEFT o RIGHT. Otras posiciones disparan un aviso y no insertan el botón.
   * @param {IDEE.Map} map
   */
  appendToContainer(map) {
    if (!Position.isRightOrLeft(this.position)) {
      Dialog.info(`${getValue('exception').invalid_tool_position} ${this.name}`);
      return;
    }
    super.appendToContainer(map);
  }

  /**
   * Maneja el clic del botón para cerrar correctamente en modo compacto.
   * @override
   */
  click(event) {
    if (this.pressed) {
      if (this.map.isCompactMode()) {
        this.map.deactivateSidePanelButtons(this);
      }
      this.deactivate();
    } else {
      this.activate();
    }
  }

  /**
   * Abre el panel asociado en el lado correspondiente del mapa, desactivando
   * cualquier otro botón de panel lateral previamente activo.
   *
   * @override
   */
  openPanel() {
    this.map.deactivateSidePanelButtons(this);
    this.map.closeSidePanels(this.position);
    this.map.openSidePanel(this.panel);
    this.panel.open();
  }

  /**
   * Cierra el panel asociado, colapsándolo.
   *
   * @override
   */
  closePanel() {
    this.map.closeSidePanels(this.position);
    this.panel.collapse();
  }
}

export default SidePanelButton;
