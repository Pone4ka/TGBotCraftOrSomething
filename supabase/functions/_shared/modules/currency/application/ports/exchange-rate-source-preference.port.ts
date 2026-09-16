import type { ExchangeRateSource } from "../../domain/exchange-rate-source.ts";

// Async, unlike the Node app's port: state has to persist across stateless edge-function
// invocations, so it's backed by Postgres instead of an in-memory Map.
export interface ExchangeRateSourcePreferencePort {
  getSource(chatId: number): Promise<ExchangeRateSource | undefined>;
  setSource(chatId: number, source: ExchangeRateSource): Promise<void>;
}
