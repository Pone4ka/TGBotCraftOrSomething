import type { BotMode } from "./bot-mode";

export interface UserModePort {
  getMode(chatId: number): BotMode | undefined;
  setMode(chatId: number, mode: BotMode): void;
}
