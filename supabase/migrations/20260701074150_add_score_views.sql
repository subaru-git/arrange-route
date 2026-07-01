-- Track score page views for the "common scores" shortcuts.

create table if not exists public.score_views (
  remaining_score int primary key check (remaining_score between 1 and 701),
  view_count bigint not null default 0 check (view_count >= 0),
  first_viewed_at timestamptz not null default now(),
  last_viewed_at timestamptz not null default now()
);

create index if not exists idx_score_views_count_score
  on public.score_views(view_count desc, remaining_score asc);

alter table public.score_views enable row level security;

drop policy if exists "score_views_select_all" on public.score_views;
create policy "score_views_select_all"
on public.score_views for select
using (true);

create or replace function public.increment_score_view(score int)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if score is null or score < 1 or score > 701 then
    return;
  end if;

  insert into public.score_views (remaining_score, view_count, first_viewed_at, last_viewed_at)
  values (score, 1, now(), now())
  on conflict (remaining_score)
  do update set
    view_count = public.score_views.view_count + 1,
    last_viewed_at = now();
end;
$$;

revoke all on function public.increment_score_view(int) from public;
grant execute on function public.increment_score_view(int) to anon, authenticated;
grant select on public.score_views to anon, authenticated;
