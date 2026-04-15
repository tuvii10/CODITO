import { SearchResult } from './types'

export async function searchMercadoLibre(query: string, limit = 24): Promise<SearchResult[]> {
  try {
    // Convert query to ML URL slug
    const slug = query.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9\-áéíóúüñ]/g, '')
    const url = `https://listado.mercadolibre.com.ar/${encodeURIComponent(slug)}`

    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'es-AR,es;q=0.9',
      },
      next: { revalidate: 300 },
    })

    if (!res.ok) return []

    const html = await res.text()

    // ML embeds product_list as JSON inside the HTML
    const startStr = '"product_list":['
    const start = html.indexOf(startStr)
    if (start === -1) return []

    const dataStart = start + startStr.length

    // Walk to find the closing bracket
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
        const hasDiscount = original && original > price
        const discPct = hasDiscount ? Math.round((1 - price / original) * 100) : 0
        return {
          id: `ml-${item.id}`,
          name: item.name,
          brand: item.brand_attribute?.name ?? null,
          ean: null,
          store_name: 'Mercado Libre',
          store_logo: 'https://http2.mlstatic.com/frontend-assets/ml-web-navigation/ui-navigation/6.6.92/mercadolibre/favicon.svg',
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
  } catch {
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
