import { Module } from "@nestjs/common";
import { UserModeModule } from "../../core/user-mode/user-mode.module";
import { CraftModule } from "../craft/craft.module";
import { CurrencyModule } from "../currency/currency.module";
import { MenuBotController } from "./adapters/in/menu-bot.controller";
import { TelegramBotController } from "./adapters/in/telegram-bot.controller";
import { ConsoleUpdateLoggerAdapter } from "./adapters/out/console-update-logger.adapter";
import { UPDATE_LOGGER_PORT } from "./application/ports/update-logger.port";
import { ReceiveMessageUseCase } from "./application/use-cases/receive-message.use-case";
import { ReceiveCommandUseCase } from "./application/use-cases/receive-command.use-case";
import { SwitchModeUseCase } from "./application/use-cases/switch-mode.use-case";
import { BotLifecycleService } from "./infrastructure/bot-lifecycle.service";
import { botProvider } from "./infrastructure/bot.provider";

@Module({
  imports: [UserModeModule, CurrencyModule, CraftModule],
  providers: [
    botProvider,
    { provide: UPDATE_LOGGER_PORT, useClass: ConsoleUpdateLoggerAdapter },
    ReceiveMessageUseCase,
    ReceiveCommandUseCase,
    SwitchModeUseCase,
    MenuBotController,
    TelegramBotController,
    BotLifecycleService,
  ],
})
export class BotModule {}
