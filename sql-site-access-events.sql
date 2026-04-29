create table if not exists public.site_access_events (
  id uuid primary key default gen_random_uuid(),
  pathname text not null,
  visitor_id text,
  referrer text,
  ip_address text,
  user_agent text,
  user_id uuid,
  session_role text,
  subscriber_id uuid,
  client_id uuid,
  created_at timestamptz not null default now()
);

create index if not exists site_access_events_created_at_idx
  on public.site_access_events (created_at desc);

create index if not exists site_access_events_pathname_idx
  on public.site_access_events (pathname);
