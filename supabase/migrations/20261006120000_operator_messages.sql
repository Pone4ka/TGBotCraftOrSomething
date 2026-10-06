-- Operator panel (web/operator, served by the Node app at /operator).

-- 1. Messages the bot sends on its own initiative (an operator writing to a user) aren't
--    replies to anything the user wrote: they're stored as a row with only the bot's
--    side filled in (reply_text/replied_at) and no user text.
alter table public.messages alter column text drop not null;

-- 2. Live updates: the Node app subscribes to changes on these tables through Supabase
--    Realtime and relays them to the panel over Server-Sent Events (GET /events). It
--    subscribes with the service-role key, so RLS without public policies still applies
--    to everyone else.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'chats'
  ) then
    alter publication supabase_realtime add table public.chats;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'messages'
  ) then
    alter publication supabase_realtime add table public.messages;
  end if;
end;
$$;
