-- Historial de precios por producto/query
-- Ejecutar en Supabase SQL Editor

create table if not exists price_history (
  id          bigserial primary key,
  query       text        not null,           -- búsqueda normalizada
  store_name  text        not null,
  product_name text       not null,
  price       numeric     not null,
  url         text,
  recorded_at timestamptz not null default now()
);

-- Índice para buscar historial por query
create index if not exists price_history_query_idx on price_history (query, recorded_at desc);

-- Índice para buscar historial por tienda
create index if not exists price_history_store_idx on price_history (store_name, recorded_at desc);

-- Solo guardamos el precio más bajo por query+store cada vez (no spamear filas idénticas)
-- TTL manual: borramos registros de más de 90 días
-- (configurar pg_cron si querés limpieza automática)

-- RLS
alter table price_history enable row level security;

-- Solo lectura pública (para el sparkline en el frontend)
create policy "public select" on price_history
  for select using (true);

-- Solo service_role puede insertar
create policy "service_role insert" on price_history
  for insert
  to service_role
  with check (true);
