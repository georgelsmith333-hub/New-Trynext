# M6 — Admin health and seven-day error evidence

**Checked:** 2026-10-11 21:21 UTC (2026-10-12 03:21 +06:00). The seven-day Render operational-event window was 2026-10-04 21:20 UTC through 2026-10-11 21:20 UTC.

## Safe authenticated live-health snapshot

Only the secret-free `GET /api/admin/system/live` endpoint was read. The Activity Log API source was inspected, but no rows were fetched: even `?summary=1` returns admin username, entity ID/name, action, and timestamp, and does not provide request-error route/status/release fields. Those identifiers were not needed for this error report.

- Snapshot timestamp: `2026-10-11T21:21:05.540Z`; API process start: `2026-10-11T20:49:53.642Z` (uptime 1,871 seconds, about 31 minutes).
- Runtime: primary, Node.js `v24.14.1`; database `ok`; Redis `ok`; storage backend `r2`, configured flag `true` (configuration presence only, not proof of write authorization).
- Last 60 minutes: 7 requests, 2 4xx, 0 5xx. Last 5 minutes: 5 requests, 1 4xx, 0 5xx. Last minute: 0 requests.
- The snapshot had no failing 5xx route groups and no recent 5xx rows. Its route/error counters are process-local, retain at most 60 minutes, and reset on restart/sleep; they cannot prove a seven-day absence of errors. The two 4xx cannot be assigned to routes from this aggregate.

## Seven-day source limitations

- Render returned no `server_failed`, `server_restarted`, `service_suspended`, or `service_resumed` events for the queried seven-day window.
- Render log-type discovery for the service returned only `app` and `build`, not `request`; therefore request status/path rows were not available for route/status/time grouping.
- The latest release is `2e5e63eda6d06800e15b2291225eff615d948849` (deploy `dep-db5vau95efls73b3eq00`); it started cleanly at the end of its deployment window. This does not map historical requests to releases.

**Result:** M6 is **PARTIAL**. The current one-hour aggregate and seven-day operational-event check are recorded, but the requested seven-day route/status/release/time/customer-impact report is unavailable from the configured request-log source. No customer impact can be established; do **not** say “no errors seen” for the full seven days. No customer/order/payment data or Admin Activity Log rows were retrieved.
