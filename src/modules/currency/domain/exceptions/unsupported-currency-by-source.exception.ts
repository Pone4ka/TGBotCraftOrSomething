import { DomainException } from "../../../../core/domain/domain-exception";

export class UnsupportedCurrencyBySourceException extends DomainException {
  readonly code = "UNSUPPORTED_CURRENCY_BY_SOURCE";

  constructor(currency: string, source: string) {
    super(`Currency ${currency} is not supported by source ${source}`);
  }
}
