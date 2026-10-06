export interface BotMessageSenderPort {
  // Delivers a text message to the chat on behalf of the bot. Throws
  // MessageDeliveryFailedException if Telegram rejects it (user blocked the bot, ...).
  sendText(chatId: number, text: string): Promise<void>;
}
