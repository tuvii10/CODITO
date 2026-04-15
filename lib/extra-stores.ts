/**
 * Tiendas extra — Fravega, Garbarino, Farmacity, Musimundo
 * Todas usan VTEX también
 */
import { SearchResult } from './types'

const EXTRA_STORES = [
  { name: 'Frávega',    domain: 'www.fravega.com' },
  { name: 'Garbarino',  domain: 'www.garbarino.com' },
  { name: 'Musimundo',  domain: 'www.musimundo.com' },
  { name: 'Farmacity', domain: 'www.farmacity.com' },
]

type VtexProduct = {
  productName: string
  brand: string
  link: string
  items: { images: { imageUrl: string }[]; sellers: { commertialOffer: { Price: number; AvailableQuantity: number } }[] }[]
}

async function searchStore(domain: string, name: string, query: string): Promise<SearchResult[]> {
  try {
    const url = `https://${domain}/api/catalog_system/pub/products/search?ft=${encodeURIComponent(query)}&_from=0&_to=4`

    const res = await fetch(url, {
      headers: { Accept: 'application/json', 'User-Agent': 'Mozilla/5.0' },
      signal: AbortSignal.timeout(5000),
      next: { revalidate: 300 },
    })

    if (!res.ok) return []
    const products: VtexProduct[] = await res.json()
    if (!Array.isArray(products)) return []

    return products.flatMap(p => {
      const item = p.items?.[0]
      if (!item) return []
      const offer = item.sellers?.[0]?.commertialOffer
      if (!offer || offer.AvailableQuantity <= 0 || !offer.Price) return []

      const productUrl = p.link?.startsWith('http') ? p.link : `https://${domain}${p.link ?? ''}`
      const image = item.images?.[0]?.imageUrl?.replace('http://', 'https://') ?? null

      return [{
        id: `extra-${name}-${p.link}`,
        name: p.productName,
        brand: p.brand ?? null,
        ean: null,
        store_name: name,
        store_logo: `https://${domain}/favicon.ico`,
        price: offer.Price,
        price_per_unit: null,
        unit: null,
        url: productUrl,
        in_stock: true,
        source: 'vtex' as const,
        image,
      } as SearchResult]
    })
  } catch {
    return []
  }
}

export async function searchExtraStores(query: string): Promise<SearchResult[]> {
  const all = await Promise.allSettled(
    EXTRA_STORES.map(s => searchStore(s.domain, s.name, query))
  )
  return all
    .filter(r => r.status === 'fulfilled')
    .flatMap(r => (r as PromiseFulfilledResult<SearchResult[]>).value)
}
