import { BotCommand } from "../../domain/bot-command.entity";
import type { UpdateLoggerPort } from "../ports/update-logger.port";

export interface ReceiveCommandInput {
  chatId: number;
  text: string;
  raw: unknown;
}

export class ReceiveCommandUseCase {
  constructor(private readonly logger: UpdateLoggerPort) {}

  async execute(input: ReceiveCommandInput): Promise<void> {
    const command = BotCommand.create(input.chatId, input.text, input.raw);
    await this.logger.logCommand(command);
  }
}
