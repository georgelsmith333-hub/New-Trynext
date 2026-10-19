/**
 * Resolve product image URLs for React Native Image components.
 * API catalog records may contain root-relative paths (for example,
 * `/assets/products/item.webp`); native images require an absolute URI.
 */
const SUPPORTED_IMAGE_PROTOCOLS = new Set([
  "http:",
  "https:",
  "file:",
  "content:",
  "data:",
  "asset:",
]);

export function resolveImageUrl(
  imageUrl: string | null | undefined,
  baseUrl: string,
): string | null {
  const value = imageUrl?.trim();
  if (!value) return null;

  try {
    const base = new URL(baseUrl);
    if (base.protocol !== "http:" && base.protocol !== "https:") return null;

    const resolved = new URL(value, `${base.origin}/`);
    return SUPPORTED_IMAGE_PROTOCOLS.has(resolved.protocol)
      ? resolved.toString()
      : null;
  } catch {
    return null;
  }
}
