import { Inject, Injectable } from "@nestjs/common";
import { BotCommand } from "../../domain/bot-command.entity";
import { UPDATE_LOGGER_PORT, type UpdateLoggerPort } from "../ports/update-logger.port";

export interface ReceiveCommandInput {
  chatId: number;
  text: string;
  raw: unknown;
}

@Injectable()
export class ReceiveCommandUseCase {
  constructor(
    @Inject(UPDATE_LOGGER_PORT) private readonly logger: UpdateLoggerPort,
  ) {}

  execute(input: ReceiveCommandInput): void {
    const command = BotCommand.create(input.chatId, input.text, input.raw);
    this.logger.logCommand(command);
  }
}
