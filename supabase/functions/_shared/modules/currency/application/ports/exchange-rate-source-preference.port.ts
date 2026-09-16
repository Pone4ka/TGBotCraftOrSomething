// GENERATED FILE — do not edit directly, edit src/modules/currency/application/ports/exchange-rate-source-preference.port.ts instead.
// Regenerate with: pnpm sync:edge

import type { ExchangeRateSource } from "../../domain/exchange-rate-source.ts";

// Async for the same reason as UserModePort — see its comment.
export interface ExchangeRateSourcePreferencePort {
  getSource(chatId: number): Promise<ExchangeRateSource | undefined>;
  setSource(chatId: number, source: ExchangeRateSource): Promise<void>;
}
