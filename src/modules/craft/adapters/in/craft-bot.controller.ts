import { Inject, Injectable } from "@nestjs/common";
import type { Bot } from "grammy";
import { USER_MODE_PORT, type UserModePort } from "../../../../core/user-mode/user-mode.port";

@Injectable()
export class CraftBotController {
  constructor(
    @Inject(USER_MODE_PORT) private readonly userMode: UserModePort,
  ) {}

  registerHandlers(bot: Bot): void {
    bot.on("message:text", async (ctx, next) => {
      const isBotCommand = ctx.message.entities?.some((entity) => entity.type === "bot_command") ?? false;
      if (isBotCommand || this.userMode.getMode(ctx.chat.id) !== "craft") {
        await next();
        return;
      }

      await ctx.reply("Модуль «Крафт» ещё в разработке. Загляните позже!");
    });
  }
}
