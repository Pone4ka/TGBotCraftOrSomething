import Fastify, { type FastifyInstance } from "fastify";
import type { Bot } from "grammy";
import type { AppConfig } from "./core/config.ts";
import { createBotModule } from "./modules/bot/bot.module.ts";

export interface App {
  fastify: FastifyInstance;
  bot: Bot;
  startPolling: (intervalMs?: number) => Promise<NodeJS.Timeout>;
}

export function createApp(config: AppConfig): App {
  const fastify = Fastify({ logger: true });
  const { bot, startPolling } = createBotModule(config.botToken);

  fastify.get("/health", async () => ({ status: "ok" }));

  return { fastify, bot, startPolling };
}
