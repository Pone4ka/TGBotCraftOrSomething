import type { ExchangeRatePort } from "../../application/ports/exchange-rate.port.ts";
import { ExchangeRateApiException } from "../../domain/exceptions/exchange-rate-api.exception.ts";

interface ExchangeRatePairResponse {
  result: "success" | "error";
  "error-type"?: string;
  conversion_result?: number;
}

export class ExchangeRateApiAdapter implements ExchangeRatePort {
  constructor(private readonly apiKey: string) {}

  async convert(amount: number, fromCurrency: string, toCurrency: string): Promise<number> {
    const url = `https://v6.exchangerate-api.com/v6/${this.apiKey}/pair/${fromCurrency}/${toCurrency}/${amount}`;

    let response: Response;
    try {
      response = await fetch(url);
    } catch (error) {
      throw new ExchangeRateApiException(
        error instanceof Error ? error.message : "network error",
      );
    }

    const data = (await response.json()) as ExchangeRatePairResponse;
    if (!response.ok || data.result !== "success" || data.conversion_result === undefined) {
      throw new ExchangeRateApiException(data["error-type"] ?? `HTTP ${response.status}`);
    }

    return data.conversion_result;
  }
}
