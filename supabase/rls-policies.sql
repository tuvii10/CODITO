-- =============================================
-- POLÍTICAS RLS — LECTURA PÚBLICA
-- Ejecutar en Supabase > SQL Editor
-- =============================================

-- Habilitar RLS en las tablas
ALTER TABLE stores   ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE prices   ENABLE ROW LEVEL SECURITY;

-- Permitir lectura pública (sin login) en las 3 tablas
CREATE POLICY "public read stores"
  ON stores FOR SELECT
  USING (true);

CREATE POLICY "public read products"
  ON products FOR SELECT
  USING (true);

CREATE POLICY "public read prices"
  ON prices FOR SELECT
  USING (true);
