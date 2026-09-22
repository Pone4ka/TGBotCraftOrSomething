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

  // Registered first (see bot-lifecycle.service.ts / supabase/functions/bot/index.ts),
  // before any mode-dependent controller gets a chance to reply: the reply-capture API
  // transformer (SupabaseUpdateLoggerAdapter#logReply) attaches an outgoing reply to the
  // most recently logged message for that chat, so the message must already be persisted
  // by the time a handler further down the chain calls ctx.reply(). Both handlers call
  // next() unconditionally so every other controller still gets to process the update.
  registerHandlers(bot: Bot): void {
    bot.on("message:entities:bot_command", async (ctx, next) => {
      await this.handle(() =>
        this.receiveCommand.execute({
          chatId: ctx.chat.id,
          text: ctx.message.text,
          raw: ctx.update,
        }),
      );
      await next();
    });

    bot.on("message", async (ctx, next) => {
      await this.handle(() =>
        this.receiveMessage.execute({
          chatId: ctx.chat.id,
          authorId: ctx.from?.id ?? 0,
          text: ctx.message.text ?? "",
          raw: ctx.update,
          firstName: ctx.from?.first_name,
          lastName: ctx.from?.last_name,
        }),
      );
      await next();
    });
  }

  private async handle(run: () => Promise<void>): Promise<void> {
    try {
      await run();
    } catch (error) {
      if (error instanceof DomainException) {
        console.error(`[bot] domain error (${error.code}):`, error.message);
        return;
      }
      throw error;
    }
  }
}
