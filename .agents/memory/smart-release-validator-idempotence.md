---
name: Smart release validator idempotence
description: The safety rule for rerunning structural validation after authenticated Smart Mockup visual approval.
---

Once a Smart Mockup release has authenticated visual approval, a later structural recheck must preserve that approval when the current source manifest and every master checksum still match the approved release. A new visual approval flag may establish approval; an ordinary recheck must not silently revoke it.

**Why:** The validator is commonly rerun as part of post-build and post-deploy verification. Rewriting `visualApproval` to false during that check can make a healthy promoted release appear unapproved and create an unsafe mismatch between the runtime package and its release record.

**How to apply:** Compare the existing approved release’s source manifest, surface count, surface identities, and master checksums before preserving approval. Any source or checksum drift must fail structural validation and require a new explicit visual review.