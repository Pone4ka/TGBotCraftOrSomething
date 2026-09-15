import type { Config } from "../../core/config";
import type { UserModePort } from "../../core/user-mode/user-mode.port";
import { CurrencyBotController } from "./adapters/in/currency-bot.controller";
import { CurrencySourceBotController } from "./adapters/in/currency-source-bot.controller";
import { ExchangeRateApiAdapter } from "./adapters/out/exchange-rate-api.adapter";
import { ExchangeRateRouterAdapter } from "./adapters/out/exchange-rate-router.adapter";
import { FrankfurterExchangeRateAdapter } from "./adapters/out/frankfurter-exchange-rate.adapter";
import { InMemoryExchangeRateSourcePreferenceAdapter } from "./adapters/out/in-memory-exchange-rate-source-preference.adapter";
import { InMemoryTargetCurrencyPreferenceAdapter } from "./adapters/out/in-memory-target-currency-preference.adapter";
import type { ExchangeRateSourcePreferencePort } from "./application/ports/exchange-rate-source-preference.port";
import type { TargetCurrencyPreferencePort } from "./application/ports/target-currency-preference.port";
import { CurrencyTextParserService } from "./application/services/currency-text-parser.service";
import { ConvertAmountUseCase } from "./application/use-cases/convert-amount.use-case";
import { SwitchExchangeRateSourceUseCase } from "./application/use-cases/switch-exchange-rate-source.use-case";

export interface CurrencyModuleDeps {
  config: Config;
  userMode: UserModePort;
}

export interface CurrencyModule {
  currencyController: CurrencyBotController;
  currencySourceController: CurrencySourceBotController;
  sourcePreference: ExchangeRateSourcePreferencePort;
  targetCurrencyPreference: TargetCurrencyPreferencePort;
}

export function createCurrencyModule(deps: CurrencyModuleDeps): CurrencyModule {
  const sourcePreference = new InMemoryExchangeRateSourcePreferenceAdapter();
  const targetCurrencyPreference = new InMemoryTargetCurrencyPreferenceAdapter();

  const frankfurter = new FrankfurterExchangeRateAdapter();
  const exchangeRateApi = new ExchangeRateApiAdapter(deps.config.exchangeApiKey);
  const exchangeRate = new ExchangeRateRouterAdapter(frankfurter, exchangeRateApi, sourcePreference);

  const parser = new CurrencyTextParserService();
  const convertAmount = new ConvertAmountUseCase(parser, exchangeRate, targetCurrencyPreference);
  const switchSource = new SwitchExchangeRateSourceUseCase(sourcePreference);

  const currencyController = new CurrencyBotController(convertAmount, parser, deps.userMode, targetCurrencyPreference);
  const currencySourceController = new CurrencySourceBotController(switchSource, sourcePreference);

  return { currencyController, currencySourceController, sourcePreference, targetCurrencyPreference };
}
