export interface Config {
  readonly botToken: string;
  readonly exchangeApiKey: string;
  readonly supabaseUrl: string;
  readonly supabaseKey: string;
  readonly supabaseServiceRoleKey?: string;
  readonly webhookUrl?: string;
  readonly webhookSecret?: string;
  readonly pollIntervalMs: number;
  readonly port: number;
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is not set`);
  }
  return value;
}

export function loadConfig(): Config {
  const webhookUrl = process.env.WEBHOOK_URL;

  return {
    botToken: requireEnv("BOT_TOKEN"),
    exchangeApiKey: requireEnv("EXCHANGE_API_KEY"),
    supabaseUrl: requireEnv("SUPABASE_URL"),
    // SUPABASE_KEY is typically the publishable/anon key, which RLS-protected tables (see
    // supabase/migrations) reject writes from. SUPABASE_SERVICE_ROLE_KEY, when set, bypasses
    // RLS the same way it's auto-injected for the Supabase Edge Functions runtime (see
    // supabase/functions/_shared/core/supabase/supabase-client.ts).
    supabaseKey: requireEnv("SUPABASE_KEY"),
    supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
    webhookUrl,
    // Only required when webhooks are actually enabled; fail fast at startup
    // rather than the first time setUpWebhook() runs.
    webhookSecret: webhookUrl ? requireEnv("WEBHOOK_SECRET") : process.env.WEBHOOK_SECRET,
    pollIntervalMs: Number(process.env.POLL_INTERVAL_MS ?? 3000),
    port: Number(process.env.PORT ?? 3000),
  };
}
