/**
 * Remembers originals that already uploaded during this Studio visit, so a
 * retry after a later failure reuses them instead of storing a second copy.
 * Keyed by the exact image data, so an edited or replaced image never reuses
 * an older upload.
 */
export interface CachedOriginal {
  objectPath: string;
  filename: string;
  mime: string;
  bytes: number;
}

export class OriginalAssetCache {
  private readonly entries = new Map<string, CachedOriginal>();

  get(src: string): CachedOriginal | undefined {
    return this.entries.get(src);
  }

  set(src: string, asset: CachedOriginal): void {
    this.entries.set(src, asset);
  }

  /** Forget everything, for example when the cart is cleared or storage reports a missing object. */
  clear(): void {
    this.entries.clear();
  }
}
