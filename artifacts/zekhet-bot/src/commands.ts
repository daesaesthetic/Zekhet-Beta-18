import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonInteraction,
  ButtonStyle,
  ChatInputCommandInteraction,
  EmbedBuilder,
  Message,
  ModalBuilder,
  ModalSubmitInteraction,
  PermissionFlagsBits,
  SlashCommandBuilder,
  TextInputBuilder,
  TextInputStyle,
  User,
} from "discord.js";
import { config } from "./config.js";
import {
  equipTitle,
  discoverLore,
  getDiscoveredLore,
  getLoreCatalog,
  getLoreEntry,
  getOwnedTitles,
  getProfile,
  getTitle,
  getTitles,
  getActiveCurses,
  getCurse,
  getCurses,
  createContract,
  getContract,
  getContractsForUser,
  inflictCurse,
  updateContractStatus,
  updateProfile,
  clearActiveCurses,
  developerApplyCurse,
  resetUserData,
  unlockAllLore,
  unlockAllTitles,
  getAchievements,
  getAchievement,
  getAchievementProgress,
  getUnlockedAchievements,
  developerUnlockAchievement,
  recordInteraction,
  processProgressionEvent,
  resetAchievementProgress,
  getGuildPrefix,
  setGuildPrefix,
  resetGuildPrefix,
  recordTutorialAction,
  getTutorialActions,
  getTutorialObjectives,
  completeTutorialObjective,
  getTutorialRewards,
  claimTutorialReward,
  resetTutorialProgress,
  getProgression,
  getInventory,
  getItem,
  getItemQuantity,
  getCurrencyBalance,
  getPassport,
  unlockPassportStamps,
  getPassportStamps,
  grantPassportStamp,
  resetPassportStamps,
  unlockAllPassportStamps,
  setPassportStatusOverride,
  clearPassportStatusOverride,
  type PassportStatus,
  type ActiveCurse,
  type Contract,
  type ContractTemplate,
  type Curse,
  type OwnedTitle,
  type DiscoveredLore,
  type LoreEntry,
  type Profile,
  type Title,
  type Achievement,
  type UnlockedAchievement,
  type Item,
  type InventoryEntry,
  type Passport,
  type UnlockedPassportStamp,
} from "./database.js";
import { achievementRewards, formatRewards, grantAchievementReward, grantRewards, progressionSummary, type Rewards } from "./rewards.js";

const themes = ["Nightshade", "Celestial", "Eclipse", "Ancient", "Royal", "Void"] as const;
const dialogue = {
  profileView: [
    "⛤ Zekhet retrieves your record from the archives.",
    "⛤ Your record has been brought before you.",
    "The archives have yielded your name.",
    "Zekhet opens the appropriate ledger.",
    "The record has been located.",
  ],
  profileEdit: [
    "The Record has been amended.",
    "The archives have accepted the revision.",
    "Zekhet has made the requested note.",
    "The ledger reflects your change.",
  ],
  titleEquip: [
    "⛤ The title has been placed upon your Record.",
    "Zekhet recognizes your new designation.",
    "The Court has acknowledged your claim.",
    "Your name now carries another distinction.",
    "The archives have amended your Record.",
  ],
  titleInspect: [
    "The Court presents the designation for inspection.",
    "Zekhet turns the title toward the light.",
    "The requested distinction has been retrieved.",
  ],
  loreDiscover: [
    "⛤ Another page has revealed itself.",
    "The Archives have surrendered another record.",
    "An unfamiliar entry has surfaced.",
    "Zekhet turns the page without comment.",
  ],
  rareLore: [
    "⛤ The Archives have yielded something unusual.",
    "This record was not meant to be found.",
    "Zekhet pauses before revealing the entry.",
  ],
  secretLore: [
    "⛤ CLASSIFIED ARCHIVE",
    "...You were not supposed to find this.",
    "The archive has no explanation for your access.",
    "Zekhet closes the ledger rather quickly.",
  ],
  cooldown: [
    "⛤ The archives require a moment before another request.",
    "Zekhet closes the ledger. Try again shortly.",
    "Even Zekhet permits the records to rest.",
  ],
  curseCooldown: [
    "The ritual has not yet recovered.",
    "The ritual circle is still cooling.",
    "The mark must wait before it can be invoked again.",
  ],
  curseApplied: [
    "The ritual is complete.",
    "The mark has been entered into the Record.",
    "The Court has witnessed the harmless invocation.",
  ],
  contractCreated: [
    "The Ledger has accepted the proposed agreement.",
    "The agreement has been written and offered for consideration.",
    "Zekhet records the offer without taking sides.",
  ],
  contractChanged: [
    "The Ledger has been amended.",
    "Zekhet has recorded the new standing of the agreement.",
    "The contract now bears its latest judgment.",
  ],
  titleMissing: [
    "That name is absent from the Court.",
    "Zekhet finds no such title in the records.",
    "The requested title does not exist in the archive.",
  ],
  titleLocked: [
    "You do not possess that title. The Court has not released it.",
    "That designation remains locked to your Record.",
    "The Court recognizes the title, but not yet your claim to it.",
  ],
  contractMissing: [
    "That agreement is absent from the Ledger.",
    "The requested contract does not exist.",
    "Zekhet finds no such entry among the agreements.",
  ],
  permissionDenied: [
    "The Ledger does not recognize you as a party to that agreement.",
    "Only the named parties may alter this record.",
    "That page is not open to your name.",
  ],
  rareAside: [
    "⛤ Zekhet stops writing.",
    "The page turns by itself.",
    "That was not in the archive a moment ago.",
  ],
} as const;

