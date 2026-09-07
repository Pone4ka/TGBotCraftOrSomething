import { DomainException } from "../../../../core/domain/domain-exception";

export class ExchangeRateSourceUnchangedException extends DomainException {
  readonly code = "EXCHANGE_RATE_SOURCE_UNCHANGED";

  constructor(source: string) {
    super(`Exchange rate source is already set to ${source}`);
  }
}
