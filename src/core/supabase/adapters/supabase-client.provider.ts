import type { Provider } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { createClient } from "@supabase/supabase-js";
import { SUPABASE_CLIENT_PORT } from "../supabase-client.port";

export const supabaseClientProvider: Provider = {
  provide: SUPABASE_CLIENT_PORT,
  useFactory: (configService: ConfigService) =>
    createClient(
      configService.getOrThrow<string>("SUPABASE_URL"),
      configService.getOrThrow<string>("SUPABASE_KEY"),
    ),
  inject: [ConfigService],
};
