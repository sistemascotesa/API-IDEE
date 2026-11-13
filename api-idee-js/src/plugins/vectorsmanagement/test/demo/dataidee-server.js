/*
 * Server of the manual editing demos: serves the pages, the local builds and the in-memory
 * DataIDEE service of dataidee-fake.js (the same one the Playwright tests use) under /local/.
 */
const http = require('http');
const path = require('path');
const fs = require('fs');
const { createDataIDEEFake } = require('./dataidee-fake');

const repositoryRoot = path.resolve(__dirname, '../../../../..');
const pluginRoot = path.resolve(__dirname, '../..');
const port = Number(process.env.DATAIDEE_DEMO_PORT || 8787);
const service = createDataIDEEFake();

const assets = new Map([
  ['/', path.join(__dirname, 'index.html')],
  ['/teunesco.html', path.join(__dirname, 'teunesco.html')],
  ['/demo.js', path.join(__dirname, 'dataidee-demo.js')],
  ['/teunesco.js', path.join(__dirname, 'teunesco-demo.js')],
  ['/teunesco.css', path.join(__dirname, 'teunesco.css')],
  ['/assets/apiidee.js', path.join(repositoryRoot, 'dist/js/apiidee-2.0.ol.min.js')],
  ['/assets/apiidee.css', path.join(repositoryRoot, 'dist/assets/css/apiidee-2.0.ol.min.css')],
  ['/assets/configuration.js', path.join(repositoryRoot, 'test/configuration_filtered.js')],
  ['/assets/vectorsmanagement.js', path.join(pluginRoot, 'dist/vectorsmanagement.ol.min.js')],
  ['/assets/vectorsmanagement.css', path.join(pluginRoot, 'dist/vectorsmanagement.ol.min.css')],
]);
const helpImages = path.join(pluginRoot, 'dist/images');
if (fs.existsSync(helpImages)) {
  fs.readdirSync(helpImages).filter((file) => file.endsWith('.png')).forEach((file) => {
    assets.set(`/plugins/vectorsmanagement/images/${file}`, path.join(helpImages, file));
  });
}

// Adapts a Node request to the service: the body is read before answering.
function localApi(request, response, url) {
  let body = '';
  request.on('data', (chunk) => { body += chunk; });
  request.on('end', () => {
    const result = service.handle({
      method: request.method, url: url.href, headers: request.headers, body,
    });
    if (result.abort) {
      response.destroy();
      return;
    }
    response.writeHead(result.status, result.headers);
    response.end(result.body);
  });
}

http.createServer((request, response) => {
  const url = new URL(request.url, `http://${request.headers.host || `localhost:${port}`}`);
  if (url.pathname.startsWith('/local/')) return localApi(request, response, url);
  const file = assets.get(url.pathname);
  if (!file || !fs.existsSync(file)) {
    response.writeHead(404);
    return response.end('Build the OpenLayers core and VectorsManagement plugin first.');
  }
  let contentType = 'text/html; charset=utf-8';
  if (file.endsWith('.js')) contentType = 'text/javascript';
  else if (file.endsWith('.css')) contentType = 'text/css';
  else if (file.endsWith('.png')) contentType = 'image/png';
  response.writeHead(200, { 'Content-Type': contentType, 'Cache-Control': 'no-store' });
  return fs.createReadStream(file).pipe(response);
}).listen(port, '127.0.0.1', () => {
  process.stdout.write(`DataIDEE editing demo: http://127.0.0.1:${port}\n`);
});
