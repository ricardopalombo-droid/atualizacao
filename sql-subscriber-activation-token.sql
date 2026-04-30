alter table public.app_users
add column if not exists activation_token_hash text;

alter table public.app_users
add column if not exists activation_token_expires_at timestamptz;
