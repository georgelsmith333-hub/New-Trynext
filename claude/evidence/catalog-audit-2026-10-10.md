# Read-only catalog and image audit — 2026-10-10

Source: `claude/evidence/products-export.csv` (Manus, public API, 70 rows). Read-only: no product, image, price, stock or setting was changed. This is a dry-run change list for the owner.

## Checks that passed
- 70 rows, unique ids, no duplicate names, no duplicate image files.
- All prices are positive. Every row with a discount price has it lower than the price.
- No row has zero or negative stock; none has stock under 10.
- All 60 first-party image files named in the export exist in the repository (`artifacts/trynex-storefront/public/assets/products/`).
- The storefront already maps those PNGs to small `optimized/*.webp` thumbnails (`resolveImageUrl`), so the 3–5 MB source PNGs are not what customers download on listing pages.

## Findings (dry run, owner decides)
| # | Finding | Rows | Risk | Proposed change (not applied) |
|---|---|---|---|---|
| 1 | Product images hosted on third-party sites (9 on images.unsplash.com, 1 on i.imgur.com) instead of first-party `/assets/products/` | ids 1–9, 20 | Images can change, be rate-limited or disappear; no thumbnail optimisation; slower and less private | Owner supplies or approves first-party images for these 10 products, or hides them; Claude then updates the rows through the admin, not by script |
| 2 | Generic seed-style names with no discount, which look like demo products (Classic White Tee, Graphic Print Tee, Premium Pullover Hoodie, Zip-Up Hoodie, Personalized Photo Mug, Magic Color-Changing Mug, Custom Snapback Cap, Classic Dad Hat, Couple T-Shirt Set) | ids 1–9 | Customers may see placeholder-looking items | Owner confirms whether ids 1–9 are real sellable products; if not, deactivate them in the admin |
| 3 | Product 20 name has a trailing space and is a Bengali bundle name using an imgur image | id 20 | Cosmetic | Trim the name in the admin when its image is replaced |
| 4 | The public API does not return `category` or `active` for each product, so the export has those columns blank | all | None for customers; limits future audits | Optional: add `categoryName` and `isActive` to a protected admin export, not the public API |

## Not checked (needs access Claude does not have)
Whether any listed product is hidden in the admin, the real stock accuracy, and image quality on the live site. Water-bottle products (10 rows) stay under the custom-order hold; this audit changes nothing about it.
