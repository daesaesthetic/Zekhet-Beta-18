import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { config } from "./config.js";

export type Profile = {
  userId: string;
  username: string;
  avatarUrl: string | null;
  bio: string;
  title: string;
  titlesOwned: number;
  createdAt: string;
  profileNumber: number;
  color: string;
  theme: string;
};

export type TitleRarity = "Common" | "Uncommon" | "Rare" | "Epic" | "Legendary" | "Mythic" | "Secret";

export type Title = {
  id: string;
  name: string;
  description: string;
  rarity: TitleRarity;
  isSecret: boolean;
};

export type OwnedTitle = Title & { equipped: boolean };

mkdirSync(dirname(config.databasePath), { recursive: true });
const database = new DatabaseSync(config.databasePath);

database.exec(`
  PRAGMA journal_mode = WAL;
  CREATE TABLE IF NOT EXISTS users (
    discord_id TEXT PRIMARY KEY,
    username TEXT NOT NULL,
    avatar_url TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS profiles (
    discord_id TEXT PRIMARY KEY REFERENCES users(discord_id) ON DELETE CASCADE,
    bio TEXT NOT NULL DEFAULT '',
    title TEXT NOT NULL DEFAULT 'Unmarked Attendant',
    color TEXT NOT NULL DEFAULT '#b78cff',
    theme TEXT NOT NULL DEFAULT 'Nightshade',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    profile_number INTEGER NOT NULL UNIQUE
  );
  CREATE TABLE IF NOT EXISTS titles (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT NOT NULL,
    rarity TEXT NOT NULL CHECK (rarity IN ('Common', 'Uncommon', 'Rare', 'Epic', 'Legendary', 'Mythic', 'Secret')),
    is_secret INTEGER NOT NULL DEFAULT 0 CHECK (is_secret IN (0, 1))
  );
  CREATE TABLE IF NOT EXISTS user_titles (
    discord_id TEXT NOT NULL REFERENCES users(discord_id) ON DELETE CASCADE,
    title_id TEXT NOT NULL REFERENCES titles(id) ON DELETE CASCADE,
    equipped INTEGER NOT NULL DEFAULT 0 CHECK (equipped IN (0, 1)),
    PRIMARY KEY (discord_id, title_id)
  );
  CREATE UNIQUE INDEX IF NOT EXISTS one_equipped_title_per_user
    ON user_titles(discord_id) WHERE equipped = 1;
`);

const initialTitles: Title[] = [
  { id: "wanderer", name: "Wanderer", description: "One who has begun the road between worlds.", rarity: "Common", isSecret: false },
  { id: "newcomer", name: "Newcomer", description: "A newly entered name in the keeper's record.", rarity: "Common", isSecret: false },
  { id: "archivist", name: "Archivist", description: "A patient hand trusted with quiet knowledge.", rarity: "Uncommon", isSecret: false },
  { id: "nightwalker", name: "Nightwalker", description: "At home where the last light gives way.", rarity: "Uncommon", isSecret: false },
  { id: "outcast", name: "Outcast", description: "Cast beyond the borders, yet still standing.", rarity: "Rare", isSecret: false },
  { id: "void-walker", name: "Void Walker", description: "A traveler who has crossed the soundless dark.", rarity: "Epic", isSecret: false },
  { id: "celestial", name: "Celestial", description: "Marked by a light that does not belong to this sky.", rarity: "Epic", isSecret: false },
  { id: "the-forgotten", name: "The Forgotten", description: "A name the ages failed to erase.", rarity: "Legendary", isSecret: false },
  { id: "sovereign", name: "Sovereign", description: "One whose presence bends the court to silence.", rarity: "Legendary", isSecret: false },
  { id: "eternal", name: "Eternal", description: "Unmoved by the ordinary passage of time.", rarity: "Mythic", isSecret: false },
  { id: "the-first", name: "The First", description: "The beginning of a record no one remembers opening.", rarity: "Mythic", isSecret: false },
  { id: "starless", name: "Starless", description: "A presence that shines without borrowing from the heavens.", rarity: "Secret", isSecret: true },
  { id: "keeper-of-records", name: "Keeper of Records", description: "The court's most trusted custodian.", rarity: "Secret", isSecret: true },
  { id: "oathbound", name: "Oathbound", description: "Bound to a promise that has not yet been spoken.", rarity: "Secret", isSecret: true },
  { id: "ascendant", name: "Ascendant", description: "A sealed name, waiting above the known order.", rarity: "Secret", isSecret: true },
];

for (const title of initialTitles) {
  database.prepare(`
    INSERT INTO titles (id, name, description, rarity, is_secret)
    VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET name = excluded.name, description = excluded.description,
      rarity = excluded.rarity, is_secret = excluded.is_secret
  `).run(title.id, title.name, title.description, title.rarity, title.isSecret ? 1 : 0);
}

