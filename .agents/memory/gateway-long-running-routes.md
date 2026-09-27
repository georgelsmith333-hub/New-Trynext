---
name: Gateway long-running routes
description: Expensive admin PSD preparation needs an explicit edge timeout without weakening ordinary API mutation budgets.
---

Route-specific edge budgets are safer than raising the shared API timeout. Keep
ordinary writes short and add a narrowly matched long-running budget only for
operations whose server-side work is known to exceed it, such as preparing the
private browser-validation PSD pair.

**Why:** A global timeout increase would make every authenticated mutation hold
the primary gateway open longer, while the Smart Mockup failure was isolated to
one expensive preparation route.

**How to apply:** When adding another expensive endpoint, measure the operation
first, add its exact path to the primary-timeout override list in both Pages
gateway copies, and cover the selection with a regression test.