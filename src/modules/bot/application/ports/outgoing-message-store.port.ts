import type { StoredMessage } from "./chat-history-query.port";

export interface OutgoingMessageStorePort {
  // Persists a message the bot sent on its own initiative (not as a reply to a logged
  // user message) and returns it in the same shape ChatHistoryQueryPort reads it back.
  saveOutgoing(chatId: number, text: string): Promise<StoredMessage>;
}
