import type { BotMode } from "./bot-mode";
import type { UserModePort } from "./user-mode.port";

export class InMemoryUserModeAdapter implements UserModePort {
  private readonly modes = new Map<number, BotMode>();

  async getMode(chatId: number): Promise<BotMode | undefined> {
    return this.modes.get(chatId);
  }

  async setMode(chatId: number, mode: BotMode): Promise<void> {
    this.modes.set(chatId, mode);
  }
}
