// GENERATED FILE — do not edit directly, edit src/modules/bot/application/ports/update-logger.port.ts instead.
// Regenerate with: pnpm sync:edge

import type { ChatMessage } from "../../domain/chat-message.entity.ts";
import type { BotCommand } from "../../domain/bot-command.entity.ts";

// Async so the same port shape works for both the in-memory/console Node adapter and
// Postgres-backed adapters (e.g. the Supabase edge functions in supabase/functions/), which
// is what lets the domain/application/adapters-in layers be shared verbatim between the two
// runtimes — see scripts/generate-edge-shared.mjs.
export interface UpdateLoggerPort {
  logMessage(message: ChatMessage): Promise<void>;
  logCommand(command: BotCommand): Promise<void>;
  // Called for every outgoing bot reply (see the sendMessage API transformer registered in
  // each runtime's composition root), independently of which controller triggered it — a
  // Postgres-backed adapter attaches it to the most recent unanswered message for that chat.
  logReply(chatId: number, text: string): Promise<void>;
}
