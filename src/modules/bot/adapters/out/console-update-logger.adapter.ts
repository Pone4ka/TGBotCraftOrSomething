import type { UpdateLoggerPort } from "../../application/ports/update-logger.port";
import type { ChatMessage } from "../../domain/chat-message.entity";
import type { BotCommand } from "../../domain/bot-command.entity";

export class ConsoleUpdateLoggerAdapter implements UpdateLoggerPort {
  async logMessage(message: ChatMessage): Promise<void> {
    console.log("[bot] message:", message.text);
    console.log(JSON.stringify(message.raw, null, 2));
  }

  async logCommand(command: BotCommand): Promise<void> {
    console.log("[bot] command:", `/${command.name}`, command.args);
    console.log(JSON.stringify(command.raw, null, 2));
  }

  async logReply(chatId: number, text: string): Promise<void> {
    console.log("[bot] reply:", chatId, text);
  }
}
