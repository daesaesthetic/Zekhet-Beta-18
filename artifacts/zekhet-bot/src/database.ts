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
  contractsCreated: number;
  contractsCompleted: number;
  achievementsUnlocked: number;
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

export type CurseRarity = "Common" | "Uncommon" | "Rare" | "Epic" | "Legendary" | "Mythic" | "Secret";

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

export type ContractStatus = "Pending" | "Accepted" | "Rejected" | "Completed" | "Expired" | "Cancelled";
export type ContractTemplate =
  | "Duel" | "Challenge" | "Pizza" | "Favor" | "Trade" | "Promise" | "Bet"
  | "Dare" | "Alliance" | "Service" | "Oath" | "Journey" | "Gift" | "Riddle" | "Vow";

export type Contract = {
  id: string;
  creatorId: string;
  creatorUsername: string;
  recipientId: string;
  recipientUsername: string;
  description: string;
  template: ContractTemplate | null;
  createdAt: number;
  expiresAt: number | null;
  status: ContractStatus;
};

export type AchievementCategory = "Exploration" | "Archives" | "Prestige" | "Rituals" | "Contracts" | "Secret";
export type AchievementRarity = "Common" | "Uncommon" | "Rare" | "Epic" | "Legendary" | "Secret";
export type Achievement = {
  id: string;
  name: string;
  description: string;
  category: AchievementCategory;
  rarity: AchievementRarity;
  isHidden: boolean;
  rewardTitleId: string | null;
};
export type UnlockedAchievement = Achievement & { unlockedAt: string };

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
    rarity TEXT NOT NULL CHECK (rarity IN ('Common', 'Uncommon', 'Rare', 'Epic', 'Legendary', 'Mythic', 'Secret')),
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
  CREATE TABLE IF NOT EXISTS contracts (
    id TEXT PRIMARY KEY,
    creator_id TEXT NOT NULL REFERENCES users(discord_id) ON DELETE CASCADE,
    recipient_id TEXT NOT NULL REFERENCES users(discord_id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    template TEXT CHECK (template IN ('Duel', 'Challenge', 'Pizza', 'Favor', 'Trade', 'Promise', 'Bet', 'Dare', 'Alliance', 'Service', 'Oath', 'Journey', 'Gift', 'Riddle', 'Vow')),
    created_at INTEGER NOT NULL,
    expires_at INTEGER,
    status TEXT NOT NULL CHECK (status IN ('Pending', 'Accepted', 'Rejected', 'Completed', 'Expired', 'Cancelled'))
  );
  CREATE INDEX IF NOT EXISTS contracts_creator_status ON contracts(creator_id, status);
  CREATE INDEX IF NOT EXISTS contracts_recipient_status ON contracts(recipient_id, status);
  CREATE TABLE IF NOT EXISTS achievements (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('Exploration', 'Archives', 'Prestige', 'Rituals', 'Contracts', 'Secret')),
    rarity TEXT NOT NULL CHECK (rarity IN ('Common', 'Uncommon', 'Rare', 'Epic', 'Legendary', 'Secret')),
    is_hidden INTEGER NOT NULL DEFAULT 0 CHECK (is_hidden IN (0, 1)),
    reward_title_id TEXT REFERENCES titles(id) ON DELETE SET NULL
  );
  CREATE TABLE IF NOT EXISTS user_achievements (
    discord_id TEXT NOT NULL REFERENCES users(discord_id) ON DELETE CASCADE,
    achievement_id TEXT NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
    unlocked_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (discord_id, achievement_id)
  );
  CREATE TABLE IF NOT EXISTS user_activity (
    discord_id TEXT PRIMARY KEY REFERENCES users(discord_id) ON DELETE CASCADE,
    interaction_count INTEGER NOT NULL DEFAULT 0,
    last_interacted_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS curse_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    target_id TEXT NOT NULL REFERENCES users(discord_id) ON DELETE CASCADE,
    curse_id TEXT NOT NULL REFERENCES curses(id) ON DELETE CASCADE,
    applied_at INTEGER NOT NULL
  );
