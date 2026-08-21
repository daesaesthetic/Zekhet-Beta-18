---
name: Activity cooldown persistence
description: Beta activity cooldowns preserve legacy Venture data while supporting independent short-cycle activities.
---

The bot keeps the established Venture cooldown table for backward compatibility and stores newer independent activities in a composite-key activity cooldown table.

**Why:** Existing Venture cooldown rows must remain valid across incremental gameplay updates, while Scavenge and Inspect need separate persistent timers.

**How to apply:** Add future short-cycle activities through the shared activity cooldown helper and composite activity key; do not repurpose or overwrite Venture cooldown rows.