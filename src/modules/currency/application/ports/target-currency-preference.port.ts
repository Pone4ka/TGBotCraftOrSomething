export const TARGET_CURRENCY_PREFERENCE_PORT = Symbol("TargetCurrencyPreferencePort");

export interface TargetCurrencyPreferencePort {
  getCurrency(chatId: number): string | undefined;
  setCurrency(chatId: number, currency: string): void;
  isAwaitingSelection(chatId: number): boolean;
  setAwaitingSelection(chatId: number, awaiting: boolean): void;
}
