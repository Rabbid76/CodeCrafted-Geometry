"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const process_1 = __importDefault(require("process"));
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const child_process_1 = __importDefault(require("child_process"));
const glob = __importStar(require("glob"));
const rootDir = '.';
const wasmBuildDir = path.join('buildWasm');
const wasmBuildBinaryDir = path.join('buildWasm/cpp');
const commands = process_1.default.argv.slice(2);
let commandError = false;
if (commands.length === 0) {
    console.log('no command found');
    commandError = true;
}
else {
    const knownCommands = ['build', 'build-debug', 'copy', 'copy-test'];
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
    console.log('  build-debug - build wasm with wasm-exceptions and asm_js with debug information');
    console.log('  copy - copy wasm to source and distribution directory');
    console.log('  copy-test - copy wasm to test directory');
    process_1.default.exit(0);
}
const buildWasmCommands = commands.filter((element) => ['build', 'build-debug'].includes(element));
let emSdkDir = process_1.default.env.EMSDK;
if (!emSdkDir) {
    emSdkDir = process_1.default.env.EMSDK_DIR;
}
if (!emSdkDir && buildWasmCommands.length > 0) {
    throw new Error('Emscripten SDK not found');
}
console.log(`Emscripten SDK directory: ${emSdkDir}`);
const run = async () => {
    for (const command of commands) {
        console.log(`running command: ${command}`);
        switch (command) {
            case 'build':
                await buildWasm(false);
                break;
            case 'build-debug':
                await buildWasm(true);
                break;
            case 'copy':
                await copyWasm();
                break;
            case 'copy-test':
                await copyWasm4Test();
                break;
        }
    }
    process_1.default.exit(0);
};
const buildWasm = async (debug) => {
    if (!fs.existsSync(wasmBuildDir)) {
        console.log(`creating directory: ${wasmBuildDir}`);
        fs.mkdirSync(wasmBuildDir, { recursive: true });
    }
    const cmakeCommand = 'cmake -G "Unix Makefiles"' +
        ` -DCMAKE_BUILD_TYPE=${debug ? 'Debug' : 'MinSizeRel'}` +
        ` -DCMAKE_TOOLCHAIN_FILE="${emSdkDir}/upstream/emscripten/cmake/Modules/Platform/Emscripten.cmake"` +
        ' -S .' +
        ` -B ${wasmBuildDir}`;
    console.log(`${cmakeCommand}`);
    child_process_1.default.execSync(cmakeCommand, { cwd: rootDir, stdio: 'inherit' });
    const makeCommand = `cmake --build ${rootDir}/${wasmBuildDir} -- -j 2`;
    child_process_1.default.execSync(makeCommand, { cwd: rootDir, stdio: 'inherit' });
};
const copyFiles = async (sourcePattern, targetDir) => {
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
        }
        catch (err) {
            console.error(`Error copying file ${file}:`, err);
        }
    }
};
const copyWasm = async () => {
    await copyFiles(`${wasmBuildBinaryDir}/CodeCraftedGeometryWasm*.*`, 'ts/wasm');
    await copyFiles(`${wasmBuildBinaryDir}/CodeCraftedGeometryJs*.*`, 'ts/wasm');
    await copyFiles('ts/wasm/CodeCraftedGeometryWasm.wasm', 'dist/client');
};
const copyWasm4Test = async () => {
    await copyFiles('ts/wasm/CodeCraftedGeometryWasm.wasm', 'dist/wasm');
    await copyFiles('ts/wasm/CodeCraftedGeometryWasm.js', 'dist/wasm');
    await copyFiles('ts/wasm/CodeCraftedGeometryJs.js', 'dist/wasm');
    await copyFiles('ts/wasm/CodeCraftedGeometryJs.js.mem', 'dist/wasm');
};
run();
//# sourceMappingURL=buildScripts.js.map