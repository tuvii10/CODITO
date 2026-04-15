/**
 * Mercado Libre — cliente server-side usando OAuth app token.
 *
 * Como ML deprecó `/sites/MLA/search`, no podemos hacer búsquedas
 * por query libre. En su lugar usamos:
 *   1) /highlights/MLA/category/{CAT_ID}  → IDs de productos best sellers
 *   2) /products/{PRODUCT_ID}             → nombre, imagen, info
 *   3) /products/{PRODUCT_ID}/items       → listings con precios
 *
 * Con esto podemos poblar la sección de Destacados por categoría.
 * Para búsquedas de texto libre del usuario, ML devuelve array vacío
 * (la función searchMercadoLibre queda stub).
 */
import { SearchResult } from './types'
import { getMLAccessToken } from './ml-auth'

const ML_LOGO = 'https://http2.mlstatic.com/frontend-assets/ml-web-navigation/ui-navigation/6.6.92/mercadolibre/favicon.svg'
const ML_API = 'https://api.mercadolibre.com'

// ─── Tipos de respuesta de ML ──────────────────────────────────────────────

type MLHighlightContent = {
  id: string
  position: number
  type: 'PRODUCT' | 'ITEM'
}

type MLHighlightResponse = {
  query_data?: unknown
  content?: MLHighlightContent[]
}

type MLPicture = {
  id: string
  url: string
  max_width?: number
  max_height?: number
}

type MLProductResponse = {
  id: string
  name: string
  family_name?: string
  permalink?: string
  pictures?: MLPicture[]
}

type MLListingItem = {
  item_id: string
  price: number
  original_price?: number | null
  currency_id: string
  condition: string
  category_id?: string
  shipping?: {
    free_shipping?: boolean
  }
}

type MLProductItemsResponse = {
  paging?: { total: number; offset: number; limit: number }
  results: MLListingItem[]
}

// ─── Helpers ───────────────────────────────────────────────────────────────

async function mlFetch<T>(path: string): Promise<T | null> {
  const token = await getMLAccessToken()
  if (!token) return null
  try {
    const res = await fetch(`${ML_API}${path}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
      },
      next: { revalidate: 3600 },
      signal: AbortSignal.timeout(7000),
    })
    if (!res.ok) {
      console.warn('[ML] API', path, 'non-OK', res.status)
      return null
    }
    return (await res.json()) as T
  } catch (err) {
    console.warn('[ML] API', path, 'error', err)
    return null
  }
}

// ─── Public API ────────────────────────────────────────────────────────────

/**
 * Busca productos destacados (best sellers) de una categoría de ML.
 * @param categoryId ID de categoría ML, ej: MLA1403 (Alimentos)
 * @param limit cuántos productos devolver
 */
export async function fetchMLHighlightsByCategory(
  categoryId: string,
  limit = 15
): Promise<SearchResult[]> {
  const highlights = await mlFetch<MLHighlightResponse>(
    `/highlights/MLA/category/${categoryId}`
  )
  if (!highlights?.content || highlights.content.length === 0) return []

  const productIds = highlights.content
    .filter(h => h.type === 'PRODUCT')
    .slice(0, limit)
    .map(h => h.id)

  if (productIds.length === 0) return []

  // Para cada producto, traer detalles + primer listing en paralelo
  const results = await Promise.allSettled(
    productIds.map(async pid => {
      const [product, items] = await Promise.all([
        mlFetch<MLProductResponse>(`/products/${pid}`),
        mlFetch<MLProductItemsResponse>(`/products/${pid}/items?limit=1`),
      ])

      if (!product || !items?.results?.[0]) return null

      const listing = items.results[0]
      const price = listing.price
      if (!price || price <= 0) return null

      const original = listing.original_price ?? null
      const validRatio = original && original > price ? price / original : 1
      const hasDiscount = !!original && original > price && validRatio >= 0.30
      const discPct = hasDiscount ? Math.round((1 - price / original!) * 100) : 0

      const image = product.pictures?.[0]?.url?.replace('http://', 'https://') ?? null

      return {
        id: `ml-${product.id}`,
        name: product.name,
        brand: null,
        ean: null,
        store_name: 'Mercado Libre',
        store_logo: ML_LOGO,
        price,
        price_per_unit: null,
        unit: null,
        url: `https://www.mercadolibre.com.ar/p/${product.id}`,
        in_stock: true,
        source: 'mercadolibre' as const,
        image,
        promo_label: hasDiscount && discPct >= 3 ? `-${discPct}%` : null,
        original_price: hasDiscount ? original : null,
        // ML devuelve original_price solo cuando hay descuento real del vendedor
        is_real_promo: hasDiscount && discPct >= 3,
      } as SearchResult
    })
  )

  return results
    .filter((r): r is PromiseFulfilledResult<SearchResult | null> => r.status === 'fulfilled')
    .map(r => r.value)
    .filter((r): r is SearchResult => r !== null)
}

/**
 * Legacy: antes hacía búsqueda por query libre.
 * ML deprecó ese endpoint — ahora devuelve vacío y los resultados de ML
 * vienen por `fetchMLHighlightsByCategory` en la sección de destacados.
 */
export async function searchMercadoLibre(_query: string, _limit = 24): Promise<SearchResult[]> {
  return []
}
