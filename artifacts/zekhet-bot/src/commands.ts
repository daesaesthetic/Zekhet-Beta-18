import {
  ChatInputCommandInteraction,
  EmbedBuilder,
  SlashCommandBuilder,
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
  inflictCurse,
  updateProfile,
  type ActiveCurse,
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

export const commands = [
  new SlashCommandBuilder().setName("help").setDescription("Consult Zekhet's available records."),
  new SlashCommandBuilder().setName("credits").setDescription("See who keeps Zekhet's records."),
  profileCommand,
  new SlashCommandBuilder().setName("titles").setDescription("View your owned titles and the Court."),
  titleCommand,
  loreCommand,
  curseCommand,
].map((command) => command.toJSON());

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

export async function handleCommand(interaction: ChatInputCommandInteraction): Promise<void> {
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
          { name: "⚖️ THE LEDGER", value: "Coming Soon" },
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