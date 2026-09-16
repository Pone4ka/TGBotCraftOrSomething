// GENERATED FILE — do not edit directly, edit src/modules/currency/domain/exceptions/exchange-rate-api.exception.ts instead.
// Regenerate with: pnpm sync:edge

import { DomainException } from "../../../../core/domain/domain-exception.ts";

export class ExchangeRateApiException extends DomainException {
  readonly code = "EXCHANGE_RATE_API_ERROR";

  constructor(reason: string) {
    super(`Exchange rate API request failed: ${reason}`);
  }
}
