export interface AppConfig {
  botToken: string;
  port: number;
  pollIntervalMs: number;
}

export function loadConfig(): AppConfig {
  const botToken = process.env.BOT_TOKEN;
  if (!botToken) {
    throw new Error("BOT_TOKEN is not set");
  }

  return {
    botToken,
    port: Number(process.env.PORT ?? 3000),
    pollIntervalMs: Number(process.env.POLL_INTERVAL_MS ?? 3000),
  };
}
