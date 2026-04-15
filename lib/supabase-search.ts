import { getSupabase } from './supabase'
import { SearchResult } from './types'
import { getStoreConfig } from './stores'

export async function searchSupabase(query: string, limit = 30): Promise<SearchResult[]> {
  const supabase = getSupabase()

  // 1. Buscar productos que coincidan con el nombre
  const { data: products, error: prodError } = await supabase
    .from('products')
    .select('id, name, brand, ean')
    .ilike('name', `%${query}%`)
    .limit(limit)

  if (prodError || !products || products.length === 0) return []

  const productIds = products.map(p => p.id)

  // Mapa id → producto
  const productMap = new Map(products.map(p => [p.id, p]))

  // 2. Buscar precios para esos productos (solo del día más reciente)
  const { data: prices, error: priceError } = await supabase
    .from('prices')
    .select(`
      id, price, price_per_unit, unit, url, in_stock, date,
      product_id, store_id,
      stores ( id, name, logo_url, url )
    `)
    .in('product_id', productIds)
    .eq('in_stock', true)
    .order('price', { ascending: true })

  if (priceError || !prices) return []

  // 3. Quedarse con el precio más bajo por producto+tienda
  const seen = new Set<string>()
  const results: SearchResult[] = []

  for (const row of prices) {
    const store = Array.isArray(row.stores) ? row.stores[0] : row.stores as StoreRef | null
    if (!store) continue

    const key = `${row.product_id}-${row.store_id}`
    if (seen.has(key)) continue
    seen.add(key)

    const product = productMap.get(row.product_id)
    if (!product) continue

    const storeConfig = getStoreConfig(store.name)
    // Si no hay URL directa, construir URL de búsqueda en la tienda
    const productUrl = row.url || storeConfig.searchUrl(product.name)

    results.push({
      id: row.id,
      name: product.name,
      brand: product.brand,
      ean: product.ean,
      store_name: store.name,
      store_logo: storeConfig.logo,
      price: row.price,
      price_per_unit: row.price_per_unit,
      unit: row.unit,
      url: productUrl,
      in_stock: row.in_stock,
      source: 'sepa' as const,
    })
  }

  return results
}

type StoreRef = { id: string; name: string; logo_url: string | null; url: string | null }
