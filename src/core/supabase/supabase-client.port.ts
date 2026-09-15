import type { SupabaseClient } from "@supabase/supabase-js";

export const SUPABASE_CLIENT_PORT = Symbol("SupabaseClientPort");

export type SupabaseClientPort = SupabaseClient;
