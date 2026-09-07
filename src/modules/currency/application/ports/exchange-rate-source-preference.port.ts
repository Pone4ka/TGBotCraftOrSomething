import type { ExchangeRateSource } from "../../domain/exchange-rate-source";

export const EXCHANGE_RATE_SOURCE_PREFERENCE_PORT = Symbol("ExchangeRateSourcePreferencePort");

export interface ExchangeRateSourcePreferencePort {
  getSource(chatId: number): ExchangeRateSource | undefined;
  setSource(chatId: number, source: ExchangeRateSource): void;
}
