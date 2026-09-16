import type { UpdateLoggerPort } from "../../application/ports/update-logger.port.ts";
import type { ChatMessage } from "../../domain/chat-message.entity.ts";
import type { BotCommand } from "../../domain/bot-command.entity.ts";

export class ConsoleUpdateLoggerAdapter implements UpdateLoggerPort {
  logMessage(message: ChatMessage): void {
    console.log("[bot] message:", message.text);
    console.log(JSON.stringify(message.raw, null, 2));
  }

  logCommand(command: BotCommand): void {
    console.log("[bot] command:", `/${command.name}`, command.args);
    console.log(JSON.stringify(command.raw, null, 2));
  }
}
