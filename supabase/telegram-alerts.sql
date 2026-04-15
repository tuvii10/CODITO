-- Soporte para alertas por Telegram
-- Ejecutar en Supabase SQL Editor

-- 1. Agregar columnas a price_alerts para soporte de Telegram
alter table price_alerts
  add column if not exists channel text not null default 'email',
  add column if not exists telegram_username text;

-- 2. Tabla para mapear username → chat_id (se llena cuando el usuario hace /start)
create table if not exists telegram_users (
  username  text primary key,
  chat_id   text not null,
  created_at timestamptz not null default now()
);

alter table telegram_users enable row level security;

create policy "service_role all" on telegram_users
  for all
  to service_role
  using (true)
  with check (true);
