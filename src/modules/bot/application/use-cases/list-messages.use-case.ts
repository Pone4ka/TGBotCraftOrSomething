import type { ChatHistoryQueryPort, StoredMessage } from "../ports/chat-history-query.port";

export class ListMessagesUseCase {
  constructor(private readonly chatHistory: ChatHistoryQueryPort) {}

  execute(): Promise<StoredMessage[]> {
    return this.chatHistory.listMessages();
  }
}
