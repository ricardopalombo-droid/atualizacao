create extension if not exists "pgcrypto";

create table if not exists public.subscribers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text,
  subscriber_type text not null default 'accounting_office' check (subscriber_type in ('accounting_office', 'company', 'business_group')),
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
  role text not null check (role in ('palsys_admin', 'subscriber_admin', 'client_user', 'event_user')),
  subscriber_id uuid references public.subscribers(id) on delete cascade,
  client_id uuid references public.clients(id) on delete cascade,
  password_hash text not null default '',
  password_salt text not null default '',
  activation_token_hash text,
  activation_token_expires_at timestamptz,
  phone text,
  email_verified_at timestamptz,
  can_view_personal_data boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint app_users_scope_chk check (
    (role = 'palsys_admin' and subscriber_id is null and client_id is null)
    or (role = 'subscriber_admin' and subscriber_id is not null and client_id is null)
    or (role = 'client_user' and subscriber_id is not null and client_id is not null)
    or (role = 'event_user' and subscriber_id is null and client_id is null)
  )
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

create table if not exists public.receipt_analysis_requests (
  id uuid primary key default gen_random_uuid(),
  ip_hash text not null,
  status text not null check (status in ('processing', 'completed', 'failed')),
  document_type text check (document_type in ('holerite', 'ferias', 'rescisao', 'desconhecido')),
  file_size integer not null check (file_size > 0),
  created_at timestamptz not null default now()
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

create table if not exists public.employee_documents (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employees(id) on delete cascade,
  document_type text not null check (document_type in (
    'rg_cin', 'cnh', 'comprovante_endereco', 'ctps', 'pis_nis',
    'certidao_civil', 'comprovante_bancario', 'aso', 'dependente', 'outro'
  )),
  storage_path text not null unique,
  original_name text not null,
  mime_type text not null,
  size_bytes integer not null check (size_bytes > 0 and size_bytes <= 12582912),
  uploaded_by text not null check (uploaded_by in ('employee', 'dp')),
  consent_at timestamptz not null,
  analysis_status text not null default 'pending' check (analysis_status in ('pending', 'processing', 'completed', 'failed')),
  extracted_fields jsonb not null default '[]'::jsonb,
  analysis_warnings jsonb not null default '[]'::jsonb,
  analysis_error text,
  delete_after timestamptz not null default (now() + interval '60 days'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.reference_catalog_items (
  id uuid primary key default gen_random_uuid(),
  subscriber_id uuid not null references public.subscribers(id) on delete cascade,
  reference_type text not null check (reference_type in ('cargo', 'horario', 'sindicato', 'local', 'departamento', 'setor', 'secao')),
  code text not null,
  label text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint reference_catalog_items_unique_scope unique (subscriber_id, reference_type, code)
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

revoke execute on function public.set_updated_at() from public, anon, authenticated;
grant execute on function public.set_updated_at() to service_role;

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

drop trigger if exists employee_documents_set_updated_at on public.employee_documents;
create trigger employee_documents_set_updated_at
before update on public.employee_documents
for each row execute procedure public.set_updated_at();

drop trigger if exists reference_catalog_items_set_updated_at on public.reference_catalog_items;
create trigger reference_catalog_items_set_updated_at
before update on public.reference_catalog_items
for each row execute procedure public.set_updated_at();

create index if not exists clients_subscriber_id_idx on public.clients(subscriber_id);
create index if not exists app_users_subscriber_id_idx on public.app_users(subscriber_id);
create index if not exists app_users_client_id_idx on public.app_users(client_id);
create index if not exists app_users_role_idx on public.app_users(role);
create index if not exists event_requests_user_created_idx on public.event_requests(user_id, created_at desc);
create index if not exists receipt_analysis_requests_ip_created_idx
on public.receipt_analysis_requests(ip_hash, created_at desc);
create index if not exists receipt_analysis_requests_created_idx
on public.receipt_analysis_requests(created_at desc);
create index if not exists employees_client_id_idx on public.employees(client_id);
create index if not exists employees_subscriber_id_idx on public.employees(subscriber_id);
create index if not exists employees_workflow_status_idx on public.employees(workflow_status);
create index if not exists dependents_employee_id_idx on public.dependents(employee_id);
create index if not exists employee_documents_employee_id_idx on public.employee_documents(employee_id, created_at desc);
create index if not exists employee_documents_delete_after_idx on public.employee_documents(delete_after);
create index if not exists reference_catalog_items_subscriber_type_idx
on public.reference_catalog_items(subscriber_id, reference_type);

alter table public.subscribers enable row level security;
alter table public.app_users enable row level security;
alter table public.clients enable row level security;
alter table public.employees enable row level security;
alter table public.dependents enable row level security;
alter table public.employee_documents enable row level security;
alter table public.reference_catalog_items enable row level security;
alter table public.event_requests enable row level security;
alter table public.receipt_analysis_requests enable row level security;

revoke all privileges on table
  public.subscribers,
  public.app_users,
  public.clients,
  public.employees,
  public.dependents,
  public.employee_documents,
  public.reference_catalog_items,
  public.event_requests,
  public.receipt_analysis_requests
from anon, authenticated;

grant select, insert, update, delete on table
  public.subscribers,
  public.app_users,
  public.clients,
  public.employees,
  public.dependents,
  public.employee_documents,
  public.reference_catalog_items,
  public.event_requests,
  public.receipt_analysis_requests
to service_role;

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

create policy "service role full employee documents"
on public.employee_documents
for all
to service_role
using (true)
with check (true);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'employee-documents',
  'employee-documents',
  false,
  12582912,
  array['application/pdf', 'image/jpeg', 'image/png']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "service role full reference_catalog_items"
on public.reference_catalog_items
for all
to service_role
using (true)
with check (true);

create policy "service role full event_requests"
on public.event_requests
for all
to service_role
using (true)
with check (true);

create policy "service role full receipt analysis requests"
on public.receipt_analysis_requests
for all
to service_role
using (true)
with check (true);
