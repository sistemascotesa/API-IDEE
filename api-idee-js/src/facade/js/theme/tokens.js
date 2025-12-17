export default function applyDesignTokenCssVariables() {
  const IDEE = window.IDEE || window.M;
  if (!IDEE || !IDEE.config || !IDEE.config.token) {
    return;
  }

  const activeTokenKey = IDEE.config.activeTOKEN || 'cnig';
  const token = IDEE.config.token[activeTokenKey];
  if (!token) {
    return;
  }

  const root = document.documentElement;
  const color = token.color || {};
  const typography = token.typography || {};
  const shape = token.shape || {};

  if (color.primary) {
    root.style.setProperty('--idee-color-primary', color.primary);
  }
  if (color.links) {
    root.style.setProperty('--idee-color-links', color.links);
  }
  if (color.primary_dark) {
    root.style.setProperty('--idee-color-primary-dark', color.primary_dark);
  }
  if (color.succes) {
    root.style.setProperty('--idee-color-success', color.succes);
  }
  if (color.danger) {
    root.style.setProperty('--idee-color-danger', color.danger);
  }
  if (color.warning) {
    root.style.setProperty('--idee-color-warning', color.warning);
  }
  if (color.neutral_05) {
    root.style.setProperty('--idee-color-neutral-05', color.neutral_05);
  }
  if (color.neutral_10) {
    root.style.setProperty('--idee-color-neutral-10', color.neutral_10);
  }
  if (color.neutral_20) {
    root.style.setProperty('--idee-color-neutral-20', color.neutral_20);
  }
  if (color.neutral_30) {
    root.style.setProperty('--idee-color-neutral-30', color.neutral_30);
  }
  if (color.neutral_40) {
    root.style.setProperty('--idee-color-neutral-40', color.neutral_40);
  }
  if (color.neutral_50) {
    root.style.setProperty('--idee-color-neutral-50', color.neutral_50);
  }
  if (color.neutral_60) {
    root.style.setProperty('--idee-color-neutral-60', color.neutral_60);
  }
  if (color.neutral_70) {
    root.style.setProperty('--idee-color-neutral-70', color.neutral_70);
  }
  if (color.neutral_80) {
    root.style.setProperty('--idee-color-neutral-80', color.neutral_80);
  }
  if (color.neutral_90) {
    root.style.setProperty('--idee-color-neutral-90', color.neutral_90);
  }
  if (color.white) {
    root.style.setProperty('--idee-color-white', color.white);
  }
  if (color.black) {
    root.style.setProperty('--idee-color-black', color.black);
  }
  if (typography.fontFamily) {
    root.style.setProperty('--idee-font-family', typography.fontFamily);
  }
  if (typography.fontSize && typography.fontSize.caption) {
    root.style.setProperty('--idee-font-size-caption', typography.fontSize.caption);
  }
  if (typography.fontSize && typography.fontSize.body_s) {
    root.style.setProperty('--idee-font-size-body-s', typography.fontSize.body_s);
  }
  if (typography.fontSize && typography.fontSize.body_m) {
    root.style.setProperty('--idee-font-size-body-m', typography.fontSize.body_m);
  }
  if (typography.fontSize && typography.fontSize.body_l) {
    root.style.setProperty('--idee-font-size-body-l', typography.fontSize.body_l);
  }
  if (typography.fontSize && typography.fontSize.heading_m) {
    root.style.setProperty('--idee-font-size-heading-m', typography.fontSize.heading_m);
  }
  if (typography.fontSize && typography.fontSize.heading_l) {
    root.style.setProperty('--idee-font-size-heading-l', typography.fontSize.heading_l);
  }
  if (typography.fontWeight && typography.fontWeight.regular) {
    root.style.setProperty('--idee-font-weight-regular', typography.fontWeight.regular);
  }
  if (typography.fontWeight && typography.fontWeight.bold) {
    root.style.setProperty('--idee-font-weight-bold', typography.fontWeight.bold);
  }
  if (shape.border) {
    root.style.setProperty('--idee-shape-border', shape.border);
  }
  if (shape.borderRadius) {
    root.style.setProperty('--idee-shape-border-radius', shape.borderRadius);
  }
  if (shape.boxShadow) {
    root.style.setProperty('--idee-shape-box-shadow', shape.boxShadow);
  }
}
