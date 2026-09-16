import type { FastifyInstance } from "fastify";
import { webhookCallback, type Bot } from "grammy";
import type { Config } from "../../../core/config";
import type { CurrencyBotController } from "../../currency/adapters/in/currency-bot.controller";
import type { CurrencySourceBotController } from "../../currency/adapters/in/currency-source-bot.controller";
import type { StudentBotController } from "../../student/adapters/in/student-bot.controller";
import type { DebugBotController } from "../adapters/in/debug-bot.controller";
import type { MenuBotController } from "../adapters/in/menu-bot.controller";
import type { TelegramBotController } from "../adapters/in/telegram-bot.controller";
import { startPolling } from "./telegram-polling";

export interface BotLifecycleDeps {
  bot: Bot;
  config: Config;
  httpServer: FastifyInstance;
  controller: TelegramBotController;
  menuController: MenuBotController;
  currencyController: CurrencyBotController;
  currencySourceController: CurrencySourceBotController;
  studentController: StudentBotController;
  debugController: DebugBotController;
}

export class BotLifecycleService {
  private pollingHandle?: NodeJS.Timeout;

  constructor(private readonly deps: BotLifecycleDeps) {}

  async start(): Promise<void> {
    const { bot, config, httpServer } = this.deps;

    // Debug goes first: a hidden command that must work no matter what mode/state the
    // chat is in, before any of the state-dependent controllers below get a look at it.
    this.deps.debugController.registerHandlers(bot);
    // Menu goes first so it can fully own mode-switch commands/buttons before the
    // module controllers below (which call next() and hand off to the loggers) see them.
    this.deps.menuController.registerHandlers(bot);
    this.deps.currencySourceController.registerHandlers(bot);
    this.deps.currencyController.registerHandlers(bot);
    this.deps.studentController.registerHandlers(bot);
    // Fallback goes last: it catches any text no module controller above recognized.
    // Registering it earlier would intercept home-screen buttons (e.g. "🎓 Студент")
    // with the generic "choose a mode" prompt before the real handler got a chance to run.
    this.deps.menuController.registerFallback(bot);
    this.deps.controller.registerHandlers(bot);
    await bot.init();

    await bot.api.setMyCommands([
      { command: "start", description: "Показать меню режимов" },
      { command: "currency", description: "Режим: конвертация валют" },
      { command: "source", description: "Выбрать источник курса валют" },
    ]);

    if (config.webhookUrl) {
      await this.setUpWebhook(httpServer, config.webhookUrl, config.webhookSecret!);
    } else {
      await this.setUpPolling(bot, config.pollIntervalMs);
    }
  }

  private async setUpWebhook(httpServer: FastifyInstance, webhookUrl: string, secretToken: string): Promise<void> {
    const path = `/telegram/webhook/${secretToken}`;

    httpServer.post(path, webhookCallback(this.deps.bot, "fastify", { secretToken }));

    const url = `${webhookUrl.replace(/\/$/, "")}${path}`;
    await this.deps.bot.api.setWebhook(url, {
      secret_token: secretToken,
      drop_pending_updates: false,
    });
    console.log(`Webhook set at ${url}`);
  }

  private async setUpPolling(bot: Bot, intervalMs: number): Promise<void> {
    this.pollingHandle = await startPolling(bot, intervalMs);
    console.log(`Polling for updates every ${intervalMs}ms`);
  }

  stop(): void {
    if (this.pollingHandle) {
      clearInterval(this.pollingHandle);
    }
  }
}
