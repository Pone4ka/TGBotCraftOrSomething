import { DomainException } from "../../../../core/domain/domain-exception";

export class ExchangeRateApiException extends DomainException {
  readonly code = "EXCHANGE_RATE_API_ERROR";

  constructor(reason: string) {
    super(`Exchange rate API request failed: ${reason}`);
  }
}
