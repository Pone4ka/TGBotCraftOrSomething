export interface TargetCurrencyPreferencePort {
  getCurrency(chatId: number): string | undefined;
  setCurrency(chatId: number, currency: string): void;
  isAwaitingSelection(chatId: number): boolean;
  setAwaitingSelection(chatId: number, awaiting: boolean): void;
}
