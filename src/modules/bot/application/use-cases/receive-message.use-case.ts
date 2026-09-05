import { Inject, Injectable } from "@nestjs/common";
import { ChatMessage } from "../../domain/chat-message.entity";
import { UPDATE_LOGGER_PORT, type UpdateLoggerPort } from "../ports/update-logger.port";

export interface ReceiveMessageInput {
  chatId: number;
  authorId: number;
  text: string;
  raw: unknown;
}

@Injectable()
export class ReceiveMessageUseCase {
  constructor(
    @Inject(UPDATE_LOGGER_PORT) private readonly logger: UpdateLoggerPort,
  ) {}

  execute(input: ReceiveMessageInput): void {
    const message = ChatMessage.create(input);
    this.logger.logMessage(message);
  }
}
