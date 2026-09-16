import type { TargetCurrencyPreferencePort } from "../../application/ports/target-currency-preference.port";

export class InMemoryTargetCurrencyPreferenceAdapter implements TargetCurrencyPreferencePort {
  private readonly currencies = new Map<number, string>();
  private readonly awaitingSelection = new Set<number>();

  async getCurrency(chatId: number): Promise<string | undefined> {
    return this.currencies.get(chatId);
  }

  async setCurrency(chatId: number, currency: string): Promise<void> {
    this.currencies.set(chatId, currency);
  }

  async isAwaitingSelection(chatId: number): Promise<boolean> {
    return this.awaitingSelection.has(chatId);
  }

  async setAwaitingSelection(chatId: number, awaiting: boolean): Promise<void> {
    if (awaiting) {
      this.awaitingSelection.add(chatId);
    } else {
      this.awaitingSelection.delete(chatId);
    }
  }
}
