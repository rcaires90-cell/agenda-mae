-- Run this in the Supabase SQL Editor

-- EVENTS
create table if not exists events (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  date_str text not null,
  title text not null,
  time text default '',
  cat text not null default 'outros',
  priority text not null default 'normal',
  recur text not null default '',
  obs text default '',
  created_at timestamptz default now()
);

-- TASKS
create table if not exists tasks (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  date_str text not null,
  title text not null,
  cat text not null default 'outros',
  priority text not null default 'normal',
  recur text not null default '',
  done boolean default false,
  created_at timestamptz default now()
);

-- NOTES
create table if not exists notes (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  date_str text not null,
  content text default '',
  updated_at timestamptz default now(),
  unique(user_id, date_str)
);

-- TASK DONE (overrides done state for recurring tasks on non-origin dates)
create table if not exists task_done (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  task_id uuid references tasks(id) on delete cascade not null,
  date_str text not null,
  done boolean default false,
  unique(task_id, date_str)
);

-- Row Level Security
alter table events    enable row level security;
alter table tasks     enable row level security;
alter table notes     enable row level security;
alter table task_done enable row level security;

create policy "users own events"    on events    for all using (auth.uid() = user_id);
create policy "users own tasks"     on tasks     for all using (auth.uid() = user_id);
create policy "users own notes"     on notes     for all using (auth.uid() = user_id);
create policy "users own task_done" on task_done for all using (auth.uid() = user_id);
