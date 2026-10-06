import type { ServerResponse } from "node:http";
import type { FastifyInstance } from "fastify";
import { DomainException } from "../../../../core/domain/domain-exception";
import type { ListChatsUseCase } from "../../application/use-cases/list-chats.use-case";
import type { ListMessagesUseCase } from "../../application/use-cases/list-messages.use-case";
import type { SendOperatorMessageUseCase } from "../../application/use-cases/send-operator-message.use-case";
import type { WatchChatHistoryUseCase } from "../../application/use-cases/watch-chat-history.use-case";
import { MessageDeliveryFailedException } from "../../domain/exceptions/message-delivery-failed.exception";

export interface ChatHistoryRoutesDeps {
  listChats: ListChatsUseCase;
  listMessages: ListMessagesUseCase;
  sendOperatorMessage: SendOperatorMessageUseCase;
  watchChatHistory: WatchChatHistoryUseCase;
}

// Keeps idle proxies (and the browser) from dropping a quiet SSE connection.
const SSE_HEARTBEAT_MS = 25_000;

export function registerChatHistoryRoutes(app: FastifyInstance, deps: ChatHistoryRoutesDeps): void {
  app.get("/chats", async () => deps.listChats.execute());

  app.get<{ Querystring: { chatId?: string } }>("/messages", async (request, reply) => {
    const { chatId } = request.query;
    if (chatId === undefined) return deps.listMessages.execute();

    const id = parseChatId(chatId);
    if (id === undefined) return reply.code(400).send({ error: "INVALID_CHAT_ID" });
    return deps.listMessages.execute({ chatId: id });
  });

  app.post<{ Params: { chatId: string }; Body: { text?: unknown } }>(
    "/chats/:chatId/messages",
    async (request, reply) => {
      const chatId = parseChatId(request.params.chatId);
      if (chatId === undefined) return reply.code(400).send({ error: "INVALID_CHAT_ID" });

      const text = request.body?.text;
      if (typeof text !== "string") return reply.code(400).send({ error: "TEXT_REQUIRED" });

      try {
        return reply.code(201).send(await deps.sendOperatorMessage.execute({ chatId, text }));
      } catch (error) {
        if (error instanceof DomainException) {
          const status = error instanceof MessageDeliveryFailedException ? 502 : 400;
          return reply.code(status).send({ error: error.code, message: error.message });
        }
        throw error;
      }
    },
  );

  registerChangeStream(app, deps.watchChatHistory);
}

// Server-Sent Events rather than a WebSocket: updates only ever flow server → browser
// (sending is a plain POST above), and EventSource reconnects on its own. Event names are
// the ChatHistoryChange types — `chat` (a ChatSummary) and `message` (a StoredMessage).
function registerChangeStream(app: FastifyInstance, watchChatHistory: WatchChatHistoryUseCase): void {
  const openStreams = new Set<ServerResponse>();

  app.get("/events", (request, reply) => {
    reply.hijack();
    const stream = reply.raw;
    stream.writeHead(200, {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    });
    stream.write("retry: 3000\n\n");
    openStreams.add(stream);

    const unsubscribe = watchChatHistory.execute((change) => {
      const data = change.type === "chat" ? change.chat : change.message;
      stream.write(`event: ${change.type}\ndata: ${JSON.stringify(data)}\n\n`);
    });
    const heartbeat = setInterval(() => stream.write(": ping\n\n"), SSE_HEARTBEAT_MS);

    request.raw.on("close", () => {
      clearInterval(heartbeat);
      unsubscribe();
      openStreams.delete(stream);
    });
  });

  // Hijacked responses are never "idle", so without this httpServer.close() in main.ts
  // would wait on open browser tabs forever.
  app.addHook("preClose", (done) => {
    for (const stream of openStreams) stream.end();
    done();
  });
}

function parseChatId(value: string): number | undefined {
  const id = Number(value);
  return Number.isSafeInteger(id) ? id : undefined;
}
