import type { ChatSummary, StoredMessage } from "./chat-history-query.port";

export type ChatHistoryChange =
  | { type: "chat"; chat: ChatSummary }
  | { type: "message"; message: StoredMessage };

export type ChatHistoryChangeListener = (change: ChatHistoryChange) => void;

// Push-side counterpart of ChatHistoryQueryPort: notifies about every inserted/updated
// chat or message, no matter which process wrote it (this Node app, or the `bot` edge
// function when Telegram's webhook points there).
export interface ChatHistoryChangesPort {
  // Returns an unsubscribe function.
  subscribe(listener: ChatHistoryChangeListener): () => void;
}
