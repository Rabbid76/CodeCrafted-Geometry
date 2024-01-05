import process from 'process';
import * as path from 'path';
import * as fs from 'fs';
import child_process from 'child_process';
import * as glob from 'glob';

const rootDirectoryName = `CodeCrafted-Geometry`;
const rootDir = '.';
const wasmBuildDir = path.join('buildWasm');

const commands: string[] = process.argv.slice(2);
let commandError = false;
if (commands.length === 0) {
  console.log('no command found');
  commandError = true;
} else {
  const knownCommands: string[] = ['build', 'build-debug', 'copyWasm4Test'];
  for (const command of commands) {
    if (!knownCommands.includes(command)) {
      console.log(`unknown command: ${command}`);
      commandError = true;
    }
  }
}
if (commandError) {
  console.log('usage: node buildScripts.js <command1> <command2> ...');
  console.log('available commands:');
  console.log('  build - build wasm with wasm-exceptions and asm_js');
  console.log(
    '  build-debug - build wasm with wasm-exceptions and asm_js with debug information'
  );
  process.exit(0);
}

const buildWasmCommands: string[] = commands.filter((element) =>
  ['build', 'build-debug'].includes(element)
);
let emSdkDir = process.env.EMSDK;
if (!emSdkDir) {
  emSdkDir = process.env.EMSDK_DIR;
}
if (!emSdkDir && buildWasmCommands.length > 0) {
  throw new Error('Emscripten SDK not found');
}
console.log(`Emscripten SDK directory: ${emSdkDir}`);

const run = async (): Promise<void> => {
  for (const command of commands) {
    console.log(`running command: ${command}`);
    switch (command) {
      case 'build':
        await buildWasm(false);
        break;
      case 'build-debug':
        await buildWasm(true);
        break;
      case 'copyWasm4Test':
        await copyWasm4Test();
        break;
    }
  }
  process.exit(0);
};

const buildWasm = async (debug: boolean): Promise<void> => {
  if (!fs.existsSync(wasmBuildDir)) {
    console.log(`creating directory: ${wasmBuildDir}`);
    fs.mkdirSync(wasmBuildDir, { recursive: true });
  }

  let cmakeCommand =
    `cmake -G "Unix Makefiles"` +
    ` -DCMAKE_BUILD_TYPE=${debug ? 'Debug' : 'MinSizeRel'}` +
    ` -DCMAKE_TOOLCHAIN_FILE="${emSdkDir}/upstream/emscripten/cmake/Modules/Platform/Emscripten.cmake"` +
    ` -S .` +
    ` -B ${wasmBuildDir}`;
  console.log(`${cmakeCommand}`);
  child_process.execSync(cmakeCommand, { cwd: rootDir, stdio: 'inherit' });

  const makeCommand = `cmake --build ${rootDir}/${wasmBuildDir} -- -j 2`;
  child_process.execSync(makeCommand, { cwd: rootDir, stdio: 'inherit' });
};

const copyFiles = async (
  sourcePattern: string,
  targetDir: string
): Promise<void> => {
  const absTargetDir = path.join(rootDir, targetDir);
  if (!fs.existsSync(absTargetDir)) {
    console.log(`creating directory: ${absTargetDir}`);
    fs.mkdirSync(absTargetDir, { recursive: true });
  }
  const files = glob.sync(`${rootDir}/${sourcePattern}`);
  for (const file of files) {
    const fileName = path.basename(file);
    const absTargetFile = path.join(absTargetDir, fileName);
    console.log(`copy ${file} to ${absTargetFile}`);
    try {
      await fs.promises.copyFile(file, absTargetFile);
    } catch (err) {
      console.error(`Error copying file ${file}:`, err);
      // Log the error and continue with the next file
    }
  }
};

const copyWasm4Test = async (): Promise<void> => {
  await copyFiles('node/wasm/*', 'node/dist/wasm');
  await copyFiles('node/asm_js/*', 'node/dist/asm_js');
};

run();
