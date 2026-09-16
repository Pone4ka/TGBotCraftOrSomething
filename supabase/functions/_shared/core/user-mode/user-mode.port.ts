// GENERATED FILE — do not edit directly, edit src/core/user-mode/user-mode.port.ts instead.
// Regenerate with: pnpm sync:edge

import type { BotMode } from "./bot-mode.ts";

// Async so the same port shape works for both the in-memory Node adapter and Postgres-backed
// adapters (e.g. the Supabase edge functions in supabase/functions/), which is what lets the
// domain/application/adapters-in layers be shared verbatim between the two runtimes — see
// scripts/generate-edge-shared.mjs.
export interface UserModePort {
  getMode(chatId: number): Promise<BotMode | undefined>;
  setMode(chatId: number, mode: BotMode): Promise<void>;
}
