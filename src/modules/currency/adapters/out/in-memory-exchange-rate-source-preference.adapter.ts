import { Injectable } from "@nestjs/common";
import type { ExchangeRateSource } from "../../domain/exchange-rate-source";
import type { ExchangeRateSourcePreferencePort } from "../../application/ports/exchange-rate-source-preference.port";

@Injectable()
export class InMemoryExchangeRateSourcePreferenceAdapter implements ExchangeRateSourcePreferencePort {
  private readonly sources = new Map<number, ExchangeRateSource>();

  getSource(chatId: number): ExchangeRateSource | undefined {
    return this.sources.get(chatId);
  }

  setSource(chatId: number, source: ExchangeRateSource): void {
    this.sources.set(chatId, source);
  }
}
