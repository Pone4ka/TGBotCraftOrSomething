import type { ChatHistoryQueryPort, ChatSummary } from "../ports/chat-history-query.port";

export class ListChatsUseCase {
  constructor(private readonly chatHistory: ChatHistoryQueryPort) {}

  execute(): Promise<ChatSummary[]> {
    return this.chatHistory.listChats();
  }
}
