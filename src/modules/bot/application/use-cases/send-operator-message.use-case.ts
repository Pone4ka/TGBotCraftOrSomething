import { EmptyMessageTextException } from "../../domain/exceptions/empty-message-text.exception";
import type { BotMessageSenderPort } from "../ports/bot-message-sender.port";
import type { StoredMessage } from "../ports/chat-history-query.port";
import type { OutgoingMessageStorePort } from "../ports/outgoing-message-store.port";

export interface SendOperatorMessageInput {
  chatId: number;
  text: string;
}

// A human operator writing to a user on the bot's behalf (see the operator panel served
// by adapters/in/operator-ui.controller.ts).
export class SendOperatorMessageUseCase {
  constructor(
    private readonly sender: BotMessageSenderPort,
    private readonly store: OutgoingMessageStorePort,
  ) {}

  async execute(input: SendOperatorMessageInput): Promise<StoredMessage> {
    const text = input.text.trim();
    if (text.length === 0) {
      throw new EmptyMessageTextException();
    }

    // Deliver first: a message Telegram rejected must not show up in the history as sent.
    await this.sender.sendText(input.chatId, text);
    return this.store.saveOutgoing(input.chatId, text);
  }
}
