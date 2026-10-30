# Neon replication and quota findings

- Logical replication guide: https://neon.com/docs/guides/logical-replication-neon
  - Enable logical replication on the Neon project first.
  - Neon publisher computes with an active subscriber do not scale to zero.
  - A dedicated role with REPLICATION privilege is recommended.
  - Logical replication streams row changes; schema/DDL and sequences need separate handling.
  - Branch restore removes replication slots.
- Consumption limits: https://neon.com/docs/guides/consumption-limits
  - Project metrics include active_time_seconds, compute_time_seconds, written_data_bytes, and data_transfer_bytes.
  - Branch metric logical_size is separate.
  - Metrics refresh about every 15 minutes and may take up to one hour to report.
  - Neon quota settings are hard suspension limits, not 80%/90% warning alerts.
  - Monthly usage resets at the billing-period boundary.
- Branching: https://neon.com/docs/introduction/branching
  - Branches are isolated copy-on-write clones, not continuously synchronized replicas.
- Connection URI API: https://neon.com/docs/reference/api/projects/get-connection-uri
- Branch API: https://neon.com/docs/reference/api/branches/create-project-branch
- Endpoint API: https://neon.com/docs/reference/api/endpoints/create-project-endpoint

Current project verified through the owner-provided Neon API key: trynex-main-backup, project small-mouse-64402656, owner improvewithamit@gmail.com, free_v3 plan. Logical replication was enabled on 2026-10-30T21:08:10Z. The schema-only standby branch `trynext-transactional-standby` was then created with a read-write endpoint, and its subscription was verified with matching LSNs and aggregate counts of 69 products, 73 orders, and 40 customers.
