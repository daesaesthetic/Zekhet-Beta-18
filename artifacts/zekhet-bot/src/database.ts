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
  xp: number;
  level: number;
  rank: string;
  passportNumber: number;
};

export type PassportStatus = "Unrecorded" | "Recognized" | "Acquainted" | "Citizen" | "Courtier" | "Archivist" | "Keeper" | "Exalted";
export type PassportStampRarity = "Common" | "Uncommon" | "Rare" | "Epic" | "Legendary" | "Mythic" | "Secret";
export type PassportStampCategory = "Exploration" | "Titles" | "Lore" | "Curses" | "Contracts" | "Achievements" | "Tutorial" | "Progression" | "Inventory" | "Currency" | "Secret";
export type PassportStamp = {
  id: string;
  name: string;
  description: string;
  rarity: PassportStampRarity;
  secret: boolean;
  category: PassportStampCategory;
  progressTarget?: number;
  progressLabel?: string;
};
export type UnlockedPassportStamp = PassportStamp & { unlockedAt: string };
export type PassportStampView = PassportStamp & {
  unlocked: boolean;
  unlockedAt?: string;
};
export type PassportRecords = {
  titles: number;
  totalTitles: number;
  lore: number;
  totalLore: number;
  achievements: number;
  totalAchievements: number;
  contracts: number;
  completedContracts: number;
  curses: number;
  totalCurses: number;
  items: number;
  totalItems: number;
  tutorialPages: number;
  totalTutorialPages: number;
  xp: number;
  level: number;
  rank: string;
};
export type Passport = {
  number: number;
  status: PassportStatus;
  records: PassportRecords;
  stamps: UnlockedPassportStamp[];
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
export type AchievementProgress = {
  current: number;
  target: number;
  label: string;
};

export type ItemCategory = "Consumable" | "Material" | "Collectible" | "Currency" | "Quest" | "Special" | "Cosmetic" | "Charm" | "Relic";
export type ItemRarity = "Common" | "Uncommon" | "Rare" | "Epic" | "Legendary" | "Mythic";
export type EffectType =
  | "LUCK_BOOST"
  | "DEBEN_BOOST"
  | "XP_BOOST"
  | "COOLDOWN_REDUCTION"
  | "RARE_ENCOUNTER_BOOST"
  | "ITEM_FIND_BOOST";
export type Item = {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: ItemCategory;
  rarity: ItemRarity;
  stackable: boolean;
  maxStack: number;
  tradable: boolean;
  usable: boolean;
  effects: Record<string, unknown> | null;
  metadata: Record<string, unknown> | null;
};
export type InventoryEntry = Item & { quantity: number; acquiredAt: string; updatedAt: string };
export type ActiveEffect = {
  id: number;
  effectId: string;
  type: EffectType;
  magnitude: number;
  startedAt: number;
  expiresAt: number;
  sourceItemId: string;
  stackable: boolean;
};
export type CurrencyTransactionKind = "credit" | "debit" | "set";
export type CurrencyResult =
  | { ok: true; balance: number; transactionId: string }
  | { ok: false; reason: "invalid-amount" | "insufficient-funds" | "duplicate-transaction" | "invalid-balance" };

export type Progression = {
  xp: number;
  level: number;
  rank: string;
  currentLevelXp: number;
  nextLevelXp: number;
};

export type ExperienceResult =
  | {
      ok: true;
      before: Progression;
      after: Progression;
      xpGranted: number;
      levelsGained: number;
      rankChanged: boolean;
    }
  | { ok: false; reason: "invalid-amount" | "invalid-xp" };

export type ProgressionEvent =
  | "PROFILE_CREATED"
  | "BIOGRAPHY_SET"
  | "TITLE_OBTAINED"
  | "TITLE_EQUIPPED"
  | "LORE_DISCOVERED"
  | "RARE_LORE_DISCOVERED"
  | "SECRET_LORE_DISCOVERED"
  | "CURSE_RECEIVED"
  | "CONTRACT_CREATED"
  | "CONTRACT_ACCEPTED"
  | "CONTRACT_COMPLETED"
  | "ACHIEVEMENT_UNLOCKED"
  | "TUTORIAL_PAGE_COMPLETED"
  | "TUTORIAL_COMPLETED"
  | "VENTURE_STARTED"
  | "VENTURE_COMPLETED"
  | "ENCOUNTER_FOUND"
  | "RARE_ENCOUNTER_FOUND";

export type VentureStats = {
  total: number;
  successful: number;
  neutral: number;
  highestRarity: string | null;
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
  CREATE TABLE IF NOT EXISTS guild_prefixes (
    guild_id TEXT PRIMARY KEY,
    prefix TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS tutorial_actions (
    discord_id TEXT NOT NULL REFERENCES users(discord_id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    action_count INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (discord_id, action)
  );
  CREATE TABLE IF NOT EXISTS tutorial_objectives (
    discord_id TEXT NOT NULL REFERENCES users(discord_id) ON DELETE CASCADE,
    page_number INTEGER NOT NULL,
    objective_id TEXT NOT NULL,
    completed_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (discord_id, page_number, objective_id)
  );
  CREATE TABLE IF NOT EXISTS tutorial_rewards (
    discord_id TEXT NOT NULL REFERENCES users(discord_id) ON DELETE CASCADE,
    page_number INTEGER NOT NULL,
    claimed_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (discord_id, page_number)
  );
  CREATE TABLE IF NOT EXISTS items (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT NOT NULL,
    icon TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('Consumable', 'Material', 'Collectible', 'Currency', 'Quest', 'Special', 'Cosmetic', 'Charm', 'Relic')),
    rarity TEXT NOT NULL CHECK (rarity IN ('Common', 'Uncommon', 'Rare', 'Epic', 'Legendary', 'Mythic')),
    stackable INTEGER NOT NULL DEFAULT 1 CHECK (stackable IN (0, 1)),
    max_stack INTEGER NOT NULL CHECK (max_stack > 0),
    tradable INTEGER NOT NULL DEFAULT 0 CHECK (tradable IN (0, 1)),
    usable INTEGER NOT NULL DEFAULT 0 CHECK (usable IN (0, 1)),
    effects_json TEXT,
    metadata_json TEXT
  );
  CREATE TABLE IF NOT EXISTS user_inventory (
    discord_id TEXT NOT NULL REFERENCES users(discord_id) ON DELETE CASCADE,
    item_id TEXT NOT NULL REFERENCES items(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    acquired_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (discord_id, item_id)
  );
  CREATE TABLE IF NOT EXISTS active_effects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    discord_id TEXT NOT NULL REFERENCES users(discord_id) ON DELETE CASCADE,
    effect_id TEXT NOT NULL,
    effect_type TEXT NOT NULL,
    magnitude REAL NOT NULL,
    started_at INTEGER NOT NULL,
    expires_at INTEGER NOT NULL,
    source_item_id TEXT NOT NULL REFERENCES items(id) ON DELETE CASCADE,
    stackable INTEGER NOT NULL DEFAULT 0 CHECK (stackable IN (0, 1))
  );
  CREATE INDEX IF NOT EXISTS active_effects_user_expiration
    ON active_effects(discord_id, expires_at);
  CREATE TABLE IF NOT EXISTS currency_balances (
    discord_id TEXT PRIMARY KEY REFERENCES users(discord_id) ON DELETE CASCADE,
    balance INTEGER NOT NULL DEFAULT 100 CHECK (balance >= 0),
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS currency_transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    discord_id TEXT NOT NULL REFERENCES users(discord_id) ON DELETE CASCADE,
    kind TEXT NOT NULL CHECK (kind IN ('credit', 'debit', 'set')),
    amount INTEGER NOT NULL CHECK (amount >= 0),
    balance_after INTEGER NOT NULL CHECK (balance_after >= 0),
    idempotency_key TEXT UNIQUE,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  CREATE INDEX IF NOT EXISTS currency_transactions_user_created
    ON currency_transactions(discord_id, created_at);
  CREATE TABLE IF NOT EXISTS user_progression (
    discord_id TEXT PRIMARY KEY REFERENCES users(discord_id) ON DELETE CASCADE,
    xp INTEGER NOT NULL DEFAULT 0 CHECK (xp >= 0),
    level INTEGER NOT NULL DEFAULT 1 CHECK (level >= 1),
    rank TEXT NOT NULL DEFAULT 'Initiate',
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS reward_claims (
    claim_key TEXT PRIMARY KEY,
    discord_id TEXT NOT NULL REFERENCES users(discord_id) ON DELETE CASCADE,
    source TEXT NOT NULL,
    claimed_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS venture_cooldowns (
    discord_id TEXT PRIMARY KEY REFERENCES users(discord_id) ON DELETE CASCADE,
    used_at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS venture_runs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    discord_id TEXT NOT NULL REFERENCES users(discord_id) ON DELETE CASCADE,
    encounter_id TEXT NOT NULL,
    rarity TEXT NOT NULL CHECK (rarity IN ('COMMON', 'UNCOMMON', 'RARE', 'EPIC', 'LEGENDARY', 'MYTHIC')),
    successful INTEGER NOT NULL CHECK (successful IN (0, 1)),
    completed_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  CREATE INDEX IF NOT EXISTS venture_runs_user_completed
    ON venture_runs(discord_id, completed_at);
  CREATE TABLE IF NOT EXISTS passport_numbers (
    discord_id TEXT PRIMARY KEY REFERENCES users(discord_id) ON DELETE CASCADE,
    passport_number INTEGER NOT NULL UNIQUE,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS passport_stamps (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT NOT NULL,
    rarity TEXT NOT NULL CHECK (rarity IN ('Common', 'Uncommon', 'Rare', 'Epic', 'Legendary', 'Mythic', 'Secret')),
    secret INTEGER NOT NULL DEFAULT 0 CHECK (secret IN (0, 1)),
    category TEXT NOT NULL DEFAULT 'Exploration',
    progress_target INTEGER,
    progress_label TEXT
  );
  CREATE TABLE IF NOT EXISTS user_passport_stamps (
    discord_id TEXT NOT NULL REFERENCES users(discord_id) ON DELETE CASCADE,
    stamp_id TEXT NOT NULL REFERENCES passport_stamps(id) ON DELETE CASCADE,
    unlocked_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (discord_id, stamp_id)
  );
  CREATE TABLE IF NOT EXISTS passport_status_overrides (
    discord_id TEXT PRIMARY KEY REFERENCES users(discord_id) ON DELETE CASCADE,
    status TEXT NOT NULL CHECK (status IN ('Unrecorded', 'Recognized', 'Acquainted', 'Citizen', 'Courtier', 'Archivist', 'Keeper', 'Exalted'))
  );
`);

const itemTable = database.prepare("SELECT sql FROM sqlite_master WHERE type = 'table' AND name = 'items'").get() as { sql?: string } | undefined;
if (itemTable?.sql && !itemTable.sql.includes("'Charm'")) {
  database.exec(`
    PRAGMA foreign_keys = OFF;
    BEGIN;
    ALTER TABLE items RENAME TO items_legacy;
    CREATE TABLE items (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      description TEXT NOT NULL,
      icon TEXT NOT NULL,
      category TEXT NOT NULL CHECK (category IN ('Consumable', 'Material', 'Collectible', 'Currency', 'Quest', 'Special', 'Cosmetic', 'Charm', 'Relic')),
      rarity TEXT NOT NULL CHECK (rarity IN ('Common', 'Uncommon', 'Rare', 'Epic', 'Legendary', 'Mythic')),
      stackable INTEGER NOT NULL DEFAULT 1 CHECK (stackable IN (0, 1)),
      max_stack INTEGER NOT NULL CHECK (max_stack > 0),
      tradable INTEGER NOT NULL DEFAULT 0 CHECK (tradable IN (0, 1)),
      usable INTEGER NOT NULL DEFAULT 0 CHECK (usable IN (0, 1)),
      effects_json TEXT,
      metadata_json TEXT
    );
    INSERT INTO items (id, name, description, icon, category, rarity, stackable, max_stack, tradable, usable, effects_json, metadata_json)
      SELECT id, name, description, icon, category, rarity, stackable, max_stack, tradable, usable, effects_json, metadata_json
      FROM items_legacy;
    DROP TABLE items_legacy;
    COMMIT;
    PRAGMA foreign_keys = ON;
  `);
}

const brokenItemReferences = database.prepare(`
  SELECT name
  FROM sqlite_master
  WHERE type = 'table' AND sql LIKE '%items_legacy%'
`).all() as Array<{ name: string }>;
const brokenItemReferenceNames = new Set(brokenItemReferences.map((row) => row.name));
if (brokenItemReferenceNames.has("user_inventory") || brokenItemReferenceNames.has("active_effects")) {
  database.exec(`
    PRAGMA foreign_keys = OFF;
    BEGIN;
    DROP INDEX IF EXISTS active_effects_user_expiration;
    ${brokenItemReferenceNames.has("user_inventory") ? `
    ALTER TABLE user_inventory RENAME TO user_inventory_legacy;
    CREATE TABLE user_inventory (
      discord_id TEXT NOT NULL REFERENCES users(discord_id) ON DELETE CASCADE,
      item_id TEXT NOT NULL REFERENCES items(id) ON DELETE CASCADE,
      quantity INTEGER NOT NULL CHECK (quantity > 0),
      acquired_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (discord_id, item_id)
    );
    INSERT INTO user_inventory (discord_id, item_id, quantity, acquired_at, updated_at)
      SELECT discord_id, item_id, quantity, acquired_at, updated_at FROM user_inventory_legacy;
    DROP TABLE user_inventory_legacy;
    ` : ""}
    ${brokenItemReferenceNames.has("active_effects") ? `
    ALTER TABLE active_effects RENAME TO active_effects_legacy;
    CREATE TABLE active_effects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      discord_id TEXT NOT NULL REFERENCES users(discord_id) ON DELETE CASCADE,
      effect_id TEXT NOT NULL,
      effect_type TEXT NOT NULL,
      magnitude REAL NOT NULL,
      started_at INTEGER NOT NULL,
      expires_at INTEGER NOT NULL,
      source_item_id TEXT NOT NULL REFERENCES items(id) ON DELETE CASCADE,
      stackable INTEGER NOT NULL DEFAULT 0 CHECK (stackable IN (0, 1))
    );
    INSERT INTO active_effects (id, discord_id, effect_id, effect_type, magnitude, started_at, expires_at, source_item_id, stackable)
      SELECT id, discord_id, effect_id, effect_type, magnitude, started_at, expires_at, source_item_id, stackable FROM active_effects_legacy;
    DROP TABLE active_effects_legacy;
    CREATE INDEX active_effects_user_expiration
      ON active_effects(discord_id, expires_at);
    ` : ""}
    COMMIT;
    PRAGMA foreign_keys = ON;
  `);
  console.warn("Repaired stale items_legacy foreign-key references in the SQLite database.");
}

const passportStampColumns = database.prepare("PRAGMA table_info(passport_stamps)").all() as Array<{ name: string }>;
if (!passportStampColumns.some((column) => column.name === "category")) {
  database.exec("ALTER TABLE passport_stamps ADD COLUMN category TEXT NOT NULL DEFAULT 'Exploration'");
}
if (!passportStampColumns.some((column) => column.name === "progress_target")) {
  database.exec("ALTER TABLE passport_stamps ADD COLUMN progress_target INTEGER");
}
if (!passportStampColumns.some((column) => column.name === "progress_label")) {
  database.exec("ALTER TABLE passport_stamps ADD COLUMN progress_label TEXT");
}

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

const activeCursesTable = database.prepare(`
  SELECT sql
  FROM sqlite_master
  WHERE type = 'table' AND name = 'active_curses'
`).get() as { sql?: string } | undefined;
if (activeCursesTable?.sql?.includes("curses_legacy")) {
  database.exec(`
    PRAGMA foreign_keys = OFF;
    BEGIN;
    DROP INDEX IF EXISTS active_curses_target_expiry;
    ALTER TABLE active_curses RENAME TO active_curses_legacy;
    CREATE TABLE active_curses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      target_id TEXT NOT NULL REFERENCES users(discord_id) ON DELETE CASCADE,
      curse_id TEXT NOT NULL REFERENCES curses(id) ON DELETE CASCADE,
      inflicted_by_id TEXT NOT NULL,
      applied_at INTEGER NOT NULL,
      expires_at INTEGER NOT NULL
    );
    INSERT INTO active_curses (id, target_id, curse_id, inflicted_by_id, applied_at, expires_at)
      SELECT id, target_id, curse_id, inflicted_by_id, applied_at, expires_at FROM active_curses_legacy;
    DROP TABLE active_curses_legacy;
    CREATE INDEX active_curses_target_expiry
      ON active_curses(target_id, expires_at);
    COMMIT;
    PRAGMA foreign_keys = ON;
  `);
  console.warn("Repaired stale curses_legacy foreign-key references in the SQLite database.");
}

const initialTitles: Title[] = [
  { id: "wanderer", name: "Wanderer", description: "One who has begun the road between worlds.", rarity: "Common", isSecret: false },
  { id: "newcomer", name: "Newcomer", description: "A newly entered name in the keeper's record.", rarity: "Common", isSecret: false },
  { id: "archivist", name: "Archivist", description: "A patient hand trusted with quiet knowledge.", rarity: "Uncommon", isSecret: false },
  { id: "student-of-archives", name: "Student of the Archives", description: "The first records have begun to teach this name.", rarity: "Uncommon", isSecret: false },
  { id: "curious", name: "Curious", description: "The Archives recognize a persistent question.", rarity: "Uncommon", isSecret: false },
  { id: "marked", name: "Marked", description: "A harmless ritual has left its violet signature.", rarity: "Uncommon", isSecret: false },
  { id: "contract-master", name: "Contract Master", description: "The Ledger knows this hand can bring an agreement to its close.", rarity: "Epic", isSecret: false },
  { id: "crown-beneath-ashes", name: "Crown Beneath the Ashes", description: "A title found where no ordinary record would look.", rarity: "Secret", isSecret: true },
  { id: "courtier", name: "Courtier", description: "A familiar presence among the Court's many designations.", rarity: "Rare", isSecret: false },
  { id: "first-lesson", name: "First Lesson", description: "The Archives have begun to teach this name.", rarity: "Common", isSecret: false },
  { id: "archive-apprentice", name: "Archive Apprentice", description: "A student of the keeper's quieter records.", rarity: "Uncommon", isSecret: false },
  { id: "ritual-witness", name: "Ritual Witness", description: "Has stood near the harmless edge of a ritual.", rarity: "Uncommon", isSecret: false },
  { id: "ledger-hand", name: "Ledger Hand", description: "A name trusted to complete what it has entered.", rarity: "Rare", isSecret: false },
  { id: "archive-adept", name: "Archive Adept", description: "The introductory records no longer require explanation.", rarity: "Legendary", isSecret: false },
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
  { id: "crown-beneath-ashes", entryNumber: 1910, rarity: "Secret", bodyTemplate: "The title beneath the ash was not meant for {{username}}. It recognized the shape of the Record anyway.", isSecret: true },
  { id: "ledger-without-end", entryNumber: 1911, rarity: "Secret", bodyTemplate: "The Ledger has recorded a promise completed after the Archives had already begun to remember {{username}}.", isSecret: true },
  { id: "violet-ritual-margin", entryNumber: 1912, rarity: "Secret", bodyTemplate: "A violet mark has appeared beside {{username}}'s name. The Court insists it is harmless; the margin remains unconvinced.", isSecret: true },
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
  { id: "first-lesson", name: "FIRST LESSON", description: "Complete your first tutorial page.", category: "Exploration", rarity: "Common", isHidden: false, rewardTitleId: null },
  { id: "student-of-the-archives", name: "STUDENT OF THE ARCHIVES", description: "Complete half of the tutorial.", category: "Archives", rarity: "Rare", isHidden: false, rewardTitleId: null },
  { id: "tutorial-archivist", name: "THE TUTORIAL ARCHIVIST", description: "Complete the entire introductory tutorial.", category: "Archives", rarity: "Legendary", isHidden: false, rewardTitleId: "archive-adept" },
  { id: "first-title", name: "FIRST DESIGNATION", description: "Obtain your first title beyond the three starter designations.", category: "Prestige", rarity: "Common", isHidden: false, rewardTitleId: null },
  { id: "first-lore", name: "FIRST PAGE", description: "Discover your first lore entry.", category: "Archives", rarity: "Common", isHidden: false, rewardTitleId: null },
  { id: "first-curse", name: "FIRST MARK", description: "Receive your first harmless curse.", category: "Rituals", rarity: "Common", isHidden: false, rewardTitleId: "marked" },
  { id: "first-contract", name: "FIRST OFFER", description: "Create your first contract.", category: "Contracts", rarity: "Common", isHidden: false, rewardTitleId: null },
  { id: "rare-page", name: "CURIOUS HAND", description: "Discover a rare or legendary lore entry.", category: "Archives", rarity: "Rare", isHidden: false, rewardTitleId: "curious" },
  { id: "ten-contracts", name: "MASTER OF THE LEDGER", description: "Complete ten contracts.", category: "Contracts", rarity: "Epic", isHidden: false, rewardTitleId: "contract-master" },
  { id: "secret-page", name: "THE HIDDEN PAGE", description: "Discover a secret lore entry.", category: "Secret", rarity: "Secret", isHidden: true, rewardTitleId: "crown-beneath-ashes" },
  { id: "archive-court", name: "ARCHIVE COURT", description: "Equip a title after discovering ten lore entries.", category: "Prestige", rarity: "Epic", isHidden: true, rewardTitleId: null },
  { id: "woven-record", name: "THE WOVEN RECORD", description: "Complete a contract after discovering lore and receiving a curse.", category: "Secret", rarity: "Legendary", isHidden: true, rewardTitleId: null },
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

const initialPassportStamps: PassportStamp[] = [
  { id: "first-record", name: "FIRST RECORD", description: "Create your first Zekhet profile.", rarity: "Common", secret: false, category: "Exploration" },
  { id: "first-title", name: "FIRST TITLE", description: "Obtain your first title beyond the starter designations.", rarity: "Common", secret: false, category: "Titles", progressTarget: 4, progressLabel: "titles held" },
  { id: "first-discovery", name: "FIRST DISCOVERY", description: "Discover your first lore entry.", rarity: "Common", secret: false, category: "Lore", progressTarget: 1, progressLabel: "lore entries" },
  { id: "archive-explorer", name: "ARCHIVE EXPLORER", description: "Discover five lore entries and begin mapping the Archive.", rarity: "Uncommon", secret: false, category: "Exploration", progressTarget: 5, progressLabel: "lore entries" },
  { id: "deep-archivist", name: "DEEP ARCHIVIST", description: "Discover 25 lore entries.", rarity: "Epic", secret: false, category: "Exploration", progressTarget: 25, progressLabel: "lore entries" },
  { id: "beyond-index", name: "BEYOND THE INDEX", description: "Discover 40 lore entries and reach beyond the public catalogue.", rarity: "Legendary", secret: false, category: "Exploration", progressTarget: 40, progressLabel: "lore entries" },
  { id: "marked", name: "MARKED", description: "Receive your first harmless curse.", rarity: "Uncommon", secret: false, category: "Curses", progressTarget: 1, progressLabel: "different curses" },
  { id: "cursed-twice", name: "CURSED TWICE", description: "Carry two different marks in the history of your Record.", rarity: "Rare", secret: false, category: "Curses", progressTarget: 2, progressLabel: "different curses" },
  { id: "many-marks", name: "MANY MARKS", description: "Receive five different curses.", rarity: "Epic", secret: false, category: "Curses", progressTarget: 5, progressLabel: "different curses" },
  { id: "the-unfortunate", name: "THE UNFORTUNATE", description: "Receive eight different curses and remain recorded.", rarity: "Legendary", secret: false, category: "Curses", progressTarget: 8, progressLabel: "different curses" },
  { id: "oathbound", name: "OATHBOUND", description: "Complete your first contract.", rarity: "Uncommon", secret: false, category: "Contracts", progressTarget: 1, progressLabel: "completed contracts" },
  { id: "oathkeeper", name: "OATHKEEPER", description: "Complete three contracts.", rarity: "Rare", secret: false, category: "Contracts", progressTarget: 3, progressLabel: "completed contracts" },
  { id: "ledger-keeper", name: "LEDGER KEEPER", description: "Complete five contracts without abandoning the Ledger.", rarity: "Epic", secret: false, category: "Contracts", progressTarget: 5, progressLabel: "completed contracts" },
  { id: "deal-maker", name: "THE DEAL MAKER", description: "Complete ten contracts.", rarity: "Legendary", secret: false, category: "Contracts", progressTarget: 10, progressLabel: "completed contracts" },
  { id: "recognized", name: "RECOGNIZED", description: "Unlock your first achievement.", rarity: "Common", secret: false, category: "Achievements", progressTarget: 1, progressLabel: "achievements" },
  { id: "decorated", name: "DECORATED", description: "Unlock three achievements across the Archive.", rarity: "Uncommon", secret: false, category: "Achievements", progressTarget: 3, progressLabel: "achievements" },
  { id: "accomplished", name: "ACCOMPLISHED", description: "Unlock five achievements.", rarity: "Rare", secret: false, category: "Achievements", progressTarget: 5, progressLabel: "achievements" },
  { id: "distinguished-record", name: "THE DISTINGUISHED RECORD", description: "Unlock eight achievements and earn the Court's notice.", rarity: "Epic", secret: false, category: "Achievements", progressTarget: 8, progressLabel: "achievements" },
  { id: "first-lesson", name: "FIRST LESSON", description: "Complete the first tutorial chapter.", rarity: "Common", secret: false, category: "Tutorial", progressTarget: 1, progressLabel: "tutorial chapters" },
  { id: "student", name: "STUDENT", description: "Complete the Zekhet tutorial.", rarity: "Rare", secret: false, category: "Tutorial", progressTarget: 6, progressLabel: "tutorial chapters" },
  { id: "scholar", name: "SCHOLAR", description: "Complete three tutorial chapters.", rarity: "Uncommon", secret: false, category: "Tutorial", progressTarget: 3, progressLabel: "tutorial chapters" },
  { id: "archivist", name: "ARCHIVIST", description: "Discover 25 lore entries.", rarity: "Epic", secret: false, category: "Lore", progressTarget: 25, progressLabel: "lore entries" },
  { id: "keeper-of-records", name: "THE DEEP KEEPER", description: "Discover 40 lore entries and keep the deepest public record.", rarity: "Legendary", secret: false, category: "Lore", progressTarget: 40, progressLabel: "lore entries" },
  { id: "courtier", name: "COURTIER", description: "Collect ten titles.", rarity: "Rare", secret: false, category: "Titles", progressTarget: 10, progressLabel: "titles held" },
  { id: "title-collector", name: "THE TITLE COLLECTOR", description: "Collect twenty titles.", rarity: "Epic", secret: false, category: "Titles", progressTarget: 20, progressLabel: "titles held" },
  { id: "the-crowned", name: "THE CROWNED", description: "Collect thirty titles and stand above the ordinary record.", rarity: "Legendary", secret: false, category: "Titles", progressTarget: 30, progressLabel: "titles held" },
  { id: "first-level", name: "FIRST LEVEL", description: "Reach level two.", rarity: "Common", secret: false, category: "Progression", progressTarget: 2, progressLabel: "level" },
  { id: "rising", name: "RISING", description: "Reach level five.", rarity: "Uncommon", secret: false, category: "Progression", progressTarget: 5, progressLabel: "level" },
  { id: "established", name: "ESTABLISHED", description: "Reach level ten.", rarity: "Rare", secret: false, category: "Progression", progressTarget: 10, progressLabel: "level" },
  { id: "veteran", name: "VETERAN", description: "Reach level twenty.", rarity: "Epic", secret: false, category: "Progression", progressTarget: 20, progressLabel: "level" },
  { id: "first-item", name: "FIRST ITEM", description: "Place your first item in the Inventory.", rarity: "Common", secret: false, category: "Inventory", progressTarget: 1, progressLabel: "items held" },
  { id: "item-collector", name: "ITEM COLLECTOR", description: "Hold five different items.", rarity: "Uncommon", secret: false, category: "Inventory", progressTarget: 5, progressLabel: "different items" },
  { id: "hoarder", name: "HOARDER", description: "Hold fifteen different items.", rarity: "Rare", secret: false, category: "Inventory", progressTarget: 15, progressLabel: "different items" },
  { id: "curator", name: "CURATOR", description: "Hold ten different items from the Archive catalogue.", rarity: "Epic", secret: false, category: "Inventory", progressTarget: 10, progressLabel: "different items" },
  { id: "first-deben", name: "FIRST DEBEN", description: "Receive your first Deben.", rarity: "Common", secret: false, category: "Currency", progressTarget: 101, progressLabel: "Deben held" },
  { id: "prosperous", name: "PROSPEROUS", description: "Hold 1,000 Deben.", rarity: "Uncommon", secret: false, category: "Currency", progressTarget: 1000, progressLabel: "Deben held" },
  { id: "wealthy", name: "WEALTHY", description: "Hold 5,000 Deben.", rarity: "Rare", secret: false, category: "Currency", progressTarget: 5000, progressLabel: "Deben held" },
  { id: "treasurer", name: "TREASURER", description: "Hold 10,000 Deben.", rarity: "Legendary", secret: false, category: "Currency", progressTarget: 10000, progressLabel: "Deben held" },
  { id: "the-unrecorded", name: "THE UNRECORDED", description: "A record absent from every official page.", rarity: "Secret", secret: true, category: "Secret" },
  { id: "forbidden", name: "FORBIDDEN", description: "Discover a secret lore entry.", rarity: "Secret", secret: true, category: "Secret" },
  { id: "zekhet-remembers", name: "ZEKHET REMEMBERS", description: "Complete the tutorial and discover a secret lore entry.", rarity: "Mythic", secret: true, category: "Secret" },
  { id: "exalted", name: "EXALTED", description: "Reach level 50 and unlock 10 achievements.", rarity: "Secret", secret: true, category: "Secret" },
  { id: "the-forbidden-page", name: "THE FORBIDDEN PAGE", description: "Own a title of rare standing while discovering a secret lore entry.", rarity: "Mythic", secret: true, category: "Secret" },
  { id: "beyond-the-archive", name: "BEYOND THE ARCHIVE", description: "Complete five contracts after reaching level ten.", rarity: "Legendary", secret: true, category: "Secret" },
  { id: "the-last-record", name: "THE LAST RECORD", description: "Complete the tutorial, hold ten titles, and discover twenty lore entries.", rarity: "Mythic", secret: true, category: "Secret" },
  { id: "missing-name", name: "THE NAME THAT WAS MISSING", description: "Unlock achievements across three different categories.", rarity: "Legendary", secret: true, category: "Secret" },
  { id: "crown-beneath-ashes", name: "THE CROWN BENEATH THE ASHES", description: "Hold a legendary title, a rare item, and a mark from a curse.", rarity: "Mythic", secret: true, category: "Secret" },
  { id: "the-observer", name: "THE OBSERVER", description: "Reach level ten while holding no active curses.", rarity: "Legendary", secret: true, category: "Secret" },
  { id: "woven-passport", name: "THE WOVEN PASSPORT", description: "Complete a contract after discovering lore and unlocking an achievement.", rarity: "Mythic", secret: true, category: "Secret" },
];
for (const stamp of initialPassportStamps) {
  database.prepare(`
    INSERT INTO passport_stamps (id, name, description, rarity, secret, category, progress_target, progress_label)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET name = excluded.name, description = excluded.description,
      rarity = excluded.rarity, secret = excluded.secret, category = excluded.category,
      progress_target = excluded.progress_target, progress_label = excluded.progress_label
  `).run(stamp.id, stamp.name, stamp.description, stamp.rarity, stamp.secret ? 1 : 0,
    stamp.category, stamp.progressTarget ?? null, stamp.progressLabel ?? null);
}

const initialItems: Item[] = [
  {
    id: "archive-shard",
    name: "Archive Shard",
    description: "A splinter of violet glass that retains the shape of a forgotten record.",
    icon: "🔹",
    category: "Material",
    rarity: "Rare",
    stackable: true,
    maxStack: 99,
    tradable: true,
    usable: false,
    effects: null,
    metadata: { source: "archives" },
  },
  {
    id: "moonlit-tonic",
    name: "Moonlit Tonic",
    description: "A sealed tonic with a pale glow that sharpens the keeper's instincts for a short while.",
    icon: "🧪",
    category: "Consumable",
    rarity: "Uncommon",
    stackable: true,
    maxStack: 10,
    tradable: false,
    usable: true,
    effects: { effectId: "moonlit-focus", type: "ITEM_FIND_BOOST", magnitude: 50, durationSeconds: 3600, label: "Item discovery chance", stackable: false },
    metadata: null,
  },
  {
    id: "lucky-scarab",
    name: "Lucky Scarab",
    description: "A dark scarab whose markings seem to shift whenever fortune draws near.",
    icon: "🪲",
    category: "Charm",
    rarity: "Uncommon",
    stackable: true,
    maxStack: 10,
    tradable: true,
    usable: true,
    effects: { effectId: "lucky-scarab", type: "LUCK_BOOST", magnitude: 100, durationSeconds: 7200, label: "Luck", stackable: false },
    metadata: { source: "buried-shrines", value: 75 },
  },
  {
    id: "merchants-seal",
    name: "Merchant's Seal",
    description: "A bronze seal that makes every honest exchange feel slightly more generous.",
    icon: "🪙",
    category: "Charm",
    rarity: "Rare",
    stackable: true,
    maxStack: 10,
    tradable: true,
    usable: true,
    effects: { effectId: "merchants-seal", type: "DEBEN_BOOST", magnitude: 25, durationSeconds: 7200, label: "Deben rewards", stackable: false },
    metadata: { source: "merchant-vaults", value: 150 },
  },
  {
    id: "explorers-draught",
    name: "Explorer's Draught",
    description: "A bright cordial distilled for travelers who intend to remember what they find.",
    icon: "🧪",
    category: "Consumable",
    rarity: "Rare",
    stackable: true,
    maxStack: 10,
    tradable: false,
    usable: true,
    effects: { effectId: "explorers-draught", type: "XP_BOOST", magnitude: 25, durationSeconds: 7200, label: "XP rewards", stackable: false },
    metadata: { source: "archive-apothecary", value: 175 },
  },
  {
    id: "sandglass-of-passage",
    name: "Sandglass of Passage",
    description: "The sand inside falls sideways, briefly persuading the desert to make room.",
    icon: "⏳",
    category: "Relic",
    rarity: "Epic",
    stackable: true,
    maxStack: 5,
    tradable: false,
    usable: true,
    effects: { effectId: "sandglass-of-passage", type: "COOLDOWN_REDUCTION", magnitude: 25, durationSeconds: 3600, label: "Venture cooldown", stackable: false },
    metadata: { source: "passage-shrines", value: 300 },
  },
  {
    id: "eye-of-the-watcher",
    name: "Eye of the Watcher",
    description: "A polished eye-shaped stone that notices rare doors before they open.",
    icon: "👁️",
    category: "Charm",
    rarity: "Epic",
    stackable: true,
    maxStack: 5,
    tradable: false,
    usable: true,
    effects: { effectId: "eye-of-the-watcher", type: "RARE_ENCOUNTER_BOOST", magnitude: 35, durationSeconds: 1800, label: "Rare encounter chance", stackable: false },
    metadata: { source: "watcher-temples", value: 350 },
  },
  {
    id: "relic-seekers-charm",
    name: "Relic Seeker's Charm",
    description: "A small charm that grows warm whenever something worth keeping is close.",
    icon: "🧿",
    category: "Charm",
    rarity: "Rare",
    stackable: true,
    maxStack: 5,
    tradable: false,
    usable: true,
    effects: { effectId: "relic-seekers-charm", type: "ITEM_FIND_BOOST", magnitude: 100, durationSeconds: 3600, label: "Item discovery chance", stackable: false },
    metadata: { source: "relic-keepers", value: 250 },
  },
  {
    id: "violet-seal",
    name: "Violet Seal",
    description: "A collectible mark pressed with the keeper's violet signet.",
    icon: "🔮",
    category: "Collectible",
    rarity: "Epic",
    stackable: true,
    maxStack: 25,
    tradable: true,
    usable: false,
    effects: null,
    metadata: null,
  },
  {
    id: "keeper-sigil",
    name: "Keeper's Sigil",
    description: "A special emblem whose purpose has been recorded but not yet revealed.",
    icon: "⛤",
    category: "Special",
    rarity: "Legendary",
    stackable: false,
    maxStack: 1,
    tradable: false,
    usable: false,
    effects: null,
    metadata: { sealed: true },
  },
  {
    id: "papyrus-fragment",
    name: "Papyrus Fragment",
    description: "A weathered fragment covered in faded hieroglyphs.",
    icon: "𓏏",
    category: "Material",
    rarity: "Common",
    stackable: true,
    maxStack: 99,
    tradable: true,
    usable: false,
    effects: null,
    metadata: { source: "desert-archives", value: 5 },
  },
  {
    id: "scribes-ink",
    name: "Scribe's Ink",
    description: "Dark ink once used to record names that were never meant to be forgotten.",
    icon: "𓂋",
    category: "Material",
    rarity: "Common",
    stackable: true,
    maxStack: 99,
    tradable: true,
    usable: false,
    effects: null,
    metadata: { source: "scribe-sanctums", value: 8 },
  },
  {
    id: "desert-glass",
    name: "Desert Glass",
    description: "A translucent shard formed beneath the ancient desert sands.",
    icon: "◇",
    category: "Material",
    rarity: "Common",
    stackable: true,
    maxStack: 99,
    tradable: true,
    usable: false,
    effects: null,
    metadata: { source: "great-sand-sea", value: 12 },
  },
  {
    id: "nile-pearl",
    name: "Nile Pearl",
    description: "A pale pearl said to have been recovered beneath the moonlit Nile.",
    icon: "◈",
    category: "Collectible",
    rarity: "Uncommon",
    stackable: true,
    maxStack: 25,
    tradable: true,
    usable: false,
    effects: null,
    metadata: { source: "moonlit-nile", value: 35 },
  },
  {
    id: "scarab-of-rebirth",
    name: "Scarab of Rebirth",
    description: "A small scarab charm bearing a symbol of renewal.",
    icon: "𓆣",
    category: "Collectible",
    rarity: "Uncommon",
    stackable: false,
    maxStack: 1,
    tradable: true,
    usable: false,
    effects: null,
    metadata: { source: "buried-shrines", value: 50 },
  },
  {
    id: "moonlit-papyrus",
    name: "Moonlit Papyrus",
    description: "Papyrus that glows faintly beneath a night sky.",
    icon: "𓂀",
    category: "Special",
    rarity: "Uncommon",
    stackable: true,
    maxStack: 10,
    tradable: false,
    usable: false,
    effects: null,
    metadata: { source: "night-archives", value: 65 },
  },
  {
    id: "eye-of-horus",
    name: "Eye of Horus",
    description: "An ancient symbol said to watch over those who carry it.",
    icon: "𓂀",
    category: "Collectible",
    rarity: "Rare",
    stackable: false,
    maxStack: 1,
    tradable: true,
    usable: false,
    effects: null,
    metadata: { source: "watchful-temples", value: 120 },
  },
  {
    id: "golden-scarab",
    name: "Golden Scarab",
    description: "A golden scarab untouched by centuries beneath the sand.",
    icon: "𓆣",
    category: "Collectible",
    rarity: "Rare",
    stackable: false,
    maxStack: 1,
    tradable: true,
    usable: false,
    effects: null,
    metadata: { source: "sealed-tombs", value: 180 },
  },
  {
    id: "tombkeepers-key",
    name: "Tombkeeper's Key",
    description: "An ornate key whose lock has long since vanished.",
    icon: "⚿",
    category: "Quest",
    rarity: "Rare",
    stackable: false,
    maxStack: 1,
    tradable: false,
    usable: false,
    effects: null,
    metadata: { source: "forgotten-tombs", questItem: true },
  },
  {
    id: "pharaohs-seal",
    name: "Pharaoh's Seal",
    description: "A royal seal bearing the mark of a forgotten dynasty.",
    icon: "𓋹",
    category: "Collectible",
    rarity: "Epic",
    stackable: false,
    maxStack: 1,
    tradable: true,
    usable: false,
    effects: null,
    metadata: { source: "royal-vaults", value: 350 },
  },
  {
    id: "niles-heart",
    name: "Nile's Heart",
    description: "A strange blue gemstone said to hold a fragment of the river's spirit.",
    icon: "✦",
    category: "Collectible",
    rarity: "Epic",
    stackable: false,
    maxStack: 1,
    tradable: false,
    usable: false,
    effects: null,
    metadata: { source: "river-sanctum", value: 500 },
  },
  {
    id: "ankh-of-eternity",
    name: "Ankh of Eternity",
    description: "An ancient ankh said to represent life beyond the mortal world.",
    icon: "𓋹",
    category: "Special",
    rarity: "Legendary",
    stackable: false,
    maxStack: 1,
    tradable: false,
    usable: false,
    effects: null,
    metadata: { source: "eternal-chambers", value: 1000 },
  },
  {
    id: "crown-of-the-forgotten-pharaoh",
    name: "Crown of the Forgotten Pharaoh",
    description: "A crown belonging to a ruler whose name has been deliberately erased from history.",
    icon: "♕",
    category: "Collectible",
    rarity: "Legendary",
    stackable: false,
    maxStack: 1,
    tradable: false,
    usable: false,
    effects: null,
    metadata: { source: "erased-dynasty", value: 1500 },
  },
  {
    id: "feather-of-maat",
    name: "Feather of Ma'at",
    description: "A feather said to weigh the truth of every soul placed before it.",
    icon: "𓆄",
    category: "Special",
    rarity: "Mythic",
    stackable: false,
    maxStack: 1,
    tradable: false,
    usable: false,
    effects: null,
    metadata: { source: "hall-of-truth", unpriced: true },
  },
  {
    id: "star-of-khepri",
    name: "Star of Khepri",
    description: "A fragment of something that fell from the heavens long before the first dynasty.",
    icon: "✶",
    category: "Collectible",
    rarity: "Mythic",
    stackable: false,
    maxStack: 1,
    tradable: false,
    usable: false,
    effects: null,
    metadata: { source: "pre-dynastic-sky", unpriced: true },
  },
];

for (const item of initialItems) {
  database.prepare(`
    INSERT INTO items (id, name, description, icon, category, rarity, stackable, max_stack, tradable, usable, effects_json, metadata_json)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET name = excluded.name, description = excluded.description,
      icon = excluded.icon, category = excluded.category, rarity = excluded.rarity,
      stackable = excluded.stackable, max_stack = excluded.max_stack, tradable = excluded.tradable,
      usable = excluded.usable, effects_json = excluded.effects_json, metadata_json = excluded.metadata_json
  `).run(
    item.id, item.name, item.description, item.icon, item.category, item.rarity,
    item.stackable ? 1 : 0, item.maxStack, item.tradable ? 1 : 0, item.usable ? 1 : 0,
    item.effects ? JSON.stringify(item.effects) : null,
    item.metadata ? JSON.stringify(item.metadata) : null,
  );
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
  database.prepare(`
    INSERT OR IGNORE INTO currency_balances (discord_id, balance)
    VALUES (?, 100)
  `).run(userId);
  database.prepare(`
    INSERT OR IGNORE INTO user_progression (discord_id, xp, level, rank)
    VALUES (?, 0, 1, 'Initiate')
  `).run(userId);
  database.prepare(`
    INSERT OR IGNORE INTO passport_numbers (discord_id, passport_number)
    SELECT ?, profile_number FROM profiles WHERE discord_id = ?
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
      COALESCE(up.xp, 0) AS xp, COALESCE(up.level, 1) AS level, COALESCE(up.rank, 'Initiate') AS rank,
      p.created_at AS createdAt, p.profile_number AS profileNumber,
      pn.passport_number AS passportNumber, p.color, p.theme
    FROM users u JOIN profiles p ON p.discord_id = u.discord_id
    JOIN passport_numbers pn ON pn.discord_id = u.discord_id
    LEFT JOIN user_progression up ON up.discord_id = u.discord_id
    LEFT JOIN user_titles ut ON ut.discord_id = u.discord_id AND ut.equipped = 1
    LEFT JOIN titles t ON t.id = ut.title_id
    WHERE u.discord_id = ?
  `).get(userId) as Profile;
  return row;
}

function mapPassportStamp(row: Record<string, unknown>): PassportStamp {
  return {
    id: row["id"] as string,
    name: row["name"] as string,
    description: row["description"] as string,
    rarity: row["rarity"] as PassportStampRarity,
    secret: Boolean(row["secret"]),
    category: (row["category"] as PassportStampCategory | undefined) ?? "Exploration",
    progressTarget: row["progressTarget"] == null ? undefined : Number(row["progressTarget"]),
    progressLabel: (row["progressLabel"] as string | null | undefined) ?? undefined,
  };
}

export function getPassportStamps(userId: string, username = "Unknown Record", avatarUrl: string | null = null): UnlockedPassportStamp[] {
  ensureProfile(userId, username, avatarUrl);
  return database.prepare(`
    SELECT ps.id, ps.name, ps.description, ps.rarity, ps.secret, ps.category,
      ps.progress_target AS progressTarget, ps.progress_label AS progressLabel,
      ups.unlocked_at AS unlockedAt
    FROM user_passport_stamps ups
    JOIN passport_stamps ps ON ps.id = ups.stamp_id
    WHERE ups.discord_id = ?
    ORDER BY ups.unlocked_at, ps.id
  `).all(userId).map((row) => ({
    ...mapPassportStamp(row as Record<string, unknown>),
    unlockedAt: (row as { unlockedAt: string }).unlockedAt,
  }));
}

export function getPassportStampCatalog(userId: string, username = "Unknown Record", avatarUrl: string | null = null): PassportStampView[] {
  ensureProfile(userId, username, avatarUrl);
  const rows = database.prepare(`
    SELECT ps.id, ps.name, ps.description, ps.rarity, ps.secret, ps.category,
      ps.progress_target AS progressTarget, ps.progress_label AS progressLabel,
      ups.unlocked_at AS unlockedAt
    FROM passport_stamps ps
    LEFT JOIN user_passport_stamps ups
      ON ups.stamp_id = ps.id AND ups.discord_id = ?
    ORDER BY CASE ps.category
      WHEN 'Exploration' THEN 1 WHEN 'Titles' THEN 2 WHEN 'Lore' THEN 3
      WHEN 'Curses' THEN 4 WHEN 'Contracts' THEN 5 WHEN 'Achievements' THEN 6
      WHEN 'Tutorial' THEN 7 WHEN 'Progression' THEN 8 WHEN 'Inventory' THEN 9
      WHEN 'Currency' THEN 10 ELSE 11 END, ps.rarity, ps.id
  `).all(userId) as Array<Record<string, unknown>>;
  return rows.map((row) => ({
    ...mapPassportStamp(row),
    unlocked: Boolean(row["unlockedAt"]),
    unlockedAt: row["unlockedAt"] == null ? undefined : String(row["unlockedAt"]),
  }));
}

function passportRecords(userId: string): PassportRecords {
  const count = (query: string, ...params: string[]) =>
    Number((database.prepare(query).get(...params) as { count?: number } | undefined)?.count ?? 0);
  const progression = getProgression(userId);
  return {
    titles: count("SELECT COUNT(*) AS count FROM user_titles WHERE discord_id = ?", userId),
    totalTitles: count("SELECT COUNT(*) AS count FROM titles"),
    lore: count("SELECT COUNT(*) AS count FROM user_lore WHERE discord_id = ?", userId),
    totalLore: count("SELECT COUNT(*) AS count FROM lore_entries WHERE is_secret = 0"),
    achievements: count("SELECT COUNT(*) AS count FROM user_achievements WHERE discord_id = ?", userId),
    totalAchievements: count("SELECT COUNT(*) AS count FROM achievements"),
    contracts: count("SELECT COUNT(*) AS count FROM contracts WHERE creator_id = ? OR recipient_id = ?", userId, userId),
    completedContracts: count("SELECT COUNT(*) AS count FROM contracts WHERE status = 'Completed' AND (creator_id = ? OR recipient_id = ?)", userId, userId),
    curses: count("SELECT COUNT(DISTINCT curse_id) AS count FROM curse_history WHERE target_id = ?", userId),
    totalCurses: count("SELECT COUNT(*) AS count FROM curses"),
    items: count("SELECT COUNT(*) AS count FROM user_inventory WHERE discord_id = ?", userId),
    totalItems: count("SELECT COUNT(*) AS count FROM items"),
    tutorialPages: count("SELECT COUNT(*) AS count FROM tutorial_rewards WHERE discord_id = ?", userId),
    totalTutorialPages: count("SELECT COUNT(*) AS count FROM tutorial_rewards WHERE discord_id = ?", userId) < 6 ? 6 : count("SELECT COUNT(*) AS count FROM tutorial_rewards WHERE discord_id = ?", userId),
    xp: progression.xp,
    level: progression.level,
    rank: progression.rank,
  };
}

function passportStatus(records: PassportRecords): PassportStatus {
  const score = records.titles + records.lore + records.achievements + records.completedContracts + records.curses + records.tutorialPages;
  if (records.level >= 50 && records.achievements >= 10) return "Exalted";
  if (records.level >= 30 || score >= 80) return "Keeper";
  if (records.level >= 20 || score >= 50) return "Archivist";
  if (records.titles >= 10 || records.lore >= 15 || records.achievements >= 8) return "Courtier";
  if (score >= 20) return "Citizen";
  if (score >= 8) return "Acquainted";
  if (score > 0) return "Recognized";
  return "Unrecorded";
}

export function setPassportStatusOverride(userId: string, status: PassportStatus, username = "Unknown Record", avatarUrl: string | null = null): void {
  ensureProfile(userId, username, avatarUrl);
  database.prepare(`
    INSERT INTO passport_status_overrides (discord_id, status) VALUES (?, ?)
    ON CONFLICT(discord_id) DO UPDATE SET status = excluded.status
  `).run(userId, status);
}

export function clearPassportStatusOverride(userId: string): void {
  database.prepare("DELETE FROM passport_status_overrides WHERE discord_id = ?").run(userId);
}

function eligiblePassportStamps(userId: string): Set<string> {
  const records = passportRecords(userId);
  const balance = getCurrencyBalance(userId);
  const secretLore = Number((database.prepare(`
    SELECT COUNT(*) AS count FROM user_lore ul JOIN lore_entries le ON le.id = ul.lore_id
    WHERE ul.discord_id = ? AND le.is_secret = 1
  `).get(userId) as { count: number }).count);
  const rareTitle = database.prepare(`
    SELECT 1 FROM user_titles ut JOIN titles t ON t.id = ut.title_id
    WHERE ut.discord_id = ? AND t.rarity IN ('Rare', 'Legendary', 'Mythic')
  `).get(userId);
  const legendaryTitle = database.prepare(`
    SELECT 1 FROM user_titles ut JOIN titles t ON t.id = ut.title_id
    WHERE ut.discord_id = ? AND t.rarity = 'Legendary'
  `).get(userId);
  const rareItem = database.prepare(`
    SELECT 1 FROM user_inventory ui JOIN items i ON i.id = ui.item_id
    WHERE ui.discord_id = ? AND i.rarity IN ('Rare', 'Legendary', 'Mythic')
  `).get(userId);
  const activeCurses = Number((database.prepare(`
    SELECT COUNT(*) AS count FROM active_curses WHERE target_id = ? AND expires_at > unixepoch()
  `).get(userId) as { count: number }).count);
  const achievementCategories = Number((database.prepare(`
    SELECT COUNT(DISTINCT a.category) AS count
    FROM user_achievements ua JOIN achievements a ON a.id = ua.achievement_id
    WHERE ua.discord_id = ?
  `).get(userId) as { count: number }).count);
  const eligible = new Set<string>();
  if (database.prepare("SELECT 1 FROM profiles WHERE discord_id = ?").get(userId)) eligible.add("first-record");
  if (records.titles >= 4) eligible.add("first-title");
  if (records.lore >= 1) eligible.add("first-discovery");
  if (records.lore >= 5) eligible.add("archive-explorer");
  if (records.lore >= 25) eligible.add("deep-archivist");
  if (records.lore >= 40) eligible.add("beyond-index");
  if (records.curses >= 1) eligible.add("marked");
  if (records.curses >= 2) eligible.add("cursed-twice");
  if (records.curses >= 8) eligible.add("the-unfortunate");
  if (records.completedContracts >= 1) eligible.add("oathbound");
  if (records.completedContracts >= 5) eligible.add("ledger-keeper");
  if (records.completedContracts >= 10) eligible.add("deal-maker");
  if (records.achievements >= 1) eligible.add("recognized");
  if (records.achievements >= 3) eligible.add("decorated");
  if (records.achievements >= 5) eligible.add("accomplished");
  if (records.achievements >= 8) eligible.add("distinguished-record");
  if (records.tutorialPages >= 1) eligible.add("first-lesson");
  if (records.tutorialPages >= 6) eligible.add("student");
  if (records.tutorialPages >= 3) eligible.add("scholar");
  if (records.lore >= 25) eligible.add("archivist");
  if (records.titles >= 10) eligible.add("courtier");
  if (records.completedContracts >= 3) eligible.add("oathkeeper");
  if (records.curses >= 5) eligible.add("many-marks");
  if (records.titles >= 20) eligible.add("collector");
  if (records.titles >= 20) eligible.add("title-collector");
  if (records.titles >= 30) eligible.add("the-crowned");
  if (records.level >= 20) eligible.add("keeper");
  if (records.lore >= 40) eligible.add("archive-heart");
  if (records.lore >= 40) eligible.add("keeper-of-records");
  if (records.level >= 2) eligible.add("first-level");
  if (records.level >= 5) eligible.add("rising");
  if (records.level >= 10) eligible.add("established");
  if (records.level >= 20) eligible.add("veteran");
  if (records.items >= 1) eligible.add("first-item");
  if (records.items >= 5) eligible.add("item-collector");
  if (records.items >= 15) eligible.add("hoarder");
  if (records.items >= 10) eligible.add("curator");
  if (balance >= 101) eligible.add("first-deben");
  if (balance >= 1000) eligible.add("prosperous");
  if (balance >= 5000) eligible.add("wealthy");
  if (balance >= 10000) eligible.add("treasurer");
  if (secretLore > 0) eligible.add("forbidden");
  if (records.tutorialPages >= 6 && secretLore > 0) eligible.add("zekhet-remembers");
  if (records.level >= 50 && records.achievements >= 10) eligible.add("exalted");
  if (rareTitle && secretLore > 0) eligible.add("the-forbidden-page");
  if (records.completedContracts >= 5 && records.level >= 10) eligible.add("beyond-the-archive");
  if (records.tutorialPages >= 6 && records.titles >= 10 && records.lore >= 20) eligible.add("the-last-record");
  if (achievementCategories >= 3) eligible.add("missing-name");
  if (legendaryTitle && rareItem && records.curses >= 1) eligible.add("crown-beneath-ashes");
  if (records.level >= 10 && activeCurses === 0) eligible.add("the-observer");
  if (records.completedContracts >= 1 && records.lore >= 1 && records.achievements >= 1) eligible.add("woven-passport");
  return eligible;
}

export function unlockPassportStamps(
  userId: string,
  username = "Unknown Record",
  avatarUrl: string | null = null,
): UnlockedPassportStamp[] {
  ensureProfile(userId, username, avatarUrl);
  const eligible = eligiblePassportStamps(userId);
  const unlocked: UnlockedPassportStamp[] = [];
  for (const stampId of eligible) {
    if (database.prepare("SELECT 1 FROM user_passport_stamps WHERE discord_id = ? AND stamp_id = ?").get(userId, stampId)) continue;
    const stamp = database.prepare("SELECT id, name, description, rarity, secret FROM passport_stamps WHERE id = ?").get(stampId) as Record<string, unknown> | undefined;
    if (!stamp) continue;
    const unlockedAt = new Date().toISOString();
    database.prepare("INSERT INTO user_passport_stamps (discord_id, stamp_id, unlocked_at) VALUES (?, ?, ?)").run(userId, stampId, unlockedAt);
    unlocked.push({ ...mapPassportStamp(stamp), unlockedAt });
  }
  return unlocked;
}

export function getPassport(userId: string, username = "Unknown Record", avatarUrl: string | null = null): Passport {
  const profile = getProfile(userId, username, avatarUrl);
  unlockPassportStamps(userId, username, avatarUrl);
  const records = passportRecords(userId);
  const override = database.prepare("SELECT status FROM passport_status_overrides WHERE discord_id = ?").get(userId) as { status?: PassportStatus } | undefined;
  return { number: profile.passportNumber, status: override?.status ?? passportStatus(records), records, stamps: getPassportStamps(userId, username, avatarUrl) };
}

export function grantPassportStamp(userId: string, stampId: string, username = "Unknown Record", avatarUrl: string | null = null): UnlockedPassportStamp | undefined {
  ensureProfile(userId, username, avatarUrl);
  const stamp = database.prepare("SELECT id, name, description, rarity, secret FROM passport_stamps WHERE id = ?").get(stampId) as Record<string, unknown> | undefined;
  if (!stamp) return undefined;
  database.prepare("INSERT OR IGNORE INTO user_passport_stamps (discord_id, stamp_id) VALUES (?, ?)").run(userId, stampId);
  const row = database.prepare(`
    SELECT ps.id, ps.name, ps.description, ps.rarity, ps.secret, ps.category,
      ps.progress_target AS progressTarget, ps.progress_label AS progressLabel,
      ups.unlocked_at AS unlockedAt
    FROM user_passport_stamps ups JOIN passport_stamps ps ON ps.id = ups.stamp_id
    WHERE ups.discord_id = ? AND ups.stamp_id = ?
  `).get(userId, stampId) as Record<string, unknown>;
  return { ...mapPassportStamp(row), unlockedAt: row["unlockedAt"] as string };
}

export function resetPassportStamps(userId: string): number {
  return Number(database.prepare("DELETE FROM user_passport_stamps WHERE discord_id = ?").run(userId).changes);
}

export function unlockAllPassportStamps(userId: string, username = "Unknown Record", avatarUrl: string | null = null): number {
  ensureProfile(userId, username, avatarUrl);
  const result = database.prepare(`
    INSERT OR IGNORE INTO user_passport_stamps (discord_id, stamp_id)
    SELECT ?, id FROM passport_stamps
  `).run(userId);
  return Number(result.changes);
}

const rankForLevel = (level: number): string => {
  if (level >= 50) return "Keeper of Eternity";
  if (level >= 30) return "High Archivist";
  if (level >= 20) return "Keeper";
  if (level >= 10) return "Acolyte";
  if (level >= 5) return "Scribe";
  return "Initiate";
};

export function xpRequiredForLevel(level: number): number {
  const safeLevel = Math.max(1, Math.floor(level));
  return safeLevel <= 1 ? 0 : ((safeLevel - 1) * safeLevel * 100) / 2;
}

function progressionFromRow(row: { xp?: number; level?: number; rank?: string }): Progression {
  const xp = Number(row.xp ?? 0);
  const level = Number(row.level ?? 1);
  return {
    xp,
    level,
    rank: row.rank ?? rankForLevel(level),
    currentLevelXp: xp - xpRequiredForLevel(level),
    nextLevelXp: xpRequiredForLevel(level + 1) - xpRequiredForLevel(level),
  };
}

export function getProgression(userId: string, username = "Unknown Record", avatarUrl: string | null = null): Progression {
  ensureProfile(userId, username, avatarUrl);
  const row = database.prepare("SELECT xp, level, rank FROM user_progression WHERE discord_id = ?")
    .get(userId) as { xp?: number; level?: number; rank?: string } | undefined;
  return progressionFromRow(row ?? {});
}

export function grantExperience(
  userId: string,
  amount: number,
  username = "Unknown Record",
  avatarUrl: string | null = null,
): ExperienceResult {
  if (!Number.isSafeInteger(amount) || amount <= 0) return { ok: false, reason: "invalid-amount" };
  ensureProfile(userId, username, avatarUrl);
  const before = getProgression(userId);
  const nextXp = before.xp + amount;
  if (!Number.isSafeInteger(nextXp)) return { ok: false, reason: "invalid-xp" };
  let nextLevel = before.level;
  while (xpRequiredForLevel(nextLevel + 1) <= nextXp) nextLevel += 1;
  const nextRank = rankForLevel(nextLevel);
  database.prepare(`
    UPDATE user_progression SET xp = ?, level = ?, rank = ?, updated_at = CURRENT_TIMESTAMP
    WHERE discord_id = ?
  `).run(nextXp, nextLevel, nextRank, userId);
  const after = getProgression(userId);
  return {
    ok: true,
    before,
    after,
    xpGranted: amount,
    levelsGained: Math.max(0, after.level - before.level),
    rankChanged: after.rank !== before.rank,
  };
}

export function claimReward(claimKey: string, userId: string, source: string): boolean {
  const result = database.prepare(`
    INSERT OR IGNORE INTO reward_claims (claim_key, discord_id, source)
    VALUES (?, ?, ?)
  `).run(claimKey, userId, source);
  return Number(result.changes) > 0;
}

export type VentureStartResult =
  | { ok: true; runId: number }
  | { ok: false; retryAfter: number };

export function beginVenture(userId: string, username: string, avatarUrl: string | null, cooldownSeconds: number): VentureStartResult {
  ensureProfile(userId, username, avatarUrl);
  const now = Math.floor(Date.now() / 1000);
  database.exec("BEGIN IMMEDIATE");
  try {
    const row = database.prepare("SELECT used_at AS usedAt FROM venture_cooldowns WHERE discord_id = ?")
      .get(userId) as { usedAt?: number } | undefined;
    const retryAfter = Math.max(0, Number(row?.usedAt ?? 0) + cooldownSeconds - now);
    if (retryAfter > 0) {
      database.exec("ROLLBACK");
      return { ok: false, retryAfter };
    }
    database.prepare(`
      INSERT INTO venture_cooldowns (discord_id, used_at) VALUES (?, ?)
      ON CONFLICT(discord_id) DO UPDATE SET used_at = excluded.used_at
    `).run(userId, now);
    const result = database.prepare(`
      INSERT INTO venture_runs (discord_id, encounter_id, rarity, successful)
      VALUES (?, 'pending', 'COMMON', 0)
    `).run(userId);
    database.exec("COMMIT");
    return { ok: true, runId: Number(result.lastInsertRowid) };
  } catch (error) {
    database.exec("ROLLBACK");
    throw error;
  }
}

export function completeVenture(runId: number, encounterId: string, rarity: string, successful: boolean): void {
  database.prepare(`
    UPDATE venture_runs SET encounter_id = ?, rarity = ?, successful = ?, completed_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(encounterId, rarity, successful ? 1 : 0, runId);
}

export function resetVentureCooldown(userId: string): void {
  database.prepare("DELETE FROM venture_cooldowns WHERE discord_id = ?").run(userId);
}

export function getVentureStats(userId: string): VentureStats {
  const row = database.prepare(`
    SELECT COUNT(*) AS total,
      COALESCE(SUM(successful), 0) AS successful,
      COALESCE(SUM(CASE WHEN successful = 0 THEN 1 ELSE 0 END), 0) AS neutral
    FROM venture_runs WHERE discord_id = ? AND encounter_id <> 'pending'
  `).get(userId) as { total?: number; successful?: number; neutral?: number };
  const highest = database.prepare(`
    SELECT rarity FROM venture_runs
    WHERE discord_id = ? AND encounter_id <> 'pending'
    ORDER BY CASE rarity
      WHEN 'MYTHIC' THEN 6 WHEN 'LEGENDARY' THEN 5 WHEN 'EPIC' THEN 4
      WHEN 'RARE' THEN 3 WHEN 'UNCOMMON' THEN 2 ELSE 1 END DESC
    LIMIT 1
  `).get(userId) as { rarity?: string } | undefined;
  return {
    total: Number(row?.total ?? 0),
    successful: Number(row?.successful ?? 0),
    neutral: Number(row?.neutral ?? 0),
    highestRarity: highest?.rarity ?? null,
  };
}

export function releaseRewardClaim(claimKey: string): void {
  database.prepare("DELETE FROM reward_claims WHERE claim_key = ?").run(claimKey);
}

function parseJson(value: unknown): Record<string, unknown> | null {
  if (typeof value !== "string" || value.length === 0) return null;
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === "object" ? parsed as Record<string, unknown> : null;
  } catch {
    return null;
  }
}

function mapItem(row: Record<string, unknown>): Item {
  return {
    id: row["id"] as string,
    name: row["name"] as string,
    description: row["description"] as string,
    icon: row["icon"] as string,
    category: row["category"] as ItemCategory,
    rarity: row["rarity"] as ItemRarity,
    stackable: Boolean(row["stackable"]),
    maxStack: Number(row["maxStack"]),
    tradable: Boolean(row["tradable"]),
    usable: Boolean(row["usable"]),
    effects: parseJson(row["effectsJson"]),
    metadata: parseJson(row["metadataJson"]),
  };
}

export function getItems(): Item[] {
  return database.prepare(`
    SELECT id, name, description, icon, category, rarity, stackable,
      max_stack AS maxStack, tradable, usable, effects_json AS effectsJson, metadata_json AS metadataJson
    FROM items ORDER BY name
  `).all().map((row) => mapItem(row as Record<string, unknown>));
}

export function getItem(itemId: string): Item | undefined {
  const row = database.prepare(`
    SELECT id, name, description, icon, category, rarity, stackable,
      max_stack AS maxStack, tradable, usable, effects_json AS effectsJson, metadata_json AS metadataJson
    FROM items WHERE id = ?
  `).get(itemId) as Record<string, unknown> | undefined;
  return row ? mapItem(row) : undefined;
}

export function getInventory(userId: string): InventoryEntry[] {
  return database.prepare(`
    SELECT i.id, i.name, i.description, i.icon, i.category, i.rarity, i.stackable,
      i.max_stack AS maxStack, i.tradable, i.usable, i.effects_json AS effectsJson,
      i.metadata_json AS metadataJson, ui.quantity, ui.acquired_at AS acquiredAt,
      ui.updated_at AS updatedAt
    FROM user_inventory ui
    JOIN items i ON i.id = ui.item_id
    WHERE ui.discord_id = ?
    ORDER BY CASE i.rarity
      WHEN 'Mythic' THEN 1 WHEN 'Legendary' THEN 2 WHEN 'Epic' THEN 3
      WHEN 'Rare' THEN 4 WHEN 'Uncommon' THEN 5 ELSE 6 END, i.name
  `).all(userId).map((row) => {
    const record = row as Record<string, unknown>;
    return { ...mapItem(record), quantity: Number(record["quantity"]), acquiredAt: record["acquiredAt"] as string, updatedAt: record["updatedAt"] as string };
  });
}

export function getItemQuantity(userId: string, itemId: string): number {
  const row = database.prepare("SELECT quantity FROM user_inventory WHERE discord_id = ? AND item_id = ?")
    .get(userId, itemId) as { quantity?: number } | undefined;
  return Number(row?.quantity ?? 0);
}

export function getCurrencyBalance(userId: string, username = "Unknown Record", avatarUrl: string | null = null): number {
  ensureProfile(userId, username, avatarUrl);
  return readCurrencyBalance(userId);
}

function readCurrencyBalance(userId: string): number {
  const row = database.prepare("SELECT balance FROM currency_balances WHERE discord_id = ?")
    .get(userId) as { balance?: number } | undefined;
  return Number(row?.balance ?? 0);
}

function validCurrencyAmount(amount: number): boolean {
  return Number.isSafeInteger(amount) && amount > 0;
}

function recordCurrencyTransaction(
  userId: string,
  kind: CurrencyTransactionKind,
  amount: number,
  balanceAfter: number,
  idempotencyKey?: string,
): string {
  const result = database.prepare(`
    INSERT INTO currency_transactions (discord_id, kind, amount, balance_after, idempotency_key)
    VALUES (?, ?, ?, ?, ?)
  `).run(userId, kind, amount, balanceAfter, idempotencyKey ?? null);
  return String(result.lastInsertRowid);
}

export function addCurrency(
  userId: string,
  amount: number,
  username = "Unknown Record",
  avatarUrl: string | null = null,
  idempotencyKey?: string,
): CurrencyResult {
  if (!validCurrencyAmount(amount)) return { ok: false, reason: "invalid-amount" };
  ensureProfile(userId, username, avatarUrl);
  database.exec("BEGIN IMMEDIATE");
  try {
    if (idempotencyKey && database.prepare("SELECT 1 FROM currency_transactions WHERE idempotency_key = ?").get(idempotencyKey)) {
      database.exec("ROLLBACK");
      return { ok: false, reason: "duplicate-transaction" };
    }
    const current = readCurrencyBalance(userId);
    const next = current + amount;
    if (!Number.isSafeInteger(next)) {
      database.exec("ROLLBACK");
      return { ok: false, reason: "invalid-balance" };
    }
    database.prepare("UPDATE currency_balances SET balance = ?, updated_at = CURRENT_TIMESTAMP WHERE discord_id = ?").run(next, userId);
    const transactionId = recordCurrencyTransaction(userId, "credit", amount, next, idempotencyKey);
    database.exec("COMMIT");
    return { ok: true, balance: next, transactionId };
  } catch (error) {
    database.exec("ROLLBACK");
    throw error;
  }
}

export function removeCurrency(
  userId: string,
  amount: number,
  username = "Unknown Record",
  avatarUrl: string | null = null,
  idempotencyKey?: string,
): CurrencyResult {
  if (!validCurrencyAmount(amount)) return { ok: false, reason: "invalid-amount" };
  ensureProfile(userId, username, avatarUrl);
  database.exec("BEGIN IMMEDIATE");
  try {
    if (idempotencyKey && database.prepare("SELECT 1 FROM currency_transactions WHERE idempotency_key = ?").get(idempotencyKey)) {
      database.exec("ROLLBACK");
      return { ok: false, reason: "duplicate-transaction" };
    }
    const current = readCurrencyBalance(userId);
    if (current < amount) {
      database.exec("ROLLBACK");
      return { ok: false, reason: "insufficient-funds" };
    }
    const next = current - amount;
    database.prepare("UPDATE currency_balances SET balance = ?, updated_at = CURRENT_TIMESTAMP WHERE discord_id = ?").run(next, userId);
    const transactionId = recordCurrencyTransaction(userId, "debit", amount, next, idempotencyKey);
    database.exec("COMMIT");
    return { ok: true, balance: next, transactionId };
  } catch (error) {
    database.exec("ROLLBACK");
    throw error;
  }
}

export function hasCurrency(userId: string, amount: number): boolean {
  return validCurrencyAmount(amount) && getCurrencyBalance(userId) >= amount;
}

export function setCurrency(
  userId: string,
  balance: number,
  username = "Unknown Record",
  avatarUrl: string | null = null,
  idempotencyKey?: string,
): CurrencyResult {
  if (!Number.isSafeInteger(balance) || balance < 0) return { ok: false, reason: "invalid-balance" };
  ensureProfile(userId, username, avatarUrl);
  database.exec("BEGIN IMMEDIATE");
  try {
    if (idempotencyKey && database.prepare("SELECT 1 FROM currency_transactions WHERE idempotency_key = ?").get(idempotencyKey)) {
      database.exec("ROLLBACK");
      return { ok: false, reason: "duplicate-transaction" };
    }
    const current = readCurrencyBalance(userId);
    database.prepare("UPDATE currency_balances SET balance = ?, updated_at = CURRENT_TIMESTAMP WHERE discord_id = ?").run(balance, userId);
    const transactionId = recordCurrencyTransaction(userId, "set", balance, balance, idempotencyKey);
    database.exec("COMMIT");
    return { ok: true, balance, transactionId };
  } catch (error) {
    database.exec("ROLLBACK");
    throw error;
  }
}

export function hasItem(userId: string, itemId: string, quantity = 1): boolean {
  return Number.isInteger(quantity) && quantity > 0 && getItemQuantity(userId, itemId) >= quantity;
}

export function addItem(
  userId: string,
  itemId: string,
  quantity: number,
  username = "Unknown Record",
  avatarUrl: string | null = null,
): InventoryEntry | undefined {
  if (!Number.isInteger(quantity) || quantity <= 0) return undefined;
  const item = getItem(itemId);
  if (!item) return undefined;
  ensureProfile(userId, username, avatarUrl);
  const existing = getItemQuantity(userId, itemId);
  if ((!item.stackable && existing > 0) || existing + quantity > item.maxStack) return undefined;
  database.prepare(`
    INSERT INTO user_inventory (discord_id, item_id, quantity)
    VALUES (?, ?, ?)
    ON CONFLICT(discord_id, item_id) DO UPDATE SET quantity = quantity + excluded.quantity,
      updated_at = CURRENT_TIMESTAMP
  `).run(userId, itemId, quantity);
  return getInventory(userId).find((entry) => entry.id === itemId);
}

export function removeItem(userId: string, itemId: string, quantity: number): boolean {
  if (!Number.isInteger(quantity) || quantity <= 0 || !hasItem(userId, itemId, quantity)) return false;
  const remaining = getItemQuantity(userId, itemId) - quantity;
  if (remaining === 0) {
    database.prepare("DELETE FROM user_inventory WHERE discord_id = ? AND item_id = ?").run(userId, itemId);
  } else {
    database.prepare("UPDATE user_inventory SET quantity = ?, updated_at = CURRENT_TIMESTAMP WHERE discord_id = ? AND item_id = ?")
      .run(remaining, userId, itemId);
  }
  return true;
}

export function setItemQuantity(
  userId: string,
  itemId: string,
  quantity: number,
  username = "Unknown Record",
  avatarUrl: string | null = null,
): boolean {
  const item = getItem(itemId);
  if (!item || !Number.isInteger(quantity) || quantity < 0 || quantity > item.maxStack || (!item.stackable && quantity > 1)) {
    return false;
  }
  ensureProfile(userId, username, avatarUrl);
  if (quantity === 0) {
    database.prepare("DELETE FROM user_inventory WHERE discord_id = ? AND item_id = ?").run(userId, itemId);
    return true;
  }
  database.prepare(`
    INSERT INTO user_inventory (discord_id, item_id, quantity)
    VALUES (?, ?, ?)
    ON CONFLICT(discord_id, item_id) DO UPDATE SET quantity = excluded.quantity,
      updated_at = CURRENT_TIMESTAMP
  `).run(userId, itemId, quantity);
  return true;
}

export function clearInventory(userId: string): number {
  return Number(database.prepare("DELETE FROM user_inventory WHERE discord_id = ?").run(userId).changes);
}

function isEffectType(value: unknown): value is EffectType {
  return ["LUCK_BOOST", "DEBEN_BOOST", "XP_BOOST", "COOLDOWN_REDUCTION", "RARE_ENCOUNTER_BOOST", "ITEM_FIND_BOOST"].includes(String(value));
}

function effectDefinition(item: Item): {
  effectId: string;
  type: EffectType;
  magnitude: number;
  durationSeconds: number;
  stackable: boolean;
} | undefined {
  const data = item.effects;
  if (!data || typeof data.effectId !== "string" || !isEffectType(data.type)) return undefined;
  const magnitude = Number(data.magnitude);
  const durationSeconds = Number(data.durationSeconds);
  if (!Number.isFinite(magnitude) || magnitude <= 0 || !Number.isSafeInteger(durationSeconds) || durationSeconds <= 0) return undefined;
  return {
    effectId: data.effectId,
    type: data.type,
    magnitude,
    durationSeconds,
    stackable: data.stackable === true,
  };
}

function cleanupExpiredEffects(userId: string): void {
  database.prepare("DELETE FROM active_effects WHERE discord_id = ? AND expires_at <= ?").run(userId, Math.floor(Date.now() / 1000));
}

function mapActiveEffect(row: Record<string, unknown>): ActiveEffect {
  return {
    id: Number(row["id"]),
    effectId: String(row["effectId"]),
    type: row["type"] as EffectType,
    magnitude: Number(row["magnitude"]),
    startedAt: Number(row["startedAt"]),
    expiresAt: Number(row["expiresAt"]),
    sourceItemId: String(row["sourceItemId"]),
    stackable: Boolean(row["stackable"]),
  };
}

export function getActiveEffects(userId: string, username = "Unknown Record", avatarUrl: string | null = null): ActiveEffect[] {
  ensureProfile(userId, username, avatarUrl);
  cleanupExpiredEffects(userId);
  return database.prepare(`
    SELECT id, effect_id AS effectId, effect_type AS type, magnitude,
      started_at AS startedAt, expires_at AS expiresAt, source_item_id AS sourceItemId, stackable
    FROM active_effects
    WHERE discord_id = ?
    ORDER BY expires_at, id
  `).all(userId).map((row) => mapActiveEffect(row as Record<string, unknown>));
}

export function getActiveEffectMagnitude(userId: string, type: EffectType): number {
  cleanupExpiredEffects(userId);
  const row = database.prepare(`
    SELECT COALESCE(MAX(magnitude), 0) AS magnitude
    FROM active_effects WHERE discord_id = ? AND effect_type = ?
  `).get(userId, type) as { magnitude?: number } | undefined;
  return Number(row?.magnitude ?? 0);
}

function upsertEffect(userId: string, item: Item, username: string, avatarUrl: string | null, consume: boolean): ActiveEffect | { reason: string } {
  const definition = effectDefinition(item);
  if (!definition) return { reason: "invalid-effect" };
  ensureProfile(userId, username, avatarUrl);
  cleanupExpiredEffects(userId);
  database.exec("BEGIN IMMEDIATE");
  try {
    if (consume && !hasItem(userId, item.id)) {
      database.exec("ROLLBACK");
      return { reason: "not-owned" };
    }
    const now = Math.floor(Date.now() / 1000);
    const existing = database.prepare(`
      SELECT id, effect_id AS effectId, effect_type AS type, magnitude,
        started_at AS startedAt, expires_at AS expiresAt, source_item_id AS sourceItemId, stackable
      FROM active_effects
      WHERE discord_id = ? AND effect_type = ? AND expires_at > ?
      ORDER BY expires_at DESC LIMIT 1
    `).get(userId, definition.type, now) as Record<string, unknown> | undefined;
    if (consume) {
      const currentQuantity = getItemQuantity(userId, item.id);
      const removed = currentQuantity === 1
        ? database.prepare("DELETE FROM user_inventory WHERE discord_id = ? AND item_id = ? AND quantity = 1").run(userId, item.id)
        : database.prepare(`
          UPDATE user_inventory SET quantity = quantity - 1, updated_at = CURRENT_TIMESTAMP
          WHERE discord_id = ? AND item_id = ? AND quantity > 1
        `).run(userId, item.id);
      if (Number(removed.changes) !== 1) {
        database.exec("ROLLBACK");
        return { reason: "not-owned" };
      }
    }
    let effectId: number;
    let expiresAt: number;
    if (existing && !definition.stackable) {
      expiresAt = Math.max(now, Number(existing["expiresAt"])) + definition.durationSeconds;
      database.prepare("UPDATE active_effects SET expires_at = ? WHERE id = ?").run(expiresAt, Number(existing["id"]));
      effectId = Number(existing["id"]);
    } else {
      expiresAt = now + definition.durationSeconds;
      const result = database.prepare(`
        INSERT INTO active_effects (discord_id, effect_id, effect_type, magnitude, started_at, expires_at, source_item_id, stackable)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(userId, definition.effectId, definition.type, definition.magnitude, now, expiresAt, item.id, definition.stackable ? 1 : 0);
      effectId = Number(result.lastInsertRowid);
    }
    database.exec("COMMIT");
    return {
      id: effectId,
      effectId: definition.effectId,
      type: definition.type,
      magnitude: definition.magnitude,
      startedAt: now,
      expiresAt,
      sourceItemId: item.id,
      stackable: definition.stackable,
    };
  } catch (error) {
    database.exec("ROLLBACK");
    throw error;
  }
}

export function activateItemEffect(
  userId: string,
  itemId: string,
  username = "Unknown Record",
  avatarUrl: string | null = null,
): { ok: true; effect: ActiveEffect; item: Item; extended: boolean } | { ok: false; reason: "invalid-item" | "not-usable" | "invalid-effect" | "not-owned" } {
  const item = getItem(itemId);
  if (!item) return { ok: false, reason: "invalid-item" };
  if (!item.usable) return { ok: false, reason: "not-usable" };
  const before = getActiveEffects(userId, username, avatarUrl).some((effect) => effect.type === effectDefinition(item)?.type);
  const result = upsertEffect(userId, item, username, avatarUrl, true);
  if ("reason" in result) return { ok: false, reason: result.reason as "invalid-effect" | "not-owned" };
  return { ok: true, effect: result, item, extended: before };
}

export function forceItemEffect(userId: string, itemId: string, username = "Unknown Record", avatarUrl: string | null = null): ActiveEffect | undefined {
  const item = getItem(itemId);
  if (!item?.usable) return undefined;
  const result = upsertEffect(userId, item, username, avatarUrl, false);
  return "reason" in result ? undefined : result;
}

export function clearActiveEffects(userId: string): number {
  return Number(database.prepare("DELETE FROM active_effects WHERE discord_id = ?").run(userId).changes);
}

export function useItem(userId: string, itemId: string, effect?: (item: Item) => void): { ok: boolean; reason?: string; item?: Item } {
  const item = getItem(itemId);
  if (!item) return { ok: false, reason: "invalid-item" };
  if (!item.usable) return { ok: false, reason: "not-usable", item };
  if (!hasItem(userId, itemId)) return { ok: false, reason: "not-owned", item };
  database.exec("BEGIN IMMEDIATE");
  try {
    if (!removeItem(userId, itemId, 1)) {
      database.exec("ROLLBACK");
      return { ok: false, reason: "not-owned", item };
    }
    effect?.(item);
    database.exec("COMMIT");
    return { ok: true, item };
  } catch (error) {
    database.exec("ROLLBACK");
    throw error;
  }
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

export function getAchievementProgress(userId: string, achievementId: string): AchievementProgress | null {
  const count = (query: string, ...params: string[]) =>
    Number((database.prepare(query).get(...params) as { count?: number } | undefined)?.count ?? 0);
  const activity = count("SELECT interaction_count AS count FROM user_activity WHERE discord_id = ?", userId);
  const titles = count("SELECT COUNT(*) AS count FROM user_titles WHERE discord_id = ?", userId);
  const lore = count("SELECT COUNT(*) AS count FROM user_lore WHERE discord_id = ?", userId);
  const secretLore = count(`
    SELECT COUNT(*) AS count FROM user_lore ul JOIN lore_entries le ON le.id = ul.lore_id
    WHERE ul.discord_id = ? AND le.is_secret = 1
  `, userId);
  const curses = count("SELECT COUNT(DISTINCT curse_id) AS count FROM curse_history WHERE target_id = ?", userId);
  const contractsCreated = count("SELECT COUNT(*) AS count FROM contracts WHERE creator_id = ? OR recipient_id = ?", userId, userId);
  const completedContracts = count("SELECT COUNT(*) AS count FROM contracts WHERE status = 'Completed' AND (creator_id = ? OR recipient_id = ?)", userId, userId);
  const targets: Record<string, { current: number; target: number; label: string }> = {
    "first-record": { current: database.prepare("SELECT 1 FROM profiles WHERE discord_id = ?").get(userId) ? 1 : 0, target: 1, label: "profile created" },
    "familiar-face": { current: activity, target: 3, label: "interactions" },
    devoted: { current: activity, target: 10, label: "interactions" },
    "the-devoted-record": { current: activity, target: 25, label: "interactions" },
    courtier: { current: titles, target: 10, label: "titles" },
    collector: { current: titles, target: 20, label: "titles" },
    archivist: { current: lore, target: 25, label: "lore entries" },
    "archive-heart": { current: lore, target: 40, label: "lore entries" },
    "marked": { current: curses, target: 1, label: "different curses" },
    cursed: { current: curses, target: 3, label: "different curses" },
    "many-marks": { current: curses, target: 5, label: "different curses" },
    oathbound: { current: completedContracts, target: 1, label: "completed contracts" },
    contractor: { current: completedContracts, target: 3, label: "completed contracts" },
    "unbroken-ledger": { current: completedContracts, target: 5, label: "completed contracts" },
    "ten-contracts": { current: completedContracts, target: 10, label: "completed contracts" },
    "first-title": { current: titles, target: 4, label: "titles" },
    "first-lore": { current: lore, target: 1, label: "lore entries" },
    "first-curse": { current: curses, target: 1, label: "different curses" },
    "first-contract": { current: contractsCreated, target: 1, label: "contracts created" },
    "secret-page": { current: secretLore, target: 1, label: "secret lore entries" },
  };
  const progress = targets[achievementId];
  if (!progress) return null;
  return { ...progress, current: Math.min(progress.current, progress.target) };
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
  const rareLore = Number((database.prepare(`
    SELECT COUNT(*) AS count FROM user_lore ul JOIN lore_entries le ON le.id = ul.lore_id
    WHERE ul.discord_id = ? AND le.rarity IN ('Rare', 'Legendary')
  `).get(userId) as { count: number }).count);
  const contractsCreated = Number((database.prepare(`
    SELECT COUNT(*) AS count FROM contracts WHERE creator_id = ? OR recipient_id = ?
  `).get(userId, userId) as { count: number }).count);
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
  if (titles > 3) unlocked.add("first-title");
  if (lore > 0) unlocked.add("first-lore");
  if (curses > 0) unlocked.add("first-curse");
  if (contractsCreated > 0) unlocked.add("first-contract");
  if (rareLore > 0) unlocked.add("rare-page");
  if (completedContracts >= 10) unlocked.add("ten-contracts");
  if (secretLore > 0) unlocked.add("secret-page");
  if (titles > 0 && lore >= 10) unlocked.add("archive-court");
  if (completedContracts > 0 && lore > 0 && curses > 0) unlocked.add("woven-record");
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
    unlocked.push({ ...achievement, unlockedAt });
  }
  return unlocked;
}

export type ProgressionUpdate = {
  event: ProgressionEvent;
  achievements: UnlockedAchievement[];
  titleIds: string[];
  loreIds: string[];
};

export function processProgressionEvent(
  userId: string,
  username: string,
  avatarUrl: string | null,
  event: ProgressionEvent,
): ProgressionUpdate {
  ensureProfile(userId, username, avatarUrl);
  unlockPassportStamps(userId, username, avatarUrl);
  const before = new Set(
    (database.prepare("SELECT title_id AS titleId FROM user_titles WHERE discord_id = ?").all(userId) as Array<{ titleId: string }>)
      .map((row) => row.titleId),
  );
  const achievements = unlockEligibleAchievements(userId);
  const loreIds = unlockProgressionLore(userId, username, avatarUrl);
  const followUpAchievements = loreIds.length > 0 ? unlockEligibleAchievements(userId) : [];
  const allAchievements = [...achievements, ...followUpAchievements];
  const titleIds = (database.prepare("SELECT title_id AS titleId FROM user_titles WHERE discord_id = ?").all(userId) as Array<{ titleId: string }>)
    .map((row) => row.titleId)
    .filter((titleId) => !before.has(titleId));
  return { event, achievements: allAchievements, titleIds, loreIds };
}

export function developerUnlockAchievement(userId: string, achievementId: string, username: string, avatarUrl: string | null): UnlockedAchievement | undefined {
  ensureProfile(userId, username, avatarUrl);
  const achievement = getAchievement(achievementId);
  if (!achievement) return undefined;
  const existing = database.prepare("SELECT 1 FROM user_achievements WHERE discord_id = ? AND achievement_id = ?").get(userId, achievementId);
  if (existing) return getUnlockedAchievements(userId, username, avatarUrl).find((entry) => entry.id === achievementId);
  const unlockedAt = new Date().toISOString();
  database.prepare("INSERT INTO user_achievements (discord_id, achievement_id, unlocked_at) VALUES (?, ?, ?)").run(userId, achievementId, unlockedAt);
  return { ...achievement, unlockedAt };
}

export function grantTitle(userId: string, titleId: string, username: string, avatarUrl: string | null): boolean {
  ensureProfile(userId, username, avatarUrl);
  const result = database.prepare("INSERT OR IGNORE INTO user_titles (discord_id, title_id) VALUES (?, ?)").run(userId, titleId);
  return Number(result.changes) > 0;
}

export function resetAchievementProgress(userId: string): number {
  const result = database.prepare("DELETE FROM user_achievements WHERE discord_id = ?").run(userId);
  return Number(result.changes);
}

export function getGuildPrefix(guildId: string): string {
  return (database.prepare("SELECT prefix FROM guild_prefixes WHERE guild_id = ?").get(guildId) as { prefix?: string } | undefined)?.prefix ?? "z!";
}

export function ensureGuildPrefix(guildId: string): void {
  database.prepare(`
    INSERT OR IGNORE INTO guild_prefixes (guild_id, prefix) VALUES (?, 'z!')
  `).run(guildId);
}

export function setGuildPrefix(guildId: string, prefix: string): void {
  database.prepare(`
    INSERT INTO guild_prefixes (guild_id, prefix) VALUES (?, ?)
    ON CONFLICT(guild_id) DO UPDATE SET prefix = excluded.prefix
  `).run(guildId, prefix);
}

export function resetGuildPrefix(guildId: string): void {
  database.prepare("DELETE FROM guild_prefixes WHERE guild_id = ?").run(guildId);
}

export function recordTutorialAction(userId: string, username: string, avatarUrl: string | null, action: string): void {
  ensureProfile(userId, username, avatarUrl);
  database.prepare(`
    INSERT INTO tutorial_actions (discord_id, action, action_count) VALUES (?, ?, 1)
    ON CONFLICT(discord_id, action) DO UPDATE SET action_count = action_count + 1
  `).run(userId, action);
}

export function getTutorialActions(userId: string): Record<string, number> {
  const actions: Record<string, number> = {};
  for (const row of database.prepare("SELECT action, action_count AS count FROM tutorial_actions WHERE discord_id = ?").all(userId) as Array<{ action: string; count: number }>) {
    actions[row.action] = Number(row.count);
  }
  return actions;
}

export function getTutorialObjectives(userId: string): Array<{ pageNumber: number; objectiveId: string }> {
  return database.prepare(`
    SELECT page_number AS pageNumber, objective_id AS objectiveId
    FROM tutorial_objectives WHERE discord_id = ? ORDER BY page_number, objective_id
  `).all(userId) as Array<{ pageNumber: number; objectiveId: string }>;
}

export function completeTutorialObjective(userId: string, pageNumber: number, objectiveId: string): boolean {
  const result = database.prepare(`
    INSERT OR IGNORE INTO tutorial_objectives (discord_id, page_number, objective_id)
    VALUES (?, ?, ?)
  `).run(userId, pageNumber, objectiveId);
  return Number(result.changes) > 0;
}

export function getTutorialRewards(userId: string): number[] {
  return (database.prepare("SELECT page_number AS pageNumber FROM tutorial_rewards WHERE discord_id = ? ORDER BY page_number").all(userId) as Array<{ pageNumber: number }>)
    .map((row) => Number(row.pageNumber));
}

export function claimTutorialReward(userId: string, pageNumber: number): boolean {
  const result = database.prepare(`
    INSERT OR IGNORE INTO tutorial_rewards (discord_id, page_number) VALUES (?, ?)
  `).run(userId, pageNumber);
  return Number(result.changes) > 0;
}

export function resetTutorialProgress(userId: string): void {
  database.exec("BEGIN");
  try {
    database.prepare("DELETE FROM tutorial_actions WHERE discord_id = ?").run(userId);
    database.prepare("DELETE FROM tutorial_objectives WHERE discord_id = ?").run(userId);
    database.prepare("DELETE FROM tutorial_rewards WHERE discord_id = ?").run(userId);
    database.exec("COMMIT");
  } catch (error) {
    database.exec("ROLLBACK");
    throw error;
  }
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

function unlockProgressionLore(userId: string, username: string, avatarUrl: string | null): string[] {
  const profile = getProfile(userId, username, avatarUrl);
  const completedContracts = Number((database.prepare(`
    SELECT COUNT(*) AS count FROM contracts
    WHERE status = 'Completed' AND (creator_id = ? OR recipient_id = ?)
  `).get(userId, userId) as { count: number }).count);
  const discoveredLore = Number((database.prepare("SELECT COUNT(*) AS count FROM user_lore WHERE discord_id = ?").get(userId) as { count: number }).count);
  const curses = Number((database.prepare("SELECT COUNT(DISTINCT curse_id) AS count FROM curse_history WHERE target_id = ?").get(userId) as { count: number }).count);
  const tutorialComplete = database.prepare(`
    SELECT COUNT(*) AS count FROM tutorial_rewards WHERE discord_id = ?
  `).get(userId) as { count: number };
  const archiveCourt = database.prepare(`
    SELECT 1 FROM user_achievements WHERE discord_id = ? AND achievement_id = 'archive-court'
  `).get(userId);
  const candidates = [
    completedContracts > 0 && discoveredLore > 0 ? "ledger-without-end" : null,
    curses > 0 && profile.titlesOwned > 3 ? "violet-ritual-margin" : null,
    Number(tutorialComplete.count) >= 6 && archiveCourt ? "crown-beneath-ashes" : null,
  ].filter((entry): entry is string => Boolean(entry));
  const unlocked: string[] = [];
  for (const loreId of candidates) {
    if (database.prepare("SELECT 1 FROM user_lore WHERE discord_id = ? AND lore_id = ?").get(userId, loreId)) continue;
    const entry = getLoreEntry(loreId);
    if (!entry) continue;
    const text = renderLore(entry.bodyTemplate, userId, profile, entry.id);
    database.prepare(`
      INSERT INTO user_lore (discord_id, lore_id, rendered_text, discovered_at)
      VALUES (?, ?, ?, ?)
    `).run(userId, entry.id, text, new Date().toISOString());
    unlocked.push(loreId);
  }
  return unlocked;
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
    database.prepare("DELETE FROM tutorial_actions WHERE discord_id = ?").run(userId);
    database.prepare("DELETE FROM tutorial_objectives WHERE discord_id = ?").run(userId);
    database.prepare("DELETE FROM tutorial_rewards WHERE discord_id = ?").run(userId);
    database.prepare("DELETE FROM user_inventory WHERE discord_id = ?").run(userId);
    database.prepare("DELETE FROM currency_transactions WHERE discord_id = ?").run(userId);
    database.prepare("DELETE FROM currency_balances WHERE discord_id = ?").run(userId);
    database.prepare("DELETE FROM reward_claims WHERE discord_id = ?").run(userId);
    database.prepare("DELETE FROM venture_runs WHERE discord_id = ?").run(userId);
    database.prepare("DELETE FROM venture_cooldowns WHERE discord_id = ?").run(userId);
    database.prepare("DELETE FROM user_progression WHERE discord_id = ?").run(userId);
    database.prepare("DELETE FROM profiles WHERE discord_id = ?").run(userId);
    database.prepare("DELETE FROM users WHERE discord_id = ?").run(userId);
    database.exec("COMMIT");
  } catch (error) {
    database.exec("ROLLBACK");
    throw error;
  }
}