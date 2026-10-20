-- Consulta somente leitura. Execute no SQL Editor de cada projeto Supabase.
-- Nenhum dado ou configuração será alterado.

select
  c.relname as table_name,
  c.relrowsecurity as rls_enabled,
  has_table_privilege('anon', c.oid, 'select') as anon_select,
  has_table_privilege('anon', c.oid, 'insert') as anon_insert,
  has_table_privilege('anon', c.oid, 'update') as anon_update,
  has_table_privilege('anon', c.oid, 'delete') as anon_delete,
  has_table_privilege('authenticated', c.oid, 'select') as authenticated_select,
  has_table_privilege('authenticated', c.oid, 'insert') as authenticated_insert,
  has_table_privilege('authenticated', c.oid, 'update') as authenticated_update,
  has_table_privilege('authenticated', c.oid, 'delete') as authenticated_delete,
  has_table_privilege('service_role', c.oid, 'select') as service_role_select,
  has_table_privilege('service_role', c.oid, 'insert') as service_role_insert,
  has_table_privilege('service_role', c.oid, 'update') as service_role_update,
  has_table_privilege('service_role', c.oid, 'delete') as service_role_delete
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relkind in ('r', 'p')
order by c.relname;
