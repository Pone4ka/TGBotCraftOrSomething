import { getSupabaseClient } from "../../../../core/supabase/supabase-client.ts";
import type { TargetCurrencyPreferencePort } from "../../application/ports/target-currency-preference.port.ts";

const TABLE = "currency_target_preferences";

export class SupabaseTargetCurrencyPreferenceAdapter implements TargetCurrencyPreferencePort {
  async getCurrency(chatId: number): Promise<string | undefined> {
    const { data, error } = await getSupabaseClient()
      .from(TABLE)
      .select("currency")
      .eq("chat_id", chatId)
      .maybeSingle();

    if (error) throw new Error(`Failed to read target currency preference: ${error.message}`);
    return data?.currency ?? undefined;
  }

  async setCurrency(chatId: number, currency: string): Promise<void> {
    const { error } = await getSupabaseClient()
      .from(TABLE)
      .upsert({ chat_id: chatId, currency }, { onConflict: "chat_id" });

    if (error) throw new Error(`Failed to persist target currency preference: ${error.message}`);
  }

  async isAwaitingSelection(chatId: number): Promise<boolean> {
    const { data, error } = await getSupabaseClient()
      .from(TABLE)
      .select("awaiting_selection")
      .eq("chat_id", chatId)
      .maybeSingle();

    if (error) throw new Error(`Failed to read awaiting-selection flag: ${error.message}`);
    return data?.awaiting_selection ?? false;
  }

  async setAwaitingSelection(chatId: number, awaiting: boolean): Promise<void> {
    const { error } = await getSupabaseClient()
      .from(TABLE)
      .upsert({ chat_id: chatId, awaiting_selection: awaiting }, { onConflict: "chat_id" });

    if (error) throw new Error(`Failed to persist awaiting-selection flag: ${error.message}`);
  }
}
