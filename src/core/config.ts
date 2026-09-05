export function validateConfig(
  config: Record<string, unknown>,
): Record<string, unknown> {
  if (!config.BOT_TOKEN) {
    throw new Error("BOT_TOKEN is not set");
  }

  return config;
}
