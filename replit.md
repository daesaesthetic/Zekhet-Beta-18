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
- Optional bot env: `ZEKHET_CREATOR`, `ZEKHET_DATABASE_PATH`

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/zekhet-bot/src/commands.ts` — slash-command definitions and embed responses
- `artifacts/zekhet-bot/src/database.ts` — SQLite schema and profile persistence
- `artifacts/zekhet-bot/src/config.ts` — environment-backed configuration

## Architecture decisions

- The bot uses only the `Guilds` gateway intent; no Message Content Intent is needed.
- Discord user IDs are the stable profile identifier, with only `users` and `profiles` SQLite tables.
- Global slash commands are registered on startup so the same personal profile surface can work in user-installed contexts.

## Product

The MVP includes `/help`, `/credits`, and a persistent Record profile with bio, theme, accent color, avatar, creation date, profile number, and a placeholder title.

## User preferences

The requested scope is intentionally limited to the current MVP; future systems such as titles, lore, economy, leveling, and achievements are not included.

## Gotchas

- Discord credentials must be configured before starting the bot.
- The SQLite database directory is created automatically from `ZEKHET_DATABASE_PATH`.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
