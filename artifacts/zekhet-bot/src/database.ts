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
  loreDiscovered: number;
  createdAt: string;
  profileNumber: number;
  color: string;
  theme: string;
  activeCurses: number;
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

export type LoreRarity = "Common" | "Uncommon" | "Rare" | "Legendary" | "Secret";

export type LoreEntry = {
  id: string;
  entryNumber: number;
  rarity: LoreRarity;
  bodyTemplate: string;
  isSecret: boolean;
};

export type DiscoveredLore = LoreEntry & {
  text: string;
  discoveredAt: string;
};

export type CurseRarity = "Common" | "Uncommon" | "Rare" | "Epic" | "Legendary" | "Mythic";

export type Curse = {
  id: string;
  name: string;
  description: string;
  rarity: CurseRarity;
  durationMinutes: number;
  cooldownSeconds: number;
};

export type ActiveCurse = Curse & {
  targetId: string;
  targetUsername: string;
  inflictedById: string;
  appliedAt: number;
  expiresAt: number;
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
  CREATE TABLE IF NOT EXISTS lore_entries (
    id TEXT PRIMARY KEY,
    entry_number INTEGER NOT NULL UNIQUE,
    rarity TEXT NOT NULL CHECK (rarity IN ('Common', 'Uncommon', 'Rare', 'Legendary', 'Secret')),
    body_template TEXT NOT NULL,
    is_secret INTEGER NOT NULL DEFAULT 0 CHECK (is_secret IN (0, 1))
  );
  CREATE TABLE IF NOT EXISTS user_lore (
    discord_id TEXT NOT NULL REFERENCES users(discord_id) ON DELETE CASCADE,
    lore_id TEXT NOT NULL REFERENCES lore_entries(id) ON DELETE CASCADE,
    rendered_text TEXT NOT NULL,
    discovered_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (discord_id, lore_id)
  );
  CREATE TABLE IF NOT EXISTS curses (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT NOT NULL,
    rarity TEXT NOT NULL CHECK (rarity IN ('Common', 'Uncommon', 'Rare', 'Epic', 'Legendary', 'Mythic')),
    duration_minutes INTEGER NOT NULL CHECK (duration_minutes > 0),
    cooldown_seconds INTEGER NOT NULL CHECK (cooldown_seconds > 0)
  );
  CREATE TABLE IF NOT EXISTS active_curses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    target_id TEXT NOT NULL REFERENCES users(discord_id) ON DELETE CASCADE,
    curse_id TEXT NOT NULL REFERENCES curses(id) ON DELETE CASCADE,
    inflicted_by_id TEXT NOT NULL,
    applied_at INTEGER NOT NULL,
    expires_at INTEGER NOT NULL
  );
  CREATE INDEX IF NOT EXISTS active_curses_target_expiry
    ON active_curses(target_id, expires_at);
  CREATE TABLE IF NOT EXISTS curse_cooldowns (
    discord_id TEXT PRIMARY KEY REFERENCES users(discord_id) ON DELETE CASCADE,
    used_at INTEGER NOT NULL
  );
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

const initialLore: LoreEntry[] = [
  { id: "unnamed-eclipse", entryNumber: 1842, rarity: "Common", bodyTemplate: "{{username}} was first recorded beneath an unnamed eclipse. The record contains no warning, only a careful pause.", isSecret: false },
  { id: "quiet-threshold", entryNumber: 1843, rarity: "Common", bodyTemplate: "The threshold recognized {{username}} before the Court did. It opened without sound.", isSecret: false },
  { id: "patient-ink", entryNumber: 1844, rarity: "Common", bodyTemplate: "A line of patient ink follows {{username}} through the archives. It has never needed correction.", isSecret: false },
  { id: "night-appointment", entryNumber: 1845, rarity: "Common", bodyTemplate: "{{username}} appears in the ledgers at an hour when most names have gone quiet.", isSecret: false },
  { id: "second-name", entryNumber: 1846, rarity: "Uncommon", bodyTemplate: "The Court has noted a second name for {{username}}: {{title}}. The first has been carefully withheld.", isSecret: false },
  { id: "violet-thread", entryNumber: 1847, rarity: "Uncommon", bodyTemplate: "A violet thread connects {{username}} to {{ownedTitles}} titles. It tightens with every new discovery.", isSecret: false },
  { id: "sealed-margin", entryNumber: 1848, rarity: "Rare", bodyTemplate: "Someone left {{username}} a mark in the sealed margin. The archive refuses to identify the hand.", isSecret: false },
  { id: "record-that-waits", entryNumber: 1849, rarity: "Rare", bodyTemplate: "The record of {{username}} does not end here. It waits for the next entry, and knows the difference.", isSecret: false },
  { id: "unlit-star", entryNumber: 1850, rarity: "Legendary", bodyTemplate: "{{username}} has crossed {{discoveries}} archive thresholds. An unlit star now appears beside their name.", isSecret: false },
  { id: "keeper-gaze", entryNumber: 1851, rarity: "Legendary", bodyTemplate: "The keeper's gaze rests on {{username}} for one breath longer than protocol allows. No explanation is attached.", isSecret: false },
  { id: "classified-echo", entryNumber: 1901, rarity: "Secret", bodyTemplate: "CLASSIFIED", isSecret: true },
  { id: "classified-origin", entryNumber: 1902, rarity: "Secret", bodyTemplate: "CLASSIFIED", isSecret: true },
];

