import { Module } from "@nestjs/common";
import { CurrencyBotController } from "./adapters/in/currency-bot.controller";
import { ExchangeRateApiAdapter } from "./adapters/out/exchange-rate-api.adapter";
import { EXCHANGE_RATE_PORT } from "./application/ports/exchange-rate.port";
import { CurrencyTextParserService } from "./application/services/currency-text-parser.service";
import { ConvertToUsdUseCase } from "./application/use-cases/convert-to-usd.use-case";

@Module({
  providers: [
    { provide: EXCHANGE_RATE_PORT, useClass: ExchangeRateApiAdapter },
    CurrencyTextParserService,
    ConvertToUsdUseCase,
    CurrencyBotController,
  ],
  exports: [CurrencyBotController],
})
export class CurrencyModule {}
