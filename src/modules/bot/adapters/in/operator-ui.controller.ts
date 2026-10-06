import { readFile } from "node:fs/promises";
import { join } from "node:path";
import type { FastifyInstance } from "fastify";

// web/operator/ at the repository root. The same number of levels up works from both
// src/modules/bot/adapters/in (tsx) and dist/modules/bot/adapters/in (tsc build).
const WEB_ROOT = join(__dirname, "..", "..", "..", "..", "..", "web", "operator");

const FILES: Record<string, { file: string; contentType: string }> = {
  "/operator": { file: "index.html", contentType: "text/html; charset=utf-8" },
  "/operator/app.js": { file: "app.js", contentType: "text/javascript; charset=utf-8" },
  "/operator/styles.css": { file: "styles.css", contentType: "text/css; charset=utf-8" },
};

// The operator panel: a Telegram-like chat UI over GET /chats, GET /messages, the
// GET /events stream and POST /chats/:chatId/messages (see chat-history.controller.ts).
// Plain static files, read on every request so editing them needs no restart.
export function registerOperatorUiRoutes(app: FastifyInstance): void {
  for (const [path, { file, contentType }] of Object.entries(FILES)) {
    app.get(path, async (_request, reply) =>
      reply.type(contentType).header("Cache-Control", "no-cache").send(await readFile(join(WEB_ROOT, file))),
    );
  }
}
