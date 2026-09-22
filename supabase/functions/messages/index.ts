import { SupabaseChatHistoryQueryAdapter } from "../_shared/modules/bot/adapters/out/supabase-chat-history-query.adapter.ts";
import { ListMessagesUseCase } from "../_shared/modules/bot/application/use-cases/list-messages.use-case.ts";

// Standalone HTTP entry point, equivalent to the Node app's `GET /messages` Fastify route
// (see src/modules/bot/adapters/in/chat-history.controller.ts).
const listMessages = new ListMessagesUseCase(new SupabaseChatHistoryQueryAdapter());

Deno.serve(async (req) => {
  if (req.method !== "GET") {
    return new Response("Method not allowed", { status: 405, headers: { Allow: "GET" } });
  }

  return Response.json(await listMessages.execute());
});
