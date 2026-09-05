import { Module } from "@nestjs/common";
import { TelegramBotController } from "./adapters/in/telegram-bot.controller";
import { ConsoleUpdateLoggerAdapter } from "./adapters/out/console-update-logger.adapter";
import { UPDATE_LOGGER_PORT } from "./application/ports/update-logger.port";
import { ReceiveMessageUseCase } from "./application/use-cases/receive-message.use-case";
import { ReceiveCommandUseCase } from "./application/use-cases/receive-command.use-case";
import { BotLifecycleService } from "./infrastructure/bot-lifecycle.service";
import { botProvider } from "./infrastructure/bot.provider";

@Module({
  providers: [
    botProvider,
    { provide: UPDATE_LOGGER_PORT, useClass: ConsoleUpdateLoggerAdapter },
    ReceiveMessageUseCase,
    ReceiveCommandUseCase,
    TelegramBotController,
    BotLifecycleService,
  ],
})
export class BotModule {}
