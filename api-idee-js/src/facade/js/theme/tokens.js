/* eslint-disable no-underscore-dangle */

export default function applyDesignTokenCssVariables() {
  try {
    const IDEE = window.IDEE || window.M;
    if (!IDEE || !IDEE.config || !IDEE.config.token) return;

    const activeTokenKey = IDEE.config.activeTOKEN || 'cnig';
    const token = IDEE.config.token[activeTokenKey];
    if (!token) return;

    const root = document.documentElement;
    const color = token.color || {};

    if (color.primary && color.primary.value) {
      root.style.setProperty('--idee-color-primary', color.primary.value);
    }
    if (color.links && color.links.value) {
      root.style.setProperty('--idee-color-links', color.links.value);
    }
    if (color.primary_dark && color.primary_dark.value) {
      root.style.setProperty('--idee-color-primary-dark', color.primary_dark.value);
    }
    if (color.succes && color.succes.value) {
      root.style.setProperty('--idee-color-success', color.succes.value);
    }
    if (color.danger && color.danger.value) {
      root.style.setProperty('--idee-color-danger', color.danger.value);
    }
    if (color.warning && color.warning.value) {
      root.style.setProperty('--idee-color-warning', color.warning.value);
    }
  } catch (e) {
    // ignore
  }
}
