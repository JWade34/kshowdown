create table if not exists picks (
  id uuid default gen_random_uuid() primary key,
  player text not null,
  game_id text not null,
  team_name text not null,
  updated_at timestamptz default now(),
  unique(player, game_id)
);
alter table picks enable row level security;
create policy "Allow all reads" on picks for select using (true);
create policy "Allow all inserts" on picks for insert with check (true);
create policy "Allow all updates" on picks for update using (true);
create policy "Allow all deletes" on picks for delete using (true);
alter publication supabase_realtime add table picks;
