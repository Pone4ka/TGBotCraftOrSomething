import { Inject, Injectable } from "@nestjs/common";
import type { ExchangeRatePort } from "../../application/ports/exchange-rate.port";
import {
  EXCHANGE_RATE_SOURCE_PREFERENCE_PORT,
  type ExchangeRateSourcePreferencePort,
} from "../../application/ports/exchange-rate-source-preference.port";
import { DEFAULT_EXCHANGE_RATE_SOURCE } from "../../domain/exchange-rate-source";
import { UnsupportedCurrencyBySourceException } from "../../domain/exceptions/unsupported-currency-by-source.exception";
import { ExchangeRateApiAdapter } from "./exchange-rate-api.adapter";
import { FrankfurterExchangeRateAdapter } from "./frankfurter-exchange-rate.adapter";

/** Picks the exchange rate source per chat, falling back to ExchangeRate-API for
 * currencies Frankfurter's ECB feed doesn't carry. */
@Injectable()
export class ExchangeRateRouterAdapter implements ExchangeRatePort {
  constructor(
    private readonly frankfurter: FrankfurterExchangeRateAdapter,
    private readonly exchangeRateApi: ExchangeRateApiAdapter,
    @Inject(EXCHANGE_RATE_SOURCE_PREFERENCE_PORT)
    private readonly sourcePreference: ExchangeRateSourcePreferencePort,
  ) {}

  async convertToUsd(amount: number, fromCurrency: string, chatId: number): Promise<number> {
    const source = this.sourcePreference.getSource(chatId) ?? DEFAULT_EXCHANGE_RATE_SOURCE;

    if (source === "exchangerate-api") {
      return this.exchangeRateApi.convertToUsd(amount, fromCurrency);
    }

    try {
      return await this.frankfurter.convertToUsd(amount, fromCurrency);
    } catch (error) {
      if (error instanceof UnsupportedCurrencyBySourceException) {
        return this.exchangeRateApi.convertToUsd(amount, fromCurrency);
      }
      throw error;
    }
  }
}