function ensureProfile(userId: string, username: string, avatarUrl: string | null): void {
  database.prepare(`
    INSERT INTO users (discord_id, username, avatar_url)
    VALUES (?, ?, ?)
    ON CONFLICT(discord_id) DO UPDATE SET username = excluded.username, avatar_url = excluded.avatar_url
  `).run(userId, username, avatarUrl);

  database.prepare(`
    INSERT INTO profiles (discord_id, profile_number)
    SELECT ?, COALESCE((SELECT MAX(profile_number) FROM profiles), 0) + 1
    WHERE NOT EXISTS (SELECT 1 FROM profiles WHERE discord_id = ?)
  `).run(userId, userId);

  const starterTitles = ["wanderer", "newcomer", "archivist"];
  for (const titleId of starterTitles) {
    database.prepare(`
      INSERT OR IGNORE INTO user_titles (discord_id, title_id) VALUES (?, ?)
    `).run(userId, titleId);
  }
}

export function getProfile(userId: string, username: string, avatarUrl: string | null): Profile {
  ensureProfile(userId, username, avatarUrl);
  const row = database.prepare(`
    SELECT u.discord_id AS userId, u.username, u.avatar_url AS avatarUrl,
      p.bio, COALESCE(t.name, 'Unmarked Attendant') AS title,
      (SELECT COUNT(*) FROM user_titles ut_count WHERE ut_count.discord_id = u.discord_id) AS titlesOwned,
      p.created_at AS createdAt, p.profile_number AS profileNumber,
      p.color, p.theme
    FROM users u JOIN profiles p ON p.discord_id = u.discord_id
    LEFT JOIN user_titles ut ON ut.discord_id = u.discord_id AND ut.equipped = 1
    LEFT JOIN titles t ON t.id = ut.title_id
    WHERE u.discord_id = ?
  `).get(userId) as Profile;
  return row;
}

export function updateProfile(
  userId: string,
  username: string,
  avatarUrl: string | null,
  updates: Partial<Pick<Profile, "bio" | "color" | "theme">>,
): Profile {
  const current = getProfile(userId, username, avatarUrl);
  const next = {
    bio: updates.bio ?? current.bio,
    color: updates.color ?? current.color,
    theme: updates.theme ?? current.theme,
  };
  database.prepare(`
    UPDATE profiles SET bio = ?, color = ?, theme = ? WHERE discord_id = ?
  `).run(next.bio, next.color, next.theme, userId);
  return getProfile(userId, username, avatarUrl);
}

export function getOwnedTitles(userId: string, username: string, avatarUrl: string | null): OwnedTitle[] {
  ensureProfile(userId, username, avatarUrl);
  return database.prepare(`
    SELECT t.id, t.name, t.description, t.rarity, t.is_secret AS isSecret, ut.equipped
    FROM user_titles ut JOIN titles t ON t.id = ut.title_id
    WHERE ut.discord_id = ?
    ORDER BY t.rarity, t.name
  `).all(userId).map((row) => ({
    ...(row as Omit<OwnedTitle, "isSecret" | "equipped">),
    isSecret: Boolean((row as { isSecret: number }).isSecret),
    equipped: Boolean((row as { equipped: number }).equipped),
  }));
}

export function getTitles(): Title[] {
  return database.prepare(`
    SELECT id, name, description, rarity, is_secret AS isSecret FROM titles ORDER BY id
  `).all().map((row) => ({
    ...(row as Omit<Title, "isSecret">),
    isSecret: Boolean((row as { isSecret: number }).isSecret),
  }));
}

export function getTitle(titleId: string): Title | undefined {
  const row = database.prepare(`
    SELECT id, name, description, rarity, is_secret AS isSecret FROM titles WHERE id = ?
  `).get(titleId) as (Omit<Title, "isSecret"> & { isSecret: number }) | undefined;
  return row ? { ...row, isSecret: Boolean(row.isSecret) } : undefined;
}

export function equipTitle(
  userId: string,
  username: string,
  avatarUrl: string | null,
  titleId: string,
): { ok: true; title: Title } | { ok: false; reason: "missing" | "not-owned" } {
  ensureProfile(userId, username, avatarUrl);
  const title = getTitle(titleId);
  if (!title) return { ok: false, reason: "missing" };

  const owned = database.prepare(`
    SELECT 1 FROM user_titles WHERE discord_id = ? AND title_id = ?
  `).get(userId, titleId);
  if (!owned) return { ok: false, reason: "not-owned" };

  database.exec("BEGIN");
  try {
    database.prepare("UPDATE user_titles SET equipped = 0 WHERE discord_id = ?").run(userId);
    database.prepare("UPDATE user_titles SET equipped = 1 WHERE discord_id = ? AND title_id = ?").run(userId, titleId);
    database.exec("COMMIT");
  } catch (error) {
    database.exec("ROLLBACK");
    throw error;
  }
  return { ok: true, title };
}