function pick<T>(items: readonly T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

function rareAside(): string {
  return Math.random() < 0.01 ? `\n\n_${pick(dialogue.rareAside)}_` : "";
}

function profileContext(profile: Profile): string {
  if (profile.activeCurses > 0) return "Zekhet notices the mark still resting upon your Record.";
  if (profile.contractsCompleted > 0) return "The Ledger records your agreements as settled.";
  if (profile.titlesOwned <= 0) return "The Court remains empty.";
  if (profile.titlesOwned >= 10) return "The Court has become rather crowded.";
  if (profile.loreDiscovered <= 1) return "The Archives contain surprisingly little about you.";
  if (profile.loreDiscovered >= 10) return "The Archives are beginning to require additional shelves.";
  return "The archives are becoming familiar with your name.";
}

const rarityColors: Record<Title["rarity"], number> = {
  Common: 0xaaa7b8,
  Uncommon: 0x65d18b,
  Rare: 0x5e9cff,
  Epic: 0xa873ff,
  Legendary: 0xffc857,
  Mythic: 0xff6bb5,
  Secret: 0x6e4b8e,
};
const loreRarityColors: Record<LoreEntry["rarity"], number> = {
  Common: 0xaaa7b8,
  Uncommon: 0x65d18b,
  Rare: 0x5e9cff,
  Legendary: 0xffc857,
  Secret: 0x6e4b8e,
};
const curseRarityColors: Record<Curse["rarity"], number> = {
  Common: 0xaaa7b8,
  Uncommon: 0x65d18b,
  Rare: 0x5e9cff,
  Epic: 0xa873ff,
  Legendary: 0xffc857,
  Mythic: 0xff6bb5,
  Secret: 0x6e4b8e,
};
const achievementRarityColors: Record<Achievement["rarity"], number> = {
  Common: 0xaaa7b8,
  Uncommon: 0x65d18b,
  Rare: 0x5e9cff,
  Epic: 0xa873ff,
  Legendary: 0xffc857,
  Secret: 0x6e4b8e,
};

type TutorialPage = {
  number: number;
  title: string;
  introduction: string;
  objectives: Array<{ id: string; label: string }>;
  reward: string;
  rewardTitleId?: string;
};
const tutorialPages: TutorialPage[] = [
  { number: 1, title: "THE FIRST RECORD", introduction: "Welcome to Zekhet. The Archives will guide you through the systems available to you.", objectives: [
    { id: "profile-view", label: "View your Record" }, { id: "bio-set", label: "Set a biography" }, { id: "theme-set", label: "Choose a profile theme" },
  ], reward: "A first lesson recorded.", rewardTitleId: "first-lesson" },
  { number: 2, title: "THE COURT", introduction: "The Court keeps the designations that may be placed upon a name.", objectives: [
    { id: "titles-view", label: "View available titles" }, { id: "title-inspect", label: "Inspect a title" }, { id: "title-equip", label: "Equip a title" },
  ], reward: "A starter designation for your Record.", rewardTitleId: "courtier" },
  { number: 3, title: "THE ARCHIVES", introduction: "Every discovered page makes the keeper's record a little less quiet.", objectives: [
    { id: "lore-discover", label: "Discover your first lore entry" }, { id: "lore-inspect", label: "Inspect a lore entry" }, { id: "lore-three", label: "Discover three lore entries" },
  ], reward: "A name among the archive hands.", rewardTitleId: "archive-apprentice" },
  { number: 4, title: "THE RITUALS", introduction: "The rituals are fictional marks only. They affect Zekhet's records and nothing beyond them.", objectives: [
    { id: "curses-view", label: "View the ritual catalog" }, { id: "curse-applied", label: "Experience or apply a harmless curse" }, { id: "curse-inspect", label: "Inspect a curse" },
  ], reward: "A witness to harmless ritual.", rewardTitleId: "ritual-witness" },
  { number: 5, title: "THE LEDGER", introduction: "The Ledger records social agreements between named parties. No money or permissions are involved.", objectives: [
    { id: "contract-create", label: "Create a contract" }, { id: "contract-accept", label: "Have a contract accepted" }, { id: "contract-complete", label: "Complete a contract" },
  ], reward: "A hand trusted by the Ledger.", rewardTitleId: "ledger-hand" },
  { number: 6, title: "THE ARCHIVIST", introduction: "You have seen the major records. Now explore them together and let the Archives acknowledge you.", objectives: [
    { id: "achievement-unlocked", label: "Unlock an achievement" }, { id: "titles-three", label: "Own three titles" }, { id: "lore-three-final", label: "Discover three lore entries" },
    { id: "contract-complete-final", label: "Complete a contract" }, { id: "systems-four", label: "Interact with four Zekhet systems" },
  ], reward: "The introductory records no longer require explanation.", rewardTitleId: "archive-adept" },
];

function syncTutorial(userId: string, username: string, avatarUrl: string | null): { completedPages: number[]; finalComplete: boolean } {
  const profile = getProfile(userId, username, avatarUrl);
  const actions = getTutorialActions(userId);
  const achievements = getUnlockedAchievements(userId, username, avatarUrl).length;
  const actionCount = (name: string) => actions[name] ?? 0;
  const objectivesByPage: Record<number, string[]> = {
    1: [
      ...(actionCount("profile-view") > 0 ? ["profile-view"] : []),
      ...(actionCount("bio-set") > 0 ? ["bio-set"] : []),
      ...(actionCount("theme-set") > 0 ? ["theme-set"] : []),
    ],
    2: [
      ...(actionCount("titles-view") > 0 ? ["titles-view"] : []),
      ...(actionCount("title-inspect") > 0 ? ["title-inspect"] : []),
      ...(actionCount("title-equip") > 0 ? ["title-equip"] : []),
    ],
    3: [
      ...(actionCount("lore-discover") > 0 ? ["lore-discover"] : []),
      ...(actionCount("lore-inspect") > 0 ? ["lore-inspect"] : []),
      ...(actionCount("lore-discover") >= 3 ? ["lore-three"] : []),
    ],
    4: [
      ...(actionCount("curses-view") > 0 ? ["curses-view"] : []),
      ...(actionCount("curse-applied") > 0 ? ["curse-applied"] : []),
      ...(actionCount("curse-inspect") > 0 ? ["curse-inspect"] : []),
    ],
    5: [
      ...(actionCount("contract-create") > 0 ? ["contract-create"] : []),
      ...(actionCount("contract-accept") > 0 ? ["contract-accept"] : []),
      ...(actionCount("contract-complete") > 0 ? ["contract-complete"] : []),
    ],
    6: [
      ...(achievements > 0 ? ["achievement-unlocked"] : []),
      ...(profile.titlesOwned >= 3 ? ["titles-three"] : []),
      ...(profile.loreDiscovered >= 3 ? ["lore-three-final"] : []),
      ...(profile.contractsCompleted >= 1 ? ["contract-complete-final"] : []),
      ...(actionCount("system-interaction") >= 4 ? ["systems-four"] : []),
    ],
  };
  const existing = new Set(getTutorialObjectives(userId).map((entry) => `${entry.pageNumber}:${entry.objectiveId}`));
  for (const page of tutorialPages) {
    for (const objectiveId of objectivesByPage[page.number]) {
      if (!existing.has(`${page.number}:${objectiveId}`)) completeTutorialObjective(userId, page.number, objectiveId);
    }
  }
  const claimed = new Set(getTutorialRewards(userId));
  const completedPages: number[] = [];
  for (const page of tutorialPages) {
    const complete = page.objectives.every((objective) => objectivesByPage[page.number].includes(objective.id));
    if (!complete || claimed.has(page.number)) continue;
    const reward: Rewards = page.rewardTitleId ? { unlocks: [{ type: "title", id: page.rewardTitleId }] } : {};
    if (grantRewards(userId, reward, { type: "tuto_objective", id: `page:${page.number}` }, { username, avatarUrl }).ok
      && claimTutorialReward(userId, page.number)) {
      completedPages.push(page.number);
      if (page.number === 1) unlockAchievementForUser(userId, "first-lesson", username, avatarUrl);
      if (page.number === 3) unlockAchievementForUser(userId, "student-of-the-archives", username, avatarUrl);
      if (page.number === tutorialPages.length) unlockAchievementForUser(userId, "tutorial-archivist", username, avatarUrl);
    }
  }
  return { completedPages, finalComplete: getTutorialRewards(userId).length === tutorialPages.length };
}

function forceTutorialPage(userId: string, username: string, avatarUrl: string | null, pageNumber: number): void {
  const page = tutorialPages[pageNumber - 1];
  if (!page) return;
  for (const objective of page.objectives) completeTutorialObjective(userId, page.number, objective.id);
  const reward: Rewards = page.rewardTitleId ? { unlocks: [{ type: "title", id: page.rewardTitleId }] } : {};
  if (!getTutorialRewards(userId).includes(page.number)
    && grantRewards(userId, reward, { type: "tuto_objective", id: `page:${page.number}` }, { username, avatarUrl }).ok
    && claimTutorialReward(userId, page.number)) {
    if (page.number === 1) unlockAchievementForUser(userId, "first-lesson", username, avatarUrl);
    if (page.number === 3) unlockAchievementForUser(userId, "student-of-the-archives", username, avatarUrl);
    if (page.number === tutorialPages.length) unlockAchievementForUser(userId, "tutorial-archivist", username, avatarUrl);
  }
}
const profileCommand = new SlashCommandBuilder()
  .setName("profile")
  .setDescription("Open or amend a personal Record.")
  .addSubcommand((sub) => sub.setName("view").setDescription("Open a Record.")
    .addUserOption((option) => option.setName("user").setDescription("The person whose Record to view.")))
  .addSubcommand((sub) => sub.setName("edit").setDescription("Edit your Record.")
    .addStringOption((option) => option.setName("bio").setDescription("A short personal bio.").setMaxLength(280))
    .addStringOption((option) => option.setName("color").setDescription("Embed accent color as #RRGGBB.").setMinLength(7).setMaxLength(7))
    .addStringOption((option) => option.setName("theme").setDescription("Choose a Record theme.")
      .addChoices(...themes.map((theme) => ({ name: theme, value: theme })))))
  .addSubcommand((sub) => sub.setName("bio").setDescription("Set your personal bio.")
    .addStringOption((option) => option.setName("text").setDescription("Your bio.").setRequired(true).setMaxLength(280)))
  .addSubcommand((sub) => sub.setName("color").setDescription("Set your profile accent color.")
    .addStringOption((option) => option.setName("hex").setDescription("A hex color, for example #b78cff.").setRequired(true)))
  .addSubcommand((sub) => sub.setName("theme").setDescription("Set your Record theme.")
    .addStringOption((option) => option.setName("name").setDescription("A theme name.").setRequired(true)
      .addChoices(...themes.map((theme) => ({ name: theme, value: theme })))));

const titleCommand = new SlashCommandBuilder()
  .setName("title")
  .setDescription("Consult the Court of titles.")
  .addSubcommand((sub) => sub.setName("view").setDescription("View your equipped title."))
  .addSubcommand((sub) => sub.setName("equip").setDescription("Equip one of your owned titles.")
    .addStringOption((option) => option.setName("title").setDescription("The title ID to equip.").setRequired(true)))
  .addSubcommand((sub) => sub.setName("inspect").setDescription("Inspect a title.")
    .addStringOption((option) => option.setName("title").setDescription("The title ID to inspect.").setRequired(true)));

const loreCommand = new SlashCommandBuilder()
  .setName("lore")
  .setDescription("Consult the personal Archives.")
  .addSubcommand((sub) => sub.setName("discover").setDescription("Discover a new archive entry."))
  .addSubcommand((sub) => sub.setName("archive").setDescription("Review your discovered archive entries."))
  .addSubcommand((sub) => sub.setName("inspect").setDescription("Inspect a discovered archive entry.")
    .addStringOption((option) => option.setName("entry").setDescription("The archive entry ID.").setRequired(true)));

const curseCommand = new SlashCommandBuilder()
  .setName("curse")
  .setDescription("Invoke a harmless ritual from the Veiled Court.")
  .addSubcommand((sub) => sub.setName("user").setDescription("Place a fictional curse upon another user's Zekhet record.")
    .addUserOption((option) => option.setName("user").setDescription("The user to mark.").setRequired(true)))
  .addSubcommand((sub) => sub.setName("active").setDescription("View active curses upon a record.")
    .addUserOption((option) => option.setName("user").setDescription("The record to inspect.")))
  .addSubcommand((sub) => sub.setName("list").setDescription("Browse the catalog of fictional curses."))
  .addSubcommand((sub) => sub.setName("inspect").setDescription("Inspect a curse in the catalog.")
    .addStringOption((option) => option.setName("curse").setDescription("The curse ID to inspect.").setRequired(true)));

const achievementCommand = new SlashCommandBuilder()
  .setName("achievement")
  .setDescription("Consult the records of your achievements.")
  .addSubcommand((sub) => sub.setName("inspect").setDescription("Inspect an achievement.")
    .addStringOption((option) => option.setName("achievement").setDescription("The achievement ID to inspect.").setRequired(true)));

const prefixCommand = new SlashCommandBuilder()
  .setName("prefix")
  .setDescription("View or change this server's text command prefix.")
  .addSubcommand((sub) => sub.setName("view").setDescription("View the current prefix."))
  .addSubcommand((sub) => sub.setName("set").setDescription("Set a new prefix.")
    .addStringOption((option) => option.setName("prefix").setDescription("A short prefix such as z!").setRequired(true).setMaxLength(5)))
  .addSubcommand((sub) => sub.setName("reset").setDescription("Restore the default z! prefix."));

const contractTemplates: ContractTemplate[] = [
  "Duel", "Challenge", "Pizza", "Favor", "Trade", "Promise", "Bet",
  "Dare", "Alliance", "Service", "Oath",
  "Journey", "Gift", "Riddle", "Vow",
];
const contractTemplateDescriptions: Record<ContractTemplate, string> = {
  Duel: "A friendly contest witnessed by the Ledger.",
  Challenge: "A harmless task offered for bragging rights.",
  Pizza: "A social promise involving pizza, never payment.",
  Favor: "One good turn recorded for later remembrance.",
  Trade: "An exchange of fictional or social contributions.",
  Promise: "A clear promise placed under the keeper's eye.",
  Bet: "A fictional wager with no real money involved.",
  Dare: "A playful dare with no harmful consequences.",
  Alliance: "A temporary pact between two named Records.",
  Service: "A harmless act of assistance owed between parties.",
  Oath: "A solemn social commitment written in the old style.",
  Journey: "A shared undertaking from one threshold to another.",
  Gift: "A non-monetary offering of time, words, or attention.",
  Riddle: "A puzzle agreed upon by both sides of the Ledger.",
  Vow: "A lasting intention, spoken plainly and recorded.",
};
const contractCommand = new SlashCommandBuilder()
  .setName("contract")
  .setDescription("Create and manage fictional social agreements.")
  .addSubcommand((sub) => sub.setName("create").setDescription("Offer a contract to another user.")
    .addUserOption((option) => option.setName("user").setDescription("The recipient of the agreement.").setRequired(true))
    .addStringOption((option) => option.setName("description").setDescription("The harmless social agreement.").setRequired(true).setMaxLength(1000))
    .addStringOption((option) => option.setName("template").setDescription("An optional Ledger template.")
      .addChoices(...contractTemplates.map((template) => ({ name: template, value: template }))))
    .addIntegerOption((option) => option.setName("expiration_days").setDescription("Optional lifetime in days.").setMinValue(1).setMaxValue(365)))
  .addSubcommand((sub) => sub.setName("accept").setDescription("Accept a contract offered to you.")
    .addStringOption((option) => option.setName("id").setDescription("The contract ID.").setRequired(true)))
  .addSubcommand((sub) => sub.setName("reject").setDescription("Reject a contract offered to you.")
    .addStringOption((option) => option.setName("id").setDescription("The contract ID.").setRequired(true)))
  .addSubcommand((sub) => sub.setName("inspect").setDescription("Inspect a contract you are party to.")
    .addStringOption((option) => option.setName("id").setDescription("The contract ID.").setRequired(true)))
  .addSubcommand((sub) => sub.setName("complete").setDescription("Mark an accepted contract complete.")
    .addStringOption((option) => option.setName("id").setDescription("The contract ID.").setRequired(true)))
  .addSubcommand((sub) => sub.setName("cancel").setDescription("Cancel a pending or accepted contract.")
    .addStringOption((option) => option.setName("id").setDescription("The contract ID.").setRequired(true)));

const itemCommand = new SlashCommandBuilder()
  .setName("item")
  .setDescription("Inspect an item recorded in the item catalog.")
  .addSubcommand((sub) => sub.setName("inspect").setDescription("Inspect an item.")
    .addStringOption((option) => option.setName("item").setDescription("The item ID to inspect.").setRequired(true)));

const balanceCommand = new SlashCommandBuilder()
  .setName("balance")
  .setDescription("View the Deben held by your Record.");

const passportCommand = new SlashCommandBuilder()
  .setName("passport")
  .setDescription("View the official record of your accomplishments.")
  .addUserOption((option) => option.setName("user").setDescription("The Passport to inspect."));

export const commands = [
  new SlashCommandBuilder().setName("help").setDescription("Consult Zekhet's available records."),
  new SlashCommandBuilder().setName("credits").setDescription("See who keeps Zekhet's records."),
  new SlashCommandBuilder().setName("developer").setDescription("Open the restricted developer control panel."),
  new SlashCommandBuilder().setName("inventory").setDescription("View the items owned by your Record."),
  balanceCommand,
  new SlashCommandBuilder().setName("progress").setDescription("View your XP, level, and rank progression."),
  passportCommand,
  itemCommand,
  profileCommand,
  new SlashCommandBuilder().setName("titles").setDescription("View your owned titles and the Court."),
  titleCommand,
  loreCommand,
  curseCommand,
  new SlashCommandBuilder().setName("achievements").setDescription("View your achievements and sealed records."),
  achievementCommand,
  prefixCommand,
  new SlashCommandBuilder().setName("tuto").setDescription("Begin or continue Zekhet's introductory records."),
  contractCommand,
  new SlashCommandBuilder().setName("contracts").setDescription("Review contracts connected to your Record."),
].map((command) => command.toJSON());

function developerPanel() {
  return {
    embeds: [new EmbedBuilder()
      .setColor(0xa873ff)
      .setAuthor({ name: "⛤ DEVELOPER ARCHIVE ⛤" })
      .setTitle("Content review panel")
      .setDescription("This private panel exposes the current catalog for controlled testing. It does not alter ordinary user permissions or Discord server state.")],
    components: [
      new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder().setCustomId("developer:titles").setLabel("View All Titles").setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId("developer:unlock-titles").setLabel("Unlock Any Title").setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId("developer:lore").setLabel("View All Lore").setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId("developer:unlock-lore").setLabel("Unlock Any Lore").setStyle(ButtonStyle.Primary),
      ),
      new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder().setCustomId("developer:curses").setLabel("View All Curses").setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId("developer:apply-curse").setLabel("Apply Any Curse").setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId("developer:contracts").setLabel("View All Contracts").setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId("developer:create-contract").setLabel("Create Test Contract").setStyle(ButtonStyle.Primary),
      ),
      new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder().setCustomId("developer:clear-curses").setLabel("Clear Active Curses").setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId("developer:reset").setLabel("Reset Test Data").setStyle(ButtonStyle.Danger),
        new ButtonBuilder().setCustomId("developer:profile").setLabel("View Profile Data").setStyle(ButtonStyle.Secondary),
      ),
      new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder().setCustomId("developer:achievements").setLabel("View All Achievements").setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId("developer:unlock-achievement").setLabel("Unlock Achievement").setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId("developer:test-achievement").setLabel("Test Unlock Notice").setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId("developer:reset-achievements").setLabel("Reset Achievements").setStyle(ButtonStyle.Danger),
      ),
      new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder().setCustomId("developer:tutorial-view").setLabel("View Tutorial").setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId("developer:tutorial-unlock").setLabel("Unlock Next Chapter").setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId("developer:tutorial-complete").setLabel("Complete Tutorial").setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId("developer:tutorial-reset").setLabel("Reset Tutorial").setStyle(ButtonStyle.Danger),
        new ButtonBuilder().setCustomId("developer:progression-check").setLabel("Run Progression Check").setStyle(ButtonStyle.Primary),
      ),
      new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder().setCustomId("developer:passport-view").setLabel("View Passport Data").setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId("developer:passport-unlock-all").setLabel("Unlock All Stamps").setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId("developer:passport-grant").setLabel("Grant Stamp").setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId("developer:passport-reset").setLabel("Reset Stamps").setStyle(ButtonStyle.Danger),
      ),
      new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder().setCustomId("developer:passport-status").setLabel("Test Passport Status").setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId("developer:passport-status-clear").setLabel("Use Derived Status").setStyle(ButtonStyle.Secondary),
      ),
    ],
  };
}

