import { loadConfig } from "../_shared/core/config.ts";
import { SupabaseUserModeAdapter } from "../_shared/core/supabase-user-mode.adapter.ts";
import { createCurrencyModule } from "../_shared/modules/currency/currency.module.ts";
import { DomainException } from "../_shared/core/domain-exception.ts";

// Standalone HTTP entry point for the currency module: the Node app never exposed one
// (currency was only reachable through the bot's text handlers), but as an edge function
// it's natural to also let it be called directly, e.g. POST { "text": "100 usd", "chatId": 1 }.
const config = loadConfig();
const userMode = new SupabaseUserModeAdapter();
const currency = createCurrencyModule({ exchangeApiKey: config.exchangeApiKey, userMode });

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers: { Allow: "POST" } });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "invalid-json" }, { status: 400 });
  }

  const { text, chatId } = (body ?? {}) as { text?: unknown; chatId?: unknown };
  if (typeof text !== "string" || typeof chatId !== "number") {
    return Response.json({ error: "text (string) and chatId (number) are required" }, { status: 400 });
  }

  try {
    const result = await currency.convertAmount.execute(text, chatId);
    if (!result) {
      const issue = currency.parser.detectIssue(text);
      return Response.json({ error: issue ?? "no-match" }, { status: 422 });
    }
    return Response.json(result);
  } catch (error) {
    if (error instanceof DomainException) {
      console.error(`[currency] domain error (${error.code}):`, error.message);
      return Response.json({ error: "exchange-rate-unavailable" }, { status: 502 });
    }
    throw error;
  }
});
