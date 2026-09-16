import { Bot, webhookCallback } from "npm:grammy@1.46.0";
import { loadConfig } from "../_shared/core/config.ts";
import { SupabaseUserModeAdapter } from "../_shared/core/supabase-user-mode.adapter.ts";
import { createCurrencyModule } from "../_shared/modules/currency/currency.module.ts";
import { createStudentModule } from "../_shared/modules/student/student.module.ts";
import { DebugBotController } from "../_shared/modules/bot/adapters/in/debug-bot.controller.ts";
import { MenuBotController } from "../_shared/modules/bot/adapters/in/menu-bot.controller.ts";
import { TelegramBotController } from "../_shared/modules/bot/adapters/in/telegram-bot.controller.ts";
import { ConsoleUpdateLoggerAdapter } from "../_shared/modules/bot/adapters/out/console-update-logger.adapter.ts";
import { ReceiveMessageUseCase } from "../_shared/modules/bot/application/use-cases/receive-message.use-case.ts";
import { ReceiveCommandUseCase } from "../_shared/modules/bot/application/use-cases/receive-command.use-case.ts";
import { SwitchModeUseCase } from "../_shared/modules/bot/application/use-cases/switch-mode.use-case.ts";

type UpdateHandler = (req: Request) => Promise<Response>;

// Built lazily (once per warm isolate, cached in this promise) instead of at module
// top-level: if composition throws (bad env var, a dependency that fails to load under
// Deno, ...), a top-level throw kills the whole isolate and Supabase reports an opaque
// "WORKER_ERROR" for every request with no way to see the real cause from here. Building
// it inside the request handler instead means we can catch that error and return it in
// the response body, which is the only diagnostic channel available without dashboard access.
let handleUpdatePromise: Promise<UpdateHandler> | undefined;

async function buildHandler(): Promise<UpdateHandler> {
  const config = loadConfig();

  const bot = new Bot(config.botToken);
  const userMode = new SupabaseUserModeAdapter();
  const currency = createCurrencyModule({ exchangeApiKey: config.exchangeApiKey, userMode });
  const student = createStudentModule();

  const updateLogger = new ConsoleUpdateLoggerAdapter();
  const receiveMessage = new ReceiveMessageUseCase(updateLogger);
  const receiveCommand = new ReceiveCommandUseCase(updateLogger);
  const switchMode = new SwitchModeUseCase(userMode);

  const debugController = new DebugBotController(userMode, currency.sourcePreference, currency.targetCurrencyPreference);
  const menuController = new MenuBotController(switchMode, userMode);
  const telegramController = new TelegramBotController(receiveMessage, receiveCommand);

  // Registration order matters: debug and menu must see every update before the
  // mode-dependent module controllers below, exactly like BotLifecycleService.start().
  debugController.registerHandlers(bot);
  menuController.registerHandlers(bot);
  currency.currencySourceController.registerHandlers(bot);
  currency.currencyController.registerHandlers(bot);
  // Student's Telegram entry point — the second of its two entry points, the first being
  // the plain GET handled by the `student` edge function itself.
  student.botController.registerHandlers(bot);
  // Fallback goes last: it catches any text no module controller above recognized.
  // Registering it earlier would intercept home-screen buttons (e.g. "🎓 Студент") with
  // the generic "choose a mode" prompt before the real handler got a chance to run.
  menuController.registerFallback(bot);
  telegramController.registerHandlers(bot);

  await bot.init();

  return webhookCallback(bot, "std/http", { secretToken: config.webhookSecret });
}

Deno.serve(async (req) => {
  let handleUpdate: UpdateHandler;
  try {
    handleUpdatePromise ??= buildHandler();
    handleUpdate = await handleUpdatePromise;
  } catch (error) {
    // Reset so the next request retries initialization instead of replaying a cached failure.
    handleUpdatePromise = undefined;
    console.error("[bot] init error:", error);
    return Response.json(
      { error: "bot-init-error", message: error instanceof Error ? error.stack ?? error.message : String(error) },
      { status: 500 },
    );
  }

  try {
    return await handleUpdate(req);
  } catch (error) {
    console.error("[bot] webhook error:", error);
    // Telegram retries non-2xx responses; once we've logged the failure there's nothing
    // useful a retry would achieve for a single update, so acknowledge it anyway.
    return new Response("ok", { status: 200 });
  }
});
