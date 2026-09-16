import type { ExchangeRateSource } from "../../domain/exchange-rate-source";
import type { ExchangeRateSourcePreferencePort } from "../../application/ports/exchange-rate-source-preference.port";

export class InMemoryExchangeRateSourcePreferenceAdapter implements ExchangeRateSourcePreferencePort {
  private readonly sources = new Map<number, ExchangeRateSource>();

  async getSource(chatId: number): Promise<ExchangeRateSource | undefined> {
    return this.sources.get(chatId);
  }

  async setSource(chatId: number, source: ExchangeRateSource): Promise<void> {
    this.sources.set(chatId, source);
  }
}
