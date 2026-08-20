---
name: Passport stamp catalog
description: Durable constraints for extending Zekhet's Passport stamp data.
---

Passport stamp names must remain globally unique because the SQLite catalog enforces a unique name constraint, even when IDs are different.

**Why:** A catalog seed with a reused display name fails the entire bot startup migration.

**How to apply:** Check existing stamp names before adding new records and prefer an intentionally distinct Zekhet-themed name when concepts overlap.

The default SQLite path is relative to the Zekhet bot artifact's working directory, not the workspace root.

**Why:** One-off database checks from the workspace root can target the wrong path or fail to open the database while the workflow is healthy.

**How to apply:** Resolve the default database under `artifacts/zekhet-bot/data/` unless `ZEKHET_DATABASE_PATH` is explicitly configured.