import type { Bot } from "grammy";
import type { ReceiveMessageUseCase } from "../../application/use-cases/receive-message.use-case.ts";
import type { ReceiveCommandUseCase } from "../../application/use-cases/receive-command.use-case.ts";
import { DomainException } from "../../../../shared/domain/domain-exception.ts";

export class TelegramBotController {
  private readonly receiveMessage: ReceiveMessageUseCase;
  private readonly receiveCommand: ReceiveCommandUseCase;

  constructor(
    receiveMessage: ReceiveMessageUseCase,
    receiveCommand: ReceiveCommandUseCase,
  ) {
    this.receiveMessage = receiveMessage;
    this.receiveCommand = receiveCommand;
  }

  registerHandlers(bot: Bot): void {
    bot.on("message:entities:bot_command", (ctx) => {
      this.handle(() =>
        this.receiveCommand.execute({
          chatId: ctx.chat.id,
          text: ctx.message.text,
        }),
      );
    });

    bot.on("message", (ctx) => {
      this.handle(() =>
        this.receiveMessage.execute({
          chatId: ctx.chat.id,
          authorId: ctx.from?.id ?? 0,
          text: ctx.message.text ?? "",
        }),
      );
    });
  }

  private handle(run: () => void): void {
    try {
      run();
    } catch (error) {
      if (error instanceof DomainException) {
        console.error(`[bot] domain error (${error.code}):`, error.message);
        return;
      }
      throw error;
    }
  }
}
