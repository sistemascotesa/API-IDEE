/* eslint-disable no-console */
/**
 * Arnés de la revisión manual WebGL (GUION_REVISION_WEBGL.md).
 * Pinta un panel con los puntos del guion, ejecuta las acciones de cada punto,
 * guarda la evaluación (automática y manual) en localStorage y la exporta en Markdown.
 */
const STORE_KEY = 'idee-webgl-review';
const params = new URLSearchParams(window.location.search);

/** Modo de la ejecución: 'webgl' (IDEE.config.WEBGL = true) o 'canvas' (control). */
export const MODE = params.get('webgl') === '0' ? 'canvas' : 'webgl';

export const sectionParam = () => params.get('s');

// ---------------------------------------------------------------- Almacenamiento

const readStore = () => {
  try {
    return JSON.parse(window.localStorage.getItem(STORE_KEY)) || {};
  } catch (e) {
    return {};
  }
};

const writeStore = (store) => {
  try {
    window.localStorage.setItem(STORE_KEY, JSON.stringify(store));
  } catch (e) {
    // Sin almacenamiento la evaluación solo vive en la página.
  }
};

const getResult = (sectionId, stepId, mode = MODE) => readStore()[`${sectionId}|${stepId}|${mode}`] || {};

const setResult = (sectionId, stepId, patch) => {
  const store = readStore();
  const key = `${sectionId}|${stepId}|${MODE}`;
  store[key] = { ...store[key], ...patch };
  writeStore(store);
};

const clearSection = (sectionId) => {
  const store = readStore();
  Object.keys(store).filter((k) => k.startsWith(`${sectionId}|`)).forEach((k) => delete store[k]);
  writeStore(store);
};

// ---------------------------------------------------------------- Carga de recursos

export const loadScript = (src) => new Promise((resolve, reject) => {
  const script = document.createElement('script');
  script.src = src;
  script.onload = resolve;
  script.onerror = () => reject(new Error(`No se pudo cargar ${src}`));
  document.head.appendChild(script);
});

export const loadCss = (href) => {
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = href;
  document.head.appendChild(link);
};

// ---------------------------------------------------------------- Consola

const consoleLog = [];
const consoleListeners = [];

const pushLog = (type, args) => {
  const msg = Array.from(args).map((a) => (a instanceof Error ? a.message : String(a))).join(' ');
  consoleLog.push({ type, msg, time: new Date().toLocaleTimeString() });
  consoleListeners.forEach((fn) => fn());
};

export const captureConsole = () => {
  const { warn, error } = console;
  console.warn = (...args) => {
    pushLog('warn', args);
    warn.apply(console, args);
  };
  console.error = (...args) => {
    pushLog('error', args);
    error.apply(console, args);
  };
  window.addEventListener('error', (e) => pushLog('error', [e.message]));
  window.addEventListener('unhandledrejection', (e) => pushLog('error', [e.reason?.message || e.reason]));
};

// ---------------------------------------------------------------- Contexto de los pasos

const wait = (ms) => new Promise((resolve) => { setTimeout(resolve, ms); });

/**
 * Crea el contexto que reciben las acciones de cada paso.
 * @param {IDEE.Map} map Mapa de la sección.
 */
export const createContext = (map) => {
  const ctx = {
    map,
    IDEE: window.IDEE,
    MODE,
    store: {},
    mark: 0,
    wait,
    /** Espera a que el mapa termine de renderizar (o al tiempo máximo). */
    rendered: (timeout = 10000) => new Promise((resolve) => {
      const olMap = map.getMapImpl();
      const timer = setTimeout(resolve, timeout);
      olMap.once('rendercomplete', () => { clearTimeout(timer); resolve(); });
      olMap.render();
    }),
    /** Mensajes de consola desde que empezó la acción en curso. */
    warnings: () => consoleLog.slice(ctx.mark).filter((l) => l.type === 'warn').map((l) => l.msg),
    errors: () => consoleLog.slice(ctx.mark).filter((l) => l.type === 'error').map((l) => l.msg),
    fallbackWarnings: () => ctx.warnings().filter((m) => /canvas/i.test(m)),
    renderer: (layer) => (layer?.getRenderer ? layer.getRenderer() : undefined),
    /**
     * Comprueba el renderer de varias capas. "expectedInWebGL" es lo esperado en modo
     * WebGL; en el modo de control (Canvas) siempre se espera 'canvas'.
     */
    expectRenderer: (layers, expectedInWebGL = 'webgl') => {
      const expected = MODE === 'webgl' ? expectedInWebGL : 'canvas';
      const list = [].concat(layers).filter(Boolean);
      const wrong = list.filter((l) => ctx.renderer(l) !== expected);
      return {
        pass: list.length > 0 && wrong.length === 0,
        detail: list.map((l) => `${l.name || l.type}=${ctx.renderer(l)}`).join(', ')
          + (wrong.length ? ` (esperado ${expected})` : ''),
      };
    },
    /** Comprueba que hubo (o no) aviso de cambio a Canvas, solo relevante en modo WebGL. */
    expectFallbackWarning: (expectedInWebGL = true) => {
      const expected = MODE === 'webgl' ? expectedInWebGL : false;
      const found = ctx.fallbackWarnings();
      return {
        pass: expected ? found.length > 0 : found.length === 0,
        detail: found.length ? `aviso: «${found[found.length - 1]}»` : 'sin aviso de Canvas',
      };
    },
    noErrors: () => {
      const errs = ctx.errors();
      return { pass: errs.length === 0, detail: errs.length ? `errores: ${errs.slice(-2).join(' | ')}` : 'sin errores' };
    },
    /** Combina varios resultados en uno. */
    all: (...results) => ({
      pass: results.every((r) => r.pass),
      detail: results.map((r) => r.detail).join(' · '),
    }),
    /** Elimina del mapa las capas creadas por pasos anteriores (ctx.store.layers). */
    cleanLayers: () => {
      const layers = ctx.store.layers || [];
      if (layers.length) map.removeLayers(layers);
      ctx.store.layers = [];
    },
    track: (...layers) => {
      ctx.store.layers = (ctx.store.layers || []).concat(layers);
      return layers[0];
    },
  };
  return ctx;
};

