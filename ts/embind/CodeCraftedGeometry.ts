import { default as CodeCraftedGeometryJs } from '../wasm/CodeCraftedGeometryJs';
import { default as CodeCraftedGeometryWasm } from '../wasm/CodeCraftedGeometryWasm';
import type { CodeCraftedGeometryContainer } from './CodeCraftedGeometryInterface';

export class CodeCraftedGeometryInstance {
  private _useWasm: boolean;
  private _forceWasm: boolean;
  private _codeCraftedGeometryModule?: CodeCraftedGeometryContainer;

  constructor(useWasm: boolean, forceWasm: boolean) {
    this._useWasm = useWasm;
    this._forceWasm = forceWasm;
  }

  public getModule(): CodeCraftedGeometryContainer {
    if (!this._codeCraftedGeometryModule) {
      throw new Error('CodeCraftedGeometryModule not initialized');
    }
    return this._codeCraftedGeometryModule;
  }

  private async init(ioContext?: any): Promise<void> {
    if (!this._codeCraftedGeometryModule) {
      if (this._useWasm) {
        try {
          this._codeCraftedGeometryModule = await CodeCraftedGeometryWasm();
        } catch (e) {
          console.error(e);
        }
      }
      if (!this._codeCraftedGeometryModule && !this._forceWasm) {
        this._codeCraftedGeometryModule = await CodeCraftedGeometryJs();
      }
      if (ioContext) {
        this._codeCraftedGeometryModule?.setIOContext(ioContext);
      }
    }
  }

  public static async newCodeCraftedGeometry(
    ioContext?: any,
    useWasm: boolean = true,
    forceWasm: boolean = false
  ): Promise<CodeCraftedGeometryInstance> {
    const codeCraftedGeometryInstance: CodeCraftedGeometryInstance =
      new CodeCraftedGeometryInstance(useWasm, forceWasm);
    await codeCraftedGeometryInstance.init(ioContext);
    return codeCraftedGeometryInstance;
  }
}
