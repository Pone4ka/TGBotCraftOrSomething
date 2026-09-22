// GENERATED FILE — do not edit directly, edit src/modules/bot/application/ports/chat-history-query.port.ts instead.
// Regenerate with: pnpm sync:edge

export interface ChatSummary {
  chatId: number;
  firstName: string | null;
  lastName: string | null;
  lastMessageAt: string | null;
  createdAt: string;
}

export interface StoredMessage {
  id: number;
  chatId: number;
  text: string;
  createdAt: string;
  replyText: string | null;
  repliedAt: string | null;
}

// Postgres-only (there's no in-memory equivalent — chat history only exists once
// persisted); the shape still lives here, next to UpdateLoggerPort, so it works unchanged
// under both Node and Deno — see scripts/generate-edge-shared.mjs.
export interface ChatHistoryQueryPort {
  // Newest first (chats: by last_message_at; messages: by created_at).
  listChats(): Promise<ChatSummary[]>;
  listMessages(): Promise<StoredMessage[]>;
}
