/**
 * SearXNG — meta-buscador open source
 * Agrega resultados de Google, Bing, DuckDuckGo y 250 fuentes más
 * Sin API key, sin cuenta, 100% gratis
 *
 * Instancias públicas confiables con JSON habilitado:
 * https://searx.space/
 */
import { SearchResult } from './types'

// Instancias públicas con JSON habilitado — usamos la primera que responda
const INSTANCES = [
  'https://search.inetol.net',
  'https://searx.tiekoetter.com',
  'https://searx.be',
  'https://opnxng.com',
]

type SearxResult = {
  title: string
  url: string
  content?: string
  price?: string
  thumbnail?: string
  publishedDate?: string
  engine?: string
}

// Extrae precio de un string de texto libre (ej: "$ 1.234" o "ARS 2500")
function extractPrice(text: string): number | null {
  const clean = text.replace(/\./g, '').replace(',', '.')
  const match = clean.match(/(?:ARS|AR\$|\$|pesos)?\s*(\d+(?:\.\d{1,2})?)/i)
  if (!match) return null
  const val = parseFloat(match[1])
  return val > 10 ? val : null
}

// Adivina el nombre de la tienda desde la URL
function storeFromUrl(url: string): string {
  try {
    const host = new URL(url).hostname.replace('www.', '')
    const parts = host.split('.')
    const name = parts[0]
    return name.charAt(0).toUpperCase() + name.slice(1)
  } catch {
    return 'Tienda'
  }
}

async function queryInstance(instance: string, query: string): Promise<SearxResult[]> {
  const params = new URLSearchParams({
    q: `${query} precio comprar argentina`,
    format: 'json',
    language: 'es-AR',
    categories: 'general',
    time_range: '',
    safesearch: '0',
  })

  const res = await fetch(`${instance}/search?${params}`, {
    headers: {
      'Accept': 'application/json',
      'User-Agent': 'Mozilla/5.0 (compatible; PriceBot/1.0)',
    },
    signal: AbortSignal.timeout(6000),
    next: { revalidate: 180 },
  })

  if (!res.ok) throw new Error(`${res.status}`)
  const data = await res.json()
  return data.results ?? []
}

export async function searchSearxng(query: string): Promise<SearchResult[]> {
  // Intentar instancias en orden hasta que una responda
  let rawResults: SearxResult[] = []

  for (const instance of INSTANCES) {
    try {
      rawResults = await queryInstance(instance, query)
      if (rawResults.length > 0) break
    } catch {
      continue
    }
  }

  if (rawResults.length === 0) return []

  const results: SearchResult[] = []
  const seen = new Set<string>()

  for (const r of rawResults.slice(0, 30)) {
    try {
      const url = r.url
      if (!url || seen.has(url)) continue

      // Filtrar solo resultados que parezcan tiendas/productos
      const isProductPage =
        url.includes('/p/') ||
        url.includes('/producto') ||
        url.includes('/products/') ||
        url.includes('/item/') ||
        url.includes('mercadolibre') ||
        url.includes('/comprar') ||
        (r.content && /\$|ARS|precio|comprar/i.test(r.content))

      if (!isProductPage) continue

      // Intentar extraer precio del contenido
      const priceText = r.price ?? r.content ?? ''
      const price = extractPrice(priceText)

      // Sin precio detectado, igual incluimos si es tienda conocida
      const storeName = storeFromUrl(url)

      seen.add(url)
      results.push({
        id: `searx-${Buffer.from(url).toString('base64').slice(0, 16)}`,
        name: r.title.replace(/\s+/g, ' ').trim(),
        brand: null,
        ean: null,
        store_name: storeName,
        store_logo: `https://www.google.com/s2/favicons?domain=${new URL(url).hostname}&sz=32`,
        price: price ?? 0,
        price_per_unit: null,
        unit: null,
        url,
        in_stock: true,
        source: 'searxng' as const,
        image: r.thumbnail ?? null,
      })
    } catch {
      continue
    }
  }

  // Separar los que tienen precio de los que no
  const withPrice    = results.filter(r => r.price > 0).sort((a, b) => a.price - b.price)
  const withoutPrice = results.filter(r => r.price === 0)

  return [...withPrice, ...withoutPrice]
}
