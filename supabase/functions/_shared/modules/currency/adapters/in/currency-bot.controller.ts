// GENERATED FILE — do not edit directly, edit src/modules/currency/adapters/in/currency-bot.controller.ts instead.
// Regenerate with: pnpm sync:edge

import type { Bot } from "npm:grammy@1.46.0";
import { DomainException } from "../../../../core/domain/domain-exception.ts";
import { DEFAULT_BOT_MODE } from "../../../../core/user-mode/bot-mode.ts";
import type { UserModePort } from "../../../../core/user-mode/user-mode.port.ts";
import { CurrencyTextParserService } from "../../application/services/currency-text-parser.service.ts";
import { ConvertAmountUseCase } from "../../application/use-cases/convert-amount.use-case.ts";
import type { TargetCurrencyPreferencePort } from "../../application/ports/target-currency-preference.port.ts";

// Label for the "choose target currency" button on the currency mode's keyboard (built in
// MenuBotController); exported so that keyboard can reuse the exact same text.
export const CHOOSE_CURRENCY_LABEL = "💱 Выбор валюты";
const CHOOSE_CURRENCY_PROMPT = "Введите название валюты";

export class CurrencyBotController {
  constructor(
    private readonly convertAmount: ConvertAmountUseCase,
    private readonly parser: CurrencyTextParserService,
    private readonly userMode: UserModePort,
    private readonly targetCurrencyPreference: TargetCurrencyPreferencePort,
  ) {}

  registerHandlers(bot: Bot): void {
    bot.hears(CHOOSE_CURRENCY_LABEL, async (ctx, next) => {
      const mode = (await this.userMode.getMode(ctx.chat.id)) ?? DEFAULT_BOT_MODE;
      if (mode !== "currency") {
        await next();
        return;
      }

      await this.targetCurrencyPreference.setAwaitingSelection(ctx.chat.id, true);
      await ctx.reply(CHOOSE_CURRENCY_PROMPT);
    });

    bot.on("message:text", async (ctx, next) => {
      const isBotCommand = ctx.message.entities?.some((entity) => entity.type === "bot_command") ?? false;
      const mode = (await this.userMode.getMode(ctx.chat.id)) ?? DEFAULT_BOT_MODE;
      if (isBotCommand || mode !== "currency") {
        await next();
        return;
      }

      if (await this.targetCurrencyPreference.isAwaitingSelection(ctx.chat.id)) {
        const currency = this.parser.parseCurrencyName(ctx.message.text);
        if (currency) {
          await this.targetCurrencyPreference.setCurrency(ctx.chat.id, currency);
          await this.targetCurrencyPreference.setAwaitingSelection(ctx.chat.id, false);
          await ctx.reply(`Валюта для конвертации: ${currency}`);
        } else {
          await ctx.reply("Не удалось распознать валюту, попробуйте ещё раз");
        }
        await next();
        return;
      }

      try {
        const result = await this.convertAmount.execute(ctx.message.text, ctx.chat.id);
        if (result) {
          await ctx.reply(
            `${result.amount} ${result.currency} ≈ ${result.converted.toFixed(2)} ${result.targetCurrency}`,
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
