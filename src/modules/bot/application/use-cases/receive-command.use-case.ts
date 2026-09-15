import { BotCommand } from "../../domain/bot-command.entity";
import type { UpdateLoggerPort } from "../ports/update-logger.port";

export interface ReceiveCommandInput {
  chatId: number;
  text: string;
  raw: unknown;
}

export class ReceiveCommandUseCase {
  constructor(private readonly logger: UpdateLoggerPort) {}

  execute(input: ReceiveCommandInput): void {
    const command = BotCommand.create(input.chatId, input.text, input.raw);
    this.logger.logCommand(command);
  }
}
