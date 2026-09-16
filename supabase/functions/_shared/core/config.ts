export interface Config {
  readonly botToken: string;
  readonly exchangeApiKey: string;
  readonly webhookSecret: string;
}

function requireEnv(name: string): string {
  const value = Deno.env.get(name);
  if (!value) {
    throw new Error(`${name} is not set`);
  }
  return value;
}

export function loadConfig(): Config {
  return {
    botToken: requireEnv("BOT_TOKEN"),
    exchangeApiKey: requireEnv("EXCHANGE_API_KEY"),
    webhookSecret: requireEnv("WEBHOOK_SECRET"),
  };
}
