// Async for the same reason as UserModePort — see its comment.
export interface TargetCurrencyPreferencePort {
  getCurrency(chatId: number): Promise<string | undefined>;
  setCurrency(chatId: number, currency: string): Promise<void>;
  isAwaitingSelection(chatId: number): Promise<boolean>;
  setAwaitingSelection(chatId: number, awaiting: boolean): Promise<void>;
}
