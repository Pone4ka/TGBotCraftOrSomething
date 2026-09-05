import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { ExchangeRatePort } from "../../application/ports/exchange-rate.port";
import { ExchangeRateApiException } from "../../domain/exceptions/exchange-rate-api.exception";

interface ExchangeRatePairResponse {
  result: "success" | "error";
  "error-type"?: string;
  conversion_result?: number;
}

@Injectable()
export class ExchangeRateApiAdapter implements ExchangeRatePort {
  constructor(private readonly configService: ConfigService) {}

  async convertToUsd(amount: number, fromCurrency: string): Promise<number> {
    const apiKey = this.configService.getOrThrow<string>("EXCHANGE_API_KEY");
    const url = `https://v6.exchangerate-api.com/v6/${apiKey}/pair/${fromCurrency}/USD/${amount}`;

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
