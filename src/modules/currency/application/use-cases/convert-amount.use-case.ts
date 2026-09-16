import { CurrencyTextParserService } from "../services/currency-text-parser.service";
import type { ExchangeRatePort } from "../ports/exchange-rate.port";
import type { TargetCurrencyPreferencePort } from "../ports/target-currency-preference.port";

export const DEFAULT_TARGET_CURRENCY = "USD";

export interface ConvertAmountResult {
  amount: number;
  currency: string;
  converted: number;
  targetCurrency: string;
}

export class ConvertAmountUseCase {
  constructor(
    private readonly parser: CurrencyTextParserService,
    private readonly exchangeRate: ExchangeRatePort,
    private readonly targetCurrencyPreference: TargetCurrencyPreferencePort,
  ) {}

  async execute(text: string, chatId: number): Promise<ConvertAmountResult | null> {
    const parsed = this.parser.parse(text);
    if (!parsed) return null;

    const targetCurrency = (await this.targetCurrencyPreference.getCurrency(chatId)) ?? DEFAULT_TARGET_CURRENCY;

    if (parsed.currency === targetCurrency) {
      return { amount: parsed.amount, currency: parsed.currency, converted: parsed.amount, targetCurrency };
    }

    const converted = await this.exchangeRate.convert(parsed.amount, parsed.currency, targetCurrency, chatId);
    return { amount: parsed.amount, currency: parsed.currency, converted, targetCurrency };
  }
}
