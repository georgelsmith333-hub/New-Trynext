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
    expect(source).toContain("sessionId, studioDraft, mockupRelease");
  });

  it("does not clear the cart before wallet or bank payment evidence is submitted", () => {
    const source = read("src/pages/Checkout.tsx");
    expect(source).toContain("const requiresPaymentEvidence = paymentMethod === 'bkash'");
    expect(source).toContain("if (!requiresPaymentEvidence) clearCart();");
    expect(source).toContain("setPaymentSubmitError(null);");
  });

  it("keeps clipboard failure inside the checkout UI error path", () => {
    const source = read("src/pages/Checkout.tsx");
    expect(source).toContain("Clipboard API unavailable");
    expect(source).toContain("Copy unavailable");
  });
});
