export function validateConfig(
  config: Record<string, unknown>,
): Record<string, unknown> {
  if (!config.BOT_TOKEN) {
    throw new Error("BOT_TOKEN is not set");
  }

  if (!config.EXCHANGE_API_KEY) {
    throw new Error("EXCHANGE_API_KEY is not set");
  }

  return config;
}
