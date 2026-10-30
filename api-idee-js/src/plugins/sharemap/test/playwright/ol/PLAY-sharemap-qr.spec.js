import { test, expect } from '@playwright/test';
import QRCode from 'qrcode';
import { readFileSync } from 'fs';
import path from 'path';

const logo = (color) => `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="60"><rect width="100" height="60" fill="${color}"/></svg>`;
const imageSelector = '.m-plugin-sharemap-qr img';
const statusSelector = '.m-plugin-sharemap-qr [role="status"]';
const downloadSelector = '.m-plugin-sharemap-downloadqr';

async function downloadQR(page) {
  const dataURL = await page.locator(imageSelector).getAttribute('src');
  await expect(page.locator(downloadSelector)).toBeEnabled();
  const pending = page.waitForEvent('download');
  await page.locator(downloadSelector).click();
  const download = await pending;
  expect(download.suggestedFilename()).toBe('mapa-qr.png');
  expect(await download.failure()).toBeNull();
  const contents = readFileSync(await download.path());
  expect(contents.subarray(0, 8)).toEqual(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  expect(contents).toEqual(Buffer.from(dataURL.split(',')[1], 'base64'));
  return contents;
}

async function checkQR(page, qrURL) {
  await expect(page.locator(imageSelector)).toBeVisible();
  const url = await page.locator('#m-plugin-sharemap-message input').inputValue();
  const { modules } = QRCode.create(qrURL || url, { errorCorrectionLevel: 'H' });
  // Compara los píxeles en el navegador para no transferir toda la imagen a Node.
  const result = await page.locator(imageSelector).evaluate(async (image, matrix) => {
    await image.decode();
    const canvas = document.createElement('canvas');
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;
    const context = canvas.getContext('2d');
    context.drawImage(image, 0, 0);
    const pixels = context.getImageData(0, 0, canvas.width, canvas.height);
    const color = context.getImageData(Math.floor(canvas.width / 2), Math.floor(canvas.height / 2), 1, 1);
    const cellSize = canvas.width / (matrix.size + 8);
    let differences = 0;
    for (let row = 0; row < matrix.size; row += 1) {
      for (let col = 0; col < matrix.size; col += 1) {
        const x = Math.floor((col + 4.5) * cellSize);
        const y = Math.floor((row + 4.5) * cellSize);
        // Se conserva la comparación de la matriz excepto en el área del logo.
        if (Math.abs(x - canvas.width / 2) < canvas.width * 0.08 + 5
          && Math.abs(y - canvas.height / 2) < canvas.height * 0.08 + 5) continue;
        const expected = matrix.data[row * matrix.size + col] ? 0 : 255;
        if (pixels.data[(y * canvas.width + x) * 4] !== expected) differences += 1;
      }
    }
    return { differences, color: Array.from(color.data) };
  }, { size: modules.size, data: Array.from(modules.data) });
  expect(result.differences, 'La imagen debe contener el QR del enlace esperado con margen blanco').toBe(0);
  return { url: new URL(url), color: result.color };
}

for (const engine of ['ol', 'cesium']) {
  test.describe(`QR ShareMap ${engine}`, () => {
    test.beforeEach(async ({ page }) => {
      await page.route('**/qr-project-logo.svg', (route) => route.fulfill({ contentType: 'image/svg+xml', body: logo('red') }));
      await page.route('**/qr-override-logo.svg', (route) => route.fulfill({ contentType: 'image/svg+xml', body: logo('blue') }));
      await page.goto(`/test/playwright/${engine}/basic-${engine}.html`);
      await page.addScriptTag({ url: `/src/plugins/sharemap/dist/sharemap.${engine}.min.js` });
      await page.addStyleTag({ url: `/src/plugins/sharemap/dist/sharemap.${engine}.min.css` });
      await page.evaluate(() => {
        IDEE.language.setLang('es');
        IDEE.config.terrain.default = [];
        IDEE.config.metadata = { logoURL: '/qr-project-logo.svg' };
        window.mapjs = IDEE.map({ container: 'map', layers: [], controls: [],
          center: [-432198.125, 5123456.875], zoom: 8.375 });
        // Estas pruebas comprueban el QR; no necesitan el renderizado continuo de Cesium.
        if (mapjs.getMapImpl().scene) mapjs.getMapImpl().useDefaultRenderLoop = false;
        window.shortURLRequests = [];
        window.originalRemoteGet = IDEE.remote.get;
        IDEE.remote.get = (url, data, options) => {
          if (url.includes('tinyurl.com')) shortURLRequests.push({ url, options });
          return Promise.resolve({ text: url.includes('/api/actions/controls') ? '[]'
            : JSON.stringify({ code: 200, error: false, content: 'https://tinyurl.com/qr-test' }) });
        };
        window.openShare = (options = {}) => {
          window.mp = new IDEE.plugin.ShareMap(options);
          mapjs.addPlugin(mp);
          mp.button.activate();
        };
      });
    });

    for (const urlAPI of [false, true]) {
      test(`El QR hereda el logo y contiene el enlace final (urlAPI=${urlAPI})`, async ({ page }) => {
        await page.evaluate((rest) => {
          mapjs.addLayers(new IDEE.layer.XYZ({ name: 'fondo', url: '/tiles/{z}/{x}/{y}.png', isBase: true }));
          openShare({ urlAPI: rest, shareBaseLayer: true, baseUrl: 'http://localhost:8080/api-idee/', minimize: true });
        }, urlAPI);
        const { url, color } = await checkQR(page);
        expect(color).toEqual([255, 0, 0, 255]);
        expect(url.searchParams.get('baselayer')).toContain('name=fondo');
        expect(url.searchParams.has('center')).toBe(true);
        expect(url.searchParams.has('zoom')).toBe(true);
        expect(await page.locator('#m-plugin-sharemap-html input').inputValue()).toContain('<iframe');
      });
    }

    test('qrLogo tiene prioridad y el mapa se vuelve a leer al reabrir', async ({ page }) => {
      await page.evaluate(() => openShare({ qrLogo: '/qr-override-logo.svg' }));
      const first = await checkQR(page);
      const firstDownload = await downloadQR(page);
      expect(first.color).toEqual([0, 0, 255, 255]);
      expect(first.url.searchParams.has('baselayer')).toBe(false);
      await page.locator('#m-plugin-sharemap-button button').click();
      await page.evaluate(() => { mapjs.setZoom(5); mp.button.activate(); });
      const second = await checkQR(page);
      expect(await downloadQR(page)).not.toEqual(firstDownload);
      expect(second.url.href).not.toBe(first.url.href);
      expect(second.url.searchParams.get('zoom')).toBe('5');
      expect(await page.locator(imageSelector).count()).toBe(1);
    });

    test('Sin logo se avisa y se puede seguir copiando el enlace', async ({ page }) => {
      await page.evaluate(() => { IDEE.config.metadata = {}; openShare(); });
      await expect(page.locator(statusSelector)).toContainText('No hay un logo');
      await expect(page.locator(imageSelector)).toBeHidden();
      await expect(page.locator(downloadSelector)).toBeDisabled();
      await expect(page.locator('#m-plugin-sharemap-copybutton')).toBeEnabled();
    });

    test('El QR respeta el filtro de capas informativas', async ({ page }) => {
      await page.evaluate(() => {
        mapjs.addLayers(['incluida', 'excluida'].map((name) => new IDEE.layer.Vector({ name,
          displayInLayerSwitcher: true })));
        openShare({ shareLayer: false, filterLayers: ['incluida'] });
      });
      const { url } = await checkQR(page);
      expect(url.searchParams.get('layers')).toContain('name=incluida');
      expect(url.searchParams.get('layers')).not.toContain('excluida');
    });

    test('Un logo que falla no sustituye la marca explícita por la heredada', async ({ page }) => {
      await page.route('**/qr-missing.svg', (route) => route.fulfill({ status: 404, body: '' }));
      await page.evaluate(() => openShare({ qrLogo: '/qr-missing.svg' }));
      await expect(page.locator(statusSelector)).toContainText('No se ha podido cargar el logo');
      await expect(page.locator(imageSelector)).toBeHidden();
      await expect(page.locator(downloadSelector)).toBeDisabled();
      await expect(page.locator('#m-plugin-sharemap-copybutton')).toBeEnabled();
    });

    test('Una URL larga genera el QR con el mismo acortamiento de las redes sociales', async ({ page }) => {
      await page.evaluate(() => openShare({ urlAPI: true, minimize: true, baseUrl: `http://localhost/${'a'.repeat(4000)}` }));
      const { url, color } = await checkQR(page, 'https://tinyurl.com/qr-test');
      expect(color).toEqual([255, 0, 0, 255]);
      await expect(page.locator('#m-plugin-sharemap-copybutton')).toBeEnabled();
      expect(url.href.length).toBeGreaterThan(4000);
      const requests = await page.evaluate(() => shortURLRequests);
      expect(requests).toHaveLength(1);
      expect(new URL(requests[0].url).protocol).toBe('https:');
      expect(new URL(requests[0].url).searchParams.get('url')).toBe(url.href);
      expect(requests[0].options).toEqual({ useProxy: true, jsonp: false });
    });

    test('Descarga el QR del enlace acortado como PNG con el logo', async ({ page }) => {
      await page.evaluate(() => openShare({ urlAPI: true, minimize: true, baseUrl: `http://localhost/${'a'.repeat(4000)}`,
        qrLogo: '/qr-override-logo.svg' }));
      expect((await checkQR(page, 'https://tinyurl.com/qr-test')).color).toEqual([0, 0, 255, 255]);
      await downloadQR(page);
      expect(await page.evaluate(() => shortURLRequests.length)).toBe(1);
    });

    for (const useProxy of [false, true]) {
      test(`El acortamiento usa el proxy por petición y conserva el modo global (${useProxy})`, async ({ page }) => {
        const proxyRequests = [];
        let directRequests = 0;
        await page.route('https://tinyurl.com/**', (route) => { directRequests += 1; return route.abort(); });
        await page.route('**/qr-test-proxy?*', (route) => {
          const request = new URL(route.request().url());
          proxyRequests.push(request);
          return route.fulfill({ contentType: 'application/javascript', body: JSON.stringify({
            code: 200, error: false, content: 'https://tinyurl.com/qr-test', headers: {},
          }) });
        });
        await page.evaluate((enabled) => {
          IDEE.proxy(enabled);
          IDEE.config.PROXY_URL = `${window.location.origin}/qr-test-proxy`;
          IDEE.remote.get = (url, data, options) => (url.includes('tinyurl.com')
            ? originalRemoteGet(url, data, options) : Promise.resolve({ text: '[]' }));
          openShare({ urlAPI: true, minimize: true, baseUrl: `http://localhost/${'a'.repeat(2500)}` });
        }, useProxy);
        const { url } = await checkQR(page, 'https://tinyurl.com/qr-test');
        expect(directRequests).toBe(0);
        expect(proxyRequests).toHaveLength(1);
        expect(proxyRequests[0].searchParams.has('callback')).toBe(false);
        expect(new URL(proxyRequests[0].searchParams.get('url')).searchParams.get('url')).toBe(url.href);
        expect(await page.evaluate(() => IDEE.useproxy)).toBe(useProxy);
      });
    }

    for (const failure of ['invalid', 'proxy', 'network', 'timeout']) {
      test(`Si falla el acortador (${failure}), avisa y conserva el enlace largo`, async ({ page }) => {
        await page.evaluate((mode) => {
          IDEE.remote.get = (url) => {
            if (url.includes('/api/actions/controls')) return Promise.resolve({ text: '[]' });
            if (mode === 'network') return Promise.reject(new Error('NETWORK_ERROR'));
            if (mode === 'timeout') return new Promise(() => {});
            if (mode === 'proxy') return Promise.resolve({ text: JSON.stringify({
              code: 502, error: true, content: 'https://tinyurl.com/qr-test',
            }) });
            return Promise.resolve({ text: '<html>Error del acortador</html>' });
          };
          openShare({ urlAPI: true, minimize: true, baseUrl: `http://localhost/${'a'.repeat(4000)}` });
        }, failure);
        await expect(page.locator(statusSelector)).toContainText('No se ha podido acortar', { timeout: 15000 });
        await expect(page.locator(imageSelector)).toBeHidden();
        await expect(page.locator(downloadSelector)).toBeDisabled();
        await expect(page.locator('#m-plugin-sharemap-copybutton')).toBeEnabled();
        expect((await page.locator('#m-plugin-sharemap-message input').inputValue()).length).toBeGreaterThan(4000);
      });
    }

    test('El QR corto funciona aunque el acortador no esté disponible', async ({ page }) => {
      await page.evaluate(() => {
        IDEE.remote.get = (url) => (url.includes('/api/actions/controls')
          ? Promise.resolve({ text: '[]' }) : Promise.reject(new Error('NETWORK_ERROR')));
        openShare();
      });
      await checkQR(page);
    });

    test('Una URL rechazada tampoco produce un QR', async ({ page }) => {
      await page.evaluate(() => openShare({ urlAPI: true, minimize: true, baseUrl: `http://localhost/${'a'.repeat(8000)}` }));
      await expect(page.locator(statusSelector)).toContainText('no se ha podido generar un enlace válido');
      await expect(page.locator(imageSelector)).toBeHidden();
      await expect(page.locator(downloadSelector)).toBeDisabled();
      await expect(page.locator('#m-plugin-sharemap-copybutton')).toBeDisabled();
      await expect(page.locator('#m-plugin-sharemap-message input')).toHaveValue('');
    });

    test('El transporte REST conserva qrLogo con delimitadores y filterLayers', async ({ page }) => {
      const result = await page.evaluate(() => {
        const original = new IDEE.plugin.ShareMap({ qrLogo: 'https://example.test/logo.svg?a=1*b&c=2', filterLayers: ['info'], shareBaseLayer: true });
        return { rest: original.getAPIRest(), legacy: new IDEE.plugin.ShareMap().getAPIRest(),
          relative: new IDEE.plugin.ShareMap({ qrLogo: '/logo.png' }).getAPIRest() };
      });
      const options = JSON.parse(Buffer.from(result.rest.split('base64=')[1], 'base64').toString('utf8'));
      expect(options.qrLogo).toBe('https://example.test/logo.svg?a=1*b&c=2');
      expect(options.filterLayers).toEqual(['info']);
      expect(options.shareBaseLayer).toBe(true);
      expect(result.legacy).not.toContain('base64=');
      const relative = JSON.parse(Buffer.from(result.relative.split('base64=')[1], 'base64').toString('utf8'));
      expect(relative.qrLogo).toBe('http://localhost:8081/logo.png');
    });
  });
}

test('Cerrar un modal con logo pendiente no modifica el QR de la siguiente apertura', async ({ page }) => {
  let release;
  let requested = false;
  const pending = new Promise((resolve) => { release = resolve; });
  await page.route('**/qr-slow.svg', async (route) => {
    requested = true;
    await pending;
    await route.fulfill({ contentType: 'image/svg+xml', body: logo('red') });
  });
  await page.route('**/qr-fast.svg', (route) => route.fulfill({ contentType: 'image/svg+xml', body: logo('blue') }));
  await page.goto('/test/playwright/ol/basic-ol.html');
  await page.addScriptTag({ url: '/src/plugins/sharemap/dist/sharemap.ol.min.js' });
  await page.addStyleTag({ url: '/src/plugins/sharemap/dist/sharemap.ol.min.css' });
  await page.evaluate(() => {
    IDEE.config.terrain.default = [];
    window.mapjs = IDEE.map({ container: 'map', layers: [], controls: [] });
    IDEE.remote.get = (url) => Promise.resolve({ text: url.includes('/api/actions/controls') ? '[]' : 'https://example.test/short' });
    window.mp = new IDEE.plugin.ShareMap({ qrLogo: '/qr-slow.svg' });
    mapjs.addPlugin(mp);
    mp.button.activate();
  });
  await expect.poll(() => requested).toBe(true);
  await expect(page.locator(downloadSelector)).toBeDisabled();
  await page.locator('#m-plugin-sharemap-button button').click();
  await page.evaluate(() => {
    mapjs.removePlugins(mp);
    window.mp = new IDEE.plugin.ShareMap({ qrLogo: '/qr-fast.svg' });
    mapjs.addPlugin(mp);
    mp.button.activate();
  });
  expect((await checkQR(page)).color).toEqual([0, 0, 255, 255]);
  release();
  expect((await checkQR(page)).color).toEqual([0, 0, 255, 255]);
  await page.setViewportSize({ width: 390, height: 844 });
  const bounds = await page.locator(imageSelector).boundingBox();
  expect(bounds.width).toBeLessThanOrEqual(390);
  await downloadQR(page);
  await page.screenshot({ path: '/tmp/sharemap-qr-mobile.png', fullPage: true });
});

test('El formulario real de sharemap.jsp permite configurar el logo del QR', async ({ page }) => {
  const jsp = readFileSync(path.resolve(__dirname, '../../../../../../../api-idee-rest/src/main/webapp/sharemap.jsp'), 'utf8');
  const form = jsp.match(/<body>([\s\S]*?)<script type="text\/javascript"/)[1];
  const script = jsp.match(/<script type="text\/javascript">\s*(const urlParams[\s\S]*?)<\/script>/)[1];
  await page.route('**/qr-form-logo.svg', (route) => route.fulfill({ contentType: 'image/svg+xml', body: logo('blue') }));
  await page.goto('/src/plugins/sharemap/test/playwright/ol/sharemap-ol.html');
  await page.addScriptTag({ url: '/src/plugins/layerswitcher/dist/layerswitcher.ol.min.js' });
  await page.addStyleTag({ url: '/src/plugins/sharemap/dist/sharemap.ol.min.css' });
  await page.evaluate((html) => {
    document.body.innerHTML = html;
    IDEE.config.MAP_VIEWER_LAYERS = [];
    IDEE.config.backgroundlayers = [];
    IDEE.remote.get = (url) => Promise.resolve({ text: url.includes('/api/actions/controls') ? '[]' : 'https://example.test/short' });
  }, form);
  await page.addScriptTag({ content: script });
  await page.locator('#inputQrLogo').fill('/qr-form-logo.svg');
  await page.locator('#inputQrLogo').dispatchEvent('change');
  await page.evaluate(() => mp.button.activate());
  expect((await checkQR(page)).color).toEqual([0, 0, 255, 255]);
});
