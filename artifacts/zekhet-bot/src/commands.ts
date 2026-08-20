import {
  ChatInputCommandInteraction,
  EmbedBuilder,
  SlashCommandBuilder,
  User,
} from "discord.js";
import { config } from "./config.js";
import {
  equipTitle,
  getOwnedTitles,
  getProfile,
  getTitle,
  getTitles,
  updateProfile,
  type OwnedTitle,
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

export const commands = [
  new SlashCommandBuilder().setName("help").setDescription("Consult Zekhet's available records."),
  new SlashCommandBuilder().setName("credits").setDescription("See who keeps Zekhet's records."),
  profileCommand,
  new SlashCommandBuilder().setName("titles").setDescription("View your owned titles and the Court."),
  titleCommand,
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
          { name: "📜 THE ARCHIVES", value: "Coming Soon" },
          { name: "🧿 THE RITUALS", value: "Coming Soon" },
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