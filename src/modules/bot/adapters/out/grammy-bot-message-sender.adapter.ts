import { GrammyError, type Api } from "grammy";
import type { BotMessageSenderPort } from "../../application/ports/bot-message-sender.port";
import { MessageDeliveryFailedException } from "../../domain/exceptions/message-delivery-failed.exception";

export class GrammyBotMessageSenderAdapter implements BotMessageSenderPort {
  // Expects an Api instance WITHOUT the reply-capture transformer from bot.module.ts:
  // that transformer would attach this message as the reply to the user's latest
  // unanswered message, while it's stored as a standalone message instead (see
  // OutgoingMessageStorePort).
  constructor(private readonly api: Api) {}

  async sendText(chatId: number, text: string): Promise<void> {
    try {
      await this.api.sendMessage(chatId, text);
    } catch (error) {
      if (error instanceof GrammyError) {
        throw new MessageDeliveryFailedException(error.description);
      }
      throw error;
    }
  }
}
