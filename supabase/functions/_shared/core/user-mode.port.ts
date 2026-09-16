import type { BotMode } from "./bot-mode.ts";

// Async, unlike the Node app's UserModePort: edge functions are stateless per invocation,
// so mode has to round-trip through Postgres instead of an in-memory Map.
export interface UserModePort {
  getMode(chatId: number): Promise<BotMode | undefined>;
  setMode(chatId: number, mode: BotMode): Promise<void>;
}
