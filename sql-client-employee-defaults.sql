alter table public.clients
add column if not exists employee_defaults jsonb not null default '{}'::jsonb;
