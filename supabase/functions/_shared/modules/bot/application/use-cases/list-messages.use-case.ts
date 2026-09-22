// GENERATED FILE — do not edit directly, edit src/modules/bot/application/use-cases/list-messages.use-case.ts instead.
// Regenerate with: pnpm sync:edge

import type { ChatHistoryQueryPort, StoredMessage } from "../ports/chat-history-query.port.ts";

export class ListMessagesUseCase {
  constructor(private readonly chatHistory: ChatHistoryQueryPort) {}

  execute(): Promise<StoredMessage[]> {
    return this.chatHistory.listMessages();
  }
}
