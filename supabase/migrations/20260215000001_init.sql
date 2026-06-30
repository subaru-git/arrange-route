-- Arrange Route MVP initial schema

create extension if not exists pgcrypto;

-- enums
do $$
begin
  create type public.out_rule as enum ('double_out', 'master_out', 'single_out');
exception
  when duplicate_object then null;
end;
$$;

do $$
begin
  create type public.bull_mode as enum ('separate', 'fat');
exception
  when duplicate_object then null;
end;
$$;

do $$
begin
  create type public.vote_type as enum ('up', 'down');
exception
  when duplicate_object then null;
end;
$$;

-- profiles
create table if not exists public.profiles (
  id uuid primary key,
  display_name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- posts
create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  author_user_id uuid not null references public.profiles(id) on delete restrict,
  remaining_score int not null check (remaining_score between 1 and 701),
  darts_left int not null check (darts_left between 1 and 3),
  out_rule public.out_rule not null,
  bull_mode public.bull_mode not null,
  route_tree jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz null
);

create index if not exists idx_posts_score_rule_mode_created
  on public.posts(remaining_score, out_rule, bull_mode, created_at desc)
  where deleted_at is null;

create index if not exists idx_posts_score_created
  on public.posts(remaining_score, created_at desc)
  where deleted_at is null;

-- votes
create table if not exists public.votes (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid null references public.profiles(id) on delete cascade,
  browser_id text null,
  vote_type public.vote_type not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint chk_votes_identity check (
    (user_id is not null and browser_id is null) or
    (user_id is null and browser_id is not null)
  )
);

create unique index if not exists uniq_votes_post_user
  on public.votes(post_id, user_id)
  where user_id is not null;

create unique index if not exists uniq_votes_post_browser
  on public.votes(post_id, browser_id)
  where user_id is null and browser_id is not null;

create index if not exists idx_votes_post_id on public.votes(post_id);

-- comments
create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  author_user_id uuid not null references public.profiles(id) on delete restrict,
  body text not null check (length(trim(body)) > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz null
);

create index if not exists idx_comments_post_created
  on public.comments(post_id, created_at asc)
  where deleted_at is null;

-- derived stats view
create or replace view public.post_stats as
select
  p.id as post_id,
  coalesce(sum(case when v.vote_type = 'up' then 1 else 0 end), 0)::int as up_count,
  coalesce(sum(case when v.vote_type = 'down' then 1 else 0 end), 0)::int as down_count,
  (
    coalesce(sum(case when v.vote_type = 'up' then 1 else 0 end), 0) -
    coalesce(sum(case when v.vote_type = 'down' then 1 else 0 end), 0)
  )::int as vote_score,
  coalesce(count(c.id), 0)::int as comment_count
from public.posts p
left join public.votes v on v.post_id = p.id
left join public.comments c on c.post_id = p.id and c.deleted_at is null
where p.deleted_at is null
group by p.id;

-- updated_at trigger helper
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- triggers
drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at
before update on public.profiles
for each row execute procedure public.set_updated_at();

drop trigger if exists trg_posts_updated_at on public.posts;
create trigger trg_posts_updated_at
before update on public.posts
for each row execute procedure public.set_updated_at();

drop trigger if exists trg_votes_updated_at on public.votes;
create trigger trg_votes_updated_at
before update on public.votes
for each row execute procedure public.set_updated_at();

drop trigger if exists trg_comments_updated_at on public.comments;
create trigger trg_comments_updated_at
before update on public.comments
for each row execute procedure public.set_updated_at();

-- RLS
alter table public.profiles enable row level security;
alter table public.posts enable row level security;
alter table public.votes enable row level security;
alter table public.comments enable row level security;

-- profiles policies
drop policy if exists "profiles_select_all" on public.profiles;
create policy "profiles_select_all"
on public.profiles for select
using (true);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
on public.profiles for insert
with check (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
on public.profiles for update
using (auth.uid() = id)
with check (auth.uid() = id);

-- posts policies
drop policy if exists "posts_select_all" on public.posts;
create policy "posts_select_all"
on public.posts for select
using (deleted_at is null);

drop policy if exists "posts_insert_auth" on public.posts;
create policy "posts_insert_auth"
on public.posts for insert
with check (auth.uid() = author_user_id);

drop policy if exists "posts_update_own" on public.posts;
create policy "posts_update_own"
on public.posts for update
using (auth.uid() = author_user_id)
with check (auth.uid() = author_user_id);

-- comments policies
drop policy if exists "comments_select_all" on public.comments;
create policy "comments_select_all"
on public.comments for select
using (deleted_at is null);

drop policy if exists "comments_insert_auth" on public.comments;
create policy "comments_insert_auth"
on public.comments for insert
with check (auth.uid() = author_user_id);

drop policy if exists "comments_delete_own" on public.comments;
create policy "comments_delete_own"
on public.comments for delete
using (auth.uid() = author_user_id);

-- votes policies
drop policy if exists "votes_select_all" on public.votes;
create policy "votes_select_all"
on public.votes for select
using (true);

drop policy if exists "votes_insert_auth" on public.votes;
create policy "votes_insert_auth"
on public.votes for insert
with check (
  auth.uid() is not null
  and user_id = auth.uid()
  and browser_id is null
);

drop policy if exists "votes_insert_guest" on public.votes;
create policy "votes_insert_guest"
on public.votes for insert
with check (
  auth.uid() is null
  and user_id is null
  and browser_id is not null
);

drop policy if exists "votes_update_auth" on public.votes;
create policy "votes_update_auth"
on public.votes for update
using (auth.uid() is not null and user_id = auth.uid())
with check (auth.uid() is not null and user_id = auth.uid());

drop policy if exists "votes_update_guest" on public.votes;
create policy "votes_update_guest"
on public.votes for update
using (auth.uid() is null and user_id is null and browser_id is not null)
with check (auth.uid() is null and user_id is null and browser_id is not null);

drop policy if exists "votes_delete_auth" on public.votes;
create policy "votes_delete_auth"
on public.votes for delete
using (auth.uid() is not null and user_id = auth.uid());

drop policy if exists "votes_delete_guest" on public.votes;
create policy "votes_delete_guest"
on public.votes for delete
using (auth.uid() is null and user_id is null and browser_id is not null);

-- view grant
grant select on public.post_stats to anon, authenticated;
