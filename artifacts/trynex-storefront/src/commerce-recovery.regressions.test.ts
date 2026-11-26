import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const storefrontRoot = resolve(__dirname, "..");
const read = (relativePath: string) => readFileSync(resolve(storefrontRoot, relativePath), "utf8");

describe("commerce recovery regressions", () => {
  it("uses the current Design Studio draft key from both cart entry points", () => {
    for (const file of ["src/pages/Cart.tsx", "src/components/CartDrawer.tsx"]) {
      const source = read(file);
      expect(source).toContain('localStorage.setItem("trynext-design-draft-v2", sessionRaw)');
      expect(source).toContain("studioMeta.studioDraft ? JSON.stringify(studioMeta.studioDraft)");
      expect(source).not.toContain("trynext-design-draft-v1");
    }
  });

  it("stores a durable draft snapshot in new Design Studio cart lines", () => {
    const source = read("src/pages/studio/DesignStudioV2.tsx");
    expect(source).toContain("const studioDraft = { version: DRAFT_VERSION");
    expect(source).toContain("embeddedStudioDraft ? { studioDraft: embeddedStudioDraft }");
    // customNote is capped at 10,000 chars by the order API; image layers hold base64 data URLs.
    expect(source).toContain("JSON.stringify(studioDraft).length <= 3000");
  });

  it("does not clear the cart before wallet or bank payment evidence is submitted", () => {
    const source = read("src/pages/Checkout.tsx");
    expect(source).toContain("const requiresPaymentEvidence = paymentMethod === 'bkash'");
    expect(source).toContain("if (!requiresPaymentEvidence) clearCart();");
    expect(source).toContain("setPaymentSubmitError(null);");
  });

  it("keeps the acknowledged order flow out of the empty-cart redirect", () => {
    const source = read("src/pages/Checkout.tsx");
    expect(source).toContain("const postOrderFlowRef = useRef(false);");
    expect(source).toContain("postOrderFlowRef.current = true;");
    expect(source).toContain("!postOrderFlowRef.current && !createdOrder");
    expect(source).toContain("postOrderFlowRef.current = false;");
  });

  it("repeats receiver, bank, card, and balance details before order confirmation", () => {
    const source = read("src/pages/Checkout.tsx");
    expect(source).toContain("<strong>Send to:</strong>");
    expect(source).toContain("<strong>Bank:</strong>");
    expect(source).toContain("<strong>Due on delivery:</strong>");
    expect(source).toContain("<strong>Remaining on delivery:</strong>");
    expect(source).toContain("No card details are collected online.");
  });

  it("keeps clipboard failure inside the checkout UI error path", () => {
    const source = read("src/pages/Checkout.tsx");
    expect(source).toContain("Clipboard API unavailable");
    expect(source).toContain("Copy unavailable");
  });
});
