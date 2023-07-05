// TODO lad .wasm
//import * as CodeCraftedGeometry from '../../buildWasm/cpp/CodeCraftedGeometryWasm.js';

// @ts-ignore
import * as CodeCraftedGeometry from '../../buildWasm/cpp/CodeCraftedGeometryJs.js';

describe('load wasm', () => {
    it('get version', async () => {
        const codeCraftedGeometry = await CodeCraftedGeometry();
        const version = codeCraftedGeometry.getVersion();
        expect(version).toBe('0.0.1');
    });
});