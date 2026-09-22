import { loadConfig } from "./core/config";
import { createHttpServer } from "./core/http/http-server";
import { createSupabaseClient } from "./core/supabase/supabase-client.factory";
import { InMemoryUserModeAdapter } from "./core/user-mode/in-memory-user-mode.adapter";
import { createBotModule } from "./modules/bot/bot.module";
import { createCurrencyModule } from "./modules/currency/currency.module";
import { createStudentModule } from "./modules/student/student.module";

async function bootstrap(): Promise<void> {
  const config = loadConfig();

  const supabaseClient = createSupabaseClient(config);

  const userMode = new InMemoryUserModeAdapter();

  const httpServer = createHttpServer();

  const currency = createCurrencyModule({ config, userMode });
  const student = createStudentModule();
  student.registerHttpRoutes(httpServer);

  const bot = createBotModule({ config, userMode, currency, student, httpServer, supabaseClient });

  // Route registration (including the optional webhook route) must happen before the
  // HTTP server starts listening.
  await bot.start();
  await httpServer.listen({ port: config.port, host: "0.0.0.0" });

  const shutdown = async (): Promise<void> => {
    bot.stop();
    await httpServer.close();
    process.exit(0);
  };
  process.on("SIGINT", () => void shutdown());
  process.on("SIGTERM", () => void shutdown());
}

bootstrap().catch((error) => {
  console.error(error);
  process.exit(1);
});
