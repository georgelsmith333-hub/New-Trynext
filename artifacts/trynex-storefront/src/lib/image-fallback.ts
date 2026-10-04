import { PRODUCT_IMAGE_PLACEHOLDER, isRetiredMockupUrl, modernizeLegacyMockupUrl } from "./legacy-mockup-url";

/**
 * What to show instead of an image that failed to load, or undefined when
 * there is nothing better to try. Steps: the full-size original when a
 * generated thumbnail is missing, the approved v10.3 photo for a retired
 * mockup URL, then the shared placeholder. A placeholder that fails is left alone.
 */
export function fallbackForFailedImage(src: string, attempt: number): string | undefined {
  if (!src || attempt >= 2) return undefined;
  if (/^(data|blob):/i.test(src)) return undefined;
  let path = src;
  try {
    const url = new URL(src, "https://placeholder.invalid");
    path = url.pathname;
  } catch {
    return undefined;
  }
  if (path === PRODUCT_IMAGE_PLACEHOLDER) return undefined;

  const thumbnail = path.match(/^\/assets\/products\/optimized\/([^/]+)\.webp$/i);
  if (thumbnail && attempt === 0) return `/assets/products/${thumbnail[1]}.png`;

  if (isRetiredMockupUrl(path)) {
    const approved = modernizeLegacyMockupUrl(path);
    if (approved && approved !== path && attempt === 0) return approved;
  }
  return PRODUCT_IMAGE_PLACEHOLDER;
}

/**
 * Catches every failed <img> on the page (error events do not bubble, so this
 * listens in the capture phase) and swaps in a fallback once or twice. Mark an
 * image data-no-fallback to opt out.
 */
export function installImageFallback(target: Document = document): void {
  target.addEventListener(
    "error",
    (event) => {
      const el = event.target;
      if (!(el instanceof HTMLImageElement) || el.hasAttribute("data-no-fallback")) return;
      const attempt = Number(el.dataset.fallbackAttempt ?? "0");
      const next = fallbackForFailedImage(el.currentSrc || el.src, attempt);
      if (!next) return;
      el.dataset.fallbackAttempt = String(attempt + 1);
      el.removeAttribute("srcset");
      el.src = next;
    },
    true,
  );
}
