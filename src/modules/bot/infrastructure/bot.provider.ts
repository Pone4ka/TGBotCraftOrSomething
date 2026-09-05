import { Bot } from "grammy";
import { ConfigService } from "@nestjs/config";
import type { Provider } from "@nestjs/common";

export const BOT_INSTANCE = Symbol("BotInstance");

export const botProvider: Provider = {
  provide: BOT_INSTANCE,
  useFactory: (configService: ConfigService) =>
    new Bot(configService.getOrThrow<string>("BOT_TOKEN")),
  inject: [ConfigService],
};
