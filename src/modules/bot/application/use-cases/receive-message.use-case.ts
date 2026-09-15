import { ChatMessage } from "../../domain/chat-message.entity";
import type { UpdateLoggerPort } from "../ports/update-logger.port";

export interface ReceiveMessageInput {
  chatId: number;
  authorId: number;
  text: string;
  raw: unknown;
}

export class ReceiveMessageUseCase {
  constructor(private readonly logger: UpdateLoggerPort) {}

  execute(input: ReceiveMessageInput): void {
    const message = ChatMessage.create(input);
    this.logger.logMessage(message);
  }
}
