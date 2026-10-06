import type { SupabaseClient } from "@supabase/supabase-js";
import type { StoredMessage } from "../../application/ports/chat-history-query.port";
import type { OutgoingMessageStorePort } from "../../application/ports/outgoing-message-store.port";
import type { UpdateLoggerPort } from "../../application/ports/update-logger.port";
import type { ChatMessage } from "../../domain/chat-message.entity";
import type { BotCommand } from "../../domain/bot-command.entity";
import { MESSAGE_COLUMNS, toStoredMessage } from "./chat-history.rows";

const CHATS_TABLE = "chats";
const MESSAGES_TABLE = "messages";

// Postgres counterpart of ./console-update-logger.adapter.ts: persists chat history into
// the `chats`/`messages` tables (see supabase/migrations) instead of just logging it.
// Not part of SHARED_FILES (scripts/generate-edge-shared.mjs) because it talks to
// @supabase/supabase-js directly, whose import path differs between Node and Deno — see
// supabase/functions/_shared/modules/bot/adapters/out/supabase-update-logger.adapter.ts for
// the edge-function counterpart.
export class SupabaseUpdateLoggerAdapter implements UpdateLoggerPort, OutgoingMessageStorePort {
  constructor(private readonly client: SupabaseClient) {}

  async logMessage(message: ChatMessage): Promise<void> {
    const { error: chatError } = await this.client.from(CHATS_TABLE).upsert(
      {
        chat_id: message.chatId,
        first_name: message.firstName,
        last_name: message.lastName,
      },
      { onConflict: "chat_id" },
    );
    if (chatError) throw new Error(`Failed to upsert chat: ${chatError.message}`);

    const { error: messageError } = await this.client
      .from(MESSAGES_TABLE)
      .insert({ chat_id: message.chatId, text: message.text });
    if (messageError) throw new Error(`Failed to persist message: ${messageError.message}`);
  }

  // Commands (/start, /currency, ...) are control flow, not chat content, so they aren't
  // written to the `messages` table.
  async logCommand(command: BotCommand): Promise<void> {
    console.log("[bot] command:", `/${command.name}`, command.args);
  }

  // Stored as a row with no user text, only the bot's side filled in: logReply() never
  // picks it (reply_text is already set) and the touch_chat_last_message trigger still
  // moves the chat to the top of the list.
  async saveOutgoing(chatId: number, text: string): Promise<StoredMessage> {
    const now = new Date().toISOString();
    const { data, error } = await this.client
      .from(MESSAGES_TABLE)
      .insert({ chat_id: chatId, text: null, reply_text: text, replied_at: now, created_at: now })
      .select(MESSAGE_COLUMNS)
      .single();
    if (error) throw new Error(`Failed to persist outgoing message: ${error.message}`);

    return toStoredMessage(data);
  }

  async logReply(chatId: number, text: string): Promise<void> {
    const { data, error: selectError } = await this.client
      .from(MESSAGES_TABLE)
      .select("id")
      .eq("chat_id", chatId)
      .is("reply_text", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (selectError) throw new Error(`Failed to find message to reply to: ${selectError.message}`);
    // No logged message waiting for a reply (e.g. a reply to a button press rather than a
    // logged text message) — nothing to attach this reply to.
    if (!data) return;

    const { error: updateError } = await this.client
      .from(MESSAGES_TABLE)
      .update({ reply_text: text, replied_at: new Date().toISOString() })
      .eq("id", data.id);
    if (updateError) throw new Error(`Failed to persist reply: ${updateError.message}`);
  }
}
