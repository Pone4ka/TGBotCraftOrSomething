import type { ChatMessage } from "../../domain/chat-message.entity";
import type { BotCommand } from "../../domain/bot-command.entity";

export interface UpdateLoggerPort {
  logMessage(message: ChatMessage): void;
  logCommand(command: BotCommand): void;
}
