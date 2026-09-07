export const EXCHANGE_RATE_PORT = Symbol("ExchangeRatePort");

export interface ExchangeRatePort {
  convert(amount: number, fromCurrency: string, toCurrency: string, chatId: number): Promise<number>;
}
