-- Stores the Telegram chat history: one row per chat, one row per user
-- message with the bot's reply attached to it (a chat is always a 1:1 DM,
-- so chat_id doubles as the Telegram user id).

create table if not exists public.chats (
  chat_id bigint primary key,
  first_name text,
  last_name text,
  last_message_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.messages (
  id bigint generated always as identity primary key,
  chat_id bigint not null references public.chats (chat_id) on delete cascade,
  text text not null,
  created_at timestamptz not null default now(),
  reply_text text,
  replied_at timestamptz
);

create index if not exists messages_chat_id_created_at_idx
  on public.messages (chat_id, created_at);

-- Edge functions talk to these tables with the service-role key, bypassing RLS; enabling
-- it anyway keeps the default posture safe if a table is ever queried with an anon/user key.
alter table public.chats enable row level security;
alter table public.messages enable row level security;

create or replace function public.touch_chat_last_message()
returns trigger
language plpgsql
as $$
begin
  update public.chats
  set last_message_at = new.created_at
  where chat_id = new.chat_id;

  return new;
end;
$$;

create trigger touch_chat_last_message
  after insert on public.messages
  for each row execute function public.touch_chat_last_message();
