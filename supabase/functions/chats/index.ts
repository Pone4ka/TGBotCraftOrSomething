import { SupabaseChatHistoryQueryAdapter } from "../_shared/modules/bot/adapters/out/supabase-chat-history-query.adapter.ts";
import { ListChatsUseCase } from "../_shared/modules/bot/application/use-cases/list-chats.use-case.ts";

// Standalone HTTP entry point, equivalent to the Node app's `GET /chats` Fastify route
// (see src/modules/bot/adapters/in/chat-history.controller.ts).
const listChats = new ListChatsUseCase(new SupabaseChatHistoryQueryAdapter());

Deno.serve(async (req) => {
  if (req.method !== "GET") {
    return new Response("Method not allowed", { status: 405, headers: { Allow: "GET" } });
  }

  return Response.json(await listChats.execute());
});
