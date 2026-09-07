import { Inject, Injectable } from "@nestjs/common";
import type { Bot } from "grammy";
import { DomainException } from "../../../../core/domain/domain-exception";
import { DEFAULT_BOT_MODE } from "../../../../core/user-mode/bot-mode";
import { USER_MODE_PORT, type UserModePort } from "../../../../core/user-mode/user-mode.port";
import { CurrencyTextParserService } from "../../application/services/currency-text-parser.service";
import { ConvertToUsdUseCase } from "../../application/use-cases/convert-to-usd.use-case";

@Injectable()
export class CurrencyBotController {
  constructor(
    private readonly convertToUsd: ConvertToUsdUseCase,
    private readonly parser: CurrencyTextParserService,
    @Inject(USER_MODE_PORT) private readonly userMode: UserModePort,
  ) {}

  registerHandlers(bot: Bot): void {
    bot.on("message:text", async (ctx, next) => {
      const isBotCommand = ctx.message.entities?.some((entity) => entity.type === "bot_command") ?? false;
      const mode = this.userMode.getMode(ctx.chat.id) ?? DEFAULT_BOT_MODE;
      if (isBotCommand || mode !== "currency") {
        await next();
        return;
      }

      try {
        const result = await this.convertToUsd.execute(ctx.message.text, ctx.chat.id);
        if (result) {
          await ctx.reply(
            `${result.amount} ${result.currency} ≈ ${result.usd.toFixed(2)} USD`,
          );
        } else {
          const issue = this.parser.detectIssue(ctx.message.text);
          if (issue === "unrecognized-currency") {
            await ctx.reply("Уточните валюту");
          } else if (issue === "missing-amount") {
            await ctx.reply("Введите значение и валюту");
          }
        }
      } catch (error) {
        if (error instanceof DomainException) {
          console.error(`[currency] domain error (${error.code}):`, error.message);
          await ctx.reply("Не удалось получить курс валют, попробуйте позже");
        } else {
          throw error;
        }
      }

      await next();
    });
  }
}
