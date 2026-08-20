import { Client, Events, GatewayIntentBits, REST, Routes } from "discord.js";
import { assertDiscordConfig, config } from "./config.js";
import { commands, handleCommand, handleDeveloperComponent } from "./commands.js";

assertDiscordConfig();

const rest = new REST({ version: "10" }).setToken(config.token);
await rest.put(Routes.applicationCommands(config.clientId), { body: commands });
console.info(`Registered ${commands.length} global slash commands.`);

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once(Events.ClientReady, (readyClient) => {
  console.info(`Zekhet is listening as ${readyClient.user.tag}.`);
});

client.on(Events.InteractionCreate, async (interaction) => {
  if (interaction.isButton()) {
    try {
      await handleDeveloperComponent(interaction);
    } catch (error) {
      console.error("Developer panel handling failed", error);
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

await client.login(config.token);