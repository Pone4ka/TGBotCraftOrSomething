import type {
  RealtimeChannel,
  RealtimePostgresChangesPayload,
  SupabaseClient,
} from "@supabase/supabase-js";
import type {
  ChatHistoryChange,
  ChatHistoryChangeListener,
  ChatHistoryChangesPort,
} from "../../application/ports/chat-history-changes.port";
import type { SupabaseChatHistoryQueryAdapter } from "./supabase-chat-history-query.adapter";

const CHANNEL_NAME = "chat-history";

type Row = Record<string, unknown>;

// Listens to Postgres changes on `chats`/`messages` through Supabase Realtime (the tables
// are added to the `supabase_realtime` publication by a migration). Going through the
// database rather than an in-process event bus means writes made by the `bot` edge
// function show up too, not only the ones made by this Node process.
//
// One Realtime channel per process, opened on the first subscriber and fanned out to all
// of them. Each change is re-read through the query adapter instead of forwarding the raw
// Realtime row, so listeners get exactly the shape GET /chats and GET /messages return
// (including the chat's last-message preview, which isn't a column).
export class SupabaseRealtimeChatHistoryChangesAdapter implements ChatHistoryChangesPort {
  private readonly listeners = new Set<ChatHistoryChangeListener>();
  private channel?: RealtimeChannel;

  constructor(
    private readonly client: SupabaseClient,
    private readonly query: SupabaseChatHistoryQueryAdapter,
  ) {}

  subscribe(listener: ChatHistoryChangeListener): () => void {
    this.listeners.add(listener);
    this.channel ??= this.openChannel();
    return () => {
      this.listeners.delete(listener);
    };
  }

  private openChannel(): RealtimeChannel {
    return this.client
      .channel(CHANNEL_NAME)
      .on("postgres_changes", { event: "*", schema: "public", table: "chats" }, (payload) =>
        this.handle(payload, (row) => this.chatChanged(Number(row.chat_id))),
      )
      .on("postgres_changes", { event: "*", schema: "public", table: "messages" }, (payload) =>
        this.handle(payload, (row) => this.messageChanged(Number(row.id), Number(row.chat_id))),
      )
      .subscribe((status, error) => {
        if (status === "SUBSCRIBED") {
          console.log("[chat-history] realtime subscribed");
        } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          // supabase-js keeps retrying the join on its own.
          console.error(`[chat-history] realtime ${status}:`, error?.message ?? "");
        }
      });
  }

  private handle(payload: RealtimePostgresChangesPayload<Row>, onRow: (row: Row) => Promise<void>): void {
    // Nothing in the app deletes history; a cascade from a manually deleted chat isn't
    // worth live-updating for.
    if (payload.eventType === "DELETE") return;
    onRow(payload.new).catch((error) => console.error("[chat-history] realtime handler error:", error));
  }

  private async chatChanged(chatId: number): Promise<void> {
    const chat = await this.query.getChat(chatId);
    if (chat) this.emit({ type: "chat", chat });
  }

  private async messageChanged(id: number, chatId: number): Promise<void> {
    const message = await this.query.getMessage(id);
    if (message) this.emit({ type: "message", message });
    // A reply being attached doesn't touch the `chats` row, but it does change the chat's
    // last-message preview.
    await this.chatChanged(chatId);
  }

  private emit(change: ChatHistoryChange): void {
    for (const listener of this.listeners) {
      listener(change);
    }
  }
}
