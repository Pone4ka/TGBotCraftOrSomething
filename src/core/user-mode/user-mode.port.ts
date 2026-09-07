import type { BotMode } from "./bot-mode";

export const USER_MODE_PORT = Symbol("UserModePort");

export interface UserModePort {
  getMode(chatId: number): BotMode | undefined;
  setMode(chatId: number, mode: BotMode): void;
}
