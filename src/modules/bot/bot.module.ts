import type { FastifyInstance } from "fastify";
import type { Config } from "../../core/config";
import type { UserModePort } from "../../core/user-mode/user-mode.port";
import type { CurrencyModule } from "../currency/currency.module";
import type { StudentModule } from "../student/student.module";
import { DebugBotController } from "./adapters/in/debug-bot.controller";
import { MenuBotController } from "./adapters/in/menu-bot.controller";
import { TelegramBotController } from "./adapters/in/telegram-bot.controller";
import { ConsoleUpdateLoggerAdapter } from "./adapters/out/console-update-logger.adapter";
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
}

export interface BotModule {
  start(): Promise<void>;
  stop(): void;
}

export function createBotModule(deps: BotModuleDeps): BotModule {
  const bot = createBot(deps.config);
  const updateLogger = new ConsoleUpdateLoggerAdapter();

  const receiveMessage = new ReceiveMessageUseCase(updateLogger);
  const receiveCommand = new ReceiveCommandUseCase(updateLogger);
  const switchMode = new SwitchModeUseCase(deps.userMode);

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
