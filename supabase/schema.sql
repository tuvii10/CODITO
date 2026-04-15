-- =============================================
-- COMPARADOR DE PRECIOS ARGENTINA
-- Schema para Supabase
-- Ejecutar en: Supabase > SQL Editor
-- =============================================

-- Tiendas / cadenas
CREATE TABLE IF NOT EXISTS stores (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name       TEXT NOT NULL UNIQUE,
  logo_url   TEXT,
  url        TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Productos (catálogo)
CREATE TABLE IF NOT EXISTS products (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ean        TEXT,                    -- código de barras
  name       TEXT NOT NULL,
  brand      TEXT,
  category   TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(ean, name)
);

-- Índice para búsqueda por nombre
CREATE INDEX IF NOT EXISTS products_name_idx ON products USING gin(to_tsvector('spanish', name));
CREATE INDEX IF NOT EXISTS products_ean_idx ON products(ean);

-- Precios (un registro por producto+tienda+fecha)
CREATE TABLE IF NOT EXISTS prices (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id      UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  store_id        UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  price           NUMERIC(12, 2) NOT NULL,
  price_per_unit  NUMERIC(12, 4),     -- precio por kg/litro/unidad
  unit            TEXT,               -- 'kg', 'litro', 'unidad'
  url             TEXT,
  in_stock        BOOLEAN DEFAULT TRUE,
  date            DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(product_id, store_id, date)
);

CREATE INDEX IF NOT EXISTS prices_product_idx ON prices(product_id);
CREATE INDEX IF NOT EXISTS prices_store_idx ON prices(store_id);
CREATE INDEX IF NOT EXISTS prices_date_idx ON prices(date DESC);
CREATE INDEX IF NOT EXISTS prices_price_idx ON prices(price ASC);

-- =============================================
-- Datos iniciales: tiendas
-- =============================================
INSERT INTO stores (name, logo_url, url) VALUES
  ('Carrefour',   '/logos/carrefour.png',  'https://www.carrefour.com.ar'),
  ('Coto',        '/logos/coto.png',       'https://www.coto.com.ar'),
  ('Chango Más',  '/logos/changomas.png',  'https://www.changomas.com.ar'),
  ('Disco',       '/logos/disco.png',      'https://www.disco.com.ar'),
  ('Vea',         '/logos/vea.png',        'https://www.vea.com.ar'),
  ('Mercado Libre','/logos/mercadolibre.png','https://www.mercadolibre.com.ar')
ON CONFLICT (name) DO NOTHING;

-- =============================================
-- Vista útil para búsquedas
-- =============================================
CREATE OR REPLACE VIEW latest_prices AS
SELECT DISTINCT ON (p.product_id, p.store_id)
  p.id,
  p.price,
  p.price_per_unit,
  p.unit,
  p.url,
  p.in_stock,
  p.date,
  pr.name        AS product_name,
  pr.brand       AS product_brand,
  pr.ean,
  pr.category,
  s.name         AS store_name,
  s.logo_url     AS store_logo,
  s.url          AS store_url
FROM prices p
JOIN products pr ON pr.id = p.product_id
JOIN stores   s  ON s.id  = p.store_id
ORDER BY p.product_id, p.store_id, p.date DESC;

-- =============================================
-- Función de búsqueda full-text
-- =============================================
CREATE OR REPLACE FUNCTION search_products(query TEXT, result_limit INT DEFAULT 50)
RETURNS TABLE (
  price_id        UUID,
  product_name    TEXT,
  product_brand   TEXT,
  ean             TEXT,
  store_name      TEXT,
  store_logo      TEXT,
  price           NUMERIC,
  price_per_unit  NUMERIC,
  unit            TEXT,
  url             TEXT,
  in_stock        BOOLEAN,
  date            DATE
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    lp.id,
    lp.product_name,
    lp.product_brand,
    lp.ean,
    lp.store_name,
    lp.store_logo,
    lp.price,
    lp.price_per_unit,
    lp.unit,
    lp.url,
    lp.in_stock,
    lp.date
  FROM latest_prices lp
  WHERE
    lp.product_name ILIKE '%' || query || '%'
    AND lp.in_stock = TRUE
  ORDER BY lp.price ASC
  LIMIT result_limit;
END;
$$ LANGUAGE plpgsql;
