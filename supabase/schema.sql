create extension if not exists "pgcrypto";

create table if not exists public.subscribers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text,
  max_clients integer not null default 1,
  max_employees integer not null default 100,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  subscriber_id uuid not null references public.subscribers(id) on delete cascade,
  name text not null,
  email text,
  cnpj text,
  max_employees integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.app_users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  full_name text not null,
  role text not null check (role in ('palsys_admin', 'subscriber_admin', 'client_user')),
  subscriber_id uuid references public.subscribers(id) on delete cascade,
  client_id uuid references public.clients(id) on delete cascade,
  password_hash text not null default '',
  password_salt text not null default '',
  can_view_personal_data boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint app_users_scope_chk check (
    (role = 'palsys_admin' and subscriber_id is null and client_id is null)
    or (role = 'subscriber_admin' and subscriber_id is not null and client_id is null)
    or (role = 'client_user' and subscriber_id is not null and client_id is not null)
  )
);

create table if not exists public.employees (
  id uuid primary key default gen_random_uuid(),
  subscriber_id uuid references public.subscribers(id) on delete set null,
  client_id uuid references public.clients(id) on delete set null,
  workflow_status text not null default 'rascunho_interno',
  actor_last_updated text not null default 'client',
  invite_email text,
  invite_token_hash text,
  invite_token_expires_at timestamptz,
  employee_name text,
  employee_email text,
  cpf text,
  full_payload jsonb not null default '{}'::jsonb,
  invited_at timestamptz,
  employee_completed_at timestamptz,
  client_completed_at timestamptz,
  exported_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.dependents (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employees(id) on delete cascade,
  relationship_name text,
  cpf text,
  relationship_degree text,
  birth_date date,
  registry_delivery_date date,
  full_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.reference_catalog_items (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  reference_type text not null check (reference_type in ('cargo', 'horario', 'sindicato')),
  code text not null,
  label text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint reference_catalog_items_unique_scope unique (client_id, reference_type, code)
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists subscribers_set_updated_at on public.subscribers;
create trigger subscribers_set_updated_at
before update on public.subscribers
for each row execute procedure public.set_updated_at();

drop trigger if exists app_users_set_updated_at on public.app_users;
create trigger app_users_set_updated_at
before update on public.app_users
for each row execute procedure public.set_updated_at();

drop trigger if exists clients_set_updated_at on public.clients;
create trigger clients_set_updated_at
before update on public.clients
for each row execute procedure public.set_updated_at();

drop trigger if exists employees_set_updated_at on public.employees;
create trigger employees_set_updated_at
before update on public.employees
for each row execute procedure public.set_updated_at();

drop trigger if exists dependents_set_updated_at on public.dependents;
create trigger dependents_set_updated_at
before update on public.dependents
for each row execute procedure public.set_updated_at();

drop trigger if exists reference_catalog_items_set_updated_at on public.reference_catalog_items;
create trigger reference_catalog_items_set_updated_at
before update on public.reference_catalog_items
for each row execute procedure public.set_updated_at();

create index if not exists clients_subscriber_id_idx on public.clients(subscriber_id);
create index if not exists app_users_subscriber_id_idx on public.app_users(subscriber_id);
create index if not exists app_users_client_id_idx on public.app_users(client_id);
create index if not exists app_users_role_idx on public.app_users(role);
create index if not exists employees_client_id_idx on public.employees(client_id);
create index if not exists employees_subscriber_id_idx on public.employees(subscriber_id);
create index if not exists employees_workflow_status_idx on public.employees(workflow_status);
create index if not exists dependents_employee_id_idx on public.dependents(employee_id);
create index if not exists reference_catalog_items_client_type_idx
on public.reference_catalog_items(client_id, reference_type);

alter table public.subscribers enable row level security;
alter table public.app_users enable row level security;
alter table public.clients enable row level security;
alter table public.employees enable row level security;
alter table public.dependents enable row level security;
alter table public.reference_catalog_items enable row level security;

create policy "service role full subscribers"
on public.subscribers
for all
to service_role
using (true)
with check (true);

create policy "service role full app_users"
on public.app_users
for all
to service_role
using (true)
with check (true);

create policy "service role full clients"
on public.clients
for all
to service_role
using (true)
with check (true);

create policy "service role full employees"
on public.employees
for all
to service_role
using (true)
with check (true);

create policy "service role full dependents"
on public.dependents
for all
to service_role
using (true)
with check (true);

create policy "service role full reference_catalog_items"
on public.reference_catalog_items
for all
to service_role
using (true)
with check (true);
