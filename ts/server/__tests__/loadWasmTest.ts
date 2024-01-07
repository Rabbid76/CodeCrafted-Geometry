import { CodeCraftedGeometryInstance } from '../../embind/CodeCraftedGeometry';
import { describe, expect, it } from '@jest/globals';

const testCases = [[true], [false]];
const timeout = 5000;

describe('load CodeCraftedGeometry', () => {
  const ioContext: any = undefined;
  it.each(testCases)(
    'getVersion, use wasm: %s',
    async (useWasm: boolean) => {
      const codeCraftedGeometryInstance =
        await CodeCraftedGeometryInstance.newCodeCraftedGeometry(
          ioContext,
          useWasm,
          useWasm
        );
      const version =
        codeCraftedGeometryInstance.getModule().getVersion() ?? '';
      expect(version).toBe('0.0.1');
    },
    timeout
  );
});
