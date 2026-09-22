// GENERATED FILE — do not edit directly, edit src/modules/bot/application/use-cases/list-chats.use-case.ts instead.
// Regenerate with: pnpm sync:edge

import type { ChatHistoryQueryPort, ChatSummary } from "../ports/chat-history-query.port.ts";

export class ListChatsUseCase {
  constructor(private readonly chatHistory: ChatHistoryQueryPort) {}

  execute(): Promise<ChatSummary[]> {
    return this.chatHistory.listChats();
  }
}
