import type { Bot } from "grammy";
import type { UserModePort } from "../../../../core/user-mode/user-mode.port";
import type { ExchangeRateSourcePreferencePort } from "../../../currency/application/ports/exchange-rate-source-preference.port";
import type { TargetCurrencyPreferencePort } from "../../../currency/application/ports/target-currency-preference.port";

// Not listed in setMyCommands, so it never shows up in Telegram's command menu —
// still reachable if someone types it directly, no matter the chat's current mode/state.
const DEBUG_COMMAND = "debug";

export class DebugBotController {
  constructor(
    private readonly userMode: UserModePort,
    private readonly sourcePreference: ExchangeRateSourcePreferencePort,
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
        mode: await this.userMode.getMode(chatId),
        exchangeRateSource: await this.sourcePreference.getSource(chatId),
        targetCurrency: await this.targetCurrencyPreference.getCurrency(chatId),
        awaitingCurrencySelection: await this.targetCurrencyPreference.isAwaitingSelection(chatId),
      };

      await ctx.reply(JSON.stringify(record, null, 2));
    });
  }
}
