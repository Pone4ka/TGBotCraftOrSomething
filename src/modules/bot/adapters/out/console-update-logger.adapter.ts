import { Injectable } from "@nestjs/common";
import type { UpdateLoggerPort } from "../../application/ports/update-logger.port";
import type { ChatMessage } from "../../domain/chat-message.entity";
import type { BotCommand } from "../../domain/bot-command.entity";

@Injectable()
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
