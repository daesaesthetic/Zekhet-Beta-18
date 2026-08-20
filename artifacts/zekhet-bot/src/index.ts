import { Client, Events, GatewayIntentBits, REST, Routes } from "discord.js";
import { assertDiscordConfig, config } from "./config.js";
import { commands, handleCommand, handleDeveloperComponent, handleDeveloperModal, handlePassportComponent, handlePrefixCommand, handleTutorialComponent } from "./commands.js";

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
      else if (interaction.customId.startsWith("passport:")) await handlePassportComponent(interaction);
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
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === 10062
    ) {
      console.warn("Ignoring expired Discord interaction.");
      return;
    }
    const response = { content: "The archives are momentarily sealed. Please try again.", ephemeral: true };
    try {
      if (interaction.replied || interaction.deferred) await interaction.followUp(response);
      else await interaction.reply(response);
    } catch (responseError) {
      console.error("Unable to send command error response", responseError);
    }
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