// GENERATED FILE — do not edit directly, edit src/modules/bot/adapters/in/telegram-bot.controller.ts instead.
// Regenerate with: pnpm sync:edge

import type { Bot } from "npm:grammy@1.46.0";
import { ReceiveMessageUseCase } from "../../application/use-cases/receive-message.use-case.ts";
import { ReceiveCommandUseCase } from "../../application/use-cases/receive-command.use-case.ts";
import { DomainException } from "../../../../core/domain/domain-exception.ts";

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
