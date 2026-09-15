import { Bot } from "grammy";
import type { Config } from "../../../core/config";

export function createBot(config: Config): Bot {
  return new Bot(config.botToken);
}
