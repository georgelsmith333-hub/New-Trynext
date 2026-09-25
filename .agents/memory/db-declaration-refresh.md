---
name: Shared declaration refresh
description: Why API typechecks can see stale database declarations after schema exports change
---

When a server imports a newly added export from a composite workspace library, run
the library declaration build before judging the server typecheck. The source
schema can be correct while the generated declaration tree still exposes the old
API.

**Why:** The API typecheck can fail on missing database exports even though the
schema source and runtime build are valid; the stale declaration is an ordering
problem, not necessarily an application-code defect.

**How to apply:** Run `pnpm run typecheck:libs` first, then rerun the affected
server typecheck and the root `pnpm run typecheck`.