// GENERATED FILE — do not edit directly, edit src/modules/currency/application/ports/exchange-rate.port.ts instead.
// Regenerate with: pnpm sync:edge

export interface ExchangeRatePort {
  convert(amount: number, fromCurrency: string, toCurrency: string, chatId: number): Promise<number>;
}
