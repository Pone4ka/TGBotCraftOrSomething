// GENERATED FILE — do not edit directly, edit src/modules/currency/domain/exceptions/exchange-rate-source-unchanged.exception.ts instead.
// Regenerate with: pnpm sync:edge

import { DomainException } from "../../../../core/domain/domain-exception.ts";

export class ExchangeRateSourceUnchangedException extends DomainException {
  readonly code = "EXCHANGE_RATE_SOURCE_UNCHANGED";

  constructor(source: string) {
    super(`Exchange rate source is already set to ${source}`);
  }
}