`);

const contractTable = database.prepare("SELECT sql FROM sqlite_master WHERE type = 'table' AND name = 'contracts'").get() as { sql?: string } | undefined;
if (contractTable?.sql && !contractTable.sql.includes("'Dare'")) {
  database.exec(`
    PRAGMA foreign_keys = OFF;
    BEGIN;
    ALTER TABLE contracts RENAME TO contracts_legacy;
    CREATE TABLE contracts (
      id TEXT PRIMARY KEY,
      creator_id TEXT NOT NULL REFERENCES users(discord_id) ON DELETE CASCADE,
      recipient_id TEXT NOT NULL REFERENCES users(discord_id) ON DELETE CASCADE,
      description TEXT NOT NULL,
      template TEXT CHECK (template IN ('Duel', 'Challenge', 'Pizza', 'Favor', 'Trade', 'Promise', 'Bet', 'Dare', 'Alliance', 'Service', 'Oath', 'Journey', 'Gift', 'Riddle', 'Vow')),
      created_at INTEGER NOT NULL,
      expires_at INTEGER,
      status TEXT NOT NULL CHECK (status IN ('Pending', 'Accepted', 'Rejected', 'Completed', 'Expired', 'Cancelled'))
    );
    INSERT INTO contracts SELECT * FROM contracts_legacy;
    DROP TABLE contracts_legacy;
    CREATE INDEX IF NOT EXISTS contracts_creator_status ON contracts(creator_id, status);
    CREATE INDEX IF NOT EXISTS contracts_recipient_status ON contracts(recipient_id, status);
    COMMIT;
    PRAGMA foreign_keys = ON;
  `);
}

const curseTable = database.prepare("SELECT sql FROM sqlite_master WHERE type = 'table' AND name = 'curses'").get() as { sql?: string } | undefined;
if (curseTable?.sql && !curseTable.sql.includes("'Secret'")) {
  database.exec(`
    PRAGMA foreign_keys = OFF;
    BEGIN;
    ALTER TABLE curses RENAME TO curses_legacy;
    CREATE TABLE curses (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      description TEXT NOT NULL,
      rarity TEXT NOT NULL CHECK (rarity IN ('Common', 'Uncommon', 'Rare', 'Epic', 'Legendary', 'Mythic', 'Secret')),
      duration_minutes INTEGER NOT NULL CHECK (duration_minutes > 0),
      cooldown_seconds INTEGER NOT NULL CHECK (cooldown_seconds > 0)
    );
    INSERT INTO curses SELECT * FROM curses_legacy;
    DROP TABLE curses_legacy;
    COMMIT;
    PRAGMA foreign_keys = ON;
  `);
}

const initialTitles: Title[] = [
  { id: "wanderer", name: "Wanderer", description: "One who has begun the road between worlds.", rarity: "Common", isSecret: false },
  { id: "newcomer", name: "Newcomer", description: "A newly entered name in the keeper's record.", rarity: "Common", isSecret: false },
  { id: "archivist", name: "Archivist", description: "A patient hand trusted with quiet knowledge.", rarity: "Uncommon", isSecret: false },
  { id: "courtier", name: "Courtier", description: "A familiar presence among the Court's many designations.", rarity: "Rare", isSecret: false },
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
  { id: "the-uninvited", name: "The Uninvited", description: "Present despite the absence of an invitation.", rarity: "Common", isSecret: false },
  { id: "oathkeeper", name: "Oathkeeper", description: "A promise survives wherever this name is written.", rarity: "Uncommon", isSecret: false },
  { id: "forgotten-heir", name: "Forgotten Heir", description: "An inheritance with no surviving house.", rarity: "Rare", isSecret: false },
  { id: "nights-witness", name: "Night's Witness", description: "Saw what the daylight was not permitted to know.", rarity: "Rare", isSecret: false },
  { id: "the-unrecorded", name: "The Unrecorded", description: "A presence absent from every official page.", rarity: "Epic", isSecret: false },
  { id: "ashen-wanderer", name: "Ashen Wanderer", description: "Carries the road's last ember from place to place.", rarity: "Epic", isSecret: false },
  { id: "quiet-one", name: "The Quiet One", description: "The Court makes room without being asked.", rarity: "Uncommon", isSecret: false },
  { id: "beyond-the-veil", name: "Beyond the Veil", description: "Returned with the mist still clinging to the name.", rarity: "Legendary", isSecret: false },
  { id: "last-visitor", name: "The Last Visitor", description: "Arrived after the doors had already closed.", rarity: "Legendary", isSecret: false },
  { id: "gravewalker", name: "Gravewalker", description: "Walks where old stories refuse to rest.", rarity: "Rare", isSecret: false },
  { id: "starbound", name: "Starbound", description: "Keeps an appointment with a distant sky.", rarity: "Epic", isSecret: false },
  { id: "false-prophet", name: "False Prophet", description: "Correct often enough to remain suspicious.", rarity: "Rare", isSecret: false },
  { id: "court-fool", name: "Court Fool", description: "The only witness allowed to laugh.", rarity: "Common", isSecret: false },
  { id: "the-nameless", name: "The Nameless", description: "A name was offered. None were accepted.", rarity: "Mythic", isSecret: false },
  { id: "moonlit", name: "Moonlit", description: "Softly marked by a borrowed silver glow.", rarity: "Common", isSecret: false },
  { id: "the-unfortunate", name: "The Unfortunate", description: "Luck recognizes this name and turns away.", rarity: "Uncommon", isSecret: false },
  { id: "eternal-witness", name: "Eternal Witness", description: "Still watching the first event unfold.", rarity: "Mythic", isSecret: false },
  { id: "wandering-crown", name: "Wandering Crown", description: "No head has held it for very long.", rarity: "Legendary", isSecret: false },
  { id: "zekhets-acquaintance", name: "Zekhet's Acquaintance", description: "Known by the keeper, though not necessarily well.", rarity: "Secret", isSecret: true },
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
  { id: "second-name-written", entryNumber: 1852, rarity: "Common", bodyTemplate: "Someone has written a second name beneath {{username}}. The ink is still deciding what it means.", isSecret: false },
  { id: "never-occurred", entryNumber: 1853, rarity: "Common", bodyTemplate: "The archive insists this event never occurred. It has nevertheless filed a witness statement from {{username}}.", isSecret: false },
  { id: "removed-lines", entryNumber: 1854, rarity: "Uncommon", bodyTemplate: "Three lines of this record have been deliberately removed. The remaining line mentions {{username}}.", isSecret: false },
  { id: "unwilling-keeper", entryNumber: 1855, rarity: "Uncommon", bodyTemplate: "Zekhet appears unwilling to discuss this entry. The silence has been entered on {{username}}'s behalf.", isSecret: false },
  { id: "named-artifact", entryNumber: 1856, rarity: "Rare", bodyTemplate: "An artifact bearing {{username}}'s name has been catalogued. Its purpose remains politely unclear.", isSecret: false },
  { id: "abrupt-record", entryNumber: 1857, rarity: "Rare", bodyTemplate: "The record ends abruptly. There is no explanation, though {{username}}'s title is underlined twice.", isSecret: false },
  { id: "borrowed-key", entryNumber: 1858, rarity: "Common", bodyTemplate: "{{username}} found a key in the archive. It opens a door that has not yet been built.", isSecret: false },
  { id: "patient-moth", entryNumber: 1859, rarity: "Common", bodyTemplate: "A patient moth has visited {{username}}'s record {{discoveries}} times and has never signed in.", isSecret: false },
  { id: "contract-in-margin", entryNumber: 1860, rarity: "Uncommon", bodyTemplate: "A contract-shaped shadow follows {{username}} through the margins. No parties have been named.", isSecret: false },
  { id: "curse-footnote", entryNumber: 1861, rarity: "Uncommon", bodyTemplate: "A footnote warns that {{username}} has been observed near a harmless curse. The footnote looks amused.", isSecret: false },
  { id: "door-under-ink", entryNumber: 1862, rarity: "Rare", bodyTemplate: "Beneath the ink of {{username}}'s record lies a door. It has no handle, but seems to be waiting.", isSecret: false },
  { id: "unclaimed-throne", entryNumber: 1863, rarity: "Rare", bodyTemplate: "The unclaimed throne has been dusted for {{username}}. The throne denies requesting this service.", isSecret: false },
  { id: "archive-laugh", entryNumber: 1864, rarity: "Common", bodyTemplate: "The archive laughed when {{username}} arrived. It refuses to explain the joke.", isSecret: false },
  { id: "red-thread", entryNumber: 1865, rarity: "Uncommon", bodyTemplate: "A red thread links {{username}}'s title to a page marked 'not yet'.", isSecret: false },
  { id: "sealed-bell", entryNumber: 1866, rarity: "Legendary", bodyTemplate: "A sealed bell rang once for {{username}}. The sound was heard in no room.", isSecret: false },
  { id: "unwritten-oath", entryNumber: 1867, rarity: "Legendary", bodyTemplate: "An unwritten oath has been attached to {{username}}'s record. Its witness is listed as 'the next dawn'.", isSecret: false },
  { id: "classified-visitor", entryNumber: 1903, rarity: "Secret", bodyTemplate: "CLASSIFIED", isSecret: true },
  { id: "classified-door", entryNumber: 1904, rarity: "Secret", bodyTemplate: "CLASSIFIED", isSecret: true },
  { id: "classified-third-name", entryNumber: 1905, rarity: "Secret", bodyTemplate: "CLASSIFIED", isSecret: true },
  { id: "classified-zekhlets-note", entryNumber: 1906, rarity: "Secret", bodyTemplate: "CLASSIFIED", isSecret: true },
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
  { id: "empty-quill", name: "Curse of the Empty Quill", description: "The quill insists it has written everything, then produces a perfectly blank flourish.", rarity: "Common", durationMinutes: 8, cooldownSeconds: 45 },
  { id: "echoing-words", name: "Curse of Echoing Words", description: "The last harmless phrase returns from somewhere just behind the record.", rarity: "Uncommon", durationMinutes: 12, cooldownSeconds: 60 },
  { id: "forgotten-name", name: "Curse of the Forgotten Name", description: "For a little while, the archive pretends the afflicted's name is on the tip of its tongue.", rarity: "Rare", durationMinutes: 15, cooldownSeconds: 90 },
  { id: "wandering-eye", name: "Curse of the Wandering Eye", description: "One violet eye in the margins keeps looking in the wrong direction.", rarity: "Uncommon", durationMinutes: 10, cooldownSeconds: 60 },
  { id: "second-thought", name: "Curse of the Second Thought", description: "Every answer arrives with a small, unnecessary reconsideration.", rarity: "Rare", durationMinutes: 15, cooldownSeconds: 90 },
  { id: "hollow-crown", name: "Curse of the Hollow Crown", description: "An invisible crown settles overhead and makes a quiet, regal wobble.", rarity: "Epic", durationMinutes: 20, cooldownSeconds: 120 },
  { id: "endless-scroll", name: "Curse of the Endless Scroll", description: "The record seems one line longer each time it is inspected.", rarity: "Epic", durationMinutes: 25, cooldownSeconds: 150 },
  { id: "watchful-star", name: "Curse of the Watchful Star", description: "A distant star has chosen the record as its favorite harmless mystery.", rarity: "Legendary", durationMinutes: 30, cooldownSeconds: 180 },
  { id: "zekhets-disapproval", name: "Curse of Zekhet's Disapproval", description: "The keeper has raised one unseen eyebrow. The effect is mostly atmospheric.", rarity: "Mythic", durationMinutes: 35, cooldownSeconds: 210 },
  { id: "unfortunate", name: "Curse of the Unfortunate", description: "The smallest possible inconvenience arrives with ceremonial timing.", rarity: "Secret", durationMinutes: 40, cooldownSeconds: 240 },
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

const initialAchievements: Achievement[] = [
  { id: "first-record", name: "FIRST RECORD", description: "Create your Zekhet profile.", category: "Exploration", rarity: "Common", isHidden: false, rewardTitleId: null },
  { id: "familiar-face", name: "FAMILIAR FACE", description: "Interact with Zekhet on multiple occasions.", category: "Exploration", rarity: "Common", isHidden: false, rewardTitleId: null },
  { id: "devoted", name: "THE DEVOTED", description: "Interact with Zekhet repeatedly over time.", category: "Exploration", rarity: "Uncommon", isHidden: false, rewardTitleId: null },
  { id: "courtier", name: "COURTIER", description: "Collect 10 titles.", category: "Prestige", rarity: "Rare", isHidden: false, rewardTitleId: "courtier" },
  { id: "collector", name: "THE COLLECTOR", description: "Collect 20 titles.", category: "Prestige", rarity: "Epic", isHidden: false, rewardTitleId: null },
  { id: "archivist", name: "ARCHIVIST", description: "Discover 25 lore entries.", category: "Archives", rarity: "Rare", isHidden: false, rewardTitleId: "archivist" },
  { id: "forbidden-page", name: "THE FORBIDDEN PAGE", description: "Discover an extremely rare archive entry.", category: "Archives", rarity: "Legendary", isHidden: false, rewardTitleId: null },
  { id: "marked", name: "MARKED", description: "Receive your first curse.", category: "Rituals", rarity: "Common", isHidden: false, rewardTitleId: null },
  { id: "cursed", name: "CURSED", description: "Receive several different curses.", category: "Rituals", rarity: "Rare", isHidden: false, rewardTitleId: null },
  { id: "oathbound", name: "OATHBOUND", description: "Complete your first contract.", category: "Contracts", rarity: "Uncommon", isHidden: false, rewardTitleId: "oathbound" },
  { id: "contractor", name: "CONTRACTOR", description: "Complete several contracts.", category: "Contracts", rarity: "Rare", isHidden: false, rewardTitleId: null },
  { id: "the-unknown", name: "THE UNKNOWN", description: "Discover a secret lore entry.", category: "Secret", rarity: "Secret", isHidden: true, rewardTitleId: null },
  { id: "the-unrecorded", name: "THE UNRECORDED", description: "Unlock a secret title.", category: "Secret", rarity: "Secret", isHidden: true, rewardTitleId: "the-unrecorded" },
  { id: "sealed-name", name: "THE SEALED NAME", description: "Own five secret titles.", category: "Secret", rarity: "Epic", isHidden: true, rewardTitleId: null },
  { id: "quiet-court", name: "THE QUIET COURT", description: "Equip a title after discovering 10 lore entries.", category: "Prestige", rarity: "Epic", isHidden: false, rewardTitleId: null },
  { id: "keeper-of-records", name: "KEEPER OF RECORDS", description: "Collect 30 titles and discover 25 lore entries.", category: "Prestige", rarity: "Legendary", isHidden: false, rewardTitleId: "keeper-of-records" },
  { id: "first-oath", name: "FIRST OATH", description: "Create and complete a contract.", category: "Contracts", rarity: "Uncommon", isHidden: false, rewardTitleId: null },
  { id: "many-marks", name: "MANY MARKS", description: "Receive five different curses.", category: "Rituals", rarity: "Epic", isHidden: false, rewardTitleId: null },
  { id: "patient-visitor", name: "PATIENT VISITOR", description: "Return to Zekhet on five different days.", category: "Exploration", rarity: "Rare", isHidden: false, rewardTitleId: null },
  { id: "archive-heart", name: "ARCHIVE HEART", description: "Discover 40 lore entries.", category: "Archives", rarity: "Legendary", isHidden: false, rewardTitleId: null },
  { id: "the-last-page", name: "THE LAST PAGE", description: "Discover every visible lore entry.", category: "Archives", rarity: "Legendary", isHidden: true, rewardTitleId: null },
  { id: "unbroken-ledger", name: "UNBROKEN LEDGER", description: "Complete five contracts without rejecting one.", category: "Contracts", rarity: "Epic", isHidden: false, rewardTitleId: null },
  { id: "night-visitor", name: "NIGHT VISITOR", description: "Interact with Zekhet after midnight.", category: "Secret", rarity: "Secret", isHidden: true, rewardTitleId: null },
  { id: "the-devoted-record", name: "THE DEVOTED RECORD", description: "Interact with Zekhet 25 times.", category: "Exploration", rarity: "Epic", isHidden: false, rewardTitleId: null },
  { id: "beyond-the-record", name: "BEYOND THE RECORD", description: "Unlock a secret title and discover a secret lore entry.", category: "Secret", rarity: "Legendary", isHidden: true, rewardTitleId: null },
];
for (const achievement of initialAchievements) {
  database.prepare(`
    INSERT INTO achievements (id, name, description, category, rarity, is_hidden, reward_title_id)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET name = excluded.name, description = excluded.description,
      category = excluded.category, rarity = excluded.rarity, is_hidden = excluded.is_hidden,
      reward_title_id = excluded.reward_title_id
  `).run(achievement.id, achievement.name, achievement.description, achievement.category,
    achievement.rarity, achievement.isHidden ? 1 : 0, achievement.rewardTitleId);
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
      (SELECT COUNT(*) FROM contracts c_created WHERE c_created.creator_id = u.discord_id) AS contractsCreated,
      (SELECT COUNT(*) FROM contracts c_completed
        WHERE c_completed.status = 'Completed'
          AND (c_completed.creator_id = u.discord_id OR c_completed.recipient_id = u.discord_id)) AS contractsCompleted,
      (SELECT COUNT(*) FROM user_achievements ua_count WHERE ua_count.discord_id = u.discord_id) AS achievementsUnlocked,
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
  database.prepare("INSERT INTO curse_history (target_id, curse_id, applied_at) VALUES (?, ?, ?)")
    .run(targetId, curse.id, appliedAt);
  database.prepare(`
    INSERT INTO curse_cooldowns (discord_id, used_at) VALUES (?, ?)
    ON CONFLICT(discord_id) DO UPDATE SET used_at = excluded.used_at
  `).run(casterId, now);
  const inserted = getActiveCurses(targetId).find((entry) => entry.id === curse.id);
  if (!inserted) throw new Error("The inflicted curse could not be recorded.");
  return { ok: true, curse: inserted };
}

function expireContracts(): void {
  database.prepare(`
    UPDATE contracts SET status = 'Expired'
    WHERE status IN ('Pending', 'Accepted') AND expires_at IS NOT NULL AND expires_at <= ?
  `).run(Math.floor(Date.now() / 1000));
}

function mapContract(row: Record<string, unknown>): Contract {
  return {
    id: row["id"] as string,
    creatorId: row["creatorId"] as string,
    creatorUsername: row["creatorUsername"] as string,
    recipientId: row["recipientId"] as string,
    recipientUsername: row["recipientUsername"] as string,
    description: row["description"] as string,
    template: (row["template"] as ContractTemplate | null) ?? null,
    createdAt: row["createdAt"] as number,
    expiresAt: (row["expiresAt"] as number | null) ?? null,
    status: row["status"] as ContractStatus,
  };
}

const contractSelect = `
  SELECT c.id, c.creator_id AS creatorId, creator.username AS creatorUsername,
    c.recipient_id AS recipientId, recipient.username AS recipientUsername,
    c.description, c.template, c.created_at AS createdAt,
    c.expires_at AS expiresAt, c.status
  FROM contracts c
  JOIN users creator ON creator.discord_id = c.creator_id
  JOIN users recipient ON recipient.discord_id = c.recipient_id
