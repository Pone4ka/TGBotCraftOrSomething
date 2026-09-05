import { Bot } from "grammy";
import { ConsoleUpdateLoggerAdapter } from "./adapters/out/console-update-logger.adapter.ts";
import { TelegramBotController } from "./adapters/in/telegram-bot.controller.ts";
import { ReceiveMessageUseCase } from "./application/use-cases/receive-message.use-case.ts";
import { ReceiveCommandUseCase } from "./application/use-cases/receive-command.use-case.ts";
import { startPolling } from "./infrastructure/telegram-polling.ts";

export interface BotModule {
  bot: Bot;
  startPolling: (intervalMs?: number) => Promise<NodeJS.Timeout>;
}

export function createBotModule(token: string): BotModule {
  const bot = new Bot(token);

  const logger = new ConsoleUpdateLoggerAdapter();
  const receiveMessage = new ReceiveMessageUseCase(logger);
  const receiveCommand = new ReceiveCommandUseCase(logger);
  const controller = new TelegramBotController(receiveMessage, receiveCommand);

  controller.registerHandlers(bot);

  return {
    bot,
    startPolling: (intervalMs?: number) => startPolling(bot, intervalMs),
  };
}
