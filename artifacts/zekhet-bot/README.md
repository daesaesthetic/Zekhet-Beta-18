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

Profiles and title ownership are stored in SQLite and remain available after restarts. New users receive `wanderer`, `newcomer`, and `archivist` for immediate testing; sealed titles remain locked.