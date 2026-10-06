import type { ChatHistoryChangeListener, ChatHistoryChangesPort } from "../ports/chat-history-changes.port";

export class WatchChatHistoryUseCase {
  constructor(private readonly changes: ChatHistoryChangesPort) {}

  // Returns an unsubscribe function.
  execute(listener: ChatHistoryChangeListener): () => void {
    return this.changes.subscribe(listener);
  }
}