export async function handleDeveloperComponent(interaction: ButtonInteraction): Promise<void> {
  if (!interaction.customId.startsWith("developer:")) return;
  if (interaction.user.id !== config.developerId) {
    await interaction.reply({ content: "You do not have access to that panel.", ephemeral: true });
    return;
  }

  const section = interaction.customId.split(":")[1];
  if (section === "unlock-titles") {
    const count = unlockAllTitles(interaction.user.id, interaction.user.username, interaction.user.displayAvatarURL());
    await interaction.reply({ content: `Developer access granted: ${count} previously locked title(s) are now on your Record.`, ephemeral: true });
    return;
  }
  if (section === "unlock-lore") {
    const count = unlockAllLore(interaction.user.id, interaction.user.username, interaction.user.displayAvatarURL());
    await interaction.reply({ content: `Developer access granted: ${count} previously classified archive entr${count === 1 ? "y is" : "ies are"} now available on your Record.`, ephemeral: true });
    return;
  }
  if (section === "unlock-achievement") {
    const modal = new ModalBuilder().setCustomId("developer:unlock-achievement-modal").setTitle("Unlock Achievement");
    const achievementId = new TextInputBuilder()
      .setCustomId("achievement-id")
      .setLabel("Achievement ID")
      .setStyle(TextInputStyle.Short)
      .setRequired(true)
      .setPlaceholder("for example: first-record");
    modal.addComponents(new ActionRowBuilder<TextInputBuilder>().addComponents(achievementId));
    await interaction.showModal(modal);
    return;
  }
  if (section === "test-achievement") {
    const achievement = getAchievements()[0];
    const unlocked = achievement && unlockAchievementForUser(
      interaction.user.id,
      achievement.id,
      interaction.user.username,
      interaction.user.displayAvatarURL(),
    );
    await interaction.reply({
      content: unlocked ? achievementNotification(unlocked) : "No achievement is available to test.",
      ephemeral: true,
    });
    return;
  }
  if (section === "reset-achievements") {
    const count = resetAchievementProgress(interaction.user.id);
    await interaction.reply({ content: `Reset ${count} achievement record(s) from your Record.`, ephemeral: true });
    return;
  }
  if (section === "tutorial-view") {
    const page = Math.min(tutorialPages.length, getTutorialRewards(interaction.user.id).length + 1);
    await interaction.reply({ embeds: [tutorialPageEmbed(interaction.user, page)], components: [tutorialButtons(page)], ephemeral: true });
    return;
  }
  if (section === "tutorial-unlock") {
    const page = Math.min(tutorialPages.length, getTutorialRewards(interaction.user.id).length + 1);
    forceTutorialPage(interaction.user.id, interaction.user.username, interaction.user.displayAvatarURL(), page);
    await interaction.reply({ content: `Developer access: tutorial chapter ${page} is now complete.`, ephemeral: true });
    return;
  }
  if (section === "tutorial-complete") {
    for (const page of tutorialPages) forceTutorialPage(interaction.user.id, interaction.user.username, interaction.user.displayAvatarURL(), page.number);
    await interaction.reply({ content: "Developer access: all tutorial chapters and rewards are complete.", ephemeral: true });
    return;
  }
  if (section === "tutorial-reset") {
    resetTutorialProgress(interaction.user.id);
    await interaction.reply({ content: "Your tutorial progress and tutorial rewards have been reset.", ephemeral: true });
    return;
  }
  if (section === "progression-check") {
    const progression = processProgressionEvent(
      interaction.user.id,
      interaction.user.username,
      interaction.user.displayAvatarURL(),
      "ACHIEVEMENT_UNLOCKED",
    );
    await interaction.reply({
      content: progressionNotice(progression, {
        id: interaction.user.id,
        username: interaction.user.username,
        avatarUrl: interaction.user.displayAvatarURL(),
      }) || "Progression checked. No new interconnected rewards are currently eligible.",
      ephemeral: true,
    });
    return;
  }
  if (section === "passport-view") {
    const passport = getPassport(interaction.user.id, interaction.user.username, interaction.user.displayAvatarURL());
    await interaction.reply({
      content: `Passport data (developer-only): #${String(passport.number).padStart(4, "0")} · status ${passport.status} · ${passport.stamps.length} stamp(s) · level ${passport.records.level}.`,
      ephemeral: true,
    });
    return;
  }
  if (section === "passport-unlock-all") {
    const count = unlockAllPassportStamps(interaction.user.id, interaction.user.username, interaction.user.displayAvatarURL());
    await interaction.reply({ content: `Developer access granted: ${count} Passport stamp(s) added to your Record.`, ephemeral: true });
    return;
  }
  if (section === "passport-reset") {
    const count = resetPassportStamps(interaction.user.id);
    await interaction.reply({ content: `Reset ${count} Passport stamp record(s). Your accomplishments remain intact.`, ephemeral: true });
    return;
  }
  if (section === "passport-grant") {
    const modal = new ModalBuilder().setCustomId("developer:passport-grant-modal").setTitle("Grant Passport Stamp");
    const stampId = new TextInputBuilder()
      .setCustomId("stamp-id")
      .setLabel("Passport stamp ID")
      .setStyle(TextInputStyle.Short)
      .setRequired(true)
      .setPlaceholder("for example: first-discovery");
    modal.addComponents(new ActionRowBuilder<TextInputBuilder>().addComponents(stampId));
    await interaction.showModal(modal);
    return;
  }
  if (section === "passport-status") {
    const modal = new ModalBuilder().setCustomId("developer:passport-status-modal").setTitle("Test Passport Status");
    const status = new TextInputBuilder()
      .setCustomId("status")
      .setLabel("Status")
      .setStyle(TextInputStyle.Short)
      .setRequired(true)
      .setPlaceholder("Archivist");
    modal.addComponents(new ActionRowBuilder<TextInputBuilder>().addComponents(status));
    await interaction.showModal(modal);
    return;
  }
  if (section === "passport-status-clear") {
    clearPassportStatusOverride(interaction.user.id);
    await interaction.reply({ content: "Passport status now follows derived progression again.", ephemeral: true });
    return;
  }
  if (section === "apply-curse") {
    const curse = getCurses()[0];
    const applied = curse && developerApplyCurse(
      interaction.user.id,
      interaction.user.id,
      curse.id,
      interaction.user.username,
      interaction.user.username,
      interaction.user.displayAvatarURL(),
    );
    await interaction.reply({ content: applied ? `Test curse applied to your Record: **${applied.name}**.` : "No curse is available to apply.", ephemeral: true });
    return;
  }
  if (section === "clear-curses") {
    const count = clearActiveCurses(interaction.user.id);
    await interaction.reply({ content: `Cleared ${count} active test curse(s) from your Record.`, ephemeral: true });
    return;
  }
  if (section === "reset") {
    await interaction.reply({
      content: "This removes only your Zekhet test data, including your profile, titles, lore, curses, and contracts. Confirm the reset?",
      ephemeral: true,
      components: [new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder().setCustomId("developer:confirm-reset").setLabel("Confirm Reset").setStyle(ButtonStyle.Danger),
        new ButtonBuilder().setCustomId("developer:cancel-reset").setLabel("Cancel").setStyle(ButtonStyle.Secondary),
      )],
    });
    return;
  }
  if (section === "confirm-reset") {
    resetUserData(interaction.user.id);
    await interaction.update({ content: "Your Zekhet test data has been reset. No other user or database record was changed.", embeds: [], components: [] });
    return;
  }
  if (section === "cancel-reset") {
    await interaction.update({ content: "Reset cancelled. Your test data remains unchanged.", embeds: [], components: [] });
    return;
  }
  if (section === "create-contract") {
    const modal = new ModalBuilder().setCustomId("developer:create-contract-modal").setTitle("Create Test Contract");
    const recipient = new TextInputBuilder()
      .setCustomId("recipient-id")
      .setLabel("Recipient Discord user ID")
      .setStyle(TextInputStyle.Short)
      .setRequired(true)
      .setMinLength(17)
      .setMaxLength(32);
    const description = new TextInputBuilder()
      .setCustomId("description")
      .setLabel("Test agreement description")
      .setStyle(TextInputStyle.Paragraph)
      .setRequired(true)
      .setMaxLength(1000);
    modal.addComponents(
      new ActionRowBuilder<TextInputBuilder>().addComponents(recipient),
      new ActionRowBuilder<TextInputBuilder>().addComponents(description),
    );
    await interaction.showModal(modal);
    return;
  }
  if (section === "profile") {
    const profile = getProfile(interaction.user.id, interaction.user.username, interaction.user.displayAvatarURL());
    await interaction.reply({
      content: `Profile data (developer-only): titles owned ${profile.titlesOwned}, lore discovered ${profile.loreDiscovered}, active curses ${profile.activeCurses}, contracts created ${profile.contractsCreated}, contracts completed ${profile.contractsCompleted}.`,
      ephemeral: true,
    });
    return;
  }
  const descriptions: Record<string, string> = {
    titles: getTitles().map((title) => `\`${title.id}\` · ${title.name} · ${title.rarity}${title.isSecret ? " · 🔒 secret" : ""}`).join("\n") || "No titles are recorded.",
    lore: getLoreCatalog().map((entry) => `\`${entry.id}\` · #${entry.entryNumber} · ${entry.rarity}${entry.isSecret ? " · 🔒 classified" : ""}`).join("\n") || "No lore is recorded.",
    curses: getCurses().map((curse) => `\`${curse.id}\` · ${curse.name} · ${curse.durationMinutes}m`).join("\n") || "No curses are recorded.",
    contracts: getContractsForUser(interaction.user.id).map((contract) => `#${contract.id} · ${contract.status} · ${contract.description}`).join("\n") || "No contracts are attached to your Record.",
    achievements: getAchievements().map((achievement) => `\`${achievement.id}\` · ${achievement.name} · ${achievement.rarity}${achievement.isHidden ? " · 🔒 hidden" : ""}`).join("\n") || "No achievements are recorded.",
  };
  const titles: Record<string, string> = {
    titles: "All titles",
    lore: "All lore entries",
    curses: "All curses",
    contracts: "Your contracts",
    achievements: "All achievements",
  };
  await interaction.update({
    ...developerPanel(),
    embeds: [new EmbedBuilder()
      .setColor(0xa873ff)
      .setAuthor({ name: "⛤ DEVELOPER ARCHIVE ⛤" })
      .setTitle(titles[section] ?? "Content review")
      .setDescription(descriptions[section] ?? "Choose a section from the panel.")],
  });
}

