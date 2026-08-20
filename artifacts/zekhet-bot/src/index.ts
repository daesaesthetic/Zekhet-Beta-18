import { Client, Events, GatewayIntentBits, REST, Routes } from "discord.js";
import { assertDiscordConfig, config } from "./config.js";
import { commands, handleCommand, handleDeveloperComponent, handleDeveloperModal, handlePrefixCommand, handleTutorialComponent } from "./commands.js";

assertDiscordConfig();

const rest = new REST({ version: "10" }).setToken(config.token);
await rest.put(Routes.applicationCommands(config.clientId), { body: commands });
console.info(`Registered ${commands.length} global slash commands.`);

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });

client.once(Events.ClientReady, (readyClient) => {
  console.info(`Zekhet is listening as ${readyClient.user.tag}.`);
});

client.on(Events.InteractionCreate, async (interaction) => {
  if (interaction.isButton()) {
    try {
      if (interaction.customId.startsWith("tutorial:")) await handleTutorialComponent(interaction);
      else await handleDeveloperComponent(interaction);
    } catch (error) {
      console.error("Developer panel handling failed", error);
    }
    return;
  }
  if (interaction.isModalSubmit()) {
    try {
      await handleDeveloperModal(interaction);
    } catch (error) {
      console.error("Developer modal handling failed", error);
    }
    return;
  }
  if (!interaction.isChatInputCommand()) return;
  try {
    await handleCommand(interaction);
  } catch (error) {
    console.error("Command handling failed", error);
    const response = { content: "The archives are momentarily sealed. Please try again.", ephemeral: true };
    if (interaction.replied || interaction.deferred) await interaction.followUp(response);
    else await interaction.reply(response);
  }
});

client.on(Events.MessageCreate, async (message) => {
  try {
    await handlePrefixCommand(message);
  } catch (error) {
    console.error("Prefix command handling failed", error);
  }
});

await client.login(config.token);