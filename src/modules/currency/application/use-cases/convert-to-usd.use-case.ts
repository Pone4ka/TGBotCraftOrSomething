import { Inject, Injectable } from "@nestjs/common";
import { CurrencyTextParserService } from "../services/currency-text-parser.service";
import { EXCHANGE_RATE_PORT, type ExchangeRatePort } from "../ports/exchange-rate.port";

export interface ConvertToUsdResult {
  amount: number;
  currency: string;
  usd: number;
}

@Injectable()
export class ConvertToUsdUseCase {
  constructor(
    private readonly parser: CurrencyTextParserService,
    @Inject(EXCHANGE_RATE_PORT) private readonly exchangeRate: ExchangeRatePort,
  ) {}

  async execute(text: string): Promise<ConvertToUsdResult | null> {
    const parsed = this.parser.parse(text);
    if (!parsed) return null;

    if (parsed.currency === "USD") {
      return { amount: parsed.amount, currency: parsed.currency, usd: parsed.amount };
    }

    const usd = await this.exchangeRate.convertToUsd(parsed.amount, parsed.currency);
    return { amount: parsed.amount, currency: parsed.currency, usd };
  }
}
