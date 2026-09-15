import type { ExchangeRateSource } from "../../domain/exchange-rate-source";

export interface ExchangeRateSourcePreferencePort {
  getSource(chatId: number): ExchangeRateSource | undefined;
  setSource(chatId: number, source: ExchangeRateSource): void;
}
