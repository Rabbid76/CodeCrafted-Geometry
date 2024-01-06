import { generateWasmInterfaces } from './wasmInterfaceGenerator';

const generateInterfaces = async () => {
  console.log('generate Tools Core interface');
  await generateWasmInterfaces(
    './.ci/CodeCraftedGeometry.json',
    'CodeCraftedGeometry',
    'CodeCraftedGeometryContainer',
    [
      {
        type: 'ts',
        filepath: './ts/embind/CodeCraftedGeometryInterface.ts',
        template: './.ci/CodeCraftedGeometry.ts.in',
      },
      {
        type: 'c++',
        filepath: './cpp/embind/CodeCraftedGeometryEmbind.cpp',
        template: './.ci/CodeCraftedGeometry.cpp.in',
      },
      {
        type: 'md',
        filepath: './docs/CodeCraftedGeometryInterface.md',
        template: './.ci/CodeCraftedGeometry.md.in',
      },
    ]
  );
};

generateInterfaces();
