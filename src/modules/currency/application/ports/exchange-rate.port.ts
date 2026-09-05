export const EXCHANGE_RATE_PORT = Symbol("ExchangeRatePort");

export interface ExchangeRatePort {
  convertToUsd(amount: number, fromCurrency: string): Promise<number>;
}
