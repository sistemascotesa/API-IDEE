const fs = require('fs-extra');
const path = require('path');
const spawn = require('child_process').spawn;

const inputPath = path.resolve(__dirname, '..', 'src', 'plugins');

/**
 * @function
 */
const generateEntryPoints = (pluginspath) => {
  const entrypoints = [];
  fs.readdirSync(pluginspath).forEach((nameFolder) => {
    const props = {};
    props.pathFolder = path.resolve(pluginspath, nameFolder);
    props.name = nameFolder;
    entrypoints.push(props);
  });
  return entrypoints;
};

const installDeps = async (folder) => {
  if (!fs.existsSync(path.resolve(folder, 'node_modules'))) {
    return new Promise((resolve, reject) => {
      const child = spawn('npm', ['install'], {
        cwd: folder,
        stdio: 'inherit',
      });

      child.on('error', (error) => {
        reject(new Error(error));
      });

      child.on('exit', (code) => {
        if (code) {
          reject(new Error(code));
          return;
        }
        resolve();
      });
    });
  }
};

const compilePlugin = async (folder) => {
  return new Promise((resolve, reject) => {
    const child = spawn('npm', ['run', 'build'], {
      cwd: folder,
      stdio: 'inherit',
    });

    child.on('error', (error) => {
      reject(new Error(error));
    });

    child.on('exit', (code) => {
      if (code) {
        reject(new Error(code));
        return;
      }
      resolve();
    });
  });
};

/**
 * @function
 */
const copyPlugin = async (entry) => {
  const dist = path.resolve(entry.pathFolder, 'dist');
  const dirPlugins = path.resolve(__dirname, '..', 'dist', 'plugins', entry.name);
  await fs.ensureDir(dirPlugins);
  await fs.copy(dist, dirPlugins);
};

/**
 * @function
 * @param {Array<object>}
 */
const main = async (entries) => {
  if (entries.length > 0) {
    const entry = entries.pop();
    await installDeps(entry.pathFolder);
    await compilePlugin(entry.pathFolder);
    await copyPlugin(entry);
    await main(entries);
  }
};

const entrypoints = generateEntryPoints(inputPath);
// Sin argumentos se conserva la compilación completa. Los nombres permiten
// actualizar únicamente los plugins afectados antes de empaquetar el WAR.
const requested = process.argv.slice(2);
const missing = requested.filter((name) => !entrypoints.some((entry) => entry.name === name));
if (missing.length) throw new Error(`Unknown plugins: ${missing.join(', ')}`);
const selected = requested.length
  ? entrypoints.filter((entry) => requested.includes(entry.name)) : entrypoints;
main(selected).catch((error) => {
  process.stderr.write(`${error.message}\n`);
  process.exitCode = 1;
});
