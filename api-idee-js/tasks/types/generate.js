#!/usr/bin/env node

const fs = require('fs-extra');
const path = require('path');
const { spawnSync } = require('child_process');

const projectRoot = path.resolve(__dirname, '..', '..');
const packageRoot = path.join(projectRoot, 'packages', 'types');
const distDir = path.join(packageRoot, 'dist');

const CORE_SYMBOLS = ['IDEE.map', 'IDEE.Map', 'IDEE.layer.WMS'];
const VARIANTS = [
  {
    name: 'ol',
    output: 'ol.d.ts',
    config: 'config/jsdoc/api/conf-ol.json',
    application: 'OpenLayers',
  },
  {
    name: 'cesium',
    output: 'cesium.d.ts',
    config: 'config/jsdoc/api/conf-cesium.json',
    application: 'Cesium',
  },
];

const PREDEFINED_MX_PARAMETERS = new Set([
  'GeoJSON', 'GeoPackage', 'GeoPackageTile', 'GeoTIFF', 'KML', 'Layer', 'LayerGroup',
  'LayerOptions', 'Map', 'MapLibre', 'MapOptions', 'MBTiles', 'MBTilesVector', 'MVT',
  'OGCAPIFeatures', 'OSM', 'Terrain', 'Tiles3D', 'TMS', 'Vector', 'WFS', 'WMC', 'WMS',
  'WMTS', 'XYZ',
]);

const RESERVED = new Set([
  'break', 'case', 'catch', 'class', 'const', 'continue', 'debugger', 'default', 'delete',
  'do', 'else', 'enum', 'export', 'extends', 'false', 'finally', 'for', 'function', 'if',
  'import', 'in', 'instanceof', 'new', 'null', 'return', 'super', 'switch', 'this', 'throw',
  'true', 'try', 'typeof', 'var', 'void', 'while', 'with', 'yield', 'let', 'static', 'implements',
  'interface', 'package', 'private', 'protected', 'public',
]);

function getJsdocBinary() {
  const binaryName = process.platform.indexOf('win') === 0 ? 'jsdoc.cmd' : 'jsdoc';
  const localBinary = path.join(projectRoot, 'node_modules', '.bin', binaryName);
  if (fs.existsSync(localBinary)) {
    return localBinary;
  }
  return require.resolve('jsdoc/jsdoc.js');
}

function runJsdoc(configPath) {
  const args = ['-X', '../README.md', '-c', configPath];
  const result = spawnSync(getJsdocBinary(), args, {
    cwd: projectRoot,
    encoding: 'utf8',
    maxBuffer: 120 * 1024 * 1024,
  });

  if (result.status !== 0) {
    throw new Error(result.stderr || result.stdout || `JSDoc failed for ${configPath}`);
  }

  try {
    return JSON.parse(result.stdout);
  } catch (err) {
    throw new Error(`Could not parse JSDoc JSON for ${configPath}: ${err.message}`);
  }
}

function isIdentifier(name) {
  return /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(name) && !RESERVED.has(name);
}

function safeIdentifier(name, fallback) {
  if (isIdentifier(name)) {
    return name;
  }
  return fallback;
}

function escapePropertyName(name) {
  return isIdentifier(name) ? name : JSON.stringify(name);
}

function stripHtml(value) {
  return String(value || '')
    .replace(/<[^>]+>/g, '')
    .replace(/\{@link\s+([^}|]+)(?:\|([^}]+))?}/g, '$2')
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();
}

function formatComment(text, indent) {
  const clean = stripHtml(text);
  if (!clean) {
    return [];
  }
  const pad = ' '.repeat(indent);
  const lines = [pad + '/**'];
  clean.match(/.{1,100}(\s|$)|\S+/g).forEach((line) => {
    lines.push(`${pad} * ${line.trim()}`);
  });
  lines.push(pad + ' */');
  return lines;
}

