---
name: Zekhet runtime
description: Runtime requirement for the Discord bot's built-in SQLite persistence.
---

The Zekhet bot should run on Node 24 or newer because it imports the built-in `node:sqlite` module.

**Why:** The workspace's older Node runtime cannot load `node:sqlite`, even though TypeScript typechecking can still pass.

**How to apply:** Keep the bot workflow and Replit runtime on Node 24+ when starting, testing, or deploying the bot.