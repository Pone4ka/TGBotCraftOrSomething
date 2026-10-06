// GENERATED FILE — do not edit directly, edit src/modules/bot/application/ports/chat-history-query.port.ts instead.
// Regenerate with: pnpm sync:edge

export interface ChatSummary {
  chatId: number;
  firstName: string | null;
  lastName: string | null;
  lastMessageAt: string | null;
  createdAt: string;
  // Preview of the most recent entry in the chat (the bot's reply if the latest message
  // has one, otherwise the user's own text) — what a chat list shows under the name.
  lastMessageText: string | null;
  lastMessageFromBot: boolean;
}

export interface StoredMessage {
  id: number;
  chatId: number;
  // null for a message the bot sent on its own initiative (e.g. from the operator panel)
  // rather than in reply to something the user wrote — then only replyText is set.
  text: string | null;
  createdAt: string;
  replyText: string | null;
  repliedAt: string | null;
}

export interface ListMessagesFilter {
  chatId?: number;
}

// Postgres-only (there's no in-memory equivalent — chat history only exists once
// persisted); the shape still lives here, next to UpdateLoggerPort, so it works unchanged
// under both Node and Deno — see scripts/generate-edge-shared.mjs.
export interface ChatHistoryQueryPort {
  // Newest first (chats: by last_message_at; messages: by created_at).
  listChats(): Promise<ChatSummary[]>;
  listMessages(filter?: ListMessagesFilter): Promise<StoredMessage[]>;
}
