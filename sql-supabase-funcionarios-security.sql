-- Execute uma vez no SQL Editor do projeto "funcionarios".
-- O site acessa estas tabelas apenas pelo servidor com a service_role.

begin;

alter table public.subscribers enable row level security;
alter table public.app_users enable row level security;
alter table public.clients enable row level security;
alter table public.employees enable row level security;
alter table public.dependents enable row level security;
alter table public.reference_catalog_items enable row level security;
alter table public.site_access_events enable row level security;

revoke all privileges on table
  public.subscribers,
  public.app_users,
  public.clients,
  public.employees,
  public.dependents,
  public.reference_catalog_items,
  public.site_access_events
from anon, authenticated;

grant select, insert, update, delete on table
  public.subscribers,
  public.app_users,
  public.clients,
  public.employees,
  public.dependents,
  public.reference_catalog_items
to service_role;

grant select, insert on table public.site_access_events to service_role;

drop policy if exists "service role access site_access_events" on public.site_access_events;
create policy "service role access site_access_events"
on public.site_access_events
for all
to service_role
using (true)
with check (true);

alter function public.set_updated_at() set search_path = '';
revoke execute on function public.set_updated_at() from public, anon, authenticated;
grant execute on function public.set_updated_at() to service_role;

commit;
