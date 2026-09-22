// GENERATED FILE — do not edit directly, edit src/modules/bot/application/use-cases/receive-message.use-case.ts instead.
// Regenerate with: pnpm sync:edge

import { ChatMessage } from "../../domain/chat-message.entity.ts";
import type { UpdateLoggerPort } from "../ports/update-logger.port.ts";

export interface ReceiveMessageInput {
  chatId: number;
  authorId: number;
  text: string;
  raw: unknown;
  firstName?: string;
  lastName?: string;
}

export class ReceiveMessageUseCase {
  constructor(private readonly logger: UpdateLoggerPort) {}

  async execute(input: ReceiveMessageInput): Promise<void> {
    const message = ChatMessage.create(input);
    await this.logger.logMessage(message);
  }
}
