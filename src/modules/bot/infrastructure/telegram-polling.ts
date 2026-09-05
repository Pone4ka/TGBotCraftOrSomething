import type { Bot } from "grammy";

export async function startPolling(
  bot: Bot,
  intervalMs = 3000,
): Promise<NodeJS.Timeout> {
  await bot.api.deleteWebhook({ drop_pending_updates: false });

  let offset = 0;
  let isPolling = false;

  const poll = async (): Promise<void> => {
    if (isPolling) return;
    isPolling = true;

    try {
      const updates = await bot.api.getUpdates({ offset, timeout: 0 });
      for (const update of updates) {
        offset = update.update_id + 1;
        await bot.handleUpdate(update);
      }
    } catch (error) {
      console.error("[bot] polling error:", error);
    } finally {
      isPolling = false;
    }
  };

  return setInterval(poll, intervalMs);
}
