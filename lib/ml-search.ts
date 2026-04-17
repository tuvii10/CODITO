/**
 * MercadoLibre Search — scrapea resultados de búsqueda de ML Argentina.
 *
 * Como la API oficial de búsqueda está deprecada, usamos la API interna
 * que ML expone para su frontend (misma que usa el sitio web).
 */
import { SearchResult } from './types'

const ML_LOGO = 'https://http2.mlstatic.com/frontend-assets/ml-web-navigation/ui-navigation/6.6.92/mercadolibre/favicon.svg'

type MLSearchItem = {
  id: string
  title: string
  price: number
  original_price?: number | null
  currency_id: string
  thumbnail: string
  permalink: string
  condition: string
  seller?: { nickname?: string }
  shipping?: { free_shipping?: boolean }
  available_quantity?: number
}

type MLSearchResponse = {
  results: MLSearchItem[]
  paging: { total: number; offset: number; limit: number }
}

export async function searchMercadoLibreWeb(query: string, limit = 20): Promise<SearchResult[]> {
  if (!query || query.trim().length < 2) return []

  try {
    // API interna de ML usada por el frontend — no requiere auth
    const url = `https://api.mercadolibre.com/sites/MLA/search?q=${encodeURIComponent(query)}&limit=${limit}&sort=price_asc`

    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json',
      },
      signal: AbortSignal.timeout(8000),
      next: { revalidate: 600 }, // 10 min cache
    })

    if (!res.ok) {
      // Si ML bloquea, fallback silencioso
      console.warn('[ML-Search] non-OK:', res.status)
      return []
    }

    const data: MLSearchResponse = await res.json()
    if (!data.results || !Array.isArray(data.results)) return []

    return data.results
      .filter(item => item.price > 0 && item.currency_id === 'ARS')
      .map(item => ({
        id: `ml-${item.id}`,
        name: item.title,
        brand: null,
        ean: null,
        store_name: 'MercadoLibre',
        store_logo: ML_LOGO,
        price: item.price,
        original_price: item.original_price ?? undefined,
        price_per_unit: null,
        unit: null,
        url: item.permalink,
        in_stock: (item.available_quantity ?? 1) > 0,
        source: 'searxng' as const, // reutilizamos tipo existente
        image: item.thumbnail?.replace('-I.jpg', '-O.jpg') ?? null, // mejor resolución
      }))
  } catch (err) {
    console.warn('[ML-Search] error:', err)
    return []
  }
}
