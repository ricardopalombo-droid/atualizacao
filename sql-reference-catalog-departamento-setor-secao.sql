alter table public.reference_catalog_items
drop constraint if exists reference_catalog_items_reference_type_check;

alter table public.reference_catalog_items
add constraint reference_catalog_items_reference_type_check
check (
  reference_type in (
    'cargo',
    'horario',
    'sindicato',
    'local',
    'departamento',
    'setor',
    'secao'
  )
);
