// GENERATED FILE — do not edit directly, edit src/modules/currency/domain/exceptions/unsupported-currency-by-source.exception.ts instead.
// Regenerate with: pnpm sync:edge

import { DomainException } from "../../../../core/domain/domain-exception.ts";

export class UnsupportedCurrencyBySourceException extends DomainException {
  readonly code = "UNSUPPORTED_CURRENCY_BY_SOURCE";

  constructor(currency: string, source: string) {
    super(`Currency ${currency} is not supported by source ${source}`);
  }
}
