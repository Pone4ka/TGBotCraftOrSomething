import type {
  ChatHistoryQueryPort,
  ChatSummary,
  ListMessagesFilter,
  StoredMessage,
} from "../../application/ports/chat-history-query.port.ts";
import { getSupabaseClient } from "../../../../core/supabase/supabase-client.ts";

const CHATS_TABLE = "chats";
const MESSAGES_TABLE = "messages";

// Not part of SHARED_FILES (scripts/generate-edge-shared.mjs) because it talks to
// @supabase/supabase-js directly, whose import path differs between Node and Deno — see
// src/modules/bot/adapters/out/supabase-chat-history-query.adapter.ts for the Node
// counterpart.
export class SupabaseChatHistoryQueryAdapter implements ChatHistoryQueryPort {
  async listChats(): Promise<ChatSummary[]> {
    const { data, error } = await getSupabaseClient()
      .from(CHATS_TABLE)
      // Embeds only the latest message of each chat, for the last-message preview.
      .select("chat_id, first_name, last_name, last_message_at, created_at, messages(text, reply_text)")
      .order("last_message_at", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false, referencedTable: MESSAGES_TABLE })
      .limit(1, { referencedTable: MESSAGES_TABLE });
    if (error) throw new Error(`Failed to list chats: ${error.message}`);

    return (data ?? []).map((row) => {
      const latest = row.messages?.[0];
      return {
        chatId: row.chat_id,
        firstName: row.first_name,
        lastName: row.last_name,
        lastMessageAt: row.last_message_at,
        createdAt: row.created_at,
        // A reply is always newer than the message it answers.
        lastMessageText: latest ? (latest.reply_text ?? latest.text) : null,
        lastMessageFromBot: latest?.reply_text != null,
      };
    });
  }

  async listMessages(filter: ListMessagesFilter = {}): Promise<StoredMessage[]> {
    let query = getSupabaseClient()
      .from(MESSAGES_TABLE)
      .select("id, chat_id, text, created_at, reply_text, replied_at");
    if (filter.chatId !== undefined) query = query.eq("chat_id", filter.chatId);

    const { data, error } = await query.order("created_at", { ascending: false });
    if (error) throw new Error(`Failed to list messages: ${error.message}`);

    return (data ?? []).map((row) => ({
      id: row.id,
      chatId: row.chat_id,
      text: row.text,
      createdAt: row.created_at,
      replyText: row.reply_text,
      repliedAt: row.replied_at,
    }));
  }
}
