-- Execute uma vez no SQL Editor do projeto "funcionarios".
-- Corrige o aviso "Function Search Path Mutable" do Security Advisor.

begin;

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

commit;
