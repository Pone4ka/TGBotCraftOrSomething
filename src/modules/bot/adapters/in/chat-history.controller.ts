import type { FastifyInstance } from "fastify";
import type { ListChatsUseCase } from "../../application/use-cases/list-chats.use-case";
import type { ListMessagesUseCase } from "../../application/use-cases/list-messages.use-case";

export function registerChatHistoryRoutes(
  app: FastifyInstance,
  listChats: ListChatsUseCase,
  listMessages: ListMessagesUseCase,
): void {
  app.get("/chats", async () => listChats.execute());
  app.get("/messages", async () => listMessages.execute());
}
