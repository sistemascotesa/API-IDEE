# @types/apiidee

TypeScript declaration package for the API IDEE browser global API.

The declarations are generated from the same source JSDoc used by the API IDEE documentation. They describe the global `IDEE` namespace exposed by the bundled scripts, for example `IDEE.map`, `IDEE.Map`, `IDEE.layer.WMS`, and `IDEE.control.Scale`.

## Usage

Install the package as a development dependency:

```sh
npm install --save-dev @types/apiidee
```

For the default OpenLayers declarations, add the package to `compilerOptions.types`:

```json
{
  "compilerOptions": {
    "types": ["apiidee"],
    "lib": ["ES2020", "DOM"]
  }
}
```

For Cesium-specific declarations, reference the subpath:

```json
{
  "compilerOptions": {
    "types": ["apiidee/cesium"],
    "lib": ["ES2020", "DOM"]
  }
}
```

This package contains declarations only. It does not provide runtime JavaScript and does not replace loading the API IDEE script and stylesheet in the browser.

## Release Policy

Normal releases should match the API IDEE version. Type-only fixes may use patch versions compatible with the same API IDEE minor release.
