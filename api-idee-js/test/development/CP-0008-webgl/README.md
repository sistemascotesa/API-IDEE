CP-001
Comparativa en tiempo real Canvas ⇄ WebGL con todas las capas que admiten WebGL, prueba automática del renderer efectivo y medidas de rendimiento.

## Arranque

```
npm start -- --name=CP-0008-webgl/CP-001
```

Abrir `http://localhost:8080/test/development/CP-0008-webgl/CP-001.html`. Se empaqueta desde `src/`, así que no hace falta compilar `dist`.

## Cómo funciona

El renderer de una capa se fija al construirla (opción `renderer: 'canvas' | 'webgl'` o `IDEE.config.WEBGL`). Por eso, al cambiar de modo, la página quita la capa y la crea de nuevo. La vista del mapa se conserva.

- **Conmutador global Canvas / WebGL**: recrea todas las capas activas que no tienen modo propio.
- **Selector de cada capa** (Global / Canvas / WebGL): fuerza el modo solo en esa capa.
- **Aplicar mediante `IDEE.config.WEBGL`**: crea las capas sin la opción `renderer` y cambia el valor global antes de construirlas.
- **Puntos sintéticos**: de 1000 a 200 000 puntos generados con semilla fija, es decir, los mismos datos en los dos modos.
- El distintivo de cada capa muestra `pedido → efectivo` (`layer.getRenderer()`) y el tiempo hasta `rendercomplete`. Aparece en rojo si el renderer efectivo no es el esperado. En el tooltip están el motivo de la caída a Canvas y los avisos `webgl_*` capturados.

## Catálogo

| Grupo | Capas |
|---|---|
| Ráster teselado (`WebGLTile`) | OSM, XYZ PNOA-MA, TMS IGN Base, WMTS PNOA, WMS teselado, MBTiles, GeoPackage ráster |
| Vectorial (`WebGLVector`) | GeoJSON con puntos sintéticos (`Generic {{color}}`), GeoJSON con `Category`, `IDEE.layer.Vector` (1000 polígonos), GeoJSON remoto, WFS, OGC API Features, KML y KMZ (`extractStyles: false`), GPX |
| Vectorial teselado (`WebGLVectorTile`) | MVT, MBTilesVector (Camino de Santiago, `OUTPUT.mbtiles` de la galería) |
| Solo WebGL | GeoTIFF/COG: ortofoto PNOA 2021 de la Costa Brava en EPSG:25831 (no tiene alternativa Canvas) |
| Caídas a Canvas esperadas | WMS `tiled: false`, XYZ con `crossOrigin: false` (`webgl_fallback_cors`), KML con estilos propios (`webgl_fallback_feature_style`), `Cluster`, `IDEE.style.Point` (`webgl_fallback_style`) |

Los fixtures MBTiles y GeoPackage cubren el mundo con zoom bajo. GPX, KMZ, MBTilesVector y COG tienen botón de encuadre (⌖). El COG solo cubre unos 3 × 6 km, así que a la vista inicial apenas se ve.

El COG usa una proyección que IDEE registra (EPSG:25831). Un COG en una proyección no registrada, por ejemplo el UTM 36N (EPSG:32636) de Sentinel-2, no se puede reproyectar y no muestra nada.

## Medidas

- **Métricas en vivo**:
  - fotogramas por segundo y ms de CPU por fotograma (de `precompose` a `postcompose`);
  - número de capas WebGL y Canvas;
  - número de `<canvas>` en el mapa (cada capa WebGL usa el suyo);
  - contextos WebGL perdidos;
  - memoria JS (solo en Chromium).
- **Medir animación**: ejecuta la misma animación de 6 s (desplazamiento y zoom) y añade una fila a la tabla comparativa. El procedimiento es medir en Canvas, cambiar a WebGL y volver a medir. Bajo la tabla aparece la relación entre la última medida WebGL y la última Canvas.
- **Comprobar todas las capas**: crea cada capa sola, primero en Canvas y después en WebGL. Espera al render (15 s como máximo) y compara el renderer efectivo con el esperado. En los casos de caída, comprueba también el aviso correspondiente. Para las capas de puntos usa un máximo de 10 000. Al terminar, restaura la selección.
  - ✔: correcto.
  - ⚠: renderer correcto, pero la carga no terminó, hubo errores de red o una capa vectorial terminó con 0 objetos geográficos. Suele ser un servicio externo caído o sin datos en la vista.
  - ✘: renderer inesperado, falta el aviso o se produjo una excepción durante la carga de esa capa.

## Advertencias

- «Recarga» incluye la red, y la caché del navegador favorece al modo que se mide en segundo lugar. Para comparar solo el renderizado, usa FPS y ms por fotograma.
- Los ms por fotograma miden la CPU del hilo principal. El trabajo de la GPU solo se nota en los FPS.
- Los navegadores limitan los contextos WebGL activos (unos 16). Por encima de ese número la página muestra un aviso.

## Versión de galería (API compilada)

`galeria/webgl-canvas.html` y `galeria/webgl-canvas.js` reproducen la misma demo con el formato de los ejemplos de la galería. Usan la API compilada desde un servidor, por defecto `https://api-ideedes.grupotecopy.es/api-idee/`, y se pueden abrir como fichero o por http. Cómo usarla, cómo cambiar de servidor y qué datos usa en lugar de los fixtures locales: [galeria/README.md](galeria/README.md).

## Consola

```js
webglDemo.active().map(({ id, requested, effective }) => [id, requested, effective])
webglDemo.setMode('webgl')
webglDemo.setActive('mvt', true)
webglDemo.checkAll()
```
