// GENERATED FILE — do not edit directly, edit src/modules/bot/application/use-cases/receive-command.use-case.ts instead.
// Regenerate with: pnpm sync:edge

import { BotCommand } from "../../domain/bot-command.entity.ts";
import type { UpdateLoggerPort } from "../ports/update-logger.port.ts";

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
