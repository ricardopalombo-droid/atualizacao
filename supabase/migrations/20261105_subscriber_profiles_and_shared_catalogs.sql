begin;

alter table public.subscribers
  add column if not exists subscriber_type text;

update public.subscribers
set subscriber_type = 'accounting_office'
where subscriber_type is null;

alter table public.subscribers
  alter column subscriber_type set default 'accounting_office',
  alter column subscriber_type set not null;

alter table public.subscribers
  drop constraint if exists subscribers_subscriber_type_check;

alter table public.subscribers
  add constraint subscribers_subscriber_type_check
  check (subscriber_type in ('accounting_office', 'company', 'business_group'));

alter table public.reference_catalog_items
  add column if not exists subscriber_id uuid references public.subscribers(id) on delete cascade;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'reference_catalog_items'
      and column_name = 'client_id'
  ) then
    update public.reference_catalog_items as reference
    set subscriber_id = client.subscriber_id
    from public.clients as client
    where reference.client_id = client.id
      and reference.subscriber_id is null;
  end if;
end;
$$;

delete from public.reference_catalog_items as duplicate
using public.reference_catalog_items as keeper
where duplicate.subscriber_id = keeper.subscriber_id
  and duplicate.reference_type = keeper.reference_type
  and duplicate.code = keeper.code
  and (
    duplicate.updated_at < keeper.updated_at
    or (duplicate.updated_at = keeper.updated_at and duplicate.id::text < keeper.id::text)
  );

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'reference_catalog_items'
      and column_name = 'client_id'
  ) then
    alter table public.reference_catalog_items
      alter column client_id drop not null;
  end if;
end;
$$;

create or replace function public.sync_reference_catalog_subscriber_id()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.subscriber_id is null and new.client_id is not null then
    select client.subscriber_id
    into new.subscriber_id
    from public.clients as client
    where client.id = new.client_id;
  end if;

  return new;
end;
$$;

revoke execute on function public.sync_reference_catalog_subscriber_id() from public, anon, authenticated;
grant execute on function public.sync_reference_catalog_subscriber_id() to service_role;

drop trigger if exists reference_catalog_items_sync_subscriber on public.reference_catalog_items;
create trigger reference_catalog_items_sync_subscriber
before insert or update on public.reference_catalog_items
for each row execute procedure public.sync_reference_catalog_subscriber_id();

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'reference_catalog_items_unique_subscriber_scope'
      and conrelid = 'public.reference_catalog_items'::regclass
  ) then
    alter table public.reference_catalog_items
      add constraint reference_catalog_items_unique_subscriber_scope
      unique (subscriber_id, reference_type, code);
  end if;
end;
$$;

create index if not exists reference_catalog_items_subscriber_type_idx
on public.reference_catalog_items(subscriber_id, reference_type);

commit;
