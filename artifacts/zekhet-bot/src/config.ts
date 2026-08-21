export const config = {
  token: process.env["DISCORD_TOKEN"] ?? "",
  clientId: process.env["DISCORD_CLIENT_ID"] ?? "",
  developerId: process.env["DEVELOPER_ID"] ?? "",
  creator: process.env["ZEKHET_CREATOR"] ?? "The Zekhet Project",
  databasePath: process.env["ZEKHET_DATABASE_PATH"] ?? "./data/zekhet.sqlite",
  loreCooldownSeconds: Number(process.env["ZEKHET_LORE_COOLDOWN_SECONDS"] ?? 60),
  ventureCooldownSeconds: Number(process.env["ZEKHET_VENTURE_COOLDOWN_SECONDS"] ?? 300),
} as const;

export function assertDiscordConfig(): void {
  const missing = [
    ["DISCORD_TOKEN", config.token],
    ["DISCORD_CLIENT_ID", config.clientId],
  ].filter(([, value]) => !value).map(([name]) => name);

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(", ")}`);
  }
}