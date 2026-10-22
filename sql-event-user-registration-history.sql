-- Execute uma vez no SQL Editor do Supabase antes de publicar esta versão.

alter table public.app_users
  add column if not exists phone text,
  add column if not exists email_verified_at timestamptz;

alter table public.app_users drop constraint if exists app_users_role_check;
alter table public.app_users drop constraint if exists app_users_scope_chk;

alter table public.app_users
  add constraint app_users_role_check
  check (role in ('palsys_admin', 'subscriber_admin', 'client_user', 'event_user'));

alter table public.app_users
  add constraint app_users_scope_chk check (
    (role = 'palsys_admin' and subscriber_id is null and client_id is null)
    or (role = 'subscriber_admin' and subscriber_id is not null and client_id is null)
    or (role = 'client_user' and subscriber_id is not null and client_id is not null)
    or (role = 'event_user' and subscriber_id is null and client_id is null)
  );

create table if not exists public.event_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.app_users(id) on delete cascade,
  export_hash text not null,
  request_text text not null,
  event_description text not null,
  event_code integer not null,
  filename text not null,
  event_json jsonb not null,
  model text,
  created_at timestamptz not null default now(),
  constraint event_requests_user_export_unique unique (user_id, export_hash)
);

create index if not exists event_requests_user_created_idx
on public.event_requests(user_id, created_at desc);

alter table public.event_requests enable row level security;
revoke all privileges on table public.event_requests from anon, authenticated;
grant select, insert, update, delete on table public.event_requests to service_role;

drop policy if exists "service role full event_requests" on public.event_requests;
create policy "service role full event_requests"
on public.event_requests
for all
to service_role
using (true)
with check (true);