// ---------------------------------------------------------------- Exportación

const statusLabel = { ok: 'OK', ko: '**KO**', na: 'N/A' };

const describeMode = (r, mode) => {
  const parts = [];
  if (r.status) parts.push(statusLabel[r.status]);
  if (r.auto) parts.push(`auto ${r.auto.pass ? '✔' : '✖'} ${r.auto.detail}`);
  if (!parts.length) return null;
  return `${mode === 'webgl' ? 'WebGL' : 'Canvas'}: ${parts.join(' — ')}`;
};

export const exportMarkdown = (sections) => {
  const lines = [
    '# Evaluación del guion de revisión WebGL',
    '',
    `- Fecha: ${new Date().toLocaleString()}`,
    `- Navegador: ${window.navigator.userAgent}`,
    '',
  ];
  sections.forEach((section) => {
    lines.push(`## ${section.title}`, '');
    section.steps.forEach((step) => {
      const webgl = getResult(section.id, step.id, 'webgl');
      const canvas = getResult(section.id, step.id, 'canvas');
      const checked = webgl.status === 'ok' || webgl.status === 'na' ? 'x' : ' ';
      lines.push(`- [${checked}] **${step.id}** ${step.text}`);
      [describeMode(webgl, 'webgl'), describeMode(canvas, 'canvas')].filter(Boolean)
        .forEach((d) => lines.push(`  - ${d}`));
      [webgl.note && `Nota (WebGL): ${webgl.note}`, canvas.note && `Nota (Canvas): ${canvas.note}`]
        .filter(Boolean).forEach((n) => lines.push(`  - ${n}`));
      if (!webgl.status && !webgl.auto && !canvas.status && !canvas.auto) lines.push('  - Sin revisar');
    });
    lines.push('');
  });
  return lines.join('\n');
};

// ---------------------------------------------------------------- Panel

const el = (tag, attrs = {}, children = []) => {
  const node = document.createElement(tag);
  Object.entries(attrs).forEach(([k, v]) => {
    if (k === 'style') node.style.cssText = v;
    else if (k.startsWith('on')) node.addEventListener(k.slice(2), v);
    else node.setAttribute(k, v);
  });
  [].concat(children).filter((c) => c !== null && c !== undefined)
    .forEach((c) => node.append(c instanceof window.Node ? c : document.createTextNode(c)));
  return node;
};

const sectionUrl = (id, mode = MODE) => `?s=${id}&webgl=${mode === 'webgl' ? 1 : 0}`;

const renderAuto = (box, auto) => {
  // eslint-disable-next-line no-param-reassign
  box.textContent = '';
  if (!auto) return;
  box.append(el('span', {
    style: `color:${auto.pass ? '#15803d' : '#b91c1c'};font-weight:bold`,
  }, auto.pass ? '✔ ' : '✖ '), auto.detail);
};

