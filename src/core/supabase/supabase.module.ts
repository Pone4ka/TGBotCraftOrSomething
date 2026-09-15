import { Module } from "@nestjs/common";
import { supabaseClientProvider } from "./adapters/supabase-client.provider";
import { SUPABASE_CLIENT_PORT } from "./supabase-client.port";

@Module({
  providers: [supabaseClientProvider],
  exports: [SUPABASE_CLIENT_PORT],
})
export class SupabaseModule {}
