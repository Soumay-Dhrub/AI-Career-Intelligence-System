-- Supabase notifications schema and RLS policies

create table if not exists notifications (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid not null,
  title text not null,
  message text not null,
  type text not null check (type in ('login', 'module', 'achievement', 'system')),
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

alter table notifications enable row level security;

create policy "users can select own notifications"
  on notifications
  for select
  using (auth.uid() = user_id);

create policy "users can insert own notifications"
  on notifications
  for insert
  with check (auth.uid() = user_id);

create policy "users can update own notifications"
  on notifications
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "users can delete own notifications"
  on notifications
  for delete
  using (auth.uid() = user_id);