const renderStep = (section, step, ctx) => {
  const saved = getResult(section.id, step.id);
  const autoBox = el('div', { style: 'margin:4px 0;font-family:monospace;font-size:11px;word-break:break-word' });
  renderAuto(autoBox, saved.auto);

  const actions = (step.actions || []).map((action) => el('button', {
    style: 'margin:2px 4px 2px 0',
    onclick: async (e) => {
      const btn = e.currentTarget;
      btn.disabled = true;
      autoBox.textContent = 'Ejecutando…';
      ctx.mark = consoleLog.length;
      let auto;
      try {
        const result = await action.run(ctx);
        auto = result && typeof result === 'object' && 'pass' in result
          ? result : { pass: true, detail: result || 'acción ejecutada' };
      } catch (err) {
        console.error(err);
        auto = { pass: false, detail: `excepción: ${err.message}` };
      }
      btn.disabled = false;
      renderAuto(autoBox, auto);
      setResult(section.id, step.id, { auto });
    },
  }, action.label));

  const radios = ['ok', 'ko', 'na'].map((status) => {
    const input = el('input', {
      type: 'radio',
      name: `st-${step.id}`,
      onchange: () => setResult(section.id, step.id, { status }),
    });
    input.checked = saved.status === status;
    return el('label', { style: 'margin-right:10px' }, [input, ` ${statusLabel[status].replace(/\*/g, '')}`]);
  });

  const note = el('input', {
    type: 'text',
    placeholder: 'Notas (qué has visto)',
    style: 'width:100%;box-sizing:border-box;margin-top:4px',
    onchange: (e) => setResult(section.id, step.id, { note: e.target.value }),
  });
  note.value = saved.note || '';

  return el('div', { style: 'background:#fff;border:1px solid #ddd;border-radius:4px;padding:6px 8px;margin:6px 0' }, [
    el('div', {}, [el('b', {}, `${step.id} `), step.text]),
    step.how ? el('div', { style: 'color:#444;margin-top:3px' }, ['▶ ', step.how]) : null,
    step.expected ? el('div', { style: 'color:#1e40af;margin-top:3px' }, ['✓ Esperado: ', step.expected]) : null,
    actions.length ? el('div', { style: 'margin-top:4px' }, actions) : null,
    autoBox,
    el('div', {}, radios),
    note,
  ]);
};

const renderConsole = (box) => {
  const draw = () => {
    // eslint-disable-next-line no-param-reassign
    box.textContent = '';
    consoleLog.slice(-8).forEach((l) => box.append(el('div', {
      style: `color:${l.type === 'error' ? '#b91c1c' : '#a16207'}`,
    }, `[${l.time}] ${l.type}: ${l.msg}`)));
  };
  consoleListeners.push(draw);
  draw();
};

/**
 * Pinta el panel de la sección.
 * @param {Array<Object>} sections Todas las secciones (para el selector y la exportación).
 * @param {Object} section Sección activa.
 * @param {Object} ctx Contexto de los pasos.
 */
export const renderPanel = (sections, section, ctx) => {
  const panel = document.getElementById('review-panel');
  panel.textContent = '';

  const select = el('select', {
    style: 'width:100%',
    onchange: (e) => { window.location.search = sectionUrl(e.target.value); },
  }, sections.map((s) => {
    const option = el('option', { value: s.id }, s.title);
    option.selected = s.id === section.id;
    return option;
  }));

  const otherMode = MODE === 'webgl' ? 'canvas' : 'webgl';
  const exportBox = el('textarea', { style: 'width:100%;height:160px;display:none;font-size:11px' });

  const toolbar = el('div', { style: 'margin:6px 0' }, [
    el('b', { style: `color:${MODE === 'webgl' ? '#15803d' : '#7c3aed'}` }, `Modo: ${MODE.toUpperCase()} `),
    el('a', { href: sectionUrl(section.id, otherMode), style: 'margin-right:8px' }, `cambiar a ${otherMode}`),
    el('a', { href: `${sectionUrl(section.id, 'webgl')}&nowebgl=1`, style: 'margin-right:8px' }, 'simular sin WebGL'),
    el('button', {
      onclick: () => {
        exportBox.style.display = 'block';
        exportBox.value = exportMarkdown(sections);
        exportBox.select();
        window.navigator.clipboard?.writeText(exportBox.value).catch(() => {});
      },
    }, 'Exportar evaluación'),
    el('button', {
      onclick: () => {
        const blob = new Blob([exportMarkdown(sections)], { type: 'text/markdown' });
        const a = el('a', { href: URL.createObjectURL(blob), download: 'EVALUACION_REVISION_WEBGL.md' });
        a.click();
      },
    }, 'Descargar .md'),
    el('button', {
      onclick: () => {
        // eslint-disable-next-line no-alert
        if (window.confirm('¿Borrar la evaluación guardada de esta sección (ambos modos)?')) {
          clearSection(section.id);
          window.location.reload();
        }
      },
    }, 'Borrar sección'),
  ]);

  const consoleBox = el('div', { style: 'font-family:monospace;font-size:11px;max-height:120px;overflow:auto;background:#fff;border:1px solid #ddd;padding:4px' });
  renderConsole(consoleBox);

  panel.append(
    el('h3', { style: 'margin:4px 0' }, 'Revisión WebGL'),
    select,
    toolbar,
    exportBox,
    section.intro ? el('p', { style: 'color:#444;margin:4px 0' }, section.intro) : null,
    ...section.steps.map((step) => renderStep(section, step, ctx)),
    el('h4', { style: 'margin:8px 0 4px' }, 'Consola (avisos y errores)'),
    consoleBox,
  );
};

export const renderError = (message) => {
  const panel = document.getElementById('review-panel');
  panel.textContent = '';
  panel.append(el('p', { style: 'color:#b91c1c' }, message));
};
