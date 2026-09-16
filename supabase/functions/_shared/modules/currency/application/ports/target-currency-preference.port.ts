// GENERATED FILE — do not edit directly, edit src/modules/currency/application/ports/target-currency-preference.port.ts instead.
// Regenerate with: pnpm sync:edge

// Async for the same reason as UserModePort — see its comment.
export interface TargetCurrencyPreferencePort {
  getCurrency(chatId: number): Promise<string | undefined>;
  setCurrency(chatId: number, currency: string): Promise<void>;
  isAwaitingSelection(chatId: number): Promise<boolean>;
  setAwaitingSelection(chatId: number, awaiting: boolean): Promise<void>;
}
