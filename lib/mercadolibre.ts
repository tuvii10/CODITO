import { SearchResult } from './types'

const SITE_ID = 'MLA'

export async function searchMercadoLibre(query: string, limit = 20): Promise<SearchResult[]> {
  try {
    const params = new URLSearchParams({
      q: query,
      limit: String(limit),
      condition: 'new',
    })

    // ML bloquea requests de servidor — usamos su endpoint de búsqueda web
    const res = await fetch(
      `https://api.mercadolibre.com/sites/${SITE_ID}/search?${params}`,
      {
        headers: {
          'Accept': 'application/json',
          'Accept-Language': 'es-AR,es;q=0.9',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          'Referer': 'https://www.mercadolibre.com.ar/',
          'Origin': 'https://www.mercadolibre.com.ar',
        },
        next: { revalidate: 300 },
      }
    )

    if (!res.ok) return []

    const data = await res.json()

    return (data.results || []).map((item: MLItem) => ({
      id: `ml-${item.id}`,
      name: item.title,
      brand: null,
      ean: null,
      store_name: 'Mercado Libre',
      store_logo: 'https://http2.mlstatic.com/frontend-assets/ml-web-navigation/ui-navigation/6.6.92/mercadolibre/favicon.svg',
      price: item.price,
      price_per_unit: null,
      unit: null,
      url: item.permalink,
      in_stock: item.available_quantity > 0,
      source: 'mercadolibre' as const,
      image: item.thumbnail?.replace('http://', 'https://'),
      seller: item.seller?.nickname,
    }))
  } catch {
    return []
  }
}

type MLItem = {
  id: string
  title: string
  price: number
  permalink: string
  thumbnail: string
  available_quantity: number
  seller: { nickname: string }
}
