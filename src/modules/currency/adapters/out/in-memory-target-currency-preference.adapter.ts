import { Injectable } from "@nestjs/common";
import type { TargetCurrencyPreferencePort } from "../../application/ports/target-currency-preference.port";

@Injectable()
export class InMemoryTargetCurrencyPreferenceAdapter implements TargetCurrencyPreferencePort {
  private readonly currencies = new Map<number, string>();
  private readonly awaitingSelection = new Set<number>();

  getCurrency(chatId: number): string | undefined {
    return this.currencies.get(chatId);
  }

  setCurrency(chatId: number, currency: string): void {
    this.currencies.set(chatId, currency);
  }

  isAwaitingSelection(chatId: number): boolean {
    return this.awaitingSelection.has(chatId);
  }

  setAwaitingSelection(chatId: number, awaiting: boolean): void {
    if (awaiting) {
      this.awaitingSelection.add(chatId);
    } else {
      this.awaitingSelection.delete(chatId);
    }
  }
}
