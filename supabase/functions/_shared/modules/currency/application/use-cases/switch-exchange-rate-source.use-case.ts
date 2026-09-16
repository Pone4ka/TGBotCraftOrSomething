import { DEFAULT_EXCHANGE_RATE_SOURCE, type ExchangeRateSource } from "../../domain/exchange-rate-source.ts";
import { ExchangeRateSourceUnchangedException } from "../../domain/exceptions/exchange-rate-source-unchanged.exception.ts";
import type { ExchangeRateSourcePreferencePort } from "../ports/exchange-rate-source-preference.port.ts";

export interface SwitchExchangeRateSourceInput {
  chatId: number;
  source: ExchangeRateSource;
}

export class SwitchExchangeRateSourceUseCase {
  constructor(private readonly sourcePreference: ExchangeRateSourcePreferencePort) {}

  async execute(input: SwitchExchangeRateSourceInput): Promise<void> {
    const current = (await this.sourcePreference.getSource(input.chatId)) ?? DEFAULT_EXCHANGE_RATE_SOURCE;
    if (current === input.source) {
      throw new ExchangeRateSourceUnchangedException(input.source);
    }

    await this.sourcePreference.setSource(input.chatId, input.source);
  }
}
