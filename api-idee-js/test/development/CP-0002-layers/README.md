CP-001
Mapa básico con todas las capas vectoriales, con pruebas de funciones.

CP-002
Mapa básico con todas las capas Rasters, con pruebas de funciones.

CP-003
Mapa básico con OSM.

CP-004
Mapa básico con capas genéricas.

CP-005
Mapa básico con capas TMS.

CP-006
Mapa básico con capas WMTS.

CP-007
Mapa básico con capas WFS.

CP-008
Mapa básico con capas WMS.

CP-009
Mapa básico con capas KML.

CP-010
Mapa básico con capas XYZ.

CP-011
Mapa básico para testear parámetro isBase y transparent.

CP-012
Mapa básico para testear parámetro extent a las capas.

CP-013
Mapa básico con capas MVT.

CP-014
Mapa básico con capas MBTiles.

CP-015
Mapa básico con capas OGCAPIFeatures.

CP-016
Pruebas de la función "toGeoJSON" de las capas y pruebas de la función "getGeoJSON" de los features de estas capas.

CP-017
WMS_FULL, capas wms sin nombre

CP-018
Mapa básico con capas MapLibre.

CP-019
Mapa básico con pruebas en todas las capas de parámetros de minZoom, maxZoom y tileGridMaxZoom.

CP-020
Mapa básico con capas GeoTiff (COG).

CP-021
Mapa básico con capas LayerGroup.

CP-022
Mapa básico con capa GeoJSON y WFS, para probar select/unselect de features múltiples.

CP-023
Mapa básico con Capas rápidas.

CP-024
Mapa básico con secciones.

CP-025
Mapa básico con Capas WMC y una WMS.

CP-026
Mapa básico con capa GeoPackage.

CP-027
Pruebas de refreshInterval en los tipos de capa soportados por OpenLayers y Cesium.

CP-028
Pruebas de refreshInterval en el mapa, su prioridad y las capas añadidas posteriormente.

Para ejecutar CP-027 y CP-028, iniciar primero los datos sintéticos desde `api-idee-js`:

~~~sh
python3 test/development/CP-0002-layers/servidor-autorefresco.py --port 8083
~~~

En otra terminal, iniciar el caso con OpenLayers:

~~~sh
npm start -- --name=CP-0002-layers/CP-027 --port 8082 --no-open
npm start -- --name=CP-0002-layers/CP-028 --port 8082 --no-open
~~~

Solo debe ejecutarse un caso cada vez. Abrir respectivamente:

- http://localhost:8082/test/development/CP-0002-layers/CP-027.html
- http://localhost:8082/test/development/CP-0002-layers/CP-028.html

Para probar con Cesium, sustituir `npm start` por `npm run start:cesium`. El propio
caso indica el motor activo. En las herramientas de desarrollo del navegador se
pueden filtrar las peticiones por `_ideeRefresh`.
