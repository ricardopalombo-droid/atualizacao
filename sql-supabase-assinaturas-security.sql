-- Execute uma vez no SQL Editor do projeto que contém public.assinaturas_mp.
-- As cobranças acessam esta tabela apenas pelo servidor com a service_role.

begin;

alter table public.assinaturas_mp enable row level security;

revoke all privileges on table public.assinaturas_mp from anon, authenticated;
grant select, insert, update on table public.assinaturas_mp to service_role;

drop policy if exists "service role access assinaturas_mp" on public.assinaturas_mp;
create policy "service role access assinaturas_mp"
on public.assinaturas_mp
for all
to service_role
using (true)
with check (true);

commit;
