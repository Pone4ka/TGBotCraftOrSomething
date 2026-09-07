import { Inject, Injectable } from "@nestjs/common";
import { Keyboard, type Bot } from "grammy";
import { CHANGE_API_LABEL } from "../../../currency/adapters/in/currency-source-bot.controller";
import { SwitchModeUseCase } from "../../application/use-cases/switch-mode.use-case";
import { DEFAULT_BOT_MODE, type BotMode } from "../../../../core/user-mode/bot-mode";
import { USER_MODE_PORT, type UserModePort } from "../../../../core/user-mode/user-mode.port";

const HOME_CURRENCY_LABEL = "💱 Валюты";
const HOME_CRAFT_LABEL = "🛠 Крафт";
const BACK_LABEL = "◀️ Назад";
const CRAFT_PLACEHOLDER_LABEL = "🚧 Скоро";

const HOME_PROMPT = "Выберите режим работы бота:";

// Root screen: no module selected yet, pick one to enter it.
const HOME_KEYBOARD = new Keyboard()
  .text(HOME_CURRENCY_LABEL)
  .text(HOME_CRAFT_LABEL)
  .resized();

// Each mode's own screen shows only "back to root" plus that mode's own buttons —
// currency never shows craft's placeholder and vice versa.
const MODE_KEYBOARDS: Record<Exclude<BotMode, "home">, Keyboard> = {
  currency: new Keyboard().text(BACK_LABEL).text(CHANGE_API_LABEL).resized(),
  craft: new Keyboard().text(BACK_LABEL).text(CRAFT_PLACEHOLDER_LABEL).resized(),
};

const MODE_REPLIES: Record<Exclude<BotMode, "home">, string> = {
  currency: "Режим переключён: Валюты. Отправьте сумму и валюту, например «100 usd».",
  craft: "Режим переключён: Крафт. Модуль в разработке.",
};

@Injectable()
export class MenuBotController {
  constructor(
    private readonly switchMode: SwitchModeUseCase,
    @Inject(USER_MODE_PORT) private readonly userMode: UserModePort,
  ) {}

  registerHandlers(bot: Bot): void {
    bot.command("start", async (ctx) => {
      await this.goHome(ctx.chat.id, ctx);
    });

    bot.command("currency", async (ctx) => {
      await this.switchAndReply(ctx.chat.id, "currency", ctx);
    });

    bot.command("craft", async (ctx) => {
      await this.switchAndReply(ctx.chat.id, "craft", ctx);
    });

    bot.hears(HOME_CURRENCY_LABEL, async (ctx) => {
      await this.switchAndReply(ctx.chat.id, "currency", ctx);
    });

    bot.hears(HOME_CRAFT_LABEL, async (ctx) => {
      await this.switchAndReply(ctx.chat.id, "craft", ctx);
    });

    bot.hears(BACK_LABEL, async (ctx) => {
      await this.goHome(ctx.chat.id, ctx);
    });

    // Catch-all for the root/home state: no other handler above matched (mode-switch
    // buttons and commands are intercepted before this), so anything reaching here
    // while the user hasn't picked a module yet just re-prompts for a choice.
    bot.on("message:text", async (ctx, next) => {
      const isBotCommand = ctx.message.entities?.some((entity) => entity.type === "bot_command") ?? false;
      const mode = this.userMode.getMode(ctx.chat.id) ?? DEFAULT_BOT_MODE;
      if (isBotCommand || mode !== "home") {
        await next();
        return;
      }

      await ctx.reply(HOME_PROMPT, { reply_markup: HOME_KEYBOARD });
      await next();
    });
  }

  private async goHome(
    chatId: number,
    ctx: { reply: (text: string, other?: { reply_markup: Keyboard }) => Promise<unknown> },
  ): Promise<void> {
    this.switchMode.execute({ chatId, mode: "home" });
    await ctx.reply(HOME_PROMPT, { reply_markup: HOME_KEYBOARD });
  }

  // Intentionally does not call next(): a mode switch is fully handled here, so the
  // currency/craft controllers further down the chain must not also react to it.
  private async switchAndReply(
    chatId: number,
    mode: Exclude<BotMode, "home">,
    ctx: { reply: (text: string, other?: { reply_markup: Keyboard }) => Promise<unknown> },
  ): Promise<void> {
    this.switchMode.execute({ chatId, mode });
    await ctx.reply(MODE_REPLIES[mode], { reply_markup: MODE_KEYBOARDS[mode] });
  }
}