export async function handleDeveloperModal(interaction: ModalSubmitInteraction): Promise<void> {
  if (interaction.customId === "developer:passport-status-modal") {
    if (interaction.user.id !== config.developerId) {
      await interaction.reply({ content: "You do not have access to that panel.", ephemeral: true });
      return;
    }
    const status = interaction.fields.getTextInputValue("status").trim().replace(/\s+/g, " ");
    const validStatuses: PassportStatus[] = ["Unrecorded", "Recognized", "Acquainted", "Citizen", "Courtier", "Archivist", "Keeper", "Exalted"];
    const selected = validStatuses.find((candidate) => candidate.toLowerCase() === status.toLowerCase());
    if (!selected) {
      await interaction.reply({ content: `Choose one of: ${validStatuses.join(", ")}.`, ephemeral: true });
      return;
    }
    setPassportStatusOverride(interaction.user.id, selected, interaction.user.username, interaction.user.displayAvatarURL());
    await interaction.reply({ content: `Developer Passport status override set to **${selected}**.`, ephemeral: true });
    return;
  }
  if (interaction.customId === "developer:passport-grant-modal") {
    if (interaction.user.id !== config.developerId) {
      await interaction.reply({ content: "You do not have access to that panel.", ephemeral: true });
      return;
    }
    const stampId = interaction.fields.getTextInputValue("stamp-id").trim().toLowerCase();
    const stamp = grantPassportStamp(interaction.user.id, stampId, interaction.user.username, interaction.user.displayAvatarURL());
    await interaction.reply({
      content: stamp ? `Passport stamp recorded: **${stamp.name}** · ${stamp.rarity}.` : "That Passport stamp ID is absent from the records.",
      ephemeral: true,
    });
    return;
  }
  if (interaction.customId === "developer:unlock-achievement-modal") {
    if (interaction.user.id !== config.developerId) {
      await interaction.reply({ content: "You do not have access to that panel.", ephemeral: true });
      return;
    }
    const achievementId = interaction.fields.getTextInputValue("achievement-id").trim().toLowerCase();
    const unlocked = unlockAchievementForUser(
      interaction.user.id,
      achievementId,
      interaction.user.username,
      interaction.user.displayAvatarURL(),
    );
    await interaction.reply({
      content: unlocked ? achievementNotification(unlocked) : "That achievement ID is absent from the records.",
      ephemeral: true,
    });
    return;
  }
  if (interaction.customId !== "developer:create-contract-modal") return;
  if (interaction.user.id !== config.developerId) {
    await interaction.reply({ content: "You do not have access to that panel.", ephemeral: true });
    return;
  }
  const recipientId = interaction.fields.getTextInputValue("recipient-id").trim();
  const description = interaction.fields.getTextInputValue("description").trim();
  if (!/^\d{17,20}$/.test(recipientId)) {
    await interaction.reply({ content: "That does not look like a Discord user ID.", ephemeral: true });
    return;
  }
  const target = await interaction.client.users.fetch(recipientId).catch(() => null);
  if (!target) {
    await interaction.reply({ content: "Zekhet could not resolve that Discord user ID.", ephemeral: true });
    return;
  }
  const result = createContract(
    interaction.user.id,
    interaction.user.username,
    interaction.user.displayAvatarURL(),
    target.id,
    target.username,
    target.displayAvatarURL(),
    description,
    "Challenge",
    7,
  );
  if (!result.ok) {
    await interaction.reply({ content: "A test contract still needs a different recipient than the developer.", ephemeral: true });
    return;
  }
  await interaction.reply({ content: `Test contract **#${result.contract.id}** created for <@${target.id}>.`, embeds: [contractEmbed(result.contract)], ephemeral: true });
}

function colorFromProfile(profile: Profile): number {
  return Number.parseInt(profile.color.slice(1), 16);
}

function progressBar(current: number, total: number, width = 10): string {
  if (total <= 0) return "░".repeat(width);
  const filled = Math.min(width, Math.round((current / total) * width));
  return `${"█".repeat(filled)}${"░".repeat(width - filled)}`;
}

function profileEmbed(profile: Profile, user: User): EmbedBuilder {
  const completedPages = getTutorialRewards(profile.userId).length;
  const completedObjectives = getTutorialObjectives(profile.userId).length;
  const totalObjectives = tutorialPages.reduce((total, page) => total + page.objectives.length, 0);
  const currentPage = completedPages >= tutorialPages.length ? tutorialPages.length : completedPages + 1;
  const inventoryCount = getInventory(profile.userId).reduce((total, entry) => total + entry.quantity, 0);
  const progression = getProgression(profile.userId, profile.username, profile.avatarUrl);
  const allAchievements = getAchievements();
  const unlockedAchievements = getUnlockedAchievements(profile.userId, profile.username, profile.avatarUrl);
  return new EmbedBuilder()
    .setColor(colorFromProfile(profile))
    .setAuthor({ name: "⛤ THE RECORD ⛤", iconURL: user.displayAvatarURL({ size: 128 }) })
    .setThumbnail(user.displayAvatarURL({ size: 256 }))
    .setTitle(`${profile.username}'s Record`)
    .setDescription(`${pick(dialogue.profileView)}${rareAside()}\n\n${profile.bio || "_No biography has been entered._"}\n\n_${profileContext(profile)}_`)
    .addFields(
      { name: "Equipped title", value: profile.title, inline: true },
      { name: "Record number", value: `#${String(profile.profileNumber).padStart(4, "0")}`, inline: true },
      { name: "Theme", value: profile.theme, inline: true },
      { name: "Tuto", value: `${progressBar(completedPages, tutorialPages.length)}\n${completedPages} / ${tutorialPages.length} pages · currently Chapter ${currentPage}`, inline: false },
      { name: "Objectives", value: `${progressBar(completedObjectives, totalObjectives)}\n${completedObjectives} / ${totalObjectives} completed`, inline: false },
      { name: "Progression", value: progressionSummary(progression), inline: false },
      { name: "Records", value: `Titles **${profile.titlesOwned}** · Lore **${profile.loreDiscovered}**`, inline: true },
      { name: "Passport", value: `#${String(profile.passportNumber).padStart(4, "0")}`, inline: true },
      { name: "Achievements", value: `${progressBar(unlockedAchievements.length, allAchievements.length)}\n**${unlockedAchievements.length} / ${allAchievements.length}** unlocked`, inline: true },
      { name: "Ledger", value: `Contracts created **${profile.contractsCreated}** · completed **${profile.contractsCompleted}** · active curses **${profile.activeCurses}**`, inline: false },
      { name: "Inventory", value: inventoryCount > 0 ? `${inventoryCount} item${inventoryCount === 1 ? "" : "s"} held` : "No items recorded", inline: true },
    )
    .setFooter({ text: `Recorded ${new Date(profile.createdAt).toLocaleDateString("en-US")} · Use /inventory for item details` });
}

const passportRarityColors: Record<UnlockedPassportStamp["rarity"], number> = {
  Common: 0xaaa7b8,
  Uncommon: 0x65d18b,
  Rare: 0x5e9cff,
  Epic: 0xa873ff,
  Legendary: 0xffc857,
  Mythic: 0xff6bb5,
  Secret: 0x6e4b8e,
};

function passportButtons(): ActionRowBuilder<ButtonBuilder> {
  return new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder().setCustomId("passport:records").setLabel("Records").setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId("passport:stamps").setLabel("Stamps").setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId("passport:progress").setLabel("Progress").setStyle(ButtonStyle.Secondary),
  );
}

function passportEmbed(passport: Passport, user: User): EmbedBuilder {
  const { records } = passport;
  const stampText = passport.stamps.length
    ? passport.stamps.slice(0, 5).map((stamp) => `${stamp.secret ? "🌑" : "⛤"} ${stamp.name}`).join("\n")
    : "_No stamps have been collected._";
  return new EmbedBuilder()
    .setColor(0x8d4ca8)
    .setAuthor({ name: "⛤ THE ZEKHET PASSPORT ⛤", iconURL: user.displayAvatarURL({ size: 128 }) })
    .setTitle(`Passport No. #${String(passport.number).padStart(4, "0")}`)
    .setDescription(`**${user.username.toUpperCase()}**\n\n_"The Archives recognize this individual."_`)
    .addFields(
      { name: "STATUS", value: passport.status, inline: true },
      { name: "RANK", value: records.rank, inline: true },
      { name: "LEVEL", value: String(records.level), inline: true },
      { name: "RECORD", value: `👑 Titles · **${records.titles}**\n📜 Lore · **${records.lore}**\n🏆 Achievements · **${records.achievements}**\n⚖️ Completed contracts · **${records.completedContracts}**\n🧿 Curses · **${records.curses}**\n🎒 Items · **${records.items}**`, inline: false },
      { name: `PASSPORT STAMPS · ${passport.stamps.length}`, value: stampText, inline: false },
    )
    .setFooter({ text: "Issued by ⛤ Zekhet · Use the buttons to inspect the record." });
}

function passportRecordsEmbed(passport: Passport, user: User): EmbedBuilder {
  const { records } = passport;
  return new EmbedBuilder()
    .setColor(0x7e4bb8)
    .setAuthor({ name: "⛤ PASSPORT RECORDS ⛤", iconURL: user.displayAvatarURL({ size: 128 }) })
    .setTitle(`#${String(passport.number).padStart(4, "0")} · ${passport.status}`)
    .addFields(
      { name: "Titles", value: `${records.titles} / ${records.totalTitles}`, inline: true },
      { name: "Lore", value: `${records.lore} / ${records.totalLore}`, inline: true },
      { name: "Achievements", value: `${records.achievements} / ${records.totalAchievements}`, inline: true },
      { name: "Contracts", value: `${records.completedContracts} completed · ${records.contracts} connected`, inline: true },
      { name: "Curses", value: `${records.curses} / ${records.totalCurses}`, inline: true },
      { name: "Items", value: `${records.items} / ${records.totalItems}`, inline: true },
      { name: "Tutorial", value: `${records.tutorialPages} / ${records.totalTutorialPages} chapters`, inline: true },
    )
    .setFooter({ text: "Totals update automatically as the Zekhet catalog grows." });
}

function passportStampsEmbed(passport: Passport, user: User): EmbedBuilder {
  const unlockedIds = new Set(passport.stamps.map((stamp) => stamp.id));
  const unlockedText = passport.stamps.length
    ? passport.stamps.map((stamp) => `${stamp.secret ? "🌑" : "⛤"} **${stamp.name}** · ${stamp.rarity}\n_${stamp.description}_`).join("\n\n")
    : "_The Passport bears no stamps yet._";
  const lockedNormal = getPassportStamps(user.id, user.username, user.displayAvatarURL());
  const lockedText = "Further stamps await recognition. Secret stamps remain sealed until discovered.";
  return new EmbedBuilder()
    .setColor(0x7e4bb8)
    .setAuthor({ name: "🎟️ PASSPORT STAMPS 🎟️", iconURL: user.displayAvatarURL({ size: 128 }) })
    .setTitle(`Collected · ${passport.stamps.length}`)
    .setDescription(`${unlockedText}\n\n**LOCKED**\n${lockedNormal.length === 0 || unlockedIds.size < 0 ? lockedText : lockedText}`)
    .setFooter({ text: "A stamp is a permanent mark of something Zekhet remembers." });
}

function passportProgressEmbed(passport: Passport, user: User): EmbedBuilder {
  const { records } = passport;
  return new EmbedBuilder()
    .setColor(0x7e4bb8)
    .setAuthor({ name: "📊 PASSPORT PROGRESS 📊", iconURL: user.displayAvatarURL({ size: 128 }) })
    .setTitle(`${user.username}'s advancement`)
    .addFields(
      { name: "Level", value: String(records.level), inline: true },
      { name: "XP", value: records.xp.toLocaleString("en-US"), inline: true },
      { name: "Rank", value: records.rank, inline: true },
      { name: "Status", value: passport.status, inline: true },
      { name: "Deben", value: `${getCurrencyBalance(user.id, user.username, user.displayAvatarURL()).toLocaleString("en-US")}`, inline: true },
      { name: "Collections", value: `Titles ${records.titles}/${records.totalTitles} · Lore ${records.lore}/${records.totalLore}\nAchievements ${records.achievements}/${records.totalAchievements} · Items ${records.items}/${records.totalItems}`, inline: false },
    )
    .setFooter({ text: "The Passport summarizes your path; use the existing commands for detail." });
}

export async function handlePassportComponent(interaction: ButtonInteraction): Promise<void> {
  if (!interaction.customId.startsWith("passport:")) return;
  const passport = getPassport(interaction.user.id, interaction.user.username, interaction.user.displayAvatarURL());
  const page = interaction.customId.split(":")[1];
  const embed = page === "records" ? passportRecordsEmbed(passport, interaction.user)
    : page === "stamps" ? passportStampsEmbed(passport, interaction.user)
      : passportProgressEmbed(passport, interaction.user);
  await interaction.update({ embeds: [embed], components: [passportButtons()] });
}

