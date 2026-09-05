import { BotCommand } from "../../domain/bot-command.entity.ts";
import type { UpdateLoggerPort } from "../ports/update-logger.port.ts";

export interface ReceiveCommandInput {
  chatId: number;
  text: string;
}

export class ReceiveCommandUseCase {
  private readonly logger: UpdateLoggerPort;

  constructor(logger: UpdateLoggerPort) {
    this.logger = logger;
  }

  execute(input: ReceiveCommandInput): void {
    const command = BotCommand.create(input.chatId, input.text);
    this.logger.logCommand(command);
  }
}
