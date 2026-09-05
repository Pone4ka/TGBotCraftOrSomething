import { Inject, Injectable, type OnApplicationShutdown, type OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { Bot } from "grammy";
import { CurrencyBotController } from "../../currency/adapters/in/currency-bot.controller";
import { TelegramBotController } from "../adapters/in/telegram-bot.controller";
import { startPolling } from "./telegram-polling";
import { BOT_INSTANCE } from "./bot.provider";

@Injectable()
export class BotLifecycleService implements OnModuleInit, OnApplicationShutdown {
  private pollingHandle?: NodeJS.Timeout;

  constructor(
    @Inject(BOT_INSTANCE) private readonly bot: Bot,
    private readonly controller: TelegramBotController,
    private readonly currencyController: CurrencyBotController,
    private readonly configService: ConfigService,
  ) {}

  async onModuleInit(): Promise<void> {
    // Registered first so it can call next() and hand off to the logging handlers below.
    this.currencyController.registerHandlers(this.bot);
    this.controller.registerHandlers(this.bot);
    await this.bot.init();

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
