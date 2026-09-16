import { getSupabaseClient } from "../../../../core/supabase/supabase-client.ts";
import type { ExchangeRateSourcePreferencePort } from "../../application/ports/exchange-rate-source-preference.port.ts";
import type { ExchangeRateSource } from "../../domain/exchange-rate-source.ts";

const TABLE = "currency_source_preferences";

export class SupabaseExchangeRateSourcePreferenceAdapter implements ExchangeRateSourcePreferencePort {
  async getSource(chatId: number): Promise<ExchangeRateSource | undefined> {
    const { data, error } = await getSupabaseClient()
      .from(TABLE)
      .select("source")
      .eq("chat_id", chatId)
      .maybeSingle();

    if (error) throw new Error(`Failed to read exchange rate source preference: ${error.message}`);
    return (data?.source as ExchangeRateSource | undefined) ?? undefined;
  }

  async setSource(chatId: number, source: ExchangeRateSource): Promise<void> {
    const { error } = await getSupabaseClient()
      .from(TABLE)
      .upsert({ chat_id: chatId, source }, { onConflict: "chat_id" });

    if (error) throw new Error(`Failed to persist exchange rate source preference: ${error.message}`);
  }
}