const initialCurses: Curse[] = [
  { id: "silence", name: "Curse of Silence", description: "The keeper's replies fall into a velvet hush, leaving only the weight of an unanswered question.", rarity: "Common", durationMinutes: 5, cooldownSeconds: 30 },
  { id: "slowness", name: "Curse of Slowness", description: "Every record seems to arrive one moonbeat late, as though time itself has become reluctant.", rarity: "Common", durationMinutes: 8, cooldownSeconds: 45 },
  { id: "misfortune", name: "Curse of Misfortune", description: "Small inconveniences gather at the edge of the afflicted's record, each one too strange to be coincidence.", rarity: "Uncommon", durationMinutes: 10, cooldownSeconds: 60 },
  { id: "fool", name: "Curse of the Fool", description: "The afflicted has attracted the attention of forces better left undisturbed. Zekhet may answer with playful absurdity.", rarity: "Uncommon", durationMinutes: 10, cooldownSeconds: 60 },
  { id: "watcher", name: "Curse of the Watcher", description: "Something unseen has taken an interest in the afflicted and leaves a violet mark in the margins.", rarity: "Rare", durationMinutes: 15, cooldownSeconds: 90 },
  { id: "echoes", name: "Curse of Echoes", description: "Old words return wearing unfamiliar faces, and the archive remembers what should have faded.", rarity: "Rare", durationMinutes: 12, cooldownSeconds: 90 },
  { id: "forgetfulness", name: "Curse of Forgetfulness", description: "A soft fog passes over the record, obscuring one harmless detail at a time.", rarity: "Epic", durationMinutes: 20, cooldownSeconds: 120 },
  { id: "void", name: "Curse of the Void", description: "The space between entries opens briefly, revealing only a beautiful and harmless darkness.", rarity: "Epic", durationMinutes: 25, cooldownSeconds: 150 },
  { id: "bad-luck", name: "Curse of Bad Luck", description: "The dice of the unseen court roll poorly, though no worldly consequence follows.", rarity: "Uncommon", durationMinutes: 15, cooldownSeconds: 90 },
  { id: "wanderer", name: "Curse of the Wanderer", description: "The path refuses to stay straight, and every answer seems to take the scenic route through the archives.", rarity: "Legendary", durationMinutes: 30, cooldownSeconds: 180 },
];

for (const entry of initialLore) {
  database.prepare(`
    INSERT INTO lore_entries (id, entry_number, rarity, body_template, is_secret)
    VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET entry_number = excluded.entry_number, rarity = excluded.rarity,
      body_template = excluded.body_template, is_secret = excluded.is_secret
  `).run(entry.id, entry.entryNumber, entry.rarity, entry.bodyTemplate, entry.isSecret ? 1 : 0);
}

