/**
 * Coto — tiene su propio sistema (no VTEX)
 * Usa su API interna de búsqueda
 */
import { SearchResult } from './types'

export async function searchCoto(query: string): Promise<SearchResult[]> {
  try {
    const url = `https://www.coto.com.ar/api/2.0/rest/storefrontapi/search/product/search?term=${encodeURIComponent(query)}&pageSize=5&page=1`

    const res = await fetch(url, {
      headers: { 'Accept': 'application/json', 'User-Agent': 'Mozilla/5.0' },
      signal: AbortSignal.timeout(5000),
      next: { revalidate: 300 },
    })

    if (!res.ok) return []

    const data = await res.json()
    const products = data?.products ?? data?.data?.products ?? []

    if (!Array.isArray(products)) return []

    return products.slice(0, 5).map((p: CotoProduct) => {
      const price = p.price ?? p.priceWithoutDiscount ?? 0
      return {
        id: `coto-${p.id ?? p.slug}`,
        name: p.name ?? p.productName,
        brand: p.brand ?? null,
        ean: p.ean ?? null,
        store_name: 'Coto',
        store_logo: 'https://www.coto.com.ar/favicon.ico',
        price,
        price_per_unit: null,
        unit: null,
        url: `https://www.coto.com.ar${p.linkText ? '/' + p.linkText + '/p' : ''}`,
        in_stock: true,
        source: 'vtex' as const,
        image: p.imageUrl ?? p.thumbnail ?? null,
      }
    }).filter((r: SearchResult) => r.price > 0)
  } catch {
    return []
  }
}

type CotoProduct = {
  id?: string
  slug?: string
  name: string
  productName?: string
  brand?: string
  ean?: string
  price: number
  priceWithoutDiscount?: number
  linkText?: string
  imageUrl?: string
  thumbnail?: string
}
