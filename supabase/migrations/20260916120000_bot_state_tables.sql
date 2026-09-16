-- State that used to live in in-memory Maps inside the Node process (see
-- InMemoryUserModeAdapter, InMemoryExchangeRateSourcePreferenceAdapter,
-- InMemoryTargetCurrencyPreferenceAdapter). Edge functions are stateless per invocation,
-- so the equivalent per-chat state has to live in Postgres instead.

create table if not exists public.bot_user_modes (
  chat_id bigint primary key,
  mode text not null default 'home',
  updated_at timestamptz not null default now()
);

create table if not exists public.currency_source_preferences (
  chat_id bigint primary key,
  source text not null default 'frankfurter',
  updated_at timestamptz not null default now()
);

create table if not exists public.currency_target_preferences (
  chat_id bigint primary key,
  currency text,
  awaiting_selection boolean not null default false,
  updated_at timestamptz not null default now()
);

-- Edge functions talk to these tables with the service-role key, bypassing RLS; enabling
-- it anyway keeps the default posture safe if a table is ever queried with an anon/user key.
alter table public.bot_user_modes enable row level security;
alter table public.currency_source_preferences enable row level security;
alter table public.currency_target_preferences enable row level security;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_updated_at
  before update on public.bot_user_modes
  for each row execute function public.set_updated_at();

create trigger set_updated_at
  before update on public.currency_source_preferences
  for each row execute function public.set_updated_at();

create trigger set_updated_at
  before update on public.currency_target_preferences
  for each row execute function public.set_updated_at();
