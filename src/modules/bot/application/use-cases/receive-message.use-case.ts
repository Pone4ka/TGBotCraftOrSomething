import { ChatMessage } from "../../domain/chat-message.entity.ts";
import type { UpdateLoggerPort } from "../ports/update-logger.port.ts";

export interface ReceiveMessageInput {
  chatId: number;
  authorId: number;
  text: string;
}

export class ReceiveMessageUseCase {
  private readonly logger: UpdateLoggerPort;

  constructor(logger: UpdateLoggerPort) {
    this.logger = logger;
  }

  execute(input: ReceiveMessageInput): void {
    const message = ChatMessage.create(input);
    this.logger.logMessage(message);
  }
}
