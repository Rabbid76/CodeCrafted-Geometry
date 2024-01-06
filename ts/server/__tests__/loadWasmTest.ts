import { default as ConfiguratorKernelJs } from '../../wasm/CodeCraftedGeometryJs';
import { default as ConfiguratorKernelWasm } from '../../wasm/CodeCraftedGeometryWasm';
import { describe, expect, it } from '@jest/globals';

describe('load asm_js', () => {
  it('get version', async () => {
    const codeCraftedGeometry = await ConfiguratorKernelJs();
    const version = codeCraftedGeometry.getVersion();
    expect(version).toBe('0.0.1');
  });
});

describe('load wasm', () => {
  it('get version', async () => {
    const codeCraftedGeometry = await ConfiguratorKernelWasm();
    const version = codeCraftedGeometry.getVersion();
    expect(version).toBe('0.0.1');
  });
});
