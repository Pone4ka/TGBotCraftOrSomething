import type { ChatSummary, StoredMessage } from "../../application/ports/chat-history-query.port";

// Row shapes of the `chats`/`messages` tables (see supabase/migrations) and their mapping
// to the port types, shared by every Node adapter that reads them back.

export const CHAT_COLUMNS = "chat_id, first_name, last_name, last_message_at, created_at";
// Embeds only the latest message of each chat — pair with LATEST_MESSAGE_ONLY below.
export const CHAT_WITH_PREVIEW_COLUMNS = `${CHAT_COLUMNS}, messages(text, reply_text)`;
export const LATEST_MESSAGE_ONLY = { referencedTable: "messages" } as const;

export const MESSAGE_COLUMNS = "id, chat_id, text, created_at, reply_text, replied_at";

interface ChatRow {
  chat_id: number;
  first_name: string | null;
  last_name: string | null;
  last_message_at: string | null;
  created_at: string;
  messages?: { text: string | null; reply_text: string | null }[];
}

interface MessageRow {
  id: number;
  chat_id: number;
  text: string | null;
  created_at: string;
  reply_text: string | null;
  replied_at: string | null;
}

export function toChatSummary(row: ChatRow): ChatSummary {
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
}

export function toStoredMessage(row: MessageRow): StoredMessage {
  return {
    id: row.id,
    chatId: row.chat_id,
    text: row.text,
    createdAt: row.created_at,
    replyText: row.reply_text,
    repliedAt: row.replied_at,
  };
}
