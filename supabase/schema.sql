-- Atul Joshi portfolio: PostgreSQL / Supabase production schema.
-- Run once in a fresh Supabase project's SQL editor.
create table public.admins (id text primary key, user_id uuid not null unique references auth.users(id));
create table public.metadata (id text primary key, value text not null);
create table public.rate_limits (id text primary key, count integer not null, expires bigint not null);
create table public.profile (id text primary key, data jsonb not null, published boolean not null default false);
create table public.experiences (id text primary key, data jsonb not null, published boolean not null default false);
create table public.categories (id text primary key, data jsonb not null, published boolean not null default false);
create table public.internal_challenges (id text primary key, data jsonb not null, published boolean not null default false, source text not null, original_number text not null, unique(source,original_number));
create table public.projects (id text primary key, data jsonb not null, published boolean not null default false, category_id text references public.categories(id) on delete set null, challenge_id text unique references public.internal_challenges(id) on delete set null);
create table public.skills (id text primary key, data jsonb not null, published boolean not null default false);
create table public.tools (id text primary key, data jsonb not null, published boolean not null default false);
create table public.journey_milestones (id text primary key, data jsonb not null, published boolean not null default false);
create table public.learning_reflections (id text primary key, data jsonb not null, published boolean not null default false, milestone_id text references public.journey_milestones(id) on delete cascade);
create table public.project_media (id text primary key, data jsonb not null, published boolean not null default false, project_id text references public.projects(id) on delete set null);
create table public.contact_submissions (id text primary key, data jsonb not null, published boolean not null default false);
create index published_projects on public.projects(published);
create index published_milestones on public.journey_milestones(published);

create function public.is_portfolio_owner() returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.admins where id='owner' and user_id=auth.uid());
$$;
revoke all on function public.is_portfolio_owner() from public;
grant execute on function public.is_portfolio_owner() to authenticated;

-- Deny direct anonymous reads, including a published project's private linkage.
-- Public access goes through /api/content, which selects published records and
-- removes private fields. Every owner operation also checks the Auth identity.
alter table public.admins enable row level security;
create policy owner_identity on public.admins for select to authenticated using(user_id=auth.uid());
alter table public.metadata enable row level security;
alter table public.rate_limits enable row level security;
alter table public.profile enable row level security;
create policy owner_only on public.profile for all to authenticated using(public.is_portfolio_owner()) with check(public.is_portfolio_owner());
alter table public.experiences enable row level security;
create policy owner_only on public.experiences for all to authenticated using(public.is_portfolio_owner()) with check(public.is_portfolio_owner());
alter table public.categories enable row level security;
create policy owner_only on public.categories for all to authenticated using(public.is_portfolio_owner()) with check(public.is_portfolio_owner());
alter table public.internal_challenges enable row level security;
create policy owner_only on public.internal_challenges for all to authenticated using(public.is_portfolio_owner()) with check(public.is_portfolio_owner());
alter table public.projects enable row level security;
create policy owner_only on public.projects for all to authenticated using(public.is_portfolio_owner()) with check(public.is_portfolio_owner());
alter table public.skills enable row level security;
create policy owner_only on public.skills for all to authenticated using(public.is_portfolio_owner()) with check(public.is_portfolio_owner());
alter table public.tools enable row level security;
create policy owner_only on public.tools for all to authenticated using(public.is_portfolio_owner()) with check(public.is_portfolio_owner());
alter table public.journey_milestones enable row level security;
create policy owner_only on public.journey_milestones for all to authenticated using(public.is_portfolio_owner()) with check(public.is_portfolio_owner());
alter table public.learning_reflections enable row level security;
create policy owner_only on public.learning_reflections for all to authenticated using(public.is_portfolio_owner()) with check(public.is_portfolio_owner());
alter table public.project_media enable row level security;
create policy owner_only on public.project_media for all to authenticated using(public.is_portfolio_owner()) with check(public.is_portfolio_owner());
alter table public.contact_submissions enable row level security;
create policy owner_only on public.contact_submissions for all to authenticated using(public.is_portfolio_owner()) with check(public.is_portfolio_owner());

create function public.check_rate_limit(key text, maximum integer, expires_at bigint) returns boolean language plpgsql security definer set search_path='' as $$
declare n integer;
begin
 insert into public.rate_limits as r(id,count,expires) values(key,1,expires_at)
 on conflict(id) do update set count=r.count+1 returning count into n;
 delete from public.rate_limits where expires<extract(epoch from now())::bigint;
 return n<=maximum;
end;
$$;
revoke all on function public.check_rate_limit(text,integer,bigint) from public,anon,authenticated;
grant execute on function public.check_rate_limit(text,integer,bigint) to service_role;

insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
values ('portfolio-media','portfolio-media',false,26214400,array['image/jpeg','image/png','image/webp','image/gif','video/mp4','video/webm']);
create policy portfolio_owner_media on storage.objects for all to authenticated
using(bucket_id='portfolio-media' and public.is_portfolio_owner())
with check(bucket_id='portfolio-media' and public.is_portfolio_owner());

-- After creating Atul's account in Authentication > Users, run with its real UUID:
-- insert into public.admins(id,user_id) values ('owner','REPLACE_WITH_OWNER_AUTH_UUID');
-- Put that same UUID in the server-side ADMIN_USER_ID environment variable.
-- Disable public sign-ups in Authentication > Providers > Email.
