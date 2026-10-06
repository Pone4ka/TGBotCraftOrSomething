import type { ChatHistoryQueryPort, ListMessagesFilter, StoredMessage } from "../ports/chat-history-query.port";

export class ListMessagesUseCase {
  constructor(private readonly chatHistory: ChatHistoryQueryPort) {}

  execute(filter?: ListMessagesFilter): Promise<StoredMessage[]> {
    return this.chatHistory.listMessages(filter);
  }
}
