import { Injectable } from "@nestjs/common";
import type { ExchangeRatePort } from "../../application/ports/exchange-rate.port";
import { ExchangeRateApiException } from "../../domain/exceptions/exchange-rate-api.exception";
import { UnsupportedCurrencyBySourceException } from "../../domain/exceptions/unsupported-currency-by-source.exception";

interface FrankfurterResponse {
  amount: number;
  base: string;
  date: string;
  rates: Record<string, number>;
}

@Injectable()
export class FrankfurterExchangeRateAdapter implements ExchangeRatePort {
  async convertToUsd(amount: number, fromCurrency: string): Promise<number> {
    const url = `https://api.frankfurter.dev/v1/latest?amount=${amount}&from=${fromCurrency}&to=USD`;

    let response: Response;
    try {
      response = await fetch(url);
    } catch (error) {
      throw new ExchangeRateApiException(
        error instanceof Error ? error.message : "network error",
      );
    }

    // Frankfurter tracks ECB reference rates, which don't cover every currency
    // (e.g. RUB, BYN, UAH, KZT) — a 404 here means "unsupported", not "down".
    if (response.status === 404) {
      throw new UnsupportedCurrencyBySourceException(fromCurrency, "frankfurter");
    }

    const data = (await response.json()) as FrankfurterResponse;
    const usd = data.rates?.USD;
    if (!response.ok || usd === undefined) {
      throw new ExchangeRateApiException(`HTTP ${response.status}`);
    }

    return usd;
  }
}
