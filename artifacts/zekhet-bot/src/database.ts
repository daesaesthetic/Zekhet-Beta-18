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
  createdAt: string;
  profileNumber: number;
  color: string;
  theme: string;
};

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
`);

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
}

export function getProfile(userId: string, username: string, avatarUrl: string | null): Profile {
  ensureProfile(userId, username, avatarUrl);
  const row = database.prepare(`
    SELECT u.discord_id AS userId, u.username, u.avatar_url AS avatarUrl,
      p.bio, p.title, p.created_at AS createdAt, p.profile_number AS profileNumber,
      p.color, p.theme
    FROM users u JOIN profiles p ON p.discord_id = u.discord_id
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