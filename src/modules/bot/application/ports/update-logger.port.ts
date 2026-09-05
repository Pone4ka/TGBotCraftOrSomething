import type { ChatMessage } from "../../domain/chat-message.entity";
import type { BotCommand } from "../../domain/bot-command.entity";

export const UPDATE_LOGGER_PORT = Symbol("UpdateLoggerPort");

export interface UpdateLoggerPort {
  logMessage(message: ChatMessage): void;
  logCommand(command: BotCommand): void;
}
