begin;

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

drop trigger if exists employee_documents_set_updated_at on public.employee_documents;
create trigger employee_documents_set_updated_at
before update on public.employee_documents
for each row execute procedure public.set_updated_at();

create index if not exists employee_documents_employee_id_idx
on public.employee_documents(employee_id, created_at desc);

create index if not exists employee_documents_delete_after_idx
on public.employee_documents(delete_after);

alter table public.employee_documents enable row level security;
revoke all privileges on table public.employee_documents from anon, authenticated;
grant select, insert, update, delete on table public.employee_documents to service_role;

drop policy if exists "service role full employee documents" on public.employee_documents;
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

commit;
