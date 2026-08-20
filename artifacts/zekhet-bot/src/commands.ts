import {
  ChatInputCommandInteraction,
  EmbedBuilder,
  SlashCommandBuilder,
  User,
} from "discord.js";
import { config } from "./config.js";
import { getProfile, updateProfile, type Profile } from "./database.js";

const themes = ["Nightshade", "Celestial", "Eclipse", "Ancient", "Royal", "Void"] as const;
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

export const commands = [
  new SlashCommandBuilder().setName("help").setDescription("Consult Zekhet's available records."),
  new SlashCommandBuilder().setName("credits").setDescription("See who keeps Zekhet's records."),
  profileCommand,
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
      { name: "Theme", value: profile.theme, inline: true },
      { name: "Record number", value: `#${String(profile.profileNumber).padStart(4, "0")}`, inline: true },
    )
    .setFooter({ text: `Recorded ${new Date(profile.createdAt).toLocaleDateString("en-US")}` });
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
          { name: "👑 THE COURT", value: "Coming Soon" },
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

  if (interaction.commandName !== "profile") return;

  const target = interaction.options.getUser("user") ?? interaction.user;
  const subcommand = interaction.options.getSubcommand(false) || "view";

  if (target.id !== interaction.user.id) {
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