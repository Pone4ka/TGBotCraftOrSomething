import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  ChatHistoryQueryPort,
  ChatSummary,
  ListMessagesFilter,
  StoredMessage,
} from "../../application/ports/chat-history-query.port";
import {
  CHAT_WITH_PREVIEW_COLUMNS,
  LATEST_MESSAGE_ONLY,
  MESSAGE_COLUMNS,
  toChatSummary,
  toStoredMessage,
} from "./chat-history.rows";

const CHATS_TABLE = "chats";
const MESSAGES_TABLE = "messages";

// Not part of SHARED_FILES (scripts/generate-edge-shared.mjs) because it talks to
// @supabase/supabase-js directly, whose import path differs between Node and Deno — see
// supabase/functions/_shared/modules/bot/adapters/out/supabase-chat-history-query.adapter.ts
// for the edge-function counterpart.
export class SupabaseChatHistoryQueryAdapter implements ChatHistoryQueryPort {
  constructor(private readonly client: SupabaseClient) {}

  async listChats(): Promise<ChatSummary[]> {
    const { data, error } = await this.client
      .from(CHATS_TABLE)
      .select(CHAT_WITH_PREVIEW_COLUMNS)
      .order("last_message_at", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false, ...LATEST_MESSAGE_ONLY })
      .limit(1, LATEST_MESSAGE_ONLY);
    if (error) throw new Error(`Failed to list chats: ${error.message}`);

    return (data ?? []).map(toChatSummary);
  }

  async getChat(chatId: number): Promise<ChatSummary | null> {
    const { data, error } = await this.client
      .from(CHATS_TABLE)
      .select(CHAT_WITH_PREVIEW_COLUMNS)
      .eq("chat_id", chatId)
      .order("created_at", { ascending: false, ...LATEST_MESSAGE_ONLY })
      .limit(1, LATEST_MESSAGE_ONLY)
      .maybeSingle();
    if (error) throw new Error(`Failed to load chat ${chatId}: ${error.message}`);

    return data ? toChatSummary(data) : null;
  }

  async listMessages(filter: ListMessagesFilter = {}): Promise<StoredMessage[]> {
    let query = this.client.from(MESSAGES_TABLE).select(MESSAGE_COLUMNS);
    if (filter.chatId !== undefined) query = query.eq("chat_id", filter.chatId);

    const { data, error } = await query.order("created_at", { ascending: false });
    if (error) throw new Error(`Failed to list messages: ${error.message}`);

    return (data ?? []).map(toStoredMessage);
  }

  async getMessage(id: number): Promise<StoredMessage | null> {
    const { data, error } = await this.client
      .from(MESSAGES_TABLE)
      .select(MESSAGE_COLUMNS)
      .eq("id", id)
      .maybeSingle();
    if (error) throw new Error(`Failed to load message ${id}: ${error.message}`);

    return data ? toStoredMessage(data) : null;
  }
}