function progressEmbed(user: User): EmbedBuilder {
  const progression = getProgression(user.id, user.username, user.displayAvatarURL());
  return new EmbedBuilder()
    .setColor(0xa873ff)
    .setAuthor({ name: "✦ THE PATH OF ASCENSION ✦", iconURL: user.displayAvatarURL({ size: 128 }) })
    .setTitle(`${user.username}'s Progression`)
    .setDescription("The Archives measure advancement by experience gathered through future records and rewards.")
    .addFields(
      { name: "Rank", value: `**${progression.rank}**`, inline: true },
      { name: "Level", value: `**${progression.level}**`, inline: true },
      { name: "Total XP", value: progression.xp.toLocaleString("en-US"), inline: true },
      { name: "Next level", value: progressionSummary(progression), inline: false },
    )
    .setFooter({ text: "XP, currency, items, and unlocks are processed by the Unified Reward System." });
}

function achievementLabel(achievement: Achievement, unlocked: boolean): string {
  return achievement.isHidden && !unlocked ? "🔒 ???" : `**${achievement.name}** · ${achievement.rarity}`;
}

function awardAchievements(
  achievements: Achievement[],
  userId: string,
  username: string,
  avatarUrl: string | null,
): void {
  for (const achievement of achievements) {
    grantAchievementReward(userId, achievement, { username, avatarUrl });
  }
}

function unlockAchievementForUser(
  userId: string,
  achievementId: string,
  username: string,
  avatarUrl: string | null,
): UnlockedAchievement | undefined {
  const unlocked = developerUnlockAchievement(userId, achievementId, username, avatarUrl);
  if (unlocked) awardAchievements([unlocked], userId, username, avatarUrl);
  return unlocked;
}

function achievementNotification(achievement: Achievement | UnlockedAchievement): string {
  const dramatic = achievement.rarity === "Secret" || achievement.rarity === "Legendary";
  return `⛤ ACHIEVEMENT UNLOCKED ⛤\n\n${dramatic ? "🌑" : "🏺"} ${achievement.name}\n\n_${achievement.description}_\n\nRarity: ${achievement.rarity}\n\n**Rewards**\n${formatRewards(achievementRewards(achievement))}`;
}

function progressionNotice(update: {
  achievements: UnlockedAchievement[];
  titleIds: string[];
  loreIds?: string[];
}, user?: { id: string; username: string; avatarUrl: string | null }): string {
  if (user) awardAchievements(update.achievements, user.id, user.username, user.avatarUrl);
  const achievementTitleIds = new Set(update.achievements.map((achievement) => achievement.rewardTitleId).filter(Boolean));
  const titleNotices = update.titleIds
    .filter((titleId) => !achievementTitleIds.has(titleId))
    .map((titleId) => getTitle(titleId))
    .filter((title): title is Title => Boolean(title))
    .map((title) => `⛤ NEW TITLE ACQUIRED ⛤\n\n📜 **${title.name}**\n\n_${title.description}_`);
  const loreNotices = (update.loreIds ?? []).map((loreId) =>
    `⛤ THE ARCHIVES HAVE CHANGED ⛤\n\nA new record has appeared: \`${loreId}\`.`,
  );
  return [...update.achievements.map(achievementNotification), ...titleNotices, ...loreNotices].join("\n\n");
}

function achievementEmbed(achievement: Achievement, unlocked: boolean): EmbedBuilder {
  return new EmbedBuilder()
    .setColor(achievementRarityColors[achievement.rarity])
    .setAuthor({ name: "🏺 THE ACHIEVEMENTS 🏺" })
    .setTitle(achievementLabel(achievement, unlocked))
    .setDescription(unlocked || !achievement.isHidden
      ? achievement.description
      : "Some records are better left unopened.")
    .addFields(
      { name: "Category", value: achievement.category, inline: true },
      { name: "Rarity", value: unlocked || !achievement.isHidden ? achievement.rarity : "Secret", inline: true },
      { name: "Status", value: unlocked ? "Unlocked" : "Locked", inline: true },
    );
}

function achievementsEmbed(all: Achievement[], unlocked: UnlockedAchievement[], userId: string): EmbedBuilder {
  const unlockedIds = new Set(unlocked.map((entry) => entry.id));
  const lines = all.map((achievement) =>
    `${unlockedIds.has(achievement.id) ? "✦" : achievement.isHidden ? "🔒" : "○"} ${achievementLabel(achievement, unlockedIds.has(achievement.id))}${getAchievementProgress(userId, achievement.id) && !unlockedIds.has(achievement.id)
      ? `\n  ${getAchievementProgress(userId, achievement.id)!.current}/${getAchievementProgress(userId, achievement.id)!.target} ${getAchievementProgress(userId, achievement.id)!.label}`
      : ""}`,
  );
  const fields: Array<{ name: string; value: string }> = [];
  let fieldLines: string[] = [];
  let fieldLength = 0;
  for (const line of lines) {
    const nextLength = fieldLength + (fieldLines.length > 0 ? 1 : 0) + line.length;
    if (fieldLines.length > 0 && nextLength > 950) {
      fields.push({
        name: `Records ${fields.length + 1}`,
        value: fieldLines.join("\n"),
      });
      fieldLines = [];
      fieldLength = 0;
    }
    fieldLines.push(line);
    fieldLength += (fieldLines.length > 1 ? 1 : 0) + line.length;
  }
  if (fieldLines.length > 0) {
    fields.push({
      name: `Records ${fields.length + 1}`,
      value: fieldLines.join("\n"),
    });
  }

  const embed = new EmbedBuilder()
    .setColor(0x7e4bb8)
    .setAuthor({ name: "🏺 THE ACHIEVEMENTS 🏺" })
    .setTitle("Personal Achievements")
    .setDescription("The Court rewards records that are lived, revisited, and remembered.")
    .setFooter({ text: "Hidden achievements reveal themselves only when the record is complete." });
  if (fields.length > 0) {
    fields[0].name = `Unlocked · ${unlocked.length} / ${all.length}`;
    embed.addFields(fields);
  } else {
    embed.addFields({ name: `Unlocked · ${unlocked.length} / ${all.length}`, value: "_No achievements are recorded._" });
  }
  return embed;
}

function titleLabel(title: Title | OwnedTitle, owned = false): string {
  if (title.isSecret && !owned) return "🔒 ???";
  return `**${title.name}** · ${title.rarity}`;
}

function titleEmbed(title: Title, owned: boolean, equipped = false): EmbedBuilder {
  return new EmbedBuilder()
    .setColor(rarityColors[title.rarity])
    .setAuthor({ name: "👑 THE COURT 👑" })
    .setTitle(titleLabel(title, owned))
    .setDescription(`${owned ? (equipped ? pick(dialogue.titleEquip) : pick(dialogue.titleInspect)) : title.isSecret ? "This title remains sealed." : pick(dialogue.titleInspect)}\n\n${owned ? title.description : (title.isSecret ? "This title remains sealed." : title.description)}`)
    .addFields(
      { name: "Title ID", value: `\`${title.id}\``, inline: true },
      { name: "Rarity", value: title.rarity, inline: true },
      { name: "Status", value: equipped ? "Equipped" : owned ? "Owned" : "Locked", inline: true },
    );
}

function titlesEmbed(ownedTitles: OwnedTitle[]): EmbedBuilder {
  const ownedIds = new Set(ownedTitles.map((title) => title.id));
  const catalog = getTitles();
  const ownedText = ownedTitles.length > 0
    ? ownedTitles.map((title) => `${title.equipped ? "✦ " : ""}${titleLabel(title, true)}\n\`${title.id}\``).join("\n")
    : "_No titles have been claimed._";
  const lockedText = catalog
    .filter((title) => !ownedIds.has(title.id))
    .map((title) => `${titleLabel(title)}\n\`${title.id}\``)
    .join("\n");

  return new EmbedBuilder()
    .setColor(0x7e4bb8)
    .setAuthor({ name: "👑 THE COURT 👑" })
    .setTitle("Titles")
    .setDescription(`${ownedTitles.length === 0 ? "The Court remains empty." : ownedTitles.length >= 10 ? "The Court has become rather crowded." : "The Court has yielded its current designations."}\n\nA title may be owned many times across the Court, but only one may be worn upon a Record.`)
    .addFields(
      { name: `Owned · ${ownedTitles.length}`, value: ownedText },
      { name: "The sealed court", value: lockedText || "_No sealed titles remain._" },
    )
    .setFooter({ text: "Use /title equip title:<id> to wear an owned title." });
}

const itemRarityColors: Record<Item["rarity"], number> = {
  Common: 0xaaa7b8,
  Uncommon: 0x65d18b,
  Rare: 0x5e9cff,
  Epic: 0xa873ff,
  Legendary: 0xffc857,
  Mythic: 0xff6bb5,
};

function inventoryEmbed(inventory: InventoryEntry[]): EmbedBuilder {
  const rarityOrder: Item["rarity"][] = ["Mythic", "Legendary", "Epic", "Rare", "Uncommon", "Common"];
  const itemText = inventory.length
    ? rarityOrder
      .map((rarity) => {
        const entries = inventory.filter((entry) => entry.rarity === rarity);
        return entries.length
          ? `**${rarity}**\n${entries.map((entry) => `${entry.icon} **${entry.name}** × ${entry.quantity}\n\`${entry.id}\` · ${entry.category}`).join("\n")}`
          : "";
      })
      .filter(Boolean)
      .join("\n\n")
    : "_Your Record contains no items._";
  return new EmbedBuilder()
    .setColor(0x7e4bb8)
    .setAuthor({ name: "𓂀 THE RELICS 𓂀" })
    .setTitle("The Keeper's Collection")
    .setDescription(inventory.length
      ? "The keeper has arranged the artifacts currently held by your Record."
      : "The shelves are empty. No placeholder items have been added.")
    .addFields({ name: `Owned Items · ${inventory.length}`, value: itemText })
    .setFooter({ text: "Use /item inspect item:<id> to examine an item." });
}

function itemEmbed(item: Item, quantity: number): EmbedBuilder {
  return new EmbedBuilder()
    .setColor(itemRarityColors[item.rarity])
    .setAuthor({ name: "🎒 THE INVENTORY 🎒" })
    .setTitle(`${item.icon} ${item.name}`)
    .setDescription(item.description)
    .addFields(
      { name: "Item ID", value: `\`${item.id}\``, inline: true },
      { name: "Rarity", value: item.rarity, inline: true },
      { name: "Category", value: item.category, inline: true },
      { name: "Owned", value: String(quantity), inline: true },
      { name: "Stacking", value: item.stackable ? `Up to ${item.maxStack}` : "Unique", inline: true },
      { name: "Usable", value: item.usable ? "Yes" : "No", inline: true },
      { name: "Tradable", value: item.tradable ? "Planned" : "No", inline: true },
    )
    .setFooter({ text: "Item effects are delegated to future reward systems." });
}

function loreEmbed(lore: DiscoveredLore, profile: Profile): EmbedBuilder {
  const discoveryLine = lore.rarity === "Secret"
    ? pick(dialogue.secretLore)
    : lore.rarity === "Legendary"
      ? pick(dialogue.rareLore)
      : pick(dialogue.loreDiscover);
  return new EmbedBuilder()
    .setColor(loreRarityColors[lore.rarity])
    .setAuthor({ name: "📜 THE ARCHIVES 📜" })
    .setTitle(`⛤ ARCHIVE ENTRY #${lore.entryNumber} ⛤`)
    .setDescription(`${discoveryLine}${rareAside()}\n\n**${profile.username.toUpperCase()}** — **${profile.title.toUpperCase()}**\n\n${lore.text}`)
    .addFields(
      { name: "Rarity", value: lore.rarity, inline: true },
      { name: "Discoveries", value: String(profile.loreDiscovered), inline: true },
    )
    .setFooter({ text: "The archive records only what Zekhet can observe." });
}

function classifiedLoreEmbed(entry: LoreEntry): EmbedBuilder {
  return new EmbedBuilder()
    .setColor(loreRarityColors.Secret)
    .setAuthor({ name: "📜 THE ARCHIVES 📜" })
    .setTitle("🔒 CLASSIFIED ARCHIVE")
    .setDescription(`${pick(dialogue.secretLore)}\n\nSome portions of this record have been sealed.`)
    .addFields(
      { name: "Entry", value: `#${entry.entryNumber}`, inline: true },
      { name: "Rarity", value: entry.rarity, inline: true },
      { name: "Status", value: "Locked", inline: true },
    );
}