for (const curse of initialCurses) {
  database.prepare(`
    INSERT INTO curses (id, name, description, rarity, duration_minutes, cooldown_seconds)
    VALUES (?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET name = excluded.name, description = excluded.description,
      rarity = excluded.rarity, duration_minutes = excluded.duration_minutes,
      cooldown_seconds = excluded.cooldown_seconds
  `).run(curse.id, curse.name, curse.description, curse.rarity, curse.durationMinutes, curse.cooldownSeconds);
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
      (SELECT COUNT(*) FROM user_lore ul_count WHERE ul_count.discord_id = u.discord_id) AS loreDiscovered,
      (SELECT COUNT(*) FROM active_curses ac_count WHERE ac_count.target_id = u.discord_id AND ac_count.expires_at > unixepoch()) AS activeCurses,
      p.created_at AS createdAt, p.profile_number AS profileNumber,
      p.color, p.theme
    FROM users u JOIN profiles p ON p.discord_id = u.discord_id
    LEFT JOIN user_titles ut ON ut.discord_id = u.discord_id AND ut.equipped = 1
    LEFT JOIN titles t ON t.id = ut.title_id
    WHERE u.discord_id = ?
  `).get(userId) as Profile;
  return row;
}

function purgeExpiredCurses(): void {
  database.prepare("DELETE FROM active_curses WHERE expires_at <= ?").run(Math.floor(Date.now() / 1000));
}

function mapCurse(row: Record<string, unknown>): Curse {
  return {
    id: row["id"] as string,
    name: row["name"] as string,
    description: row["description"] as string,
    rarity: row["rarity"] as CurseRarity,
    durationMinutes: row["durationMinutes"] as number,
    cooldownSeconds: row["cooldownSeconds"] as number,
  };
}

export function getCurses(): Curse[] {
  return database.prepare(`
    SELECT id, name, description, rarity, duration_minutes AS durationMinutes,
      cooldown_seconds AS cooldownSeconds
    FROM curses ORDER BY id
  `).all().map((row) => mapCurse(row as Record<string, unknown>));
}

export function getCurse(curseId: string): Curse | undefined {
  const row = database.prepare(`
    SELECT id, name, description, rarity, duration_minutes AS durationMinutes,
      cooldown_seconds AS cooldownSeconds
    FROM curses WHERE id = ?
  `).get(curseId) as Record<string, unknown> | undefined;
  return row ? mapCurse(row) : undefined;
}

export function getActiveCurses(
  targetId: string,
  username = "the afflicted",
): ActiveCurse[] {
  purgeExpiredCurses();
  return database.prepare(`
    SELECT c.id, c.name, c.description, c.rarity,
      c.duration_minutes AS durationMinutes, c.cooldown_seconds AS cooldownSeconds,
      ac.target_id AS targetId, u.username AS targetUsername, ac.inflicted_by_id AS inflictedById,
      ac.applied_at AS appliedAt, ac.expires_at AS expiresAt
    FROM active_curses ac
    JOIN curses c ON c.id = ac.curse_id
    LEFT JOIN users u ON u.discord_id = ac.target_id
    WHERE ac.target_id = ?
    ORDER BY ac.expires_at
  `).all(targetId).map((row) => ({
    ...mapCurse(row as Record<string, unknown>),
    targetId: (row as { targetId: string }).targetId,
    targetUsername: (row as { targetUsername?: string }).targetUsername ?? username,
    inflictedById: (row as { inflictedById: string }).inflictedById,
    appliedAt: (row as { appliedAt: number }).appliedAt,
    expiresAt: (row as { expiresAt: number }).expiresAt,
  }));
}

export function inflictCurse(
  casterId: string,
  targetId: string,
  casterUsername = "the ritualist",
  targetUsername = "the afflicted",
  casterAvatarUrl: string | null = null,
  targetAvatarUrl: string | null = null,
): { ok: true; curse: ActiveCurse } | { ok: false; reason: "self" | "cooldown" | "already-afflicted"; retryAfter?: number } {
  if (casterId === targetId) return { ok: false, reason: "self" };
  ensureProfile(casterId, casterUsername, casterAvatarUrl);
  ensureProfile(targetId, targetUsername, targetAvatarUrl);
  purgeExpiredCurses();
  const now = Math.floor(Date.now() / 1000);
  const cooldown = database.prepare("SELECT used_at AS usedAt FROM curse_cooldowns WHERE discord_id = ?")
    .get(casterId) as { usedAt: number } | undefined;
  const availableCurses = getCurses();
  if (cooldown) {
    const elapsed = now - cooldown.usedAt;
    const minimumCooldown = Math.min(...availableCurses.map((curse) => curse.cooldownSeconds));
    if (elapsed < minimumCooldown) return { ok: false, reason: "cooldown", retryAfter: minimumCooldown - elapsed };
  }
  const active = getActiveCurses(targetId);
  const available = availableCurses.filter((curse) => !active.some((entry) => entry.id === curse.id));
  if (available.length === 0) return { ok: false, reason: "already-afflicted" };
  const curse = available[now % available.length];
  const appliedAt = now;
  const expiresAt = now + curse.durationMinutes * 60;
  database.prepare(`
    INSERT INTO active_curses (target_id, curse_id, inflicted_by_id, applied_at, expires_at)
    VALUES (?, ?, ?, ?, ?)
  `).run(targetId, curse.id, casterId, appliedAt, expiresAt);
  database.prepare(`
    INSERT INTO curse_cooldowns (discord_id, used_at) VALUES (?, ?)
    ON CONFLICT(discord_id) DO UPDATE SET used_at = excluded.used_at
  `).run(casterId, now);
  const inserted = getActiveCurses(targetId).find((entry) => entry.id === curse.id);
  if (!inserted) throw new Error("The inflicted curse could not be recorded.");
  return { ok: true, curse: inserted };
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

function stableIndex(value: string, length: number): number {
  let hash = 0;
  for (const character of value) hash = (hash * 31 + character.codePointAt(0)!) >>> 0;
  return hash % length;
}

function renderLore(template: string, userId: string, profile: Profile, entryId: string): string {
  const openings = [
    "The archives note:",
    "In a margin written after midnight:",
    "The keeper's hand records:",
  ];
  const closings = [
    "The remainder of the entry is quiet.",
    "Some portions of this record have been sealed.",
    "No further interpretation is attached.",
  ];
  const body = template
    .replaceAll("{{username}}", profile.username)
    .replaceAll("{{title}}", profile.title)
    .replaceAll("{{ownedTitles}}", String(profile.titlesOwned))
    .replaceAll("{{discoveries}}", String(profile.loreDiscovered + 1))
    .replaceAll("{{profileNumber}}", String(profile.profileNumber))
    .replaceAll("{{theme}}", profile.theme)
    .replaceAll("{{bio}}", profile.bio || "an unentered name");
  return `${openings[stableIndex(`${userId}:${entryId}:opening`, openings.length)]} ${body}\n\n${closings[stableIndex(`${userId}:${entryId}:closing`, closings.length)]}`;
}

function mapLore(row: Record<string, unknown>): LoreEntry {
  return {
    id: row["id"] as string,
    entryNumber: row["entryNumber"] as number,
    rarity: row["rarity"] as LoreRarity,
    bodyTemplate: row["bodyTemplate"] as string,
    isSecret: Boolean(row["isSecret"]),
  };
}

export function getLoreCatalog(): LoreEntry[] {
  return database.prepare(`
    SELECT id, entry_number AS entryNumber, rarity, body_template AS bodyTemplate, is_secret AS isSecret
    FROM lore_entries ORDER BY entry_number
  `).all().map((row) => mapLore(row as Record<string, unknown>));
}

export function getLoreEntry(loreId: string): LoreEntry | undefined {
  const row = database.prepare(`
    SELECT id, entry_number AS entryNumber, rarity, body_template AS bodyTemplate, is_secret AS isSecret
    FROM lore_entries WHERE id = ?
  `).get(loreId) as Record<string, unknown> | undefined;
  return row ? mapLore(row) : undefined;
}

export function getDiscoveredLore(userId: string, username: string, avatarUrl: string | null): DiscoveredLore[] {
  ensureProfile(userId, username, avatarUrl);
  return database.prepare(`
    SELECT l.id, l.entry_number AS entryNumber, l.rarity, l.body_template AS bodyTemplate,
      l.is_secret AS isSecret, ul.rendered_text AS text, ul.discovered_at AS discoveredAt
    FROM user_lore ul JOIN lore_entries l ON l.id = ul.lore_id
    WHERE ul.discord_id = ?
    ORDER BY l.entry_number
  `).all(userId).map((row) => {
    const typed = row as Record<string, unknown>;
    return { ...mapLore(typed), text: typed["text"] as string, discoveredAt: typed["discoveredAt"] as string };
  });
}

export function discoverLore(
  userId: string,
  username: string,
  avatarUrl: string | null,
  cooldownSeconds: number,
): { ok: true; lore: DiscoveredLore } | { ok: false; reason: "cooldown" | "complete"; retryAfter?: number } {
  const profile = getProfile(userId, username, avatarUrl);
  const latest = database.prepare(`
    SELECT strftime('%s', discovered_at) AS discoveredAt FROM user_lore
    WHERE discord_id = ? ORDER BY discovered_at DESC LIMIT 1
  `).get(userId) as { discoveredAt: string } | undefined;
  const nowSeconds = Math.floor(Date.now() / 1000);
  if (latest) {
    const elapsed = nowSeconds - Number(latest.discoveredAt);
    if (elapsed < cooldownSeconds) return { ok: false, reason: "cooldown", retryAfter: cooldownSeconds - elapsed };
  }

  const entry = database.prepare(`
    SELECT l.id, l.entry_number AS entryNumber, l.rarity, l.body_template AS bodyTemplate, l.is_secret AS isSecret
    FROM lore_entries l LEFT JOIN user_lore ul ON ul.lore_id = l.id AND ul.discord_id = ?
    WHERE l.is_secret = 0 AND ul.lore_id IS NULL
    ORDER BY l.entry_number
    LIMIT 1
  `).get(userId) as Record<string, unknown> | undefined;
  if (!entry) return { ok: false, reason: "complete" };

  const loreEntry = mapLore(entry);
  const text = renderLore(loreEntry.bodyTemplate, userId, profile, loreEntry.id);
  const discoveredAt = new Date().toISOString();
  database.prepare(`
    INSERT INTO user_lore (discord_id, lore_id, rendered_text, discovered_at)
    VALUES (?, ?, ?, ?)
  `).run(userId, loreEntry.id, text, discoveredAt);
  return { ok: true, lore: { ...loreEntry, text, discoveredAt } };
}