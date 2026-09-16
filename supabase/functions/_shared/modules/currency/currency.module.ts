import type { UserModePort } from "../../core/user-mode.port.ts";
import { CurrencyBotController } from "./adapters/in/currency-bot.controller.ts";
import { CurrencySourceBotController } from "./adapters/in/currency-source-bot.controller.ts";
import { ExchangeRateApiAdapter } from "./adapters/out/exchange-rate-api.adapter.ts";
import { ExchangeRateRouterAdapter } from "./adapters/out/exchange-rate-router.adapter.ts";
import { FrankfurterExchangeRateAdapter } from "./adapters/out/frankfurter-exchange-rate.adapter.ts";
import { SupabaseExchangeRateSourcePreferenceAdapter } from "./adapters/out/supabase-exchange-rate-source-preference.adapter.ts";
import { SupabaseTargetCurrencyPreferenceAdapter } from "./adapters/out/supabase-target-currency-preference.adapter.ts";
import type { ExchangeRateSourcePreferencePort } from "./application/ports/exchange-rate-source-preference.port.ts";
import type { TargetCurrencyPreferencePort } from "./application/ports/target-currency-preference.port.ts";
import { CurrencyTextParserService } from "./application/services/currency-text-parser.service.ts";
import { ConvertAmountUseCase } from "./application/use-cases/convert-amount.use-case.ts";
import { SwitchExchangeRateSourceUseCase } from "./application/use-cases/switch-exchange-rate-source.use-case.ts";

export interface CurrencyModuleDeps {
  exchangeApiKey: string;
  userMode: UserModePort;
}

export interface CurrencyModule {
  currencyController: CurrencyBotController;
  currencySourceController: CurrencySourceBotController;
  sourcePreference: ExchangeRateSourcePreferencePort;
  targetCurrencyPreference: TargetCurrencyPreferencePort;
  // Exposed (unlike the Node app's module) so the standalone `currency` edge function can
  // run a conversion straight from an HTTP request, without going through Telegram at all.
  convertAmount: ConvertAmountUseCase;
  parser: CurrencyTextParserService;
}

export function createCurrencyModule(deps: CurrencyModuleDeps): CurrencyModule {
  const sourcePreference = new SupabaseExchangeRateSourcePreferenceAdapter();
  const targetCurrencyPreference = new SupabaseTargetCurrencyPreferenceAdapter();

  const frankfurter = new FrankfurterExchangeRateAdapter();
  const exchangeRateApi = new ExchangeRateApiAdapter(deps.exchangeApiKey);
  const exchangeRate = new ExchangeRateRouterAdapter(frankfurter, exchangeRateApi, sourcePreference);

  const parser = new CurrencyTextParserService();
  const convertAmount = new ConvertAmountUseCase(parser, exchangeRate, targetCurrencyPreference);
  const switchSource = new SwitchExchangeRateSourceUseCase(sourcePreference);

  const currencyController = new CurrencyBotController(convertAmount, parser, deps.userMode, targetCurrencyPreference);
  const currencySourceController = new CurrencySourceBotController(switchSource, sourcePreference);

  return {
    currencyController,
    currencySourceController,
    sourcePreference,
    targetCurrencyPreference,
    convertAmount,
    parser,
  };
}