function createNamespace(name) {
  return {
    name,
    namespaces: new Map(),
    classes: new Map(),
    interfaces: new Map(),
    typeAliases: new Map(),
    functions: new Map(),
    variables: new Map(),
  };
}

function getNamespace(root, segments) {
  let node = root;
  segments.forEach((segment) => {
    if (!isIdentifier(segment)) {
      return;
    }
    if (!node.namespaces.has(segment)) {
      node.namespaces.set(segment, createNamespace(segment));
    }
    node = node.namespaces.get(segment);
  });
  return node;
}

function cleanLongname(longname) {
  return String(longname || '').replace(/\/_\D*_/g, '');
}

function stripModulePrefix(name) {
  return name.replace(/^module:/, '');
}

function exportPathFromLongname(longname) {
  const clean = cleanLongname(longname);
  if (!clean.startsWith('module:IDEE')) {
    return null;
  }

  const noMembers = clean.split('#')[0];
  const [modulePart] = noMembers.split('~');
  const segments = stripModulePrefix(modulePart).split(/[/.]/).filter(Boolean);
  if (segments[0] !== 'IDEE') {
    return null;
  }
  const output = segments.slice(1);
  if (output.some((segment) => !isIdentifier(segment))) {
    return null;
  }
  return output;
}

function typedefPathFromLongname(longname) {
  const clean = cleanLongname(longname);
  if (!clean.startsWith('module:IDEE')) {
    return null;
  }

  const [modulePart, innerPart] = clean.split('~');
  const segments = stripModulePrefix(modulePart).split(/[/.]/).filter(Boolean);
  if (segments[0] !== 'IDEE') {
    return null;
  }

  const output = segments.slice(1);
  if (innerPart) {
    output.push(innerPart.split(/[.#]/)[0]);
  }
  if (output.some((segment) => !isIdentifier(segment))) {
    return null;
  }
  return output;
}

function memberNameFromLongname(longname) {
  const clean = cleanLongname(longname);
  const memberMatch = clean.match(/[#.]([^#.~]+)$/);
  if (!memberMatch) {
    return null;
  }
  const name = memberMatch[1];
  return isIdentifier(name) ? name : null;
}

function isApiDoclet(doclet) {
  return Boolean(doclet && (doclet.stability || doclet.api === true));
}

function isTypedefDoclet(doclet) {
  return doclet.kind === 'typedef' && !doclet.undocumented;
}

function collectTypeNames(doclets) {
  const refs = new Set();
  const visit = (type) => {
    if (!type || !Array.isArray(type.names)) {
      return;
    }
    type.names.forEach((name) => collectTypeRefs(String(name), refs));
  };

  doclets.forEach((doclet) => {
    visit(doclet.type);
    (doclet.params || []).forEach((param) => visit(param.type));
    (doclet.returns || []).forEach((ret) => visit(ret.type));
    (doclet.properties || []).forEach((property) => visit(property.type));
  });
  return refs;
}

function collectTypeRefs(typeName, refs) {
  const matches = typeName.match(/[A-Za-z_$][A-Za-z0-9_$]*(?:\.[A-Za-z_$][A-Za-z0-9_$]*)+/g) || [];
  matches.forEach((match) => refs.add(match));
}

function createClassModel(name, doclet) {
  return {
    name,
    description: doclet.classdesc || doclet.description,
    constructorParams: topLevelParams(doclet.params || []),
    properties: new Map(),
    methods: new Map(),
    staticProperties: new Map(),
    staticMethods: new Map(),
  };
}

function addSignature(map, name, signature) {
  if (!map.has(name)) {
    map.set(name, []);
  }
  if (!map.get(name).some((item) => item.signature === signature.signature)) {
    map.get(name).push(signature);
  }
}

function addProperty(map, name, property) {
  if (!map.has(name)) {
    map.set(name, property);
  }
}

function topLevelParams(params) {
  return (params || []).filter((param) => param.name && !String(param.name).includes('.'));
}

function getDocletType(doclet, fallback) {
  if (doclet.type && Array.isArray(doclet.type.names) && doclet.type.names.length) {
    return doclet.type.names;
  }
  return [fallback];
}

function buildModel(doclets) {
  const root = createNamespace('IDEE');
  const classByLongname = new Map();
  const declaredTypePaths = new Set();

  doclets.forEach((doclet) => {
    if (doclet.kind !== 'class' || !isApiDoclet(doclet)) {
      return;
    }
    const symbolPath = exportPathFromLongname(doclet.longname);
    if (!symbolPath || !symbolPath.length) {
      return;
    }

    const name = symbolPath[symbolPath.length - 1];
    const parent = getNamespace(root, symbolPath.slice(0, -1));
    if (!parent || parent.classes.has(name)) {
      return;
    }
    const classModel = createClassModel(name, doclet);
    parent.classes.set(name, classModel);
    classByLongname.set(cleanLongname(doclet.longname), classModel);
    declaredTypePaths.add(`IDEE.${symbolPath.join('.')}`);

    (doclet.properties || []).forEach((property) => {
      if (property.name && !String(property.name).includes('.')) {
        addProperty(classModel.properties, property.name, property);
      }
    });
  });

  doclets.forEach((doclet) => {
    if (!isTypedefDoclet(doclet)) {
      return;
    }
    const symbolPath = typedefPathFromLongname(doclet.longname);
    if (!symbolPath || !symbolPath.length) {
      return;
    }
    const name = symbolPath[symbolPath.length - 1];
    const parent = getNamespace(root, symbolPath.slice(0, -1));
    if (!parent) {
      return;
    }

    if ((doclet.properties || []).length || /^(Object|object)$/.test((doclet.type && doclet.type.names || [''])[0])) {
      parent.interfaces.set(name, doclet);
    } else {
      parent.typeAliases.set(name, doclet);
    }
    declaredTypePaths.add(`IDEE.${symbolPath.join('.')}`);
  });

  doclets.forEach((doclet) => {
    if (!isApiDoclet(doclet) || doclet.kind === 'class' || doclet.kind === 'typedef') {
      return;
    }

    const clean = cleanLongname(doclet.longname);
    const instanceOwner = clean.includes('#') ? clean.split('#')[0] : null;
    const staticOwner = doclet.memberof && classByLongname.has(cleanLongname(doclet.memberof))
      ? cleanLongname(doclet.memberof)
      : null;
    const classModel = instanceOwner
      ? classByLongname.get(instanceOwner)
      : (staticOwner ? classByLongname.get(staticOwner) : null);

    if (classModel) {
      const name = memberNameFromLongname(doclet.longname) || doclet.name;
      if (!name || !isIdentifier(name) || name === 'constructor') {
        return;
      }
      const isStatic = Boolean(staticOwner) && !instanceOwner;
      if (doclet.kind === 'function') {
        addSignature(isStatic ? classModel.staticMethods : classModel.methods, name, {
          signature: functionSignature(doclet, declaredTypePaths),
          description: doclet.description,
        });
      } else if (doclet.kind === 'member' || doclet.kind === 'constant') {
        addProperty(isStatic ? classModel.staticProperties : classModel.properties, name, doclet);
      }
      return;
    }

    const symbolPath = exportPathFromLongname(doclet.longname);
    if (!symbolPath || !symbolPath.length) {
      return;
    }
    const name = symbolPath[symbolPath.length - 1];
    const parent = getNamespace(root, symbolPath.slice(0, -1));
    if (!parent || parent.classes.has(name)) {
      return;
    }

    if (doclet.kind === 'function') {
      addSignature(parent.functions, name, {
        signature: functionSignature(doclet, declaredTypePaths),
        description: doclet.description,
      });
    } else if (doclet.kind === 'member' || doclet.kind === 'constant') {
      parent.variables.set(name, doclet);
    }
  });

  const mxRefs = Array.from(collectTypeNames(doclets)).filter((name) => name.startsWith('Mx.'));
  return { root, declaredTypePaths, mxRefs };
}

function splitTopLevel(value, separator) {
  const parts = [];
  let depth = 0;
  let current = '';
  for (let i = 0; i < value.length; i += 1) {
    const char = value[i];
    if (char === '<' || char === '(' || char === '[') {
      depth += 1;
    } else if (char === '>' || char === ')' || char === ']') {
      depth -= 1;
    }
    if (char === separator && depth === 0) {
      parts.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  parts.push(current);
  return parts.map((part) => part.trim()).filter(Boolean);
}

function normalizeType(typeName, declaredTypePaths) {
  let type = String(typeName || 'any').trim();
  type = type.replace(/^\?/, '').replace(/=$/, '').trim();
  type = type.replace(/^!/, '').trim();
  type = type.replace(/\s+/g, '');

  if (!type || type === '*' || type === '?') {
    return 'any';
  }

  const union = splitTopLevel(type, '|');
  if (union.length > 1) {
    return union.map((part) => {
      const normalized = normalizeType(part, declaredTypePaths);
      return normalized.includes('=>') ? `(${normalized})` : normalized;
    }).join(' | ');
  }

  const generic = type.match(/^([A-Za-z_$][A-Za-z0-9_$.]*)(?:\.<|<)(.*)>$/);
  if (generic) {
    const genericName = generic[1];
    const genericArgs = splitTopLevel(generic[2], ',').map((arg) => normalizeType(arg, declaredTypePaths));
    if (genericName === 'Array') {
      return `Array<${genericArgs[0] || 'any'}>`;
    }
    if (genericName === 'Object' || genericName === 'object') {
      return genericArgs.length > 1 ? `Record<string, ${genericArgs[1]}>` : 'Record<string, any>';
    }
    if (genericName === 'Promise') {
      return `Promise<${genericArgs[0] || 'any'}>`;
    }
    return 'any';
  }

  const moduleRef = type.match(/^module:IDEE(?:[/.][A-Za-z0-9_$]+)+(?:~[A-Za-z0-9_$]+)?$/);
  if (moduleRef) {
    const symbolPath = typedefPathFromLongname(type) || exportPathFromLongname(type);
    const fullPath = symbolPath ? `IDEE.${symbolPath.join('.')}` : null;
    return fullPath && declaredTypePaths.has(fullPath) ? fullPath : 'any';
  }

  const lower = type.toLowerCase();
  if (lower === 'string') return 'string';
  if (lower === 'number') return 'number';
  if (lower === 'boolean') return 'boolean';
  if (lower === 'object') return 'Record<string, any>';
  if (lower === 'array') return 'any[]';
  if (lower === 'function') return '(...args: any[]) => any';
  if (lower === 'undefined') return 'undefined';
  if (lower === 'null') return 'null';
  if (lower === 'void') return 'void';
  if (lower === 'promise') return 'Promise<any>';
  if (lower === 'bool') return 'boolean';
  if (lower === 'float' || lower === 'integer' || lower === 'int') return 'number';

  if (type === 'HTML' || type === 'DOMElement') {
    return 'HTMLElement';
  }
  if (type === 'Map') {
    return declaredTypePaths.has('IDEE.Map') ? 'IDEE.Map' : 'any';
  }
  if (type === 'Layer') {
    return declaredTypePaths.has('IDEE.Layer') ? 'IDEE.Layer' : 'any';
  }

  if (/^(ol|Cesium|GeoPackage|GeoPackageAPI|protobuf|jsts|proj4)\./.test(type)) {
    return 'any';
  }

  if (type.startsWith('IDEE.')) {
    return declaredTypePaths.has(type) ? type : 'any';
  }

  if (type.startsWith('Mx.')) {
    return type;
  }

  if (/^(ArrayBuffer|Blob|CanvasRenderingContext2D|Date|Document|Element|Error|Event|File|FileReader|HTMLElement|HTMLCanvasElement|HTMLCollection|HTMLImageElement|ImageData|KeyboardEvent|MouseEvent|Node|Promise|RegExp|Request|Response|URL|Window)$/.test(type)) {
    return type;
  }

  return 'any';
}

function typeFromNames(names, declaredTypePaths, fallback = 'any') {
  if (!names || !names.length) {
    return fallback;
  }
  const normalized = names.map((name) => normalizeType(name, declaredTypePaths));
  if (normalized.length > 1) {
    return normalized.map((type) => (type.includes('=>') ? `(${type})` : type)).join(' | ');
  }
  return normalized[0];
}

function paramDeclaration(param, index, declaredTypePaths, optionalAsUnion) {
  const rawName = String(param.name || `arg${index}`);
  const cleanName = rawName.replace(/^\.\.\./, '').replace(/[^A-Za-z0-9_$]/g, '_');
  const name = safeIdentifier(cleanName, `arg${index}`);
  const type = typeFromNames(param.type && param.type.names, declaredTypePaths);

  if (param.variable) {
    return `...${name}: Array<${type}>`;
  }

  const optional = param.optional || index > 0;

  if (optional && !optionalAsUnion) {
    return `${name}?: ${type}`;
  }

  if (optional && optionalAsUnion) {
    return `${name}: ${type} | undefined`;
  }

  return `${name}: ${type}`;
}

function paramsDeclaration(params, declaredTypePaths) {
  const topParams = topLevelParams(params);
  let seenOptional = false;
  let hasRequiredAfterOptional = false;
  topParams.forEach((param, index) => {
    if (param.optional || index > 0) {
      seenOptional = true;
    } else if (seenOptional && !param.variable) {
      hasRequiredAfterOptional = true;
    }
  });
  return topParams
    .map((param, index) => paramDeclaration(param, index, declaredTypePaths, hasRequiredAfterOptional))
    .join(', ');
}

function functionSignature(doclet, declaredTypePaths) {
  const params = paramsDeclaration(doclet.params || [], declaredTypePaths);
  const returns = doclet.returns && doclet.returns.length
    ? typeFromNames(doclet.returns.flatMap((ret) => ret.type ? ret.type.names : []), declaredTypePaths, 'void')
    : 'void';
  return `(${params}): ${returns}`;
}

function propertyDeclaration(property, declaredTypePaths) {
  const name = escapePropertyName(property.name);
  const optional = property.optional ? '?' : '';
  const type = typeFromNames(getDocletType(property, 'any'), declaredTypePaths);
  return `${name}${optional}: ${type};`;
}

function interfaceBody(doclet, declaredTypePaths, indent) {
  const pad = ' '.repeat(indent);
  const lines = [];
  const properties = doclet.properties || [];
  if (!properties.length) {
    lines.push(`${pad}[key: string]: any;`);
    return lines;
  }
  properties.forEach((property) => {
    lines.push(...formatComment(property.description, indent));
    lines.push(`${pad}${propertyDeclaration(property, declaredTypePaths)}`);
  });
  lines.push(`${pad}[key: string]: any;`);
  return lines;
}

function renderClass(name, model, declaredTypePaths, indent) {
  const pad = ' '.repeat(indent);
  const lines = [];
  lines.push(...formatComment(model.description, indent));
  lines.push(`${pad}export class ${name} {`);
  const bodyPad = indent + 2;

  lines.push(`${' '.repeat(bodyPad)}constructor(...args: any[]);`);

  Array.from(model.properties.entries()).sort(([a], [b]) => a.localeCompare(b)).forEach(([propName, prop]) => {
    if (!isIdentifier(propName)) {
      return;
    }
    lines.push(...formatComment(prop.description, bodyPad));
    lines.push(`${' '.repeat(bodyPad)}${propertyDeclaration({ ...prop, name: propName }, declaredTypePaths)}`);
  });

  Array.from(model.staticProperties.entries()).sort(([a], [b]) => a.localeCompare(b)).forEach(([propName, prop]) => {
    if (!isIdentifier(propName)) {
      return;
    }
    lines.push(...formatComment(prop.description, bodyPad));
    lines.push(`${' '.repeat(bodyPad)}static ${propertyDeclaration({ ...prop, name: propName }, declaredTypePaths)}`);
  });

  Array.from(model.methods.entries()).sort(([a], [b]) => a.localeCompare(b)).forEach(([methodName, signatures]) => {
    if (model.properties.has(methodName)) {
      return;
    }
    signatures.forEach((signature) => {
      lines.push(...formatComment(signature.description, bodyPad));
      lines.push(`${' '.repeat(bodyPad)}${methodName}${signature.signature};`);
    });
  });

  Array.from(model.staticMethods.entries()).sort(([a], [b]) => a.localeCompare(b)).forEach(([methodName, signatures]) => {
    if (model.staticProperties.has(methodName)) {
      return;
    }
    signatures.forEach((signature) => {
      lines.push(...formatComment(signature.description, bodyPad));
      lines.push(`${' '.repeat(bodyPad)}static ${methodName}${signature.signature};`);
    });
  });

  lines.push(`${pad}}`);
  return lines;
}

function renderNamespace(node, declaredTypePaths, indent) {
  const pad = ' '.repeat(indent);
  const lines = [];

  Array.from(node.interfaces.entries()).sort(([a], [b]) => a.localeCompare(b)).forEach(([name, doclet]) => {
    if (!isIdentifier(name)) {
      return;
    }
    lines.push(...formatComment(doclet.description, indent));
    lines.push(`${pad}export interface ${name} {`);
    lines.push(...interfaceBody(doclet, declaredTypePaths, indent + 2));
    lines.push(`${pad}}`);
  });

  Array.from(node.typeAliases.entries()).sort(([a], [b]) => a.localeCompare(b)).forEach(([name, doclet]) => {
    if (!isIdentifier(name)) {
      return;
    }
    const type = typeFromNames(doclet.type && doclet.type.names, declaredTypePaths);
    lines.push(...formatComment(doclet.description, indent));
    lines.push(`${pad}export type ${name} = ${type};`);
  });

  Array.from(node.variables.entries()).sort(([a], [b]) => a.localeCompare(b)).forEach(([name, doclet]) => {
    if (!isIdentifier(name)) {
      return;
    }
    if (node.namespaces.has(name) || node.classes.has(name) || node.interfaces.has(name) ||
      node.typeAliases.has(name) || node.functions.has(name)) {
      return;
    }
    const declaration = doclet.kind === 'constant' ? 'const' : 'let';
    const type = typeFromNames(getDocletType(doclet, 'any'), declaredTypePaths);
    lines.push(...formatComment(doclet.description, indent));
    lines.push(`${pad}export ${declaration} ${name}: ${type};`);
  });

  Array.from(node.functions.entries()).sort(([a], [b]) => a.localeCompare(b)).forEach(([name, signatures]) => {
    if (!isIdentifier(name)) {
      return;
    }
    if (node.namespaces.has(name) || node.classes.has(name) || node.interfaces.has(name) ||
      node.typeAliases.has(name)) {
      return;
    }
    signatures.forEach((signature) => {
      lines.push(...formatComment(signature.description, indent));
      lines.push(`${pad}export function ${name}${signature.signature};`);
    });
  });

  Array.from(node.classes.entries()).sort(([a], [b]) => a.localeCompare(b)).forEach(([name, model]) => {
    lines.push(...renderClass(name, model, declaredTypePaths, indent));
  });

  Array.from(node.namespaces.entries()).sort(([a], [b]) => a.localeCompare(b)).forEach(([name, child]) => {
    if (!isIdentifier(name)) {
      return;
    }
    lines.push(`${pad}export namespace ${name} {`);
    lines.push(...renderNamespace(child, declaredTypePaths, indent + 2));
    lines.push(`${pad}}`);
  });

  return lines;
}

function mxModel(mxRefs) {
  const root = {};
  mxRefs.forEach((ref) => {
    const parts = ref.split('.');
    if (parts[0] !== 'Mx' || parts.length < 2) {
      return;
    }
    let node = root;
    parts.slice(1).forEach((part, index, arr) => {
      if (!isIdentifier(part)) {
        return;
      }
      if (index === arr.length - 1) {
        node[part] = node[part] || null;
      } else {
        node[part] = node[part] || {};
        node = node[part];
      }
    });
  });
  return root;
}

function renderMxNode(name, node, indent, parentName) {
  const pad = ' '.repeat(indent);
  const lines = [];
  if (parentName === 'parameters' && PREDEFINED_MX_PARAMETERS.has(name)) {
    return lines;
  }
  if (node === null) {
    lines.push(`${pad}export interface ${name} {`);
    lines.push(`${pad}  [key: string]: any;`);
    lines.push(`${pad}}`);
    return lines;
  }

  lines.push(`${pad}export namespace ${name} {`);
  Object.keys(node).sort().forEach((childName) => {
    lines.push(...renderMxNode(childName, node[childName], indent + 2, name));
  });
  lines.push(`${pad}}`);
  return lines;
}

function renderMx(mxRefs, indent) {
  const model = mxModel(mxRefs);
  const pad = ' '.repeat(indent);
  const lines = [`${pad}namespace Mx {`];
  lines.push(`${pad}  namespace parameters {`);
  lines.push(`${pad}    interface Layer {`);
  lines.push(`${pad}      type?: string;`);
  lines.push(`${pad}      name?: string;`);
  lines.push(`${pad}      legend?: string;`);
  lines.push(`${pad}      url?: string | string[];`);
  lines.push(`${pad}      visibility?: boolean;`);
  lines.push(`${pad}      visible?: boolean;`);
  lines.push(`${pad}      isBase?: boolean;`);
  lines.push(`${pad}      transparent?: boolean;`);
  lines.push(`${pad}      projection?: string;`);
  lines.push(`${pad}      opacity?: number;`);
  lines.push(`${pad}      queryable?: boolean;`);
  lines.push(`${pad}      displayInLayerSwitcher?: boolean;`);
  lines.push(`${pad}      useCapabilities?: boolean;`);
  lines.push(`${pad}      extract?: boolean;`);
  lines.push(`${pad}      attribution?: any;`);
  lines.push(`${pad}      style?: any;`);
  lines.push(`${pad}      [key: string]: any;`);
  lines.push(`${pad}    }`);
  lines.push(`${pad}    interface Map {`);
  lines.push(`${pad}      id?: string;`);
  lines.push(`${pad}      container?: string | HTMLElement;`);
  lines.push(`${pad}      center?: string | number[] | { x?: number; y?: number; draw?: boolean; [key: string]: any };`);
  lines.push(`${pad}      zoom?: number;`);
  lines.push(`${pad}      projection?: string;`);
  lines.push(`${pad}      bbox?: string | number[];`);
  lines.push(`${pad}      maxExtent?: string | number[] | Record<string, any>;`);
  lines.push(`${pad}      layers?: Array<string | Layer> | string;`);
  lines.push(`${pad}      controls?: string | any[];`);
  lines.push(`${pad}      label?: string | Record<string, any>;`);
  lines.push(`${pad}      minZoom?: number;`);
  lines.push(`${pad}      maxZoom?: number;`);
  lines.push(`${pad}      resolutions?: string | string[] | number[];`);
  lines.push(`${pad}      viewExtent?: string | number[] | Record<string, any>;`);
  lines.push(`${pad}      rotation?: number;`);
  lines.push(`${pad}      ticket?: string;`);
  lines.push(`${pad}      [key: string]: any;`);
  lines.push(`${pad}    }`);
  lines.push(`${pad}    interface MapOptions {`);
  lines.push(`${pad}      [key: string]: any;`);
  lines.push(`${pad}    }`);
  lines.push(`${pad}    interface LayerOptions {`);
  lines.push(`${pad}      opacity?: number;`);
  lines.push(`${pad}      minZoom?: number;`);
  lines.push(`${pad}      maxZoom?: number;`);
  lines.push(`${pad}      minScale?: number;`);
  lines.push(`${pad}      maxScale?: number;`);
  lines.push(`${pad}      minResolution?: number;`);
  lines.push(`${pad}      maxResolution?: number;`);
  lines.push(`${pad}      displayInLayerSwitcher?: boolean;`);
  lines.push(`${pad}      queryable?: boolean;`);
  lines.push(`${pad}      [key: string]: any;`);
  lines.push(`${pad}    }`);
  [
    'GeoJSON', 'GeoPackage', 'GeoPackageTile', 'GeoTIFF', 'KML', 'LayerGroup', 'MapLibre',
    'MBTiles', 'MBTilesVector', 'MVT', 'OGCAPIFeatures', 'OSM', 'Terrain', 'Tiles3D',
    'TMS', 'Vector', 'WFS', 'WMC', 'WMS', 'WMTS', 'XYZ',
  ].forEach((name) => {
    lines.push(`${pad}    interface ${name} extends Layer {}`);
  });
  lines.push(`${pad}  }`);
  Object.keys(model).sort().forEach((name) => {
    lines.push(...renderMxNode(name, model[name], indent + 2));
  });
  lines.push(`${pad}}`);
  return lines;
}

function renderDts(doclets, variant) {
  const { root, declaredTypePaths, mxRefs } = buildModel(doclets);
  const exportedPaths = new Set();

  function collectPaths(node, prefix) {
    node.classes.forEach((_, name) => exportedPaths.add(['IDEE'].concat(prefix, name).join('.')));
    node.interfaces.forEach((_, name) => exportedPaths.add(['IDEE'].concat(prefix, name).join('.')));
    node.functions.forEach((_, name) => exportedPaths.add(['IDEE'].concat(prefix, name).join('.')));
    node.variables.forEach((_, name) => exportedPaths.add(['IDEE'].concat(prefix, name).join('.')));
    node.namespaces.forEach((child, name) => collectPaths(child, prefix.concat(name)));
  }
  collectPaths(root, []);

  CORE_SYMBOLS.forEach((symbol) => {
    if (!exportedPaths.has(symbol)) {
      throw new Error(`${variant.name} types generation did not include core symbol ${symbol}`);
    }
  });

  const lines = [
    '/* eslint-disable */',
    `// Generated by api-idee-js/tasks/types/generate.js from ${variant.config}.`,
    `// API IDEE ${variant.application} browser-global declarations.`,
    '',
    'export {};',
    '',
    'declare global {',
    '  namespace IDEE {',
    ...renderNamespace(root, declaredTypePaths, 4),
    '  }',
    '',
    ...renderMx(mxRefs, 2),
    '',
    '  interface Window {',
    '    IDEE: typeof IDEE;',
    '  }',
    '}',
    '',
  ];

  return lines.join('\n');
}

function writeVariant(variant) {
  const doclets = runJsdoc(variant.config);
  const dts = renderDts(doclets, variant);
  fs.outputFileSync(path.join(distDir, variant.output), dts, 'utf8');
  return dts;
}

function main() {
  fs.emptyDirSync(distDir);
  const outputs = new Map();
  VARIANTS.forEach((variant) => {
    outputs.set(variant.name, writeVariant(variant));
  });
  fs.outputFileSync(path.join(distDir, 'index.d.ts'), outputs.get('ol'), 'utf8');
}

if (require.main === module) {
  try {
    main();
  } catch (err) {
    process.stderr.write(`${err.stack || err.message}\n`);
    process.exit(1);
  }
}
