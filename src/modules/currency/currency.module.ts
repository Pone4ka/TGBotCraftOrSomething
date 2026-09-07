import { Module } from "@nestjs/common";
import { UserModeModule } from "../../core/user-mode/user-mode.module";
import { CurrencyBotController } from "./adapters/in/currency-bot.controller";
import { CurrencySourceBotController } from "./adapters/in/currency-source-bot.controller";
import { ExchangeRateApiAdapter } from "./adapters/out/exchange-rate-api.adapter";
import { ExchangeRateRouterAdapter } from "./adapters/out/exchange-rate-router.adapter";
import { FrankfurterExchangeRateAdapter } from "./adapters/out/frankfurter-exchange-rate.adapter";
import { InMemoryExchangeRateSourcePreferenceAdapter } from "./adapters/out/in-memory-exchange-rate-source-preference.adapter";
import { EXCHANGE_RATE_PORT } from "./application/ports/exchange-rate.port";
import { EXCHANGE_RATE_SOURCE_PREFERENCE_PORT } from "./application/ports/exchange-rate-source-preference.port";
import { CurrencyTextParserService } from "./application/services/currency-text-parser.service";
import { ConvertToUsdUseCase } from "./application/use-cases/convert-to-usd.use-case";
import { SwitchExchangeRateSourceUseCase } from "./application/use-cases/switch-exchange-rate-source.use-case";

@Module({
  imports: [UserModeModule],
  providers: [
    FrankfurterExchangeRateAdapter,
    ExchangeRateApiAdapter,
    { provide: EXCHANGE_RATE_PORT, useClass: ExchangeRateRouterAdapter },
    {
      provide: EXCHANGE_RATE_SOURCE_PREFERENCE_PORT,
      useClass: InMemoryExchangeRateSourcePreferenceAdapter,
    },
    CurrencyTextParserService,
    ConvertToUsdUseCase,
    SwitchExchangeRateSourceUseCase,
    CurrencyBotController,
    CurrencySourceBotController,
  ],
  exports: [CurrencyBotController, CurrencySourceBotController],
})
export class CurrencyModule {}
