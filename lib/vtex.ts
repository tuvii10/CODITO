/**
 * VTEX Search — tiendas argentinas confirmadas
 * Todas verificadas con respuesta real de productos
 */
import { SearchResult } from './types'

type VtexStore = {
  name: string
  domain: string
  category: string
}

const VTEX_STORES: VtexStore[] = [
  // Supermercados
  { name: 'Carrefour',    domain: 'www.carrefour.com.ar',     category: 'supermercado' },
  { name: 'Disco',        domain: 'www.disco.com.ar',         category: 'supermercado' },
  { name: 'Vea',          domain: 'www.vea.com.ar',           category: 'supermercado' },
  { name: 'Jumbo',        domain: 'www.jumbo.com.ar',         category: 'supermercado' },
  { name: 'Libertad',     domain: 'www.hiperlibertad.com.ar', category: 'supermercado' },

  // Electrónica / tecnología
  { name: 'Frávega',      domain: 'www.fravega.com',          category: 'electro' },
  { name: 'Motorola',     domain: 'www.motorola.com.ar',      category: 'electro' },
  { name: 'BGH',          domain: 'www.bgh.com.ar',           category: 'electro' },

  // Hogar / construcción
  { name: 'Easy',         domain: 'www.easy.com.ar',          category: 'hogar' },

  // Farmacia / salud / belleza
  { name: 'Farmacity',    domain: 'www.farmacity.com',        category: 'farmacia' },

  // Indumentaria / moda
  { name: 'Topper',       domain: 'www.topper.com.ar',        category: 'moda' },
  { name: 'Mimo',         domain: 'www.mimo.com.ar',          category: 'moda' },
  { name: 'Taverniti',    domain: 'www.taverniti.com.ar',     category: 'moda' },
]

type VtexProduct = {
  productName: string
  brand: string
  link: string
  items: {
    images: { imageUrl: string }[]
    sellers: { commertialOffer: { Price: number; AvailableQuantity: number } }[]
  }[]
}

async function searchOneStore(store: VtexStore, query: string): Promise<SearchResult[]> {
  try {
    const url = `https://${store.domain}/api/catalog_system/pub/products/search?ft=${encodeURIComponent(query)}&_from=0&_to=7`

    const res = await fetch(url, {
      headers: {
        Accept: 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      signal: AbortSignal.timeout(6000),
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

      const productUrl = p.link?.startsWith('http')
        ? p.link
        : `https://${store.domain}${p.link ?? ''}`
      const image = item.images?.[0]?.imageUrl?.replace('http://', 'https://') ?? null

      return [{
        id: `vtex-${store.name}-${p.link}`,
        name: p.productName,
        brand: p.brand ?? null,
        ean: null,
        store_name: store.name,
        store_logo: `https://${store.domain}/favicon.ico`,
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

export async function searchVtex(query: string): Promise<SearchResult[]> {
  const results = await Promise.allSettled(
    VTEX_STORES.map(s => searchOneStore(s, query))
  )
  return results
    .filter(r => r.status === 'fulfilled')
    .flatMap(r => (r as PromiseFulfilledResult<SearchResult[]>).value)
}

export const VTEX_STORE_COUNT = VTEX_STORES.length
export const VTEX_STORE_NAMES = VTEX_STORES.map(s => s.name)