function archiveEmbed(discovered: DiscoveredLore[], catalog: LoreEntry[]): EmbedBuilder {
  const discoveredIds = new Set(discovered.map((entry) => entry.id));
  const discoveredText = discovered.length
    ? discovered.map((entry) => `**#${entry.entryNumber}** · ${entry.rarity}\n\`${entry.id}\``).join("\n")
    : "_No archive entries have been discovered._";
  const sealedCount = catalog.filter((entry) => entry.isSecret && !discoveredIds.has(entry.id)).length;
  return new EmbedBuilder()
    .setColor(0x7e4bb8)
    .setAuthor({ name: "📜 THE ARCHIVES 📜" })
    .setTitle("Personal Archive")
    .setDescription("The Archives preserve only fragments Zekhet has actually recorded.")
    .addFields(
      { name: `Discovered · ${discovered.length}`, value: discoveredText },
      { name: "Unopened records", value: `${catalog.filter((entry) => !entry.isSecret && !discoveredIds.has(entry.id)).length} entries remain undiscovered.` },
      { name: "Sealed records", value: `${sealedCount} classified entries remain beyond the visible archive.` },
    )
    .setFooter({ text: "Use /lore discover to seek another entry." });
}

function curseEmbed(curse: Curse): EmbedBuilder {
  return new EmbedBuilder()
    .setColor(curseRarityColors[curse.rarity])
    .setAuthor({ name: "🧿 THE RITUALS 🧿" })
    .setTitle(`⛤ ${curse.name.toUpperCase()} ⛤`)
    .setDescription(curse.description)
    .addFields(
      { name: "Curse ID", value: `\`${curse.id}\``, inline: true },
      { name: "Rarity", value: curse.rarity, inline: true },
      { name: "Duration", value: formatDuration(curse.durationMinutes * 60), inline: true },
      { name: "Cooldown", value: formatDuration(curse.cooldownSeconds), inline: true },
    )
    .setFooter({ text: "These rituals affect only Zekhet's own records." });
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds} seconds`;
  const minutes = Math.floor(seconds / 60);
  return `${minutes} minute${minutes === 1 ? "" : "s"}`;
}

function activeCurseEmbed(curse: ActiveCurse): EmbedBuilder {
  const remaining = Math.max(0, curse.expiresAt - Math.floor(Date.now() / 1000));
  return new EmbedBuilder()
    .setColor(curseRarityColors[curse.rarity])
    .setAuthor({ name: "🧿 THE RITUALS 🧿" })
    .setTitle(`⛤ ${curse.name.toUpperCase()} ⛤`)
    .setDescription(curse.description)
    .addFields(
      { name: "Afflicted record", value: `<@${curse.targetId}>`, inline: true },
      { name: "Rarity", value: curse.rarity, inline: true },
      { name: "Time remaining", value: formatDuration(remaining), inline: true },
    )
    .setFooter({ text: "The mark fades on its own and has no effect outside Zekhet." });
}

function curseListEmbed(curses: Curse[]): EmbedBuilder {
  return new EmbedBuilder()
    .setColor(0x7e4bb8)
    .setAuthor({ name: "🧿 THE RITUALS 🧿" })
    .setTitle("The Catalog of Curses")
    .setDescription("Harmless fictional marks that alter only Zekhet's responses and records.")
    .addFields({
      name: `${curses.length} recorded rituals`,
      value: curses.map((curse) => `**${curse.name}** · ${curse.rarity}\n\`${curse.id}\` · ${formatDuration(curse.durationMinutes * 60)} · cooldown ${formatDuration(curse.cooldownSeconds)}`).join("\n"),
    })
    .setFooter({ text: "Use /curse inspect curse:<id> to read a full entry." });
}

function activeCursesEmbed(user: User, curses: ActiveCurse[]): EmbedBuilder {
  return new EmbedBuilder()
    .setColor(0x7e4bb8)
    .setAuthor({ name: "🧿 THE RITUALS 🧿", iconURL: user.displayAvatarURL({ size: 128 }) })
    .setTitle(`${user.username}'s Active Curses`)
    .setDescription(curses.length
      ? curses.map((curse) => `**${curse.name}** · ${curse.rarity}\n${curse.description}\n**Fades in:** ${formatDuration(Math.max(0, curse.expiresAt - Math.floor(Date.now() / 1000)))}`).join("\n\n")
      : "_No fictional curses cling to this Record._")
    .setFooter({ text: "Curses affect only Zekhet's own systems." });
}

function contractStatusLabel(status: Contract["status"]): string {
  return {
    Pending: "AWAITING ACCEPTANCE",
    Accepted: "ACCEPTED",
    Rejected: "REJECTED",
    Completed: "COMPLETED",
    Expired: "EXPIRED",
    Cancelled: "CANCELLED",
  }[status];
}

function contractEmbed(contract: Contract): EmbedBuilder {
  const expiration = contract.expiresAt
    ? new Date(contract.expiresAt * 1000).toLocaleDateString("en-US")
    : "No expiration";
  return new EmbedBuilder()
    .setColor(contract.status === "Completed" ? 0x65d18b : contract.status === "Rejected" || contract.status === "Cancelled" || contract.status === "Expired" ? 0x6e4b8e : 0xa873ff)
    .setAuthor({ name: "⚖️ THE LEDGER ⚖️" })
    .setTitle(`⛤ CONTRACT #${contract.id} ⛤`)
    .addFields(
      { name: "PARTY A", value: `<@${contract.creatorId}>`, inline: true },
      { name: "PARTY B", value: `<@${contract.recipientId}>`, inline: true },
      { name: "STATUS", value: contractStatusLabel(contract.status), inline: true },
      { name: "AGREEMENT", value: `“${contract.description}”` },
       ...(contract.template ? [
         { name: "Template", value: contract.template, inline: true },
         { name: "Ledger wording", value: contractTemplateDescriptions[contract.template] },
       ] : []),
      { name: "Created", value: new Date(contract.createdAt * 1000).toLocaleDateString("en-US"), inline: true },
      { name: "Expires", value: expiration, inline: true },
    )
    .setFooter({ text: "The Ledger records fictional social agreements only. No payments or Discord permissions are involved." });
}

function contractsEmbed(user: User, contracts: Contract[]): EmbedBuilder {
  const text = contracts.length
    ? contracts.map((contract) => `**#${contract.id}** · ${contractStatusLabel(contract.status)}\n${contract.creatorId === user.id ? "To" : "From"} <@${contract.creatorId === user.id ? contract.recipientId : contract.creatorId}>\n${contract.description}`).join("\n\n")
    : "_No contracts are connected to this Record._";
  return new EmbedBuilder()
    .setColor(0x7e4bb8)
    .setAuthor({ name: "⚖️ THE LEDGER ⚖️", iconURL: user.displayAvatarURL({ size: 128 }) })
    .setTitle(`${user.username}'s Contracts`)
    .setDescription("The Ledger keeps harmless fictional agreements between named parties.")
    .addFields({ name: `Recorded contracts · ${contracts.length}`, value: text })
    .setFooter({ text: "Use /contract inspect id:<id> to open a full contract." });
}

function tutorialPageEmbed(user: User, pageNumber: number): EmbedBuilder {
  const profile = getProfile(user.id, user.username, user.displayAvatarURL());
  const status = syncTutorial(user.id, user.username, user.displayAvatarURL());
  const page = tutorialPages[Math.max(0, Math.min(tutorialPages.length - 1, pageNumber - 1))];
  const completed = new Set(getTutorialObjectives(user.id)
    .filter((objective) => objective.pageNumber === page.number)
    .map((objective) => objective.objectiveId));
  const pageUnlocked = page.number === 1 || getTutorialRewards(user.id).includes(page.number - 1);
  const progress = page.objectives.filter((objective) => completed.has(objective.id)).length;
  const reward: Rewards = page.rewardTitleId ? { unlocks: [{ type: "title", id: page.rewardTitleId }] } : {};
  return new EmbedBuilder()
    .setColor(0x7e4bb8)
    .setAuthor({ name: "📜 THE TUTORIAL 📜", iconURL: user.displayAvatarURL({ size: 128 }) })
    .setTitle(`⛤ ${page.number}/${tutorialPages.length} — ${page.title} ⛤`)
    .setDescription(pageUnlocked
      ? `${page.introduction}\n\n**OBJECTIVES**\n${page.objectives.map((objective) => `${completed.has(objective.id) ? "✓" : "○"} ${objective.label}`).join("\n")}\n\n**REWARD**\n${page.reward}\n${formatRewards(reward)}\n\n**Progress:** ${progress}/${page.objectives.length}`
      : "⛤ The Archives remain sealed ⛤\n\nComplete the previous chapter before proceeding.")
    .addFields(
      { name: "Overall progress", value: `${getTutorialRewards(user.id).length}/${tutorialPages.length} chapters complete`, inline: true },
      { name: "Record", value: `#${String(profile.profileNumber).padStart(4, "0")}`, inline: true },
    )
    .setFooter({ text: status.finalComplete ? "Tutorial complete · The Archives acknowledge you." : "Use the buttons to revisit available chapters." });
}

function tutorialButtons(pageNumber: number): ActionRowBuilder<ButtonBuilder> {
  return new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder().setCustomId(`tutorial:prev:${pageNumber}`).setLabel("Previous").setStyle(ButtonStyle.Secondary).setDisabled(pageNumber <= 1),
    new ButtonBuilder().setCustomId(`tutorial:next:${pageNumber}`).setLabel("Next").setStyle(ButtonStyle.Primary).setDisabled(pageNumber >= tutorialPages.length),
  );
}

export async function handleTutorialComponent(interaction: ButtonInteraction): Promise<void> {
  if (!interaction.customId.startsWith("tutorial:")) return;
  const [, direction, rawPage] = interaction.customId.split(":");
  const requested = Number(rawPage) + (direction === "next" ? 1 : -1);
  const rewards = getTutorialRewards(interaction.user.id);
  const unlockedPage = Math.min(tutorialPages.length, rewards.length + 1);
  const page = Math.max(1, Math.min(unlockedPage, requested));
  await interaction.update({ embeds: [tutorialPageEmbed(interaction.user, page)], components: [tutorialButtons(page)] });
}

