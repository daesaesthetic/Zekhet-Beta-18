---
name: Reward claim initialization
description: Foreign-key ordering constraint for one-time reward claims in the SQLite bot.
---

One-time reward claims must initialize the user/profile row before inserting the claim record.

**Why:** `reward_claims.discord_id` references `users.discord_id`, so recording a claim for a first-time user before profile initialization fails with a foreign-key error.

**How to apply:** Any future reward entry point should ensure the user exists before calling the claim/idempotency guard.