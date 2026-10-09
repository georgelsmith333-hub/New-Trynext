import { and, eq, sql } from "drizzle-orm";
import { productsTable } from "@workspace/db";

/** One stock line that was put back when an order was cancelled. */
export interface RestockedLine {
  productId: number;
  variantId?: string;
  quantity: number;
}

export interface RestockResult {
  restored: RestockedLine[];
  /** Lines that could not be put back (product or variant no longer exists). */
  skipped: Array<{ productId: number; variantId?: string; quantity: number; reason: string }>;
}

// Only the parts of a drizzle transaction this needs, so tests can stand in for it.
type Tx = {
  select: (...a: any[]) => any;
  update: (...a: any[]) => any;
};

const qtyOf = (n: unknown): number => {
  const q = Math.floor(Number(n));
  return Number.isFinite(q) && q > 0 ? q : 0;
};

/**
 * Put back the stock an order reserved at checkout. This mirrors the way
 * checkout takes stock (plain stock column, one JSONB variant entry, or each
 * product inside a custom hamper) and is only ever called inside the same
 * transaction that moves the order to "cancelled", so it runs exactly once.
 * Studio lines never reserved catalogue stock and are skipped.
 */
export async function restoreOrderStock(tx: Tx, items: unknown): Promise<RestockResult> {
  const result: RestockResult = { restored: [], skipped: [] };
  const lines = Array.isArray(items) ? (items as any[]) : [];

  const addPlain = async (productId: number, quantity: number) => {
    const [row] = await tx.update(productsTable)
      .set({ stock: sql`${productsTable.stock} + ${quantity}` })
      .where(eq(productsTable.id, productId))
      .returning({ id: productsTable.id });
    if (row) result.restored.push({ productId, quantity });
    else result.skipped.push({ productId, quantity, reason: "product_missing" });
  };

  for (const item of lines) {
    if (!item || item.isStudio) continue;

    if (item.isHamper) {
      const parts = Array.isArray(item.constituentProducts) ? item.constituentProducts : [];
      for (const c of parts) {
        const quantity = qtyOf(c?.quantity);
        const productId = Number(c?.productId);
        if (quantity && Number.isInteger(productId) && productId > 0) await addPlain(productId, quantity);
      }
      continue;
    }

    const quantity = qtyOf(item.quantity);
    const productId = Number(item.productId);
    if (!quantity || !Number.isInteger(productId) || productId <= 0) continue;

    const variantId = typeof item.variantId === "string" && item.variantId ? item.variantId : null;
    if (!variantId) {
      await addPlain(productId, quantity);
      continue;
    }

    const [prod] = await tx.select({ variants: productsTable.variants }).from(productsTable).where(eq(productsTable.id, productId));
    const variants = Array.isArray(prod?.variants) ? (prod.variants as any[]) : [];
    const index = variants.findIndex((v) => v?.id === variantId);
    if (!prod || index < 0) {
      result.skipped.push({ productId, variantId, quantity, reason: prod ? "variant_missing" : "product_missing" });
      continue;
    }
    // The array position must be an int: an untyped parameter after `->` is read
    // as a text key, which finds nothing in a JSON array.
    const pos = sql`${index}::int`;
    const jsonPath = sql`ARRAY[${index}::text, 'stock']`;
    const currentStock = sql`COALESCE((${productsTable.variants}->${pos}->>'stock')::numeric, 0)`;
    const [row] = await tx.update(productsTable)
      .set({ variants: sql`jsonb_set(${productsTable.variants}, ${jsonPath}, to_jsonb(${currentStock} + ${quantity}))` })
      .where(and(eq(productsTable.id, productId), sql`${productsTable.variants}->${pos}->>'id' = ${variantId}`))
      .returning({ id: productsTable.id });
    if (row) result.restored.push({ productId, variantId, quantity });
    else result.skipped.push({ productId, variantId, quantity, reason: "variant_changed" });
  }
  return result;
}
