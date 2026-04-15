import { SearchResult } from './types'

const ML_LOGO = 'https://http2.mlstatic.com/frontend-assets/ml-web-navigation/ui-navigation/6.6.92/mercadolibre/favicon.svg'

/**
 * Búsqueda en Mercado Libre con dos caminos:
 * 1) API oficial pública: api.mercadolibre.com/sites/MLA/search
 *    (rápida, estructurada, pero a veces bloquea IPs sospechosas)
 * 2) HTML scraping: listado.mercadolibre.com.ar (a veces redirige a challenge)
 *
 * Probamos la API primero; si falla o viene vacía, caemos al scraping.
 */

type MLApiItem = {
  id: string
  title: string
  price: number
  original_price?: number | null
  permalink: string
  thumbnail?: string
  available_quantity?: number
  seller?: { nickname?: string }
}

async function searchViaApi(query: string, limit: number): Promise<SearchResult[]> {
  try {
    const url = `https://api.mercadolibre.com/sites/MLA/search?q=${encodeURIComponent(query)}&limit=${Math.min(limit, 50)}&condition=new`

    const res = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'Accept-Language': 'es-AR,es;q=0.9',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      },
      next: { revalidate: 300 },
      signal: AbortSignal.timeout(7000),
    })

    if (!res.ok) {
      console.warn('[ML] API non-OK', res.status, 'query:', query)
      return []
    }

    const data = await res.json()
    if (!Array.isArray(data?.results)) return []

    const items: MLApiItem[] = data.results
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
    console.warn('[ML] API error', String(err), 'query:', query)
    return []
  }
}

type MLProductItem = {
  id: string
  name: string
  image?: string
  brand_attribute?: { name: string }
  item_offered: {
    price: number
    original_price?: number
    price_currency: string
    url: string
  }
}

async function searchViaScraping(query: string, limit: number): Promise<SearchResult[]> {
  try {
    const slug = query.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9\-áéíóúüñ]/g, '')
    const url = `https://listado.mercadolibre.com.ar/${encodeURIComponent(slug)}`

    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9',
        'Accept-Language': 'es-AR,es;q=0.9,en;q=0.8',
        'Referer': 'https://www.google.com.ar/',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'cross-site',
        'Upgrade-Insecure-Requests': '1',
      },
      next: { revalidate: 300 },
      redirect: 'follow',
      signal: AbortSignal.timeout(8000),
    })

    if (!res.ok) {
      console.warn('[ML] Scrape non-OK', res.status, 'query:', query)
      return []
    }

    const html = await res.text()

    // Detectar si nos mandaron a challenge/captcha
    if (html.length < 5000 || html.includes('account-verification') || html.includes('captcha')) {
      console.warn('[ML] Scrape challenged (length:', html.length, ') query:', query)
      return []
    }

    const startStr = '"product_list":['
    const start = html.indexOf(startStr)
    if (start === -1) {
      console.warn('[ML] Scrape: product_list not found, query:', query)
      return []
    }

    const dataStart = start + startStr.length
    let depth = 1, i = dataStart
    while (i < html.length && depth > 0) {
      if (html[i] === '[') depth++
      else if (html[i] === ']') depth--
      i++
    }

    const raw = html
      .slice(dataStart, i - 1)
      .replace(/\\u002F/g, '/')
      .replace(/\\u0026/g, '&')
      .replace(/\\u003C/g, '<')
      .replace(/\\u003E/g, '>')

    const items: MLProductItem[] = JSON.parse('[' + raw + ']')

    return items
      .filter(item => item.item_offered?.price > 0)
      .slice(0, limit)
      .map(item => {
        const price = item.item_offered.price
        const original = item.item_offered.original_price ?? null
        const validRatio = original && original > price ? price / original : 1
        const hasDiscount = !!original && original > price && validRatio >= 0.30
        const discPct = hasDiscount ? Math.round((1 - price / original!) * 100) : 0
        return {
          id: `ml-${item.id}`,
          name: item.name,
          brand: item.brand_attribute?.name ?? null,
          ean: null,
          store_name: 'Mercado Libre',
          store_logo: ML_LOGO,
          price,
          price_per_unit: null,
          unit: null,
          url: item.item_offered.url,
          in_stock: true,
          source: 'mercadolibre' as const,
          image: item.image?.replace('http://', 'https://') ?? null,
          seller: undefined,
          promo_label: hasDiscount && discPct >= 3 ? `-${discPct}%` : null,
          original_price: hasDiscount ? original : null,
        }
      })
  } catch (err) {
    console.warn('[ML] Scrape error', String(err), 'query:', query)
    return []
  }
}

export async function searchMercadoLibre(query: string, limit = 24): Promise<SearchResult[]> {
  // 1) Probar la API oficial primero
  const apiResults = await searchViaApi(query, limit)
  if (apiResults.length > 0) return apiResults.slice(0, limit)

  // 2) Fallback: scraping HTML
  const scrapedResults = await searchViaScraping(query, limit)
  return scrapedResults.slice(0, limit)
}
