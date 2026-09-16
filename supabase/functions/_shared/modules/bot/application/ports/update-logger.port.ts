// GENERATED FILE — do not edit directly, edit src/modules/bot/application/ports/update-logger.port.ts instead.
// Regenerate with: pnpm sync:edge

import type { ChatMessage } from "../../domain/chat-message.entity.ts";
import type { BotCommand } from "../../domain/bot-command.entity.ts";

export interface UpdateLoggerPort {
  logMessage(message: ChatMessage): void;
  logCommand(command: BotCommand): void;
}
