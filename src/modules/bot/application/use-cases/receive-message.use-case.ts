import { ChatMessage } from "../../domain/chat-message.entity";
import type { UpdateLoggerPort } from "../ports/update-logger.port";

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
