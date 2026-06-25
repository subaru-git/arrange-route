-- Add authenticated user bookmarks for posts.

create table if not exists public.bookmarks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  post_id uuid not null references public.posts(id) on delete cascade,
  created_at timestamptz not null default now()
);

create unique index if not exists uniq_bookmarks_user_post
  on public.bookmarks(user_id, post_id);

create index if not exists idx_bookmarks_user_created
  on public.bookmarks(user_id, created_at desc);

create index if not exists idx_bookmarks_post_id
  on public.bookmarks(post_id);

alter table public.bookmarks enable row level security;

drop policy if exists "bookmarks_select_own" on public.bookmarks;
create policy "bookmarks_select_own"
on public.bookmarks for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "bookmarks_insert_own" on public.bookmarks;
create policy "bookmarks_insert_own"
on public.bookmarks for insert
to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "bookmarks_delete_own" on public.bookmarks;
create policy "bookmarks_delete_own"
on public.bookmarks for delete
to authenticated
using ((select auth.uid()) = user_id);

grant select, insert, delete on public.bookmarks to authenticated;
