export const config = {
  token: process.env["DISCORD_TOKEN"] ?? "",
  clientId: process.env["DISCORD_CLIENT_ID"] ?? "",
  creator: process.env["ZEKHET_CREATOR"] ?? "The Zekhet Project",
  databasePath: process.env["ZEKHET_DATABASE_PATH"] ?? "./data/zekhet.sqlite",
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