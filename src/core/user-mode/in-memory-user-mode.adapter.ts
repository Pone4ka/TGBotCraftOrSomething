import type { BotMode } from "./bot-mode";
import type { UserModePort } from "./user-mode.port";

export class InMemoryUserModeAdapter implements UserModePort {
  private readonly modes = new Map<number, BotMode>();

  getMode(chatId: number): BotMode | undefined {
    return this.modes.get(chatId);
  }

  setMode(chatId: number, mode: BotMode): void {
    this.modes.set(chatId, mode);
  }
}
