import type { ChatMessage } from "../../domain/chat-message.entity.ts";
import type { BotCommand } from "../../domain/bot-command.entity.ts";

export interface UpdateLoggerPort {
  logMessage(message: ChatMessage): void;
  logCommand(command: BotCommand): void;
}
