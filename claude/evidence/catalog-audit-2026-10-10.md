# Read-only catalog audit — from Manus's sanitized export (2026-10-10)

Source: `claude/evidence/products-export.csv` (70 rows: id, name, price, discount price, stock, image; category and active were not exposed by the public API and are blank). This audit read the file only. No live data, setting, schema or image was touched, and no live request was made by Claude.

## Result

| Check | Result |
| --- | --- |
| Rows / unique ids | 70 / 70 (ids 1–80, gaps are deleted rows) |
| Duplicate product names | none |
| Discount price not below price | none (3 products have no discount) |
| Zero or very low stock | none; lowest stock is 18 |
| Products below 100 stock | 14 (normal: sold or adjusted) |
| Image shared by two products | none |
| First-party images (`/assets/products/*.png`) present in the repo | **60 of 60** |
| Images pointing at a third-party host | **10 products** (below) |

## The one finding: 10 products use third-party image links
Ids 1–9 and 20 point at `images.unsplash.com` (9 products: ids 1–9) and `i.imgur.com` (id 20, the Bengali "custom T-shirt x2" product). These are the oldest catalog rows. The other 60 products use first-party files that exist in the repo.

Why it matters: a product image the shop does not host can change or disappear without notice, adds a third-party request on the product page (privacy and speed), and may be blocked on some networks (the earlier local browser sweep already saw such hosts blocked). It is not a customer-facing outage on this evidence; Manus's live check only loaded the homepage and Studio.

Suggested fix (needs the owner's approval, not done): upload first-party photos for those 10 products in Admin → Products and replace the image address, or point them at existing first-party product art. Changing them is a live data edit, so it needs a dry run (list of id → new image) and explicit approval first. Nothing here changes the water-bottle hold or the mockup state.

## Not covered
Category, active/inactive flag, variants, extra gallery images and per-variant stock are not in the export, so they are UNVERIFIED. The export came from a public session; it says nothing about hidden or draft products.
