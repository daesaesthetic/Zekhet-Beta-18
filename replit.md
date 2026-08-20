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
- Optional bot env: `DEVELOPER_ID`, `ZEKHET_CREATOR`, `ZEKHET_DATABASE_PATH`

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

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
