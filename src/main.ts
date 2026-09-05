import { createApp } from "./app.module.ts";
import { loadConfig } from "./core/config.ts";

async function bootstrap(): Promise<void> {
  const config = loadConfig();
  const { fastify, bot, startPolling } = createApp(config);

  await bot.init();
  await fastify.listen({ port: config.port, host: "0.0.0.0" });

  const pollingHandle = await startPolling(config.pollIntervalMs);
  console.log(`Polling for updates every ${config.pollIntervalMs}ms`);

  const shutdown = async (): Promise<void> => {
    clearInterval(pollingHandle);
    await fastify.close();
    process.exit(0);
  };

  process.once("SIGINT", shutdown);
  process.once("SIGTERM", shutdown);
}

bootstrap().catch((error) => {
  console.error(error);
  process.exit(1);
});
