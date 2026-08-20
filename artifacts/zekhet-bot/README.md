# Zekhet

Zekhet is a lightweight Discord.js attendant and keeper of records.

## Run

Set these environment variables in the workspace secrets/environment settings:

- `DISCORD_TOKEN` — the bot token
- `DISCORD_CLIENT_ID` — the Discord application ID
- `ZEKHET_CREATOR` — optional creator/developer text shown by `/credits`
- `ZEKHET_DATABASE_PATH` — optional SQLite path, defaulting to `./data/zekhet.sqlite`

Then start the bot:

```sh
pnpm --filter @workspace/zekhet-bot run dev
```

The bot registers global slash commands on startup. It uses only the `Guilds` intent and does not require Message Content.

## MVP commands

- `/help`
- `/credits`
- `/profile view`
- `/profile view user:@user`
- `/profile edit bio:... color:#... theme:...`
- `/profile bio text:...`
- `/profile color hex:#...`
- `/profile theme name:...`
- `/titles`
- `/title`
- `/title equip title:<id>`
- `/title inspect title:<id>`
- `/lore`
- `/lore discover`
- `/lore archive`
- `/lore inspect entry:<id>`
- `/curse user user:@user`
- `/curse active`
- `/curse list`
- `/curse inspect curse:<id>`
- `/contract create user:@user description:<text> template:<template> expiration_days:<days>`
- `/contract accept id:<id>`
- `/contract reject id:<id>`
- `/contract inspect id:<id>`
- `/contract complete id:<id>`
- `/contract cancel id:<id>`
- `/contracts`

Profiles, title ownership, lore discoveries, active curses, and Ledger contracts are stored in SQLite and remain available after restarts. New users receive `wanderer`, `newcomer`, and `archivist` for immediate testing; sealed titles remain locked. Lore discovery has a 60-second cooldown by default, configurable with `ZEKHET_LORE_COOLDOWN_SECONDS`. Curse rituals have a built-in anti-spam cooldown and expire automatically without affecting Discord permissions, roles, messages, or moderation. Contracts are fictional social agreements only; they never process payments or modify Discord permissions.