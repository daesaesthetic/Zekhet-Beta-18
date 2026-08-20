# ⛤ Zekhet ⛤

Zekhet is a lightweight Discord.js bot that keeps persistent personal profiles as polished Discord embeds.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm --filter @workspace/zekhet-bot run dev` — run the Discord bot
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required bot env: `DISCORD_TOKEN`, `DISCORD_CLIENT_ID`
- Optional bot env: `DEVELOPER_ID`, `ZEKHET_CREATOR`, `ZEKHET_DATABASE_PATH`, `ZEKHET_LORE_COOLDOWN_SECONDS`, `ZEKHET_VENTURE_COOLDOWN_SECONDS`

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/zekhet-bot/src/commands.ts` — slash-command definitions and embed responses
- `artifacts/zekhet-bot/src/database.ts` — SQLite schema, profile persistence, Deben ledger, item catalog, and inventory persistence
- `artifacts/zekhet-bot/src/config.ts` — environment-backed configuration

## Architecture decisions

- The bot uses only the `Guilds` gateway intent; no Message Content Intent is needed.
- Discord user IDs are the stable profile identifier, with only `users` and `profiles` SQLite tables.
- Global slash commands are registered on startup so the same personal profile surface can work in user-installed contexts.

## Product

The MVP includes `/help`, `/credits`, `/balance`, and a persistent Record profile with bio, theme, accent color, avatar, creation date, profile number, and a placeholder title.

Beta 10 adds a persistent Deben balance with transaction history and idempotency protection, plus 15 Egyptian-inspired artifacts in the existing item catalog.

## User preferences

The current scope includes titles, lore, achievements, tutorials, contracts, curses, the item/inventory foundation, and the Deben economy foundation. Shops, trading, marketplaces, XP, and levels remain intentionally unimplemented.

## Gotchas

- Discord credentials must be configured before starting the bot.
- `DEVELOPER_ID` restricts the `/developer` control panel to one Discord user; it is optional for normal bot operation.
- The SQLite database directory is created automatically from `ZEKHET_DATABASE_PATH`.
- Node.js 24 is required because the bot uses the built-in `node:sqlite` module.

## Beta 15 — The Passport

- `/passport` and `z!passport` show a persistent accomplishment Passport; an optional user argument inspects another public Passport.
- Passport numbers are assigned persistently and existing profile numbers are preserved during lazy migration.
- Passport records and status are derived from the existing titles, lore, achievements, contracts, curses, items, tutorial, XP, and rank systems.
- Passport stamps are stored separately and unlock idempotently through existing progression checks. Developer controls expose Passport inspection, stamp granting, unlock-all, and reset testing.

## Beta 15.1 — Passport Expansion

- The Passport catalog contains 52 categorized stamps across exploration, titles, lore, curses, contracts, achievements, tutorial, progression, inventory, currency, and secret records.
- Normal stamps show locked/unlocked state and progress where meaningful; secret stamps remain `🔒 UNKNOWN RECORD` until unlocked.
- `/passport stamp:<id>` inspects a stamp without exposing sealed requirements. Passport stamp pages are paginated to keep Discord embeds compact.
- Combination-based secret records are checked through the existing Passport progression path and remain idempotent for existing users.
- The developer panel includes a private “List All Stamps” view for reviewing hidden IDs and categories.

## Beta 16 — Phase 1: The First Venture

- `/venture` and the configured prefix equivalent (`z!venture` by default) provide a small repeatable encounter loop.
- Venture cooldowns and completed encounter statistics persist in SQLite; the default cooldown is 15 minutes.
- Venture rewards reuse the existing XP and Deben systems only.
- Developer controls can force Common, Rare, Epic, Legendary, or Mythic encounters and reset the Venture cooldown.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
