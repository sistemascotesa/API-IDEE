import initSqlJs from 'sql.js';
import path from 'path';
import { readFileSync } from 'fs';

/** Crea ficheros pequeños y deterministas sin depender de servicios externos. */
export const createGeoPackage = async (kind = 'mixed') => {
  const SQL = await initSqlJs({
    wasmBinary: readFileSync(require.resolve('sql.js/dist/sql-wasm.wasm')),
  });
  const db = new SQL.Database();
  db.run(`
    PRAGMA application_id = 1196444487;
    PRAGMA user_version = 10300;
    CREATE TABLE gpkg_spatial_ref_sys (
      srs_name TEXT NOT NULL, srs_id INTEGER PRIMARY KEY, organization TEXT NOT NULL,
      organization_coordsys_id INTEGER NOT NULL, definition TEXT NOT NULL, description TEXT
    );
    INSERT INTO gpkg_spatial_ref_sys VALUES ('Undefined Cartesian', -1, 'NONE', -1, 'undefined', '');
    INSERT INTO gpkg_spatial_ref_sys VALUES ('Undefined Geographic', 0, 'NONE', 0, 'undefined', '');
    INSERT INTO gpkg_spatial_ref_sys VALUES ('WGS 84', 4326, 'EPSG', 4326, 'EPSG:4326', '');
    INSERT INTO gpkg_spatial_ref_sys VALUES ('Web Mercator', 3857, 'EPSG', 3857, 'EPSG:3857', '');
    CREATE TABLE gpkg_contents (
      table_name TEXT PRIMARY KEY, data_type TEXT NOT NULL, identifier TEXT UNIQUE,
      description TEXT DEFAULT '', last_change DATETIME NOT NULL,
      min_x DOUBLE, min_y DOUBLE, max_x DOUBLE, max_y DOUBLE, srs_id INTEGER
    );
    CREATE TABLE gpkg_geometry_columns (
      table_name TEXT PRIMARY KEY, column_name TEXT NOT NULL, geometry_type_name TEXT NOT NULL,
      srs_id INTEGER NOT NULL, z TINYINT NOT NULL, m TINYINT NOT NULL
    );
    CREATE TABLE gpkg_tile_matrix_set (
      table_name TEXT PRIMARY KEY, srs_id INTEGER NOT NULL,
      min_x DOUBLE NOT NULL, min_y DOUBLE NOT NULL, max_x DOUBLE NOT NULL, max_y DOUBLE NOT NULL
    );
    CREATE TABLE gpkg_tile_matrix (
      table_name TEXT NOT NULL, zoom_level INTEGER NOT NULL,
      matrix_width INTEGER NOT NULL, matrix_height INTEGER NOT NULL,
      tile_width INTEGER NOT NULL, tile_height INTEGER NOT NULL,
      pixel_x_size DOUBLE NOT NULL, pixel_y_size DOUBLE NOT NULL,
      PRIMARY KEY (table_name, zoom_level)
    );
  `);
  if (kind === 'mixed' || kind === 'vector') {
    db.run(`
      CREATE TABLE places (id INTEGER PRIMARY KEY, geom BLOB, title TEXT);
      INSERT INTO gpkg_contents VALUES
        ('places', 'features', 'places', '', '2020-01-01T00:00:00.000Z', 0, 0, 0, 0, 4326);
      INSERT INTO gpkg_geometry_columns VALUES ('places', 'geom', 'POINT', 4326, 0, 0);
      INSERT INTO places VALUES
        (1, X'47500001E6100000010100000000000000000000000000000000000000', 'Origen');
    `);
  }
  if (kind === 'mixed' || kind === 'raster') {
    db.run(`
      CREATE TABLE imagery (
        id INTEGER PRIMARY KEY, zoom_level INTEGER NOT NULL, tile_column INTEGER NOT NULL,
        tile_row INTEGER NOT NULL, tile_data BLOB NOT NULL,
        UNIQUE (zoom_level, tile_column, tile_row)
      );
      INSERT INTO gpkg_contents VALUES
        ('imagery', 'tiles', 'imagery', '', '2020-01-01T00:00:00.000Z',
        -20037508.342789244, -20037508.342789244, 20037508.342789244, 20037508.342789244, 3857);
      INSERT INTO gpkg_tile_matrix_set VALUES
        ('imagery', 3857, -20037508.342789244, -20037508.342789244,
        20037508.342789244, 20037508.342789244);
      INSERT INTO gpkg_tile_matrix VALUES
        ('imagery', 0, 1, 1, 1, 1, 40075016.68557849, 40075016.68557849);
    `);
    const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aV1kAAAAASUVORK5CYII=', 'base64');
    db.run('INSERT INTO imagery VALUES (1, 0, 0, 0, ?)', [png]);
  }
  const bytes = Buffer.from(db.export());
  db.close();
  return bytes;
};

/** Usa el bundle de verificación, si se indica, sin modificar dist. */
export const prepareGeoPackagePage = async (page) => {
  if (process.env.API_IDEE_TEST_BUILD) {
    await page.route('**/dist/js/apiidee.ol.min.js', (route) => route.fulfill({
      path: path.join(process.env.API_IDEE_TEST_BUILD, 'js/apiidee.ol.min.js'),
      contentType: 'application/javascript',
    }));
  }
  await page.route('**/sql-wasm.wasm', (route) => route.fulfill({
    path: require.resolve('sql.js/dist/sql-wasm.wasm'),
    contentType: 'application/wasm',
  }));
  await page.route('**/fixtures/geopackage/*.gpkg', async (route) => {
    const kind = path.basename(new URL(route.request().url()).pathname, '.gpkg');
    await route.fulfill({ body: await createGeoPackage(kind), contentType: 'application/geopackage+sqlite3' });
  });
  await page.goto('/test/playwright/ol/basic-ol.html');
};
