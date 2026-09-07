import { Inject, Injectable } from "@nestjs/common";
import { DEFAULT_EXCHANGE_RATE_SOURCE, type ExchangeRateSource } from "../../domain/exchange-rate-source";
import { ExchangeRateSourceUnchangedException } from "../../domain/exceptions/exchange-rate-source-unchanged.exception";
import {
  EXCHANGE_RATE_SOURCE_PREFERENCE_PORT,
  type ExchangeRateSourcePreferencePort,
} from "../ports/exchange-rate-source-preference.port";

export interface SwitchExchangeRateSourceInput {
  chatId: number;
  source: ExchangeRateSource;
}

@Injectable()
export class SwitchExchangeRateSourceUseCase {
  constructor(
    @Inject(EXCHANGE_RATE_SOURCE_PREFERENCE_PORT)
    private readonly sourcePreference: ExchangeRateSourcePreferencePort,
  ) {}

  execute(input: SwitchExchangeRateSourceInput): void {
    const current = this.sourcePreference.getSource(input.chatId) ?? DEFAULT_EXCHANGE_RATE_SOURCE;
    if (current === input.source) {
      throw new ExchangeRateSourceUnchangedException(input.source);
    }

    this.sourcePreference.setSource(input.chatId, input.source);
  }
}