function validPrefix(prefix: string): boolean {
  return /^[^\s\\/@#]{1,5}$/.test(prefix);
}

export async function handlePrefixCommand(message: Message): Promise<void> {
  if (!message.guild || message.author.bot) return;
  const prefix = getGuildPrefix(message.guild.id);
  if (!message.content.startsWith(prefix)) return;
  const input = message.content.slice(prefix.length).trim();
  if (!input) return;
  const [rawCommand, ...args] = input.split(/\s+/);
  const command = rawCommand.toLowerCase();
  const username = message.author.username;
  const avatarUrl = message.author.displayAvatarURL();
  const newlyUnlocked = recordInteraction(message.author.id, username, avatarUrl);
  awardAchievements(newlyUnlocked, message.author.id, username, avatarUrl);
  recordTutorialAction(message.author.id, username, avatarUrl, "system-interaction");
  const tutorialStatus = syncTutorial(message.author.id, username, avatarUrl);
  const tutorialNotice = tutorialStatus.completedPages.length
    ? `\n\n⛤ PAGE COMPLETE ⛤\nThe Archives have acknowledged chapter ${tutorialStatus.completedPages.join(", ")}.`
    : "";

  if (command === "help") {
    await message.reply("⛤ Zekhet commands ⛤\n`z!profile` · `z!passport` · `z!titles` · `z!lore` · `z!curse` · `z!contracts` · `z!achievements` · `z!tuto`\nSlash commands remain the primary interface.");
    return;
  }

  if (command === "balance") {
    const balance = getCurrencyBalance(message.author.id, username, avatarUrl);
    await message.reply(`𓂀 **THE TREASURY** 𓂀\nYour Record holds **${balance.toLocaleString("en-US")} Deben**.`);
    return;
  }
  if (command === "progress") {
    await message.reply({ embeds: [progressEmbed(message.author)] });
    return;
  }
  if (command === "passport") {
    const target = message.mentions.users.first() ?? message.author;
    const passport = getPassport(target.id, target.username, target.displayAvatarURL());
    await message.reply({ embeds: [passportEmbed(passport, target)], components: [passportButtons()] });
    return;
  }
  if (command === "credits") {
    await message.reply(`Zekhet was conceived, built, and kept by **${config.creator}**.`);
    return;
  }
  if (command === "profile") {
    recordTutorialAction(message.author.id, username, avatarUrl, "profile-view");
    await message.reply({ embeds: [profileEmbed(getProfile(message.author.id, username, avatarUrl), message.mentions.users.first() ?? message.author)] });
    return;
  }
  if (command === "titles") {
    recordTutorialAction(message.author.id, username, avatarUrl, "titles-view");
    await message.reply({ embeds: [titlesEmbed(getOwnedTitles(message.author.id, username, avatarUrl))] });
    return;
  }
  if (command === "lore") {
    await message.reply({ embeds: [archiveEmbed(getDiscoveredLore(message.author.id, username, avatarUrl), getLoreCatalog())] });
    return;
  }
  if (command === "curse") {
    await message.reply({ embeds: [curseListEmbed(getCurses())] });
    return;
  }
  if (command === "contracts") {
    await message.reply({ embeds: [contractsEmbed(message.author, getContractsForUser(message.author.id))] });
    return;
  }
  if (command === "achievements") {
     await message.reply({ content: tutorialNotice || undefined, embeds: [achievementsEmbed(getAchievements(), getUnlockedAchievements(message.author.id, username, avatarUrl), message.author.id)] });
    return;
  }
  if (command === "tuto") {
    await message.reply({ content: tutorialNotice || undefined, embeds: [tutorialPageEmbed(message.author, Math.min(tutorialPages.length, getTutorialRewards(message.author.id).length + 1))], components: [tutorialButtons(Math.min(tutorialPages.length, getTutorialRewards(message.author.id).length + 1))] });
    return;
  }
  if (command === "title" && (args[0] === "equip" || args[0] === "inspect")) {
    const titleId = args.slice(1).join("-").replace(/^["']|["']$/g, "").toLowerCase();
    const title = getTitle(titleId);
    if (!title) { await message.reply("The Court finds no such title ID."); return; }
    if (args[0] === "inspect") recordTutorialAction(message.author.id, username, avatarUrl, "title-inspect");
    await message.reply({ embeds: [titleEmbed(title, Boolean(getOwnedTitles(message.author.id, username, avatarUrl).find((entry) => entry.id === title.id)))] });
    return;
  }
  await message.reply(`The Archives do not recognize \`${command}\`. Try \`${prefix}help\`.`);
}

export async function handleCommand(interaction: ChatInputCommandInteraction): Promise<void> {
  if (interaction.commandName === "developer") {
    if (!config.developerId || interaction.user.id !== config.developerId) {
      await interaction.reply({ content: "You do not have permission to use that command.", ephemeral: true });
      return;
    }
    await interaction.reply({ ...developerPanel(), ephemeral: true });
    return;
  }

  if (interaction.commandName === "inventory") {
    getProfile(interaction.user.id, interaction.user.username, interaction.user.displayAvatarURL());
    await interaction.reply({ embeds: [inventoryEmbed(getInventory(interaction.user.id))] });
    return;
  }

  if (interaction.commandName === "progress") {
    await interaction.reply({ embeds: [progressEmbed(interaction.user)] });
    return;
  }

  if (interaction.commandName === "passport") {
    const target = interaction.options.getUser("user") ?? interaction.user;
    const passport = getPassport(target.id, target.username, target.displayAvatarURL());
    await interaction.reply({ embeds: [passportEmbed(passport, target)], components: [passportButtons()] });
    return;
  }

  if (interaction.commandName === "balance") {
    const balance = getCurrencyBalance(interaction.user.id, interaction.user.username, interaction.user.displayAvatarURL());
    await interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(0xd6a84f)
          .setAuthor({ name: "𓂀 THE TREASURY 𓂀" })
          .setTitle("Deben Balance")
          .setDescription("The ledger has counted the wealth recorded beneath your name.")
          .addFields({ name: "Available Deben", value: `**${balance.toLocaleString("en-US")}**`, inline: true })
          .setFooter({ text: "Deben is Zekhet's fictional in-world currency." }),
      ],
    });
    return;
  }

  if (interaction.commandName === "item") {
    const itemId = interaction.options.getString("item", true).trim().toLowerCase();
    const item = getItem(itemId);
    if (!item) {
      await interaction.reply({ content: "The item catalog contains no record with that ID.", ephemeral: true });
      return;
    }
    await interaction.reply({ embeds: [itemEmbed(item, getItemQuantity(interaction.user.id, item.id))] });
    return;
  }

  if (interaction.commandName === "profile" && (interaction.options.getSubcommand(false) || "view") === "view") {
    const target = interaction.options.getUser("user") ?? interaction.user;
    const profile = getProfile(target.id, target.username, target.displayAvatarURL());
    await interaction.reply({ embeds: [profileEmbed(profile, target)] });
    return;
  }

  const newlyUnlocked = recordInteraction(
    interaction.user.id,
    interaction.user.username,
    interaction.user.displayAvatarURL(),
  );
  awardAchievements(newlyUnlocked, interaction.user.id, interaction.user.username, interaction.user.displayAvatarURL());
  recordTutorialAction(interaction.user.id, interaction.user.username, interaction.user.displayAvatarURL(), "system-interaction");
  const tutorialStatus = syncTutorial(interaction.user.id, interaction.user.username, interaction.user.displayAvatarURL());
  const achievementNotice = newlyUnlocked.map(achievementNotification).join("\n\n");
  const tutorialNotice = tutorialStatus.completedPages.length
    ? `⛤ PAGE COMPLETE ⛤\nThe Archives have acknowledged chapter ${tutorialStatus.completedPages.join(", ")}.`
    : "";

  if (interaction.commandName === "prefix") {
    if (!interaction.guildId) {
      await interaction.reply({ content: "A server record is required to configure a prefix.", ephemeral: true });
      return;
    }
    const subcommand = interaction.options.getSubcommand();
    if (subcommand === "view") {
      await interaction.reply({ content: `The current server prefix is \`${getGuildPrefix(interaction.guildId)}\`.` });
      return;
    }
    if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild)) {
      await interaction.reply({ content: "Only members with Manage Server permission may change Zekhet's prefix.", ephemeral: true });
      return;
    }
    if (subcommand === "reset") {
      resetGuildPrefix(interaction.guildId);
      await interaction.reply({ content: "The server prefix has returned to `z!`." });
      return;
    }
    const prefix = interaction.options.getString("prefix")?.trim() ?? "";
    if (!validPrefix(prefix)) {
      await interaction.reply({ content: "Choose a short prefix of 1–5 non-whitespace characters without `/`, `@`, `#`, or `\\`.", ephemeral: true });
      return;
    }
    setGuildPrefix(interaction.guildId, prefix);
    await interaction.reply({ content: `The server prefix is now \`${prefix}\`.` });
    return;
  }

  if (interaction.commandName === "tuto") {
    const page = Math.min(tutorialPages.length, getTutorialRewards(interaction.user.id).length + 1);
    await interaction.reply({
      content: [achievementNotice, tutorialNotice].filter(Boolean).join("\n\n") || undefined,
      embeds: [tutorialPageEmbed(interaction.user, page)],
      components: [tutorialButtons(page)],
    });
    return;
  }

  if (interaction.commandName === "achievements") {
    await interaction.reply({
      content: achievementNotice || undefined,
      embeds: [achievementsEmbed(
        getAchievements(),
        getUnlockedAchievements(interaction.user.id, interaction.user.username, interaction.user.displayAvatarURL()),
        interaction.user.id,
      )],
    });
    return;
  }

  if (interaction.commandName === "achievement") {
    const achievementId = interaction.options.getString("achievement")?.trim().toLowerCase();
    const achievement = achievementId ? getAchievement(achievementId) : undefined;
    if (!achievement) {
      await interaction.reply({ content: "That achievement is absent from the records.", ephemeral: true });
      return;
    }
    const unlocked = getUnlockedAchievements(interaction.user.id, interaction.user.username, interaction.user.displayAvatarURL())
      .some((entry) => entry.id === achievement.id);
    await interaction.reply({ content: achievementNotice || undefined, embeds: [achievementEmbed(achievement, unlocked)] });
    return;
  }

  if (interaction.commandName === "help") {
    await interaction.reply({
      content: achievementNotice || undefined,
      embeds: [new EmbedBuilder()
        .setColor(0x7e4bb8)
        .setAuthor({ name: "⛤ ZEKHET ⛤" })
        .setTitle("Your personal attendant & keeper of records.")
        .setDescription("The archives are quiet. These records are presently open to you.")
        .addFields(
           { name: "⛤ THE RECORD", value: "`/profile` — View or amend your personal Record." },
           { name: "⛤ THE PASSPORT", value: "`/passport` — View the official record of your accomplishments." },
          { name: "👑 THE COURT", value: "`/titles` — View titles.\n`/title equip` — Equip an owned title.\n`/title inspect` — Inspect a title." },
          { name: "📜 THE ARCHIVES", value: "`/lore discover` — Discover an archive entry.\n`/lore archive` — Review discoveries.\n`/lore inspect` — Inspect an entry." },
          { name: "🧿 THE RITUALS", value: "`/curse user` — Mark another Record with a harmless fictional curse.\n`/curse active` — View active curses.\n`/curse list` — Browse the curse catalog.\n`/curse inspect` — Inspect a curse." },
          { name: "⚖️ THE LEDGER", value: "`/contract create` — Offer a social agreement.\n`/contract accept` — Accept an agreement.\n`/contract reject` — Reject an agreement.\n`/contract inspect` — Inspect a contract.\n`/contract complete` — Complete an accepted agreement.\n`/contract cancel` — Cancel an agreement.\n`/contracts` — Review your contracts." },
           { name: "✦ THE PATH", value: "`/progress` — View XP, level, and rank progression.\nRewards can combine XP, Deben, items, and unlocks." },
           { name: "🏺 THE ACHIEVEMENTS", value: "`/achievements` — View your progress.\n`/achievement inspect` — Inspect a record." },
        )],
    });
    return;
  }

  if (interaction.commandName === "credits") {
    await interaction.reply({
      embeds: [new EmbedBuilder()
        .setColor(0x7e4bb8)
        .setAuthor({ name: "⛤ ZEKHET ⛤" })
        .setTitle("The hand behind the attendant")
        .setDescription(`Zekhet was conceived, built, and kept by **${config.creator}**.`)],
    });
    return;
  }

  if (interaction.commandName === "titles") {
    recordTutorialAction(interaction.user.id, interaction.user.username, interaction.user.displayAvatarURL(), "titles-view");
    await interaction.reply({
      content: achievementNotice || undefined,
      embeds: [titlesEmbed(getOwnedTitles(interaction.user.id, interaction.user.username, interaction.user.displayAvatarURL()))],
    });
    return;
  }

  if (interaction.commandName === "title") {
    const subcommand = interaction.options.getSubcommand(false) || "view";
    const titleId = interaction.options.getString("title")?.trim().toLowerCase();

    if (subcommand === "inspect") {
      recordTutorialAction(interaction.user.id, interaction.user.username, interaction.user.displayAvatarURL(), "title-inspect");
      if (!titleId) {
        await interaction.reply({ content: "Name the title ID you wish to inspect; the Court cannot search an unnamed page.", ephemeral: true });
        return;
      }
      const title = getTitle(titleId);
      if (!title) {
        await interaction.reply({ content: pick(dialogue.titleMissing), ephemeral: true });
        return;
      }
      const owned = getOwnedTitles(interaction.user.id, interaction.user.username, interaction.user.displayAvatarURL())
        .find((ownedTitle) => ownedTitle.id === title.id);
      await interaction.reply({ embeds: [titleEmbed(title, Boolean(owned), owned?.equipped)] });
      return;
    }

    if (subcommand === "equip") {
      recordTutorialAction(interaction.user.id, interaction.user.username, interaction.user.displayAvatarURL(), "title-equip");
      if (!titleId) {
        await interaction.reply({ content: "Name the title ID you wish to equip; the Court cannot place an unnamed designation.", ephemeral: true });
        return;
      }
      const result = equipTitle(interaction.user.id, interaction.user.username, interaction.user.displayAvatarURL(), titleId);
      if (!result.ok) {
        await interaction.reply({
          content: result.reason === "missing"
            ? pick(dialogue.titleMissing)
            : pick(dialogue.titleLocked),
          ephemeral: true,
        });
        return;
      }
      const progression = processProgressionEvent(
        interaction.user.id,
        interaction.user.username,
        interaction.user.displayAvatarURL(),
        "TITLE_EQUIPPED",
      );
      const notice = progressionNotice(progression, {
        id: interaction.user.id,
        username: interaction.user.username,
        avatarUrl: interaction.user.displayAvatarURL(),
      });
      await interaction.reply({
        content: `${pick(dialogue.titleEquip)}\n\nThe title **${result.title.name}** is now equipped upon your Record.${notice ? `\n\n${notice}` : ""}`,
      });
      return;
    }

    const ownedTitles = getOwnedTitles(interaction.user.id, interaction.user.username, interaction.user.displayAvatarURL());
    const equipped = ownedTitles.find((title) => title.equipped);
    await interaction.reply({
      embeds: [equipped ? titleEmbed(equipped, true, true) : new EmbedBuilder()
        .setColor(0x7e4bb8)
        .setAuthor({ name: "👑 THE COURT 👑" })
        .setDescription("No title is currently equipped upon your Record.")],
    });
    return;
  }

  if (interaction.commandName === "lore") {
    const subcommand = interaction.options.getSubcommand(false) || "archive";
    const profile = getProfile(interaction.user.id, interaction.user.username, interaction.user.displayAvatarURL());
    const discovered = getDiscoveredLore(interaction.user.id, interaction.user.username, interaction.user.displayAvatarURL());

    if (subcommand === "discover") {
      const result = discoverLore(
        interaction.user.id,
        interaction.user.username,
        interaction.user.displayAvatarURL(),
        config.loreCooldownSeconds,
      );
      if (!result.ok) {
        await interaction.reply({
          content: result.reason === "cooldown"
            ? `${pick(dialogue.cooldown)} Try again in ${result.retryAfter} seconds.`
            : "The Archives have no unsealed pages left. The deeper records remain classified.",
          ephemeral: true,
        });
        return;
      }
      const updatedProfile = getProfile(interaction.user.id, interaction.user.username, interaction.user.displayAvatarURL());
      recordTutorialAction(interaction.user.id, interaction.user.username, interaction.user.displayAvatarURL(), "lore-discover");
      syncTutorial(interaction.user.id, interaction.user.username, interaction.user.displayAvatarURL());
      const progression = processProgressionEvent(
        interaction.user.id,
        interaction.user.username,
        interaction.user.displayAvatarURL(),
        result.lore.rarity === "Secret"
          ? "SECRET_LORE_DISCOVERED"
          : result.lore.rarity === "Rare" || result.lore.rarity === "Legendary"
            ? "RARE_LORE_DISCOVERED"
            : "LORE_DISCOVERED",
      );
      const notice = [
        ...newlyUnlocked.map(achievementNotification),
        progressionNotice(progression, {
          id: interaction.user.id,
          username: interaction.user.username,
          avatarUrl: interaction.user.displayAvatarURL(),
        }),
      ].filter(Boolean).join("\n\n");
      await interaction.reply({ content: notice || undefined, embeds: [loreEmbed(result.lore, updatedProfile)] });
      return;
    }

    if (subcommand === "inspect") {
      recordTutorialAction(interaction.user.id, interaction.user.username, interaction.user.displayAvatarURL(), "lore-inspect");
      const loreId = interaction.options.getString("entry")?.trim().toLowerCase();
      if (!loreId) {
        await interaction.reply({ content: "Name the archive entry ID you wish to inspect.", ephemeral: true });
        return;
      }
      const entry = getLoreEntry(loreId);
      if (!entry) {
        await interaction.reply({ content: "That entry is absent from the Archives.", ephemeral: true });
        return;
      }
      const found = discovered.find((discoveredEntry) => discoveredEntry.id === entry.id);
      if (found) {
        await interaction.reply({ embeds: [loreEmbed(found, profile)] });
      } else if (entry.isSecret) {
        await interaction.reply({ embeds: [classifiedLoreEmbed(entry)] });
      } else {
        await interaction.reply({ content: "That page has not yet been revealed. Use `/lore discover`.", ephemeral: true });
      }
      return;
    }

    await interaction.reply({ embeds: [archiveEmbed(discovered, getLoreCatalog())] });
    return;
  }

  if (interaction.commandName === "curse") {
    const subcommand = interaction.options.getSubcommand();
    if (subcommand === "list") {
      recordTutorialAction(interaction.user.id, interaction.user.username, interaction.user.displayAvatarURL(), "curses-view");
      await interaction.reply({ embeds: [curseListEmbed(getCurses())] });
      return;
    }

    if (subcommand === "inspect") {
      recordTutorialAction(interaction.user.id, interaction.user.username, interaction.user.displayAvatarURL(), "curse-inspect");
      const curseId = interaction.options.getString("curse")?.trim().toLowerCase();
      const curse = curseId ? getCurse(curseId) : undefined;
      if (!curse) {
        await interaction.reply({ content: "Zekhet finds no such ritual in the Catalog of Curses.", ephemeral: true });
        return;
      }
      await interaction.reply({ embeds: [curseEmbed(curse)] });
      return;
    }

    if (subcommand === "active") {
      const target = interaction.options.getUser("user") ?? interaction.user;
      await interaction.reply({ embeds: [activeCursesEmbed(target, getActiveCurses(target.id, target.username))] });
      return;
    }

    const target = interaction.options.getUser("user");
    if (!target) {
      await interaction.reply({ content: "Name the user whose Record will receive the ritual.", ephemeral: true });
      return;
    }
    const result = inflictCurse(
      interaction.user.id,
      target.id,
      interaction.user.username,
      target.username,
      interaction.user.displayAvatarURL(),
      target.displayAvatarURL(),
    );
    if (!result.ok) {
      const message = result.reason === "self"
        ? "A ritual cannot be turned upon your own Record. Even the Court has boundaries."
        : result.reason === "cooldown"
          ? `${pick(dialogue.curseCooldown)} Try again in ${result.retryAfter} seconds.`
          : "That Record already bears every available mark. Wait for one to fade.";
      await interaction.reply({ content: message, ephemeral: true });
      return;
    }
    recordTutorialAction(target.id, target.username, target.displayAvatarURL(), "curse-applied");
    syncTutorial(target.id, target.username, target.displayAvatarURL());
    const progression = processProgressionEvent(
      target.id,
      target.username,
      target.displayAvatarURL(),
      "CURSE_RECEIVED",
    );
    const notice = progressionNotice(progression, {
      id: interaction.user.id,
      username: interaction.user.username,
      avatarUrl: interaction.user.displayAvatarURL(),
    });
    await interaction.reply({
      content: `${pick(dialogue.curseApplied)} <@${target.id}> has been marked.${target.id === interaction.user.id && (achievementNotice || notice) ? `\n\n${[achievementNotice, notice].filter(Boolean).join("\n\n")}` : ""}`,
      embeds: [activeCurseEmbed(result.curse)],
    });
    return;
  }

  if (interaction.commandName === "contracts") {
    await interaction.reply({
      embeds: [contractsEmbed(
        interaction.user,
        getContractsForUser(interaction.user.id),
      )],
    });
    return;
  }

  if (interaction.commandName === "contract") {
    const subcommand = interaction.options.getSubcommand();
    if (subcommand === "create") {
      const target = interaction.options.getUser("user");
      const description = interaction.options.getString("description")?.trim();
      if (!target || !description) {
        await interaction.reply({ content: "Name a recipient and describe the agreement.", ephemeral: true });
        return;
      }
      const template = interaction.options.getString("template") as ContractTemplate | null;
      const result = createContract(
        interaction.user.id,
        interaction.user.username,
        interaction.user.displayAvatarURL(),
        target.id,
        target.username,
        target.displayAvatarURL(),
        description,
        template,
        interaction.options.getInteger("expiration_days"),
      );
      if (!result.ok) {
        await interaction.reply({ content: "A contract cannot be offered to your own Record.", ephemeral: true });
        return;
      }
      recordTutorialAction(interaction.user.id, interaction.user.username, interaction.user.displayAvatarURL(), "contract-create");
      syncTutorial(interaction.user.id, interaction.user.username, interaction.user.displayAvatarURL());
      const progression = processProgressionEvent(
        interaction.user.id,
        interaction.user.username,
        interaction.user.displayAvatarURL(),
        "CONTRACT_CREATED",
      );
      const contractNotice = progressionNotice(progression, {
        id: interaction.user.id,
        username: interaction.user.username,
        avatarUrl: interaction.user.displayAvatarURL(),
      });
      await interaction.reply({
        content: `${pick(dialogue.contractCreated)}\n\nContract **#${result.contract.id}** has been offered to <@${target.id}>.${[achievementNotice, contractNotice].filter(Boolean).length ? `\n\n${[achievementNotice, contractNotice].filter(Boolean).join("\n\n")}` : ""}`,
        embeds: [contractEmbed(result.contract)],
      });
      return;
    }

    const contractId = interaction.options.getString("id")?.trim() ?? "";
    const contract = getContract(contractId);
    if (!contract) {
        await interaction.reply({ content: pick(dialogue.contractMissing), ephemeral: true });
      return;
    }

    if (subcommand === "inspect") {
      if (interaction.user.id !== contract.creatorId && interaction.user.id !== contract.recipientId) {
        await interaction.reply({ content: pick(dialogue.permissionDenied), ephemeral: true });
        return;
      }
      await interaction.reply({ embeds: [contractEmbed(contract)] });
      return;
    }

    const result = updateContractStatus(
      contract.id,
      interaction.user.id,
      subcommand as "accept" | "reject" | "complete" | "cancel",
    );
    if (!result.ok) {
      const message = result.reason === "unauthorized"
        ? subcommand === "accept" || subcommand === "reject"
          ? "Only the contract recipient may accept or reject this agreement."
          : pick(dialogue.permissionDenied)
        : result.reason === "invalid-status"
          ? `This contract is already ${contractStatusLabel(contract.status).toLowerCase()} and cannot be changed that way.`
        : pick(dialogue.contractMissing);
      await interaction.reply({ content: message, ephemeral: true });
      return;
    }
    if (result.contract.status === "Accepted") recordTutorialAction(interaction.user.id, interaction.user.username, interaction.user.displayAvatarURL(), "contract-accept");
    if (result.contract.status === "Completed") recordTutorialAction(interaction.user.id, interaction.user.username, interaction.user.displayAvatarURL(), "contract-complete");
    syncTutorial(interaction.user.id, interaction.user.username, interaction.user.displayAvatarURL());
    const progression = processProgressionEvent(
      interaction.user.id,
      interaction.user.username,
      interaction.user.displayAvatarURL(),
      result.contract.status === "Completed"
        ? "CONTRACT_COMPLETED"
        : result.contract.status === "Accepted"
          ? "CONTRACT_ACCEPTED"
          : "CONTRACT_CREATED",
    );
    const notice = [
      ...newlyUnlocked.map(achievementNotification),
      progressionNotice(progression, {
        id: interaction.user.id,
        username: interaction.user.username,
        avatarUrl: interaction.user.displayAvatarURL(),
      }),
    ].filter(Boolean).join("\n\n");
    await interaction.reply({
      content: `${pick(dialogue.contractChanged)} Contract **#${result.contract.id}** is now **${contractStatusLabel(result.contract.status)}**.${notice ? `\n\n${notice}` : ""}`,
      embeds: [contractEmbed(result.contract)],
    });
    return;
  }

  if (interaction.commandName !== "profile") return;

  const target = interaction.options.getUser("user") ?? interaction.user;
  const subcommand = interaction.options.getSubcommand(false) || "view";

  if (subcommand !== "view" && target.id !== interaction.user.id) {
    await interaction.reply({ content: "That Record is not available for inspection here.", ephemeral: true });
    return;
  }

  if (subcommand === "view") {
    const profile = getProfile(target.id, target.username, target.displayAvatarURL());
    await interaction.reply({ content: achievementNotice || undefined, embeds: [profileEmbed(profile, target)] });
    return;
  }

  const updates = {
    bio: interaction.options.getString("bio") ?? undefined,
    color: interaction.options.getString("color") ?? undefined,
    theme: interaction.options.getString("theme") ?? undefined,
  };

  if (subcommand === "bio") updates.bio = interaction.options.getString("text") ?? "";
  if (subcommand === "color") updates.color = interaction.options.getString("hex") ?? "";
  if (subcommand === "theme") updates.theme = interaction.options.getString("name") ?? "";
  if (subcommand === "bio") recordTutorialAction(interaction.user.id, interaction.user.username, interaction.user.displayAvatarURL(), "bio-set");
  if (subcommand === "theme") recordTutorialAction(interaction.user.id, interaction.user.username, interaction.user.displayAvatarURL(), "theme-set");

  if (updates.color && !/^#[0-9a-f]{6}$/i.test(updates.color)) {
    await interaction.reply({ content: "The color must be a six-digit hex value such as `#b78cff`.", ephemeral: true });
    return;
  }

  const profile = updateProfile(target.id, target.username, target.displayAvatarURL(), updates);
  const progression = processProgressionEvent(
    interaction.user.id,
    interaction.user.username,
    interaction.user.displayAvatarURL(),
    subcommand === "bio" ? "BIOGRAPHY_SET" : "PROFILE_CREATED",
  );
  const notice = progressionNotice(progression, {
    id: interaction.user.id,
    username: interaction.user.username,
    avatarUrl: interaction.user.displayAvatarURL(),
  });
  await interaction.reply({ content: `${pick(dialogue.profileEdit)}${rareAside()}${notice ? `\n\n${notice}` : ""}`, embeds: [profileEmbed(profile, target)] });
}