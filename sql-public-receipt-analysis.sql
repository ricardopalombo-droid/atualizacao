-- Execute uma vez no SQL Editor do projeto Supabase usado pelo site PalSys.
-- O documento e o resultado da análise não são armazenados nesta tabela.

create table if not exists public.receipt_analysis_requests (
  id uuid primary key default gen_random_uuid(),
  ip_hash text not null,
  status text not null check (status in ('processing', 'completed', 'failed')),
  document_type text check (document_type in ('holerite', 'ferias', 'rescisao', 'desconhecido')),
  file_size integer not null check (file_size > 0),
  created_at timestamptz not null default now()
);

create index if not exists receipt_analysis_requests_ip_created_idx
on public.receipt_analysis_requests(ip_hash, created_at desc);

create index if not exists receipt_analysis_requests_created_idx
on public.receipt_analysis_requests(created_at desc);

alter table public.receipt_analysis_requests enable row level security;
revoke all privileges on table public.receipt_analysis_requests from anon, authenticated;
grant select, insert, update, delete on table public.receipt_analysis_requests to service_role;

drop policy if exists "service role full receipt analysis requests"
on public.receipt_analysis_requests;

create policy "service role full receipt analysis requests"
on public.receipt_analysis_requests
for all
to service_role
using (true)
with check (true);

