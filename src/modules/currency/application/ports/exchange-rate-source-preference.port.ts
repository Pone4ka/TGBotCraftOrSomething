import type { ExchangeRateSource } from "../../domain/exchange-rate-source";

// Async for the same reason as UserModePort — see its comment.
export interface ExchangeRateSourcePreferencePort {
  getSource(chatId: number): Promise<ExchangeRateSource | undefined>;
  setSource(chatId: number, source: ExchangeRateSource): Promise<void>;
}
