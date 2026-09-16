import { createClient, type SupabaseClient } from "npm:@supabase/supabase-js@2.116.0";

let client: SupabaseClient | undefined;

// Lazily built and cached per isolate: Supabase Edge Functions may keep an isolate warm
// across invocations, so there is no need to reconnect on every request.
export function getSupabaseClient(): SupabaseClient {
  if (!client) {
    const url = Deno.env.get("SUPABASE_URL");
    // SUPABASE_SERVICE_ROLE_KEY is injected automatically by the Supabase Edge Functions
    // runtime; SUPABASE_KEY is kept as a fallback so local `supabase/functions/.env` files
    // can reuse the same variable name as the Node app's .env.
    const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? Deno.env.get("SUPABASE_KEY");
    if (!url || !key) {
      throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_KEY) must be set");
    }
    client = createClient(url, key, { auth: { persistSession: false } });
  }
  return client;
}
