import { Inject, Injectable } from "@nestjs/common";
import { InlineKeyboard, type Bot } from "grammy";
import {
  EXCHANGE_RATE_SOURCE_PREFERENCE_PORT,
  type ExchangeRateSourcePreferencePort,
} from "../../application/ports/exchange-rate-source-preference.port";
import { SwitchExchangeRateSourceUseCase } from "../../application/use-cases/switch-exchange-rate-source.use-case";
import {
  DEFAULT_EXCHANGE_RATE_SOURCE,
  EXCHANGE_RATE_SOURCES,
  EXCHANGE_RATE_SOURCE_LABELS,
  type ExchangeRateSource,
} from "../../domain/exchange-rate-source";
import { ExchangeRateSourceUnchangedException } from "../../domain/exceptions/exchange-rate-source-unchanged.exception";

const CALLBACK_PREFIX = "exrate-source:";
const PROMPT_TEXT = "Выберите источник курса валют:";

// Label for the "change API" button on the currency mode's keyboard (built in
// MenuBotController); exported so that keyboard can reuse the exact same text.
export const CHANGE_API_LABEL = "🔁 Сменить API";

function isExchangeRateSource(value: string): value is ExchangeRateSource {
  return (EXCHANGE_RATE_SOURCES as readonly string[]).includes(value);
}

function buildKeyboard(current: ExchangeRateSource): InlineKeyboard {
  const keyboard = new InlineKeyboard();
  for (const source of EXCHANGE_RATE_SOURCES) {
    const mark = source === current ? "✅ " : "";
    keyboard.text(`${mark}${EXCHANGE_RATE_SOURCE_LABELS[source]}`, `${CALLBACK_PREFIX}${source}`).row();
  }
  return keyboard;
}

@Injectable()
export class CurrencySourceBotController {
  constructor(
    private readonly switchSource: SwitchExchangeRateSourceUseCase,
    @Inject(EXCHANGE_RATE_SOURCE_PREFERENCE_PORT)
    private readonly sourcePreference: ExchangeRateSourcePreferencePort,
  ) {}

  registerHandlers(bot: Bot): void {
    const showPicker = async (ctx: { chat?: { id: number }; reply: (text: string, other?: { reply_markup: InlineKeyboard }) => Promise<unknown> }): Promise<void> => {
      const chatId = ctx.chat!.id;
      const current = this.sourcePreference.getSource(chatId) ?? DEFAULT_EXCHANGE_RATE_SOURCE;
      await ctx.reply(PROMPT_TEXT, { reply_markup: buildKeyboard(current) });
    };

    bot.command("source", showPicker);
    bot.hears(CHANGE_API_LABEL, showPicker);

    bot.callbackQuery(new RegExp(`^${CALLBACK_PREFIX}`), async (ctx) => {
      const chatId = ctx.chat?.id;
      const raw = ctx.callbackQuery.data.slice(CALLBACK_PREFIX.length);
      if (!chatId || !isExchangeRateSource(raw)) {
        await ctx.answerCallbackQuery();
        return;
      }

      try {
        this.switchSource.execute({ chatId, source: raw });
      } catch (error) {
        if (error instanceof ExchangeRateSourceUnchangedException) {
          // Same source re-selected: nothing changed, so skip editMessageText — Telegram
          // rejects an edit with identical text/markup with a "message is not modified" error.
          await ctx.answerCallbackQuery({ text: `Уже выбрано: ${EXCHANGE_RATE_SOURCE_LABELS[raw]}` });
          return;
        }
        throw error;
      }

      await ctx.answerCallbackQuery({ text: `Источник: ${EXCHANGE_RATE_SOURCE_LABELS[raw]}` });
      await ctx.editMessageText(PROMPT_TEXT, { reply_markup: buildKeyboard(raw) });
    });
  }
}
