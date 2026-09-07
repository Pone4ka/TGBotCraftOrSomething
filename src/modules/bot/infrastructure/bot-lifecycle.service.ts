import { Inject, Injectable, type OnApplicationShutdown, type OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { HttpAdapterHost } from "@nestjs/core";
import type { FastifyInstance } from "fastify";
import { webhookCallback, type Bot } from "grammy";
import { CraftBotController } from "../../craft/adapters/in/craft-bot.controller";
import { CurrencyBotController } from "../../currency/adapters/in/currency-bot.controller";
import { CurrencySourceBotController } from "../../currency/adapters/in/currency-source-bot.controller";
import { MenuBotController } from "../adapters/in/menu-bot.controller";
import { TelegramBotController } from "../adapters/in/telegram-bot.controller";
import { startPolling } from "./telegram-polling";
import { BOT_INSTANCE } from "./bot.provider";

@Injectable()
export class BotLifecycleService implements OnModuleInit, OnApplicationShutdown {
  private pollingHandle?: NodeJS.Timeout;

  constructor(
    @Inject(BOT_INSTANCE) private readonly bot: Bot,
    private readonly controller: TelegramBotController,
    private readonly menuController: MenuBotController,
    private readonly currencyController: CurrencyBotController,
    private readonly currencySourceController: CurrencySourceBotController,
    private readonly craftController: CraftBotController,
    private readonly configService: ConfigService,
    private readonly httpAdapterHost: HttpAdapterHost,
  ) {}

  async onModuleInit(): Promise<void> {
    // Menu goes first so it can fully own mode-switch commands/buttons before the
    // module controllers below (which call next() and hand off to the loggers) see them.
    this.menuController.registerHandlers(this.bot);
    this.currencySourceController.registerHandlers(this.bot);
    this.currencyController.registerHandlers(this.bot);
    this.craftController.registerHandlers(this.bot);
    this.controller.registerHandlers(this.bot);
    await this.bot.init();

    await this.bot.api.setMyCommands([
      { command: "start", description: "Показать меню режимов" },
      { command: "currency", description: "Режим: конвертация валют" },
      { command: "craft", description: "Режим: крафт (в разработке)" },
      { command: "source", description: "Выбрать источник курса валют" },
    ]);

    const webhookUrl = this.configService.get<string>("WEBHOOK_URL");
    if (webhookUrl) {
      await this.setUpWebhook(webhookUrl);
    } else {
      await this.setUpPolling();
    }
  }

  private async setUpWebhook(webhookUrl: string): Promise<void> {
    const secretToken = this.configService.getOrThrow<string>("WEBHOOK_SECRET");
    const path = `/telegram/webhook/${secretToken}`;

    const instance = this.httpAdapterHost.httpAdapter.getInstance<FastifyInstance>();
    instance.post(path, webhookCallback(this.bot, "fastify", { secretToken }));

    const url = `${webhookUrl.replace(/\/$/, "")}${path}`;
    await this.bot.api.setWebhook(url, {
      secret_token: secretToken,
      drop_pending_updates: false,
    });
    console.log(`Webhook set at ${url}`);
  }

  private async setUpPolling(): Promise<void> {
    const intervalMs = Number(this.configService.get("POLL_INTERVAL_MS") ?? 3000);
    this.pollingHandle = await startPolling(this.bot, intervalMs);
    console.log(`Polling for updates every ${intervalMs}ms`);
  }

  onApplicationShutdown(): void {
    if (this.pollingHandle) {
      clearInterval(this.pollingHandle);
    }
  }
}
