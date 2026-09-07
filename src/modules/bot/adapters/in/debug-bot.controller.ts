import { Inject, Injectable } from "@nestjs/common";
import type { Bot } from "grammy";
import { USER_MODE_PORT, type UserModePort } from "../../../../core/user-mode/user-mode.port";
import {
  EXCHANGE_RATE_SOURCE_PREFERENCE_PORT,
  type ExchangeRateSourcePreferencePort,
} from "../../../currency/application/ports/exchange-rate-source-preference.port";
import {
  TARGET_CURRENCY_PREFERENCE_PORT,
  type TargetCurrencyPreferencePort,
} from "../../../currency/application/ports/target-currency-preference.port";

// Not listed in setMyCommands, so it never shows up in Telegram's command menu —
// still reachable if someone types it directly, no matter the chat's current mode/state.
const DEBUG_COMMAND = "debug";

@Injectable()
export class DebugBotController {
  constructor(
    @Inject(USER_MODE_PORT) private readonly userMode: UserModePort,
    @Inject(EXCHANGE_RATE_SOURCE_PREFERENCE_PORT)
    private readonly sourcePreference: ExchangeRateSourcePreferencePort,
    @Inject(TARGET_CURRENCY_PREFERENCE_PORT)
    private readonly targetCurrencyPreference: TargetCurrencyPreferencePort,
  ) {}

  // Intentionally does not call next(): fully handled here regardless of mode, so no
  // downstream mode-dependent controller should also react to it.
  registerHandlers(bot: Bot): void {
    bot.command(DEBUG_COMMAND, async (ctx) => {
      const chatId = ctx.chat.id;
      const record = {
        chatId,
        userId: ctx.from?.id,
        mode: this.userMode.getMode(chatId),
        exchangeRateSource: this.sourcePreference.getSource(chatId),
        targetCurrency: this.targetCurrencyPreference.getCurrency(chatId),
        awaitingCurrencySelection: this.targetCurrencyPreference.isAwaitingSelection(chatId),
      };

      await ctx.reply(JSON.stringify(record, null, 2));
    });
  }
}
