import type { BotMode } from "./bot-mode.ts";
import type { UserModePort } from "./user-mode.port.ts";
import { getSupabaseClient } from "../supabase/supabase-client.ts";

const TABLE = "bot_user_modes";

// Deno/Postgres counterpart of src/core/user-mode/in-memory-user-mode.adapter.ts: same
// UserModePort contract, backed by a table instead of a Map because edge functions are
// stateless per invocation.
export class SupabaseUserModeAdapter implements UserModePort {
  async getMode(chatId: number): Promise<BotMode | undefined> {
    const { data, error } = await getSupabaseClient()
      .from(TABLE)
      .select("mode")
      .eq("chat_id", chatId)
      .maybeSingle();

    if (error) throw new Error(`Failed to read user mode: ${error.message}`);
    return (data?.mode as BotMode | undefined) ?? undefined;
  }

  async setMode(chatId: number, mode: BotMode): Promise<void> {
    const { error } = await getSupabaseClient()
      .from(TABLE)
      .upsert({ chat_id: chatId, mode }, { onConflict: "chat_id" });

    if (error) throw new Error(`Failed to persist user mode: ${error.message}`);
  }
}
