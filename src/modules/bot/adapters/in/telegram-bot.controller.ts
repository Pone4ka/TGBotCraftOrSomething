import { Injectable } from "@nestjs/common";
import type { Bot } from "grammy";
import { ReceiveMessageUseCase } from "../../application/use-cases/receive-message.use-case";
import { ReceiveCommandUseCase } from "../../application/use-cases/receive-command.use-case";
import { DomainException } from "../../../../core/domain/domain-exception";

@Injectable()
export class TelegramBotController {
  constructor(
    private readonly receiveMessage: ReceiveMessageUseCase,
    private readonly receiveCommand: ReceiveCommandUseCase,
  ) {}

  registerHandlers(bot: Bot): void {
    bot.on("message:entities:bot_command", (ctx) => {
      this.handle(() =>
        this.receiveCommand.execute({
          chatId: ctx.chat.id,
          text: ctx.message.text,
          raw: ctx.update,
        }),
      );
    });

    bot.on("message", (ctx) => {
      this.handle(() =>
        this.receiveMessage.execute({
          chatId: ctx.chat.id,
          authorId: ctx.from?.id ?? 0,
          text: ctx.message.text ?? "",
          raw: ctx.update,
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
