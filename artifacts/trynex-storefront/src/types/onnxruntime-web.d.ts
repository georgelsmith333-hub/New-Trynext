// onnxruntime-web's package.json "exports" map has no "types" condition on
// its "." entry (its own types.d.ts does `export * from 'onnxruntime-common'`,
// which has the identical problem one level deeper) — a known packaging bug
// in both packages. Rather than chase broken "exports" resolution through
// multiple upstream packages, this declares only the actual runtime API
// surface used by src/lib/backgroundRemoval.ts.
declare module "onnxruntime-web" {
  export type Tensor = {
    readonly data: Float32Array | Uint8Array | Int32Array | BigInt64Array | string[];
    readonly dims: readonly number[];
    readonly type: string;
  };
  export const Tensor: {
    new (type: "float32", data: Float32Array, dims: readonly number[]): Tensor;
  };

  export type InferenceSession = {
    readonly inputNames: readonly string[];
    readonly outputNames: readonly string[];
    run(feeds: Record<string, Tensor>): Promise<Record<string, Tensor>>;
  };
  export const InferenceSession: {
    create(
      uri: string,
      options?: { executionProviders?: readonly string[] },
    ): Promise<InferenceSession>;
  };

  export const env: {
    wasm: { wasmPaths: string };
  };
}
