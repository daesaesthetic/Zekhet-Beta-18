import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonInteraction,
  ButtonStyle,
  ChatInputCommandInteraction,
  EmbedBuilder,
  ModalBuilder,
  ModalSubmitInteraction,
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
  type ActiveCurse,
  type Contract,
  type ContractTemplate,
  type Curse,
  type OwnedTitle,
  type DiscoveredLore,
  type LoreEntry,
  type Profile,
  type Title,
} from "./database.js";

const themes = ["Nightshade", "Celestial", "Eclipse", "Ancient", "Royal", "Void"] as const;
const rarityColors: Record<Title["rarity"], number> = {
  Common: 0xaaa7b8,
  Uncommon: 0x65d18b,
  Rare: 0x5e9cff,
  Epic: 0xa873ff,
  Legendary: 0xffc857,
  Mythic: 0xff6bb5,
  Secret: 0x6e4b8e,
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
};
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

export const commands = [
  new SlashCommandBuilder().setName("help").setDescription("Consult Zekhet's available records."),
  new SlashCommandBuilder().setName("credits").setDescription("See who keeps Zekhet's records."),
  new SlashCommandBuilder().setName("developer").setDescription("Open the restricted developer control panel."),
  profileCommand,
  new SlashCommandBuilder().setName("titles").setDescription("View your owned titles and the Court."),
  titleCommand,
  loreCommand,
  curseCommand,
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
  };
  const titles: Record<string, string> = {
    titles: "All titles",
    lore: "All lore entries",
    curses: "All curses",
    contracts: "Your contracts",
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

function profileEmbed(profile: Profile, user: User): EmbedBuilder {
  return new EmbedBuilder()
    .setColor(colorFromProfile(profile))
    .setAuthor({ name: "⛤ THE RECORD ⛤", iconURL: user.displayAvatarURL({ size: 128 }) })
    .setThumbnail(user.displayAvatarURL({ size: 256 }))
    .setTitle(`${profile.username}'s Record`)
    .setDescription(profile.bio || "_No biography has been entered._")
    .addFields(
      { name: "Equipped title", value: profile.title, inline: true },
      { name: "Titles owned", value: String(profile.titlesOwned), inline: true },
      { name: "Lore discovered", value: String(profile.loreDiscovered), inline: true },
      { name: "Active curses", value: String(profile.activeCurses), inline: true },
      { name: "Contracts created", value: String(profile.contractsCreated), inline: true },
      { name: "Contracts completed", value: String(profile.contractsCompleted), inline: true },
      { name: "Theme", value: profile.theme, inline: true },
      { name: "Record number", value: `#${String(profile.profileNumber).padStart(4, "0")}`, inline: true },
    )
    .setFooter({ text: `Recorded ${new Date(profile.createdAt).toLocaleDateString("en-US")}` });
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
    .setDescription(owned ? title.description : (title.isSecret ? "This title remains sealed." : title.description))
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
    .setDescription("A title may be owned many times across the Court, but only one may be worn upon a Record.")
    .addFields(
      { name: `Owned · ${ownedTitles.length}`, value: ownedText },
      { name: "The sealed court", value: lockedText || "_No sealed titles remain._" },
    )
    .setFooter({ text: "Use /title equip title:<id> to wear an owned title." });
}

function loreEmbed(lore: DiscoveredLore, profile: Profile): EmbedBuilder {
  return new EmbedBuilder()
    .setColor(loreRarityColors[lore.rarity])
    .setAuthor({ name: "📜 THE ARCHIVES 📜" })
    .setTitle(`⛤ ARCHIVE ENTRY #${lore.entryNumber} ⛤`)
    .setDescription(`**${profile.username.toUpperCase()}** — **${profile.title.toUpperCase()}**\n\n${lore.text}`)
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
    .setDescription("Some portions of this record have been sealed.")
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

export async function handleCommand(interaction: ChatInputCommandInteraction): Promise<void> {
  if (interaction.commandName === "developer") {
    if (!config.developerId || interaction.user.id !== config.developerId) {
      await interaction.reply({ content: "You do not have permission to use that command.", ephemeral: true });
      return;
    }
    await interaction.reply({ ...developerPanel(), ephemeral: true });
    return;
  }

  if (interaction.commandName === "help") {
    await interaction.reply({
      embeds: [new EmbedBuilder()
        .setColor(0x7e4bb8)
        .setAuthor({ name: "⛤ ZEKHET ⛤" })
        .setTitle("Your personal attendant & keeper of records.")
        .setDescription("The archives are quiet. These records are presently open to you.")
        .addFields(
          { name: "⛤ THE RECORD", value: "`/profile` — View or amend your personal Record." },
          { name: "👑 THE COURT", value: "`/titles` — View titles.\n`/title equip` — Equip an owned title.\n`/title inspect` — Inspect a title." },
          { name: "📜 THE ARCHIVES", value: "`/lore discover` — Discover an archive entry.\n`/lore archive` — Review discoveries.\n`/lore inspect` — Inspect an entry." },
          { name: "🧿 THE RITUALS", value: "`/curse user` — Mark another Record with a harmless fictional curse.\n`/curse active` — View active curses.\n`/curse list` — Browse the curse catalog.\n`/curse inspect` — Inspect a curse." },
          { name: "⚖️ THE LEDGER", value: "`/contract create` — Offer a social agreement.\n`/contract accept` — Accept an agreement.\n`/contract reject` — Reject an agreement.\n`/contract inspect` — Inspect a contract.\n`/contract complete` — Complete an accepted agreement.\n`/contract cancel` — Cancel an agreement.\n`/contracts` — Review your contracts." },
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
    await interaction.reply({
      embeds: [titlesEmbed(getOwnedTitles(interaction.user.id, interaction.user.username, interaction.user.displayAvatarURL()))],
    });
    return;
  }

  if (interaction.commandName === "title") {
    const subcommand = interaction.options.getSubcommand(false) || "view";
    const titleId = interaction.options.getString("title")?.trim().toLowerCase();

    if (subcommand === "inspect") {
      if (!titleId) {
        await interaction.reply({ content: "Name the title ID you wish to inspect.", ephemeral: true });
        return;
      }
      const title = getTitle(titleId);
      if (!title) {
        await interaction.reply({ content: "That title is not recorded in the Court.", ephemeral: true });
        return;
      }
      const owned = getOwnedTitles(interaction.user.id, interaction.user.username, interaction.user.displayAvatarURL())
        .find((ownedTitle) => ownedTitle.id === title.id);
      await interaction.reply({ embeds: [titleEmbed(title, Boolean(owned), owned?.equipped)] });
      return;
    }

    if (subcommand === "equip") {
      if (!titleId) {
        await interaction.reply({ content: "Name the title ID you wish to equip.", ephemeral: true });
        return;
      }
      const result = equipTitle(interaction.user.id, interaction.user.username, interaction.user.displayAvatarURL(), titleId);
      if (!result.ok) {
        await interaction.reply({
          content: result.reason === "missing"
            ? "That title is not recorded in the Court."
            : "You do not own that title. Locked titles cannot be equipped.",
          ephemeral: true,
        });
        return;
      }
      await interaction.reply({ content: `The title **${result.title.name}** is now equipped upon your Record.` });
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
            ? `The Archives are still settling. Try again in ${result.retryAfter} seconds.`
            : "No unsealed archive entries remain. The deeper records are classified.",
          ephemeral: true,
        });
        return;
      }
      const updatedProfile = getProfile(interaction.user.id, interaction.user.username, interaction.user.displayAvatarURL());
      await interaction.reply({ embeds: [loreEmbed(result.lore, updatedProfile)] });
      return;
    }

    if (subcommand === "inspect") {
      const loreId = interaction.options.getString("entry")?.trim().toLowerCase();
      if (!loreId) {
        await interaction.reply({ content: "Name the archive entry ID you wish to inspect.", ephemeral: true });
        return;
      }
      const entry = getLoreEntry(loreId);
      if (!entry) {
        await interaction.reply({ content: "That archive entry is not recorded.", ephemeral: true });
        return;
      }
      const found = discovered.find((discoveredEntry) => discoveredEntry.id === entry.id);
      if (found) {
        await interaction.reply({ embeds: [loreEmbed(found, profile)] });
      } else if (entry.isSecret) {
        await interaction.reply({ embeds: [classifiedLoreEmbed(entry)] });
      } else {
        await interaction.reply({ content: "That entry has not yet been discovered. Use `/lore discover`.", ephemeral: true });
      }
      return;
    }

    await interaction.reply({ embeds: [archiveEmbed(discovered, getLoreCatalog())] });
    return;
  }

  if (interaction.commandName === "curse") {
    const subcommand = interaction.options.getSubcommand();
    if (subcommand === "list") {
      await interaction.reply({ embeds: [curseListEmbed(getCurses())] });
      return;
    }

    if (subcommand === "inspect") {
      const curseId = interaction.options.getString("curse")?.trim().toLowerCase();
      const curse = curseId ? getCurse(curseId) : undefined;
      if (!curse) {
        await interaction.reply({ content: "That ritual is not recorded in the Catalog of Curses.", ephemeral: true });
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
        ? "A ritual cannot be turned upon your own Record."
        : result.reason === "cooldown"
          ? `The ritual circle is still cooling. Try again in ${result.retryAfter} seconds.`
          : "That Record already bears every available mark. Wait for one to fade.";
      await interaction.reply({ content: message, ephemeral: true });
      return;
    }
    await interaction.reply({
      content: `The ritual is complete. <@${target.id}> has been marked.`,
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
      await interaction.reply({
        content: `Contract **#${result.contract.id}** has been offered to <@${target.id}>.`,
        embeds: [contractEmbed(result.contract)],
      });
      return;
    }

    const contractId = interaction.options.getString("id")?.trim() ?? "";
    const contract = getContract(contractId);
    if (!contract) {
      await interaction.reply({ content: "That contract is not recorded in the Ledger.", ephemeral: true });
      return;
    }

    if (subcommand === "inspect") {
      if (interaction.user.id !== contract.creatorId && interaction.user.id !== contract.recipientId) {
        await interaction.reply({ content: "Only the named parties may inspect this contract.", ephemeral: true });
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
          : "Only a named party may change this agreement."
        : result.reason === "invalid-status"
          ? `This contract is already ${contractStatusLabel(contract.status).toLowerCase()} and cannot be changed that way.`
          : "That contract is not recorded in the Ledger.";
      await interaction.reply({ content: message, ephemeral: true });
      return;
    }
    await interaction.reply({
      content: `Contract **#${result.contract.id}** is now **${contractStatusLabel(result.contract.status)}**.`,
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
    await interaction.reply({ embeds: [profileEmbed(profile, target)] });
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

  if (updates.color && !/^#[0-9a-f]{6}$/i.test(updates.color)) {
    await interaction.reply({ content: "The color must be a six-digit hex value such as `#b78cff`.", ephemeral: true });
    return;
  }

  const profile = updateProfile(target.id, target.username, target.displayAvatarURL(), updates);
  await interaction.reply({ content: "The Record has been amended.", embeds: [profileEmbed(profile, target)] });
}