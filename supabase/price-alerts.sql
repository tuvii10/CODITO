-- =============================================
-- ALERTAS DE PRECIO
-- Ejecutar en Supabase > SQL Editor
-- =============================================

CREATE TABLE IF NOT EXISTS price_alerts (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email      TEXT NOT NULL,
  query      TEXT NOT NULL,          -- búsqueda que monitorear
  max_price  NUMERIC(12, 2) NOT NULL, -- avisar cuando baje de este precio
  active     BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS price_alerts_email_idx  ON price_alerts(email);
CREATE INDEX IF NOT EXISTS price_alerts_active_idx ON price_alerts(active);

-- Permitir inserción pública (cualquiera puede suscribirse)
ALTER TABLE price_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public insert alerts"
  ON price_alerts FOR INSERT
  WITH CHECK (true);

-- Solo el service role puede leer/actualizar (para el job de notificaciones)
CREATE POLICY "service read alerts"
  ON price_alerts FOR SELECT
  USING (auth.role() = 'service_role');
