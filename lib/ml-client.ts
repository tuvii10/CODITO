/**
 * Cliente de Mercado Libre que corre en el NAVEGADOR.
 *
 * ML bloquea las IPs de Vercel (403) tanto en su API pública como en el
 * scraping. La solución: hacer el fetch desde el browser del usuario, que
 * tiene una IP residencial normal. La API de ML soporta CORS, así que se
 * puede llamar directamente desde JS del cliente.
 */
import { SearchResult } from './types'

const ML_LOGO = 'https://http2.mlstatic.com/frontend-assets/ml-web-navigation/ui-navigation/6.6.92/mercadolibre/favicon.svg'

type MLApiResult = {
  id: string
  title: string
  price: number
  original_price?: number | null
  permalink: string
  thumbnail?: string
  available_quantity?: number
  seller?: { nickname?: string }
}

export async function searchMercadoLibreClient(query: string, limit = 15): Promise<SearchResult[]> {
  if (typeof window === 'undefined') return []
  if (!query || query.trim().length < 2) return []

  try {
    const url = `https://api.mercadolibre.com/sites/MLA/search?q=${encodeURIComponent(query)}&limit=${Math.min(limit, 50)}&condition=new`
    const res = await fetch(url, {
      headers: { 'Accept': 'application/json' },
    })

    if (!res.ok) {
      console.warn('[ML-client] API non-OK', res.status)
      return []
    }

    const data = await res.json()
    if (!Array.isArray(data?.results)) return []

    const items: MLApiResult[] = data.results
    return items
      .filter(it => it.price > 0 && (it.available_quantity ?? 1) > 0)
      .map(it => {
        const original = it.original_price ?? null
        const validRatio = original && original > it.price ? it.price / original : 1
        const hasDiscount = !!original && original > it.price && validRatio >= 0.30
        const discPct = hasDiscount ? Math.round((1 - it.price / original!) * 100) : 0

        return {
          id: `ml-${it.id}`,
          name: it.title,
          brand: null,
          ean: null,
          store_name: 'Mercado Libre',
          store_logo: ML_LOGO,
          price: it.price,
          price_per_unit: null,
          unit: null,
          url: it.permalink,
          in_stock: true,
          source: 'mercadolibre' as const,
          image: it.thumbnail?.replace('http://', 'https://') ?? null,
          seller: it.seller?.nickname,
          promo_label: hasDiscount && discPct >= 3 ? `-${discPct}%` : null,
          original_price: hasDiscount ? original : null,
        } as SearchResult
      })
  } catch (err) {
    console.warn('[ML-client] Error', err)
    return []
  }
}
