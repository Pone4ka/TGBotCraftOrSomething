import type { FastifyInstance } from "fastify";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Config } from "../../core/config";
import type { UserModePort } from "../../core/user-mode/user-mode.port";
import type { CurrencyModule } from "../currency/currency.module";
import type { StudentModule } from "../student/student.module";
import { DebugBotController } from "./adapters/in/debug-bot.controller";
import { registerChatHistoryRoutes } from "./adapters/in/chat-history.controller";
import { MenuBotController } from "./adapters/in/menu-bot.controller";
import { TelegramBotController } from "./adapters/in/telegram-bot.controller";
import { SupabaseChatHistoryQueryAdapter } from "./adapters/out/supabase-chat-history-query.adapter";
import { SupabaseUpdateLoggerAdapter } from "./adapters/out/supabase-update-logger.adapter";
import { ListChatsUseCase } from "./application/use-cases/list-chats.use-case";
import { ListMessagesUseCase } from "./application/use-cases/list-messages.use-case";
import { ReceiveMessageUseCase } from "./application/use-cases/receive-message.use-case";
import { ReceiveCommandUseCase } from "./application/use-cases/receive-command.use-case";
import { SwitchModeUseCase } from "./application/use-cases/switch-mode.use-case";
import { BotLifecycleService } from "./infrastructure/bot-lifecycle.service";
import { createBot } from "./infrastructure/bot.provider";

export interface BotModuleDeps {
  config: Config;
  userMode: UserModePort;
  currency: CurrencyModule;
  student: StudentModule;
  httpServer: FastifyInstance;
  supabaseClient: SupabaseClient;
}

export interface BotModule {
  start(): Promise<void>;
  stop(): void;
}

export function createBotModule(deps: BotModuleDeps): BotModule {
  const bot = createBot(deps.config);
  const updateLogger = new SupabaseUpdateLoggerAdapter(deps.supabaseClient);

  // Captures every outgoing message regardless of which controller sent it (menu, currency,
  // student, ...) and attaches it as the reply to the most recent unanswered message for
  // that chat — see SupabaseUpdateLoggerAdapter#logReply.
  bot.api.config.use(async (prev, method, payload, signal) => {
    const result = await prev(method, payload, signal);
    if (method === "sendMessage" && "chat_id" in payload && "text" in payload) {
      await updateLogger.logReply(Number(payload.chat_id), String(payload.text));
    }
    return result;
  });

  const receiveMessage = new ReceiveMessageUseCase(updateLogger);
  const receiveCommand = new ReceiveCommandUseCase(updateLogger);
  const switchMode = new SwitchModeUseCase(deps.userMode);

  const chatHistoryQuery = new SupabaseChatHistoryQueryAdapter(deps.supabaseClient);
  registerChatHistoryRoutes(
    deps.httpServer,
    new ListChatsUseCase(chatHistoryQuery),
    new ListMessagesUseCase(chatHistoryQuery),
  );

  const telegramController = new TelegramBotController(receiveMessage, receiveCommand);
  const menuController = new MenuBotController(switchMode, deps.userMode);
  const debugController = new DebugBotController(
    deps.userMode,
    deps.currency.sourcePreference,
    deps.currency.targetCurrencyPreference,
  );

  const lifecycle = new BotLifecycleService({
    bot,
    config: deps.config,
    httpServer: deps.httpServer,
    controller: telegramController,
    menuController,
    currencyController: deps.currency.currencyController,
    currencySourceController: deps.currency.currencySourceController,
    studentController: deps.student.botController,
    debugController,
  });

  return {
    start: () => lifecycle.start(),
    stop: () => lifecycle.stop(),
  };
}