`;

export function getContract(contractId: string): Contract | undefined {
  expireContracts();
  const normalizedId = contractId.replace(/^#/, "").trim();
  const row = database.prepare(`${contractSelect} WHERE c.id = ?`).get(normalizedId) as Record<string, unknown> | undefined;
  return row ? mapContract(row) : undefined;
}

export function getContractsForUser(userId: string): Contract[] {
  expireContracts();
  return database.prepare(`
    ${contractSelect}
    WHERE c.creator_id = ? OR c.recipient_id = ?
    ORDER BY c.created_at DESC
  `).all(userId, userId).map((row) => mapContract(row as Record<string, unknown>));
}

export function createContract(
  creatorId: string,
  creatorUsername: string,
  creatorAvatarUrl: string | null,
  recipientId: string,
  recipientUsername: string,
  recipientAvatarUrl: string | null,
  description: string,
  template: ContractTemplate | null,
  expirationDays: number | null,
): { ok: true; contract: Contract } | { ok: false; reason: "self" } {
  if (creatorId === recipientId) return { ok: false, reason: "self" };
  ensureProfile(creatorId, creatorUsername, creatorAvatarUrl);
  ensureProfile(recipientId, recipientUsername, recipientAvatarUrl);
  const now = Math.floor(Date.now() / 1000);
  const expiresAt = expirationDays ? now + expirationDays * 24 * 60 * 60 : null;
  const nextNumber = (database.prepare("SELECT COALESCE(MAX(CAST(id AS INTEGER)), 420) + 1 AS nextId FROM contracts").get() as { nextId: number }).nextId;
  const id = String(nextNumber).padStart(5, "0");
  database.prepare(`
    INSERT INTO contracts (id, creator_id, recipient_id, description, template, created_at, expires_at, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'Pending')
  `).run(id, creatorId, recipientId, description.trim(), template, now, expiresAt);
  return { ok: true, contract: getContract(id)! };
}

type ContractAction = "accept" | "reject" | "complete" | "cancel";
type ContractActionResult =
  | { ok: true; contract: Contract }
  | { ok: false; reason: "missing" | "unauthorized" | "invalid-status" };

export function updateContractStatus(
  contractId: string,
  actorId: string,
  action: ContractAction,
): ContractActionResult {
  const contract = getContract(contractId);
  if (!contract) return { ok: false, reason: "missing" };
  const isCreator = actorId === contract.creatorId;
  const isRecipient = actorId === contract.recipientId;
  if (action === "accept" || action === "reject") {
    if (!isRecipient) return { ok: false, reason: "unauthorized" };
    if (contract.status !== "Pending") return { ok: false, reason: "invalid-status" };
  } else {
    if (!isCreator && !isRecipient) return { ok: false, reason: "unauthorized" };
    if (action === "complete" && contract.status !== "Accepted") return { ok: false, reason: "invalid-status" };
    if (action === "cancel" && !["Pending", "Accepted"].includes(contract.status)) {
      return { ok: false, reason: "invalid-status" };
    }
  }
  const nextStatus: Record<ContractAction, ContractStatus> = {
    accept: "Accepted",
    reject: "Rejected",
    complete: "Completed",
    cancel: "Cancelled",
  };
  database.prepare("UPDATE contracts SET status = ? WHERE id = ?").run(nextStatus[action], contract.id);
  return { ok: true, contract: getContract(contract.id)! };
}

function mapAchievement(row: Record<string, unknown>): Achievement {
  return {
    id: row["id"] as string,
    name: row["name"] as string,
    description: row["description"] as string,
    category: row["category"] as AchievementCategory,
    rarity: row["rarity"] as AchievementRarity,
    isHidden: Boolean(row["isHidden"]),
    rewardTitleId: (row["rewardTitleId"] as string | null) ?? null,
  };
}

export function getAchievements(): Achievement[] {
  return database.prepare(`
    SELECT id, name, description, category, rarity, is_hidden AS isHidden, reward_title_id AS rewardTitleId
    FROM achievements ORDER BY category, rarity, id
  `).all().map((row) => mapAchievement(row as Record<string, unknown>));
}

export function getAchievement(id: string): Achievement | undefined {
  const row = database.prepare(`
    SELECT id, name, description, category, rarity, is_hidden AS isHidden, reward_title_id AS rewardTitleId
    FROM achievements WHERE id = ?
  `).get(id) as Record<string, unknown> | undefined;
  return row ? mapAchievement(row) : undefined;
}

export function getUnlockedAchievements(userId: string, username: string, avatarUrl: string | null): UnlockedAchievement[] {
  ensureProfile(userId, username, avatarUrl);
  return database.prepare(`
    SELECT a.id, a.name, a.description, a.category, a.rarity, a.is_hidden AS isHidden,
      a.reward_title_id AS rewardTitleId, ua.unlocked_at AS unlockedAt
    FROM user_achievements ua JOIN achievements a ON a.id = ua.achievement_id
    WHERE ua.discord_id = ? ORDER BY ua.unlocked_at
  `).all(userId).map((row) => {
    const typed = row as Record<string, unknown>;
    return { ...mapAchievement(typed), unlockedAt: typed["unlockedAt"] as string };
  });
}

function achievementRequirements(userId: string): Set<string> {
  const titles = Number((database.prepare("SELECT COUNT(*) AS count FROM user_titles WHERE discord_id = ?").get(userId) as { count: number }).count);
  const lore = Number((database.prepare("SELECT COUNT(*) AS count FROM user_lore WHERE discord_id = ?").get(userId) as { count: number }).count);
  const visibleLore = Number((database.prepare(`
    SELECT COUNT(*) AS count FROM user_lore ul JOIN lore_entries le ON le.id = ul.lore_id
    WHERE ul.discord_id = ? AND le.is_secret = 0
  `).get(userId) as { count: number }).count);
  const secretLore = Number((database.prepare(`
    SELECT COUNT(*) AS count FROM user_lore ul JOIN lore_entries le ON le.id = ul.lore_id
    WHERE ul.discord_id = ? AND le.is_secret = 1
  `).get(userId) as { count: number }).count);
  const secretTitles = Number((database.prepare(`
    SELECT COUNT(*) AS count FROM user_titles ut JOIN titles t ON t.id = ut.title_id
    WHERE ut.discord_id = ? AND t.is_secret = 1
  `).get(userId) as { count: number }).count);
  const curses = Number((database.prepare("SELECT COUNT(DISTINCT curse_id) AS count FROM curse_history WHERE target_id = ?").get(userId) as { count: number }).count);
  const completedContracts = Number((database.prepare(`
    SELECT COUNT(*) AS count FROM contracts WHERE status = 'Completed' AND (creator_id = ? OR recipient_id = ?)
  `).get(userId, userId) as { count: number }).count);
  const activity = database.prepare("SELECT interaction_count AS count, last_interacted_at AS lastInteractedAt FROM user_activity WHERE discord_id = ?")
    .get(userId) as { count: number; lastInteractedAt: string } | undefined;
  const unlocked = new Set<string>();
  if (database.prepare("SELECT 1 FROM profiles WHERE discord_id = ?").get(userId)) unlocked.add("first-record");
  if ((activity?.count ?? 0) >= 3) unlocked.add("familiar-face");
  if ((activity?.count ?? 0) >= 10) unlocked.add("devoted");
  if ((activity?.count ?? 0) >= 25) unlocked.add("the-devoted-record");
  if (titles >= 10) unlocked.add("courtier");
  if (titles >= 20) unlocked.add("collector");
  if (titles >= 30 && lore >= 25) unlocked.add("keeper-of-records");
  if (lore >= 25) unlocked.add("archivist");
  if (lore >= 40) unlocked.add("archive-heart");
  if (visibleLore >= getLoreCatalog().filter((entry) => !entry.isSecret).length) unlocked.add("the-last-page");
  if (secretLore > 0) unlocked.add("the-unknown");
  if (secretTitles > 0) unlocked.add("the-unrecorded");
  if (secretTitles >= 5) unlocked.add("sealed-name");
  if (curses >= 1) unlocked.add("marked");
  if (curses >= 3) unlocked.add("cursed");
  if (curses >= 5) unlocked.add("many-marks");
  if (completedContracts >= 1) unlocked.add("oathbound");
  if (completedContracts >= 1) unlocked.add("first-oath");
  if (completedContracts >= 3) unlocked.add("contractor");
  if (completedContracts >= 5) unlocked.add("unbroken-ledger");
  if (lore >= 10 && titles > 0) unlocked.add("quiet-court");
  if (secretTitles > 0 && secretLore > 0) unlocked.add("beyond-the-record");
  if (activity?.lastInteractedAt && new Date(activity.lastInteractedAt).getHours() < 6) unlocked.add("night-visitor");
  return unlocked;
}

export function recordInteraction(userId: string, username: string, avatarUrl: string | null): UnlockedAchievement[] {
  ensureProfile(userId, username, avatarUrl);
  database.prepare(`
    INSERT INTO user_activity (discord_id, interaction_count, last_interacted_at)
    VALUES (?, 1, ?)
    ON CONFLICT(discord_id) DO UPDATE SET interaction_count = interaction_count + 1, last_interacted_at = excluded.last_interacted_at
  `).run(userId, new Date().toISOString());
  return unlockEligibleAchievements(userId);
}

export function unlockEligibleAchievements(userId: string): UnlockedAchievement[] {
  const eligible = achievementRequirements(userId);
  const unlocked: UnlockedAchievement[] = [];
  for (const achievement of getAchievements()) {
    if (!eligible.has(achievement.id)) continue;
    const existing = database.prepare("SELECT 1 FROM user_achievements WHERE discord_id = ? AND achievement_id = ?").get(userId, achievement.id);
    if (existing) continue;
    const unlockedAt = new Date().toISOString();
    database.prepare("INSERT INTO user_achievements (discord_id, achievement_id, unlocked_at) VALUES (?, ?, ?)")
      .run(userId, achievement.id, unlockedAt);
    if (achievement.rewardTitleId) {
      database.prepare("INSERT OR IGNORE INTO user_titles (discord_id, title_id) VALUES (?, ?)")
        .run(userId, achievement.rewardTitleId);
    }
    unlocked.push({ ...achievement, unlockedAt });
  }
  return unlocked;
}

export function developerUnlockAchievement(userId: string, achievementId: string, username: string, avatarUrl: string | null): UnlockedAchievement | undefined {
  ensureProfile(userId, username, avatarUrl);
  const achievement = getAchievement(achievementId);
  if (!achievement) return undefined;
  const existing = database.prepare("SELECT 1 FROM user_achievements WHERE discord_id = ? AND achievement_id = ?").get(userId, achievementId);
  if (existing) return getUnlockedAchievements(userId, username, avatarUrl).find((entry) => entry.id === achievementId);
  const unlockedAt = new Date().toISOString();
  database.prepare("INSERT INTO user_achievements (discord_id, achievement_id, unlocked_at) VALUES (?, ?, ?)").run(userId, achievementId, unlockedAt);
  if (achievement.rewardTitleId) database.prepare("INSERT OR IGNORE INTO user_titles (discord_id, title_id) VALUES (?, ?)").run(userId, achievement.rewardTitleId);
  return { ...achievement, unlockedAt };
}

export function resetAchievementProgress(userId: string): number {
  const result = database.prepare("DELETE FROM user_achievements WHERE discord_id = ?").run(userId);
  return Number(result.changes);
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

export function unlockAllTitles(userId: string, username: string, avatarUrl: string | null): number {
  ensureProfile(userId, username, avatarUrl);
  const result = database.prepare(`
    INSERT OR IGNORE INTO user_titles (discord_id, title_id)
    SELECT ?, id FROM titles
  `).run(userId);
  return Number(result.changes);
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

export function unlockAllLore(userId: string, username: string, avatarUrl: string | null): number {
  const profile = getProfile(userId, username, avatarUrl);
  const entries = getLoreCatalog();
  let unlocked = 0;
  for (const entry of entries) {
    const existing = database.prepare("SELECT 1 FROM user_lore WHERE discord_id = ? AND lore_id = ?")
      .get(userId, entry.id);
    if (existing) continue;
    const text = entry.isSecret
      ? `${entry.bodyTemplate} (Developer access: classified content revealed.)`
      : renderLore(entry.bodyTemplate, userId, profile, entry.id);
    database.prepare(`
      INSERT INTO user_lore (discord_id, lore_id, rendered_text, discovered_at)
      VALUES (?, ?, ?, ?)
    `).run(userId, entry.id, text, new Date().toISOString());
    unlocked += 1;
  }
  return unlocked;
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

export function developerApplyCurse(
  casterId: string,
  targetId: string,
  curseId: string,
  casterUsername: string,
  targetUsername: string,
  targetAvatarUrl: string | null,
): ActiveCurse | undefined {
  const curse = getCurse(curseId);
  if (!curse) return undefined;
  ensureProfile(casterId, casterUsername, null);
  ensureProfile(targetId, targetUsername, targetAvatarUrl);
  purgeExpiredCurses();
  database.prepare(`
    DELETE FROM active_curses WHERE target_id = ? AND curse_id = ?
  `).run(targetId, curseId);
  const now = Math.floor(Date.now() / 1000);
  database.prepare(`
    INSERT INTO active_curses (target_id, curse_id, inflicted_by_id, applied_at, expires_at)
    VALUES (?, ?, ?, ?, ?)
  `).run(targetId, curseId, casterId, now, now + curse.durationMinutes * 60);
  return getActiveCurses(targetId, targetUsername).find((active) => active.id === curseId);
}

export function clearActiveCurses(userId: string): number {
  const result = database.prepare("DELETE FROM active_curses WHERE target_id = ?").run(userId);
  database.prepare("DELETE FROM curse_cooldowns WHERE discord_id = ?").run(userId);
  return Number(result.changes);
}

export function resetUserData(userId: string): void {
  database.exec("BEGIN");
  try {
    database.prepare("DELETE FROM active_curses WHERE target_id = ? OR inflicted_by_id = ?").run(userId, userId);
    database.prepare("DELETE FROM curse_history WHERE target_id = ?").run(userId);
    database.prepare("DELETE FROM curse_cooldowns WHERE discord_id = ?").run(userId);
    database.prepare("DELETE FROM contracts WHERE creator_id = ? OR recipient_id = ?").run(userId, userId);
    database.prepare("DELETE FROM user_lore WHERE discord_id = ?").run(userId);
    database.prepare("DELETE FROM user_titles WHERE discord_id = ?").run(userId);
    database.prepare("DELETE FROM user_achievements WHERE discord_id = ?").run(userId);
    database.prepare("DELETE FROM user_activity WHERE discord_id = ?").run(userId);
    database.prepare("DELETE FROM profiles WHERE discord_id = ?").run(userId);
    database.prepare("DELETE FROM users WHERE discord_id = ?").run(userId);
    database.exec("COMMIT");
  } catch (error) {
    database.exec("ROLLBACK");
    throw error;
  }
}