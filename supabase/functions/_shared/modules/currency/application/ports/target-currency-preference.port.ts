// Async, unlike the Node app's port: state has to persist across stateless edge-function
// invocations, so it's backed by Postgres instead of an in-memory Map/Set.
export interface TargetCurrencyPreferencePort {
  getCurrency(chatId: number): Promise<string | undefined>;
  setCurrency(chatId: number, currency: string): Promise<void>;
  isAwaitingSelection(chatId: number): Promise<boolean>;
  setAwaitingSelection(chatId: number, awaiting: boolean): Promise<void>;
}
