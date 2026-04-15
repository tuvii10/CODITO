/**
 * SuperPrecio — API pública de comparación de precios argentinos.
 * https://superprecio.ar · https://github.com/bunkerapps/superprecio_mcp
 *
 * Cubre: Carrefour, ChangoMas, Coto Digital, Día, Disco, Jumbo, Vea,
 *        Easy, Farmacity, Cordiez, Coca Cola shop, Libertad, y más.
 *
 * Un solo endpoint POST /api/products que devuelve productos agrupados
 * por supermercado. No requiere auth.
 */
import { SearchResult } from './types'

type SuperPrecioProduct = {
  img?: string
  price: number
  desc: string
  code?: string
  link?: string
  barcode?: string
  market: string
  logo?: string
  show?: boolean
}

type SuperPrecioResponse = {
  allData?: SuperPrecioProduct[][]
  markets?: Array<{ id: number; name: string; url?: string; logo?: string }>
}

// Mapa de markets → nombre display (normaliza para que coincida con stores.ts)
const MARKET_DISPLAY: Record<string, string> = {
  'Carrefour': 'Carrefour',
  'ChangoMas': 'Chango Más',
  'Coto Digital': 'Coto',
  'Dia': 'DIA',
  'Disco': 'Disco',
  'Easy': 'Easy',
  'Farmacity': 'Farmacity',
  'Jumbo': 'Jumbo',
  'Vea': 'Vea',
  'Cordiez': 'Cordiez',
  'CocaCola': 'Coca Cola',
  'Libertad': 'Libertad',
  'Mas Cerca': 'Más Cerca',
}

export async function searchSuperPrecio(query: string, limit = 40): Promise<SearchResult[]> {
  if (!query || query.trim().length < 2) return []

  try {
    const res = await fetch('https://superprecio.ar/api/products', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (compatible; Codito/1.0)',
      },
      body: JSON.stringify({
        search: query.trim(),
        maxResults: limit,
        order: 'OrderByPriceASC',
      }),
      signal: AbortSignal.timeout(10000),
      next: { revalidate: 900 },
    })

    if (!res.ok) {
      console.warn('[SuperPrecio] non-OK', res.status, 'query:', query)
      return []
    }

    const data: SuperPrecioResponse = await res.json()
    if (!Array.isArray(data.allData)) return []

    // allData es Array<Array<Product>> — primera dim = market, segunda = productos
    const results: SearchResult[] = []
    for (const marketProducts of data.allData) {
      if (!Array.isArray(marketProducts)) continue
      for (const p of marketProducts) {
        if (!p.price || p.price <= 0 || !p.desc) continue
        const storeName = MARKET_DISPLAY[p.market] ?? p.market
        results.push({
          id: `sp-${p.market}-${p.code ?? p.barcode ?? p.desc.slice(0, 20)}`,
          name: p.desc,
          brand: null,
          ean: p.barcode ?? null,
          store_name: storeName,
          store_logo: p.logo ? `https://superprecio.ar${p.logo}` : null,
          price: p.price,
          price_per_unit: null,
          unit: null,
          url: p.link ?? null,
          in_stock: true,
          // Usamos 'coto' como source genérica externa para que pase por
          // el dedupe/compare junto con el resto
          source: 'coto' as const,
          image: p.img ?? null,
        })
      }
    }

    return results.slice(0, limit)
  } catch (err) {
    console.warn('[SuperPrecio] error', err)
    return []
  }
}
