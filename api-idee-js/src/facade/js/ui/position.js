/**
 * @module IDEE/ui/position
 */

/**
 * Posición zona central, arriba a la izquierda.
 * @public
 * @const
 * @type {string}
 * @api
 */
export const CTL = 'center-top-left';

/**
 * Posición zona central, arriba a la derecha.
 * @public
 * @const
 * @type {string}
 * @api
 */
export const CTR = 'center-top-right';

/**
 * Posición zona central, abajo a la izquierda.
 * @public
 * @const
 * @type {string}
 * @api
 */
export const CBL = 'center-bottom-left';

/**
 * Posición zona central, abajo a la derecha.
 * @public
 * @const
 * @type {string}
 * @api
 */
export const CBR = 'center-bottom-right';

/**
 * Posición izquierda.
 * @public
 * @const
 * @type {string}
 * @api
 */
export const LEFT = 'left';

/**
 * Posición derecha.
 * @public
 * @const
 * @type {string}
 * @api
 */
export const RIGHT = 'right';

/**
 * Posición abajo.
 * @public
 * @const
 * @type {string}
 * @api
 */
export const DOWN = 'down';

export const isValid = (position) => {
  return [
    CTL,
    CTR,
    CBL,
    CBR,
    LEFT,
    RIGHT,
    DOWN,
  ].some((validPosition) => validPosition === position);
};
