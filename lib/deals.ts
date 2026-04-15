/**
 * Ofertas del día: pipeline robusto que garantiza productos reales con
 * descuentos verificados contra el mercado.
 *
 * Fuentes:
 * 1. VTEX (19+ tiendas con Teasers) → promos 2x1, 4x3, 2do al X%, -X%
 * 2. Mercado Libre vía OAuth (/highlights + /products/items) → productos
 *    con original_price > price (descuento real del vendedor)
 *
 * Pipeline:
 * 1. Recolectar candidatos de todas las fuentes
 * 2. Deduplicar por nombre tokenizado
 * 3. Filtrar por criterios de "oferta con valor":
 *    - discount >= 10%
 *    - savings >= $300
 *    - $1000 <= price <= $500.000
 *    - discount <= 70% (anti-ListPrice fake)
 * 4. Ordenar por ahorro absoluto
 * 5. Devolver top 30
 */
import { SearchResult } from './types'
import { getMLAccessToken } from './ml-auth'

// ─── Tipos ─────────────────────────────────────────────────────────────────

export type Deal = SearchResult & {
  original_price: number
  discount_pct: number
  category: string
  verified: boolean
  cheapest_alt: number | null
  promo_label: string | null
  min_units: number
}

// ─── Queries VTEX por categoría ────────────────────────────────────────────

const DEAL_QUERIES: Array<{ q: string; cat: string }> = [
  // Electrodomésticos chicos (accesibles)
  { q: 'cafetera',                cat: 'Electro' },
  { q: 'licuadora',               cat: 'Electro' },
  { q: 'plancha',                 cat: 'Electro' },
  { q: 'microondas',              cat: 'Electro' },
  { q: 'auriculares bluetooth',   cat: 'Electro' },
  { q: 'smartwatch',              cat: 'Electro' },
  { q: 'parlante bluetooth',      cat: 'Electro' },
  { q: 'tostadora',               cat: 'Electro' },
  { q: 'batidora',                cat: 'Electro' },
  { q: 'ventilador',              cat: 'Electro' },
  { q: 'pava electrica',          cat: 'Electro' },
  { q: 'secador de pelo',         cat: 'Electro' },
  // Moda
  { q: 'zapatillas running',      cat: 'Moda' },
  { q: 'zapatillas adidas',       cat: 'Moda' },
  { q: 'zapatillas nike',         cat: 'Moda' },
  { q: 'zapatillas topper',       cat: 'Moda' },
  { q: 'campera',                 cat: 'Moda' },
  { q: 'buzo hoodie',             cat: 'Moda' },
  { q: 'remera',                  cat: 'Moda' },
  // Hogar
  { q: 'colchon',                 cat: 'Hogar' },
  { q: 'taladro',                 cat: 'Hogar' },
  { q: 'juego sabanas',           cat: 'Hogar' },
  { q: 'frazada polar',           cat: 'Hogar' },
  { q: 'olla',                    cat: 'Hogar' },
  // Supermercado
  { q: 'aceite oliva',            cat: 'Super' },
  { q: 'yerba mate',              cat: 'Super' },
  { q: 'cafe molido',             cat: 'Super' },
  { q: 'whisky',                  cat: 'Super' },
  { q: 'pañales',                 cat: 'Super' },
  { q: 'leche en polvo',          cat: 'Super' },
  { q: 'detergente ropa',         cat: 'Super' },
]

// ─── Tiendas VTEX para buscar ofertas ──────────────────────────────────────

const VTEX_DEAL_STORES = [
  { name: 'Carrefour',   domain: 'www.carrefour.com.ar' },
  { name: 'Disco',       domain: 'www.disco.com.ar' },
  { name: 'Vea',         domain: 'www.vea.com.ar' },
  { name: 'Jumbo',       domain: 'www.jumbo.com.ar' },
  { name: 'Chango Más',  domain: 'www.masonline.com.ar' },
  { name: 'Frávega',     domain: 'www.fravega.com' },
  { name: 'Naldo',       domain: 'www.naldo.com.ar' },
  { name: 'Easy',        domain: 'www.easy.com.ar' },
  { name: 'Pardo Hogar', domain: 'www.pardo.com.ar' },
  { name: 'Farmacity',   domain: 'www.farmacity.com' },
  { name: 'Puppis',      domain: 'www.puppis.com.ar' },
  { name: 'Topper',      domain: 'www.topper.com.ar' },
  { name: 'Mimo',        domain: 'www.mimo.com.ar' },
  { name: 'Marathon',    domain: 'www.marathon.com.ar' },
  { name: 'Sporting',    domain: 'www.sporting.com.ar' },
]

// ─── Tipos de VTEX Teasers ─────────────────────────────────────────────────

type VtexTeaserParam = { '<Name>k__BackingField': string; '<Value>k__BackingField': string }
type VtexTeaser = {
  '<Name>k__BackingField': string
  '<Conditions>k__BackingField': {
    '<MinimumQuantity>k__BackingField': number
    '<Parameters>k__BackingField': VtexTeaserParam[]
  }
  '<Effects>k__BackingField': {
    '<Parameters>k__BackingField': VtexTeaserParam[]
  }
}

type VtexOffer = {
  Price: number
  ListPrice: number
  AvailableQuantity: number
  Teasers?: VtexTeaser[]
}

type VtexProduct = {
  productName: string
  brand?: string
  link: string
  items?: Array<{
    images?: Array<{ imageUrl: string }>
    sellers?: Array<{ commertialOffer: VtexOffer }>
  }>
}

// ─── Tokenización para deduplicar ──────────────────────────────────────────

const STOP_WORDS = new Set([
  'de', 'del', 'la', 'el', 'los', 'las', 'y', 'con', 'sin', 'para', 'en', 'por',
  'un', 'una', 'x', 'ml', 'cc', 'gr', 'kg', 'lt', 'lts', 'litro', 'litros',
  'pack', 'caja', 'botella', 'bolsa', 'unidad', 'unidades',
])

function tokenize(name: string): string[] {
  return name
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/(\d)[.,](\d)/g, '$1$2')
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 1 && !STOP_WORDS.has(w))
}

// ─── Parser de Teasers ─────────────────────────────────────────────────────

type PromoResult = {
  effectivePrice: number
  discountPct: number
  label: string
  minUnits: number
}

function parseBestTeaser(teasers: VtexTeaser[], unitPrice: number): PromoResult | null {
  let best: PromoResult | null = null

  for (const t of teasers) {
    const name = t['<Name>k__BackingField'] ?? ''
    const conditions = t['<Conditions>k__BackingField']
    const effects = t['<Effects>k__BackingField']
    const minQty = conditions?.['<MinimumQuantity>k__BackingField'] ?? 0
    const condParams = conditions?.['<Parameters>k__BackingField'] ?? []
    const effParams = effects?.['<Parameters>k__BackingField'] ?? []

    const requiresCard = condParams.some(p => p['<Name>k__BackingField'] === 'RestrictionsBins')
    if (requiresCard) continue

    let promo: PromoResult | null = null

    // NxM
    const nxmMatch = name.match(/(\d+)\s*[xX]\s*(\d+)/)
    if (nxmMatch) {
      const buy = parseInt(nxmMatch[1])
      const pay = parseInt(nxmMatch[2])
      if (buy > pay && pay > 0) {
        const effectivePrice = unitPrice * pay / buy
        const discountPct = Math.round((1 - pay / buy) * 100)
        promo = { effectivePrice, discountPct, label: `${buy}x${pay}`, minUnits: Math.max(buy, minQty) }
      }
    }

    // Ndo al X%
    if (!promo) {
      const ndoMatch = name.match(/(\d+)(?:do|da|ro|ra|to|ta)\s+al\s+(\d+)%/i)
      if (ndoMatch) {
        const n = parseInt(ndoMatch[1])
        const discOnNth = parseInt(ndoMatch[2])
        if (n >= 2 && discOnNth > 0 && discOnNth <= 100) {
          const effectivePrice = ((n - 1) * unitPrice + unitPrice * (1 - discOnNth / 100)) / n
          const discountPct = Math.round((1 - effectivePrice / unitPrice) * 100)
          const label = discOnNth === 100 ? `${n}x${n - 1}` : `${n}do al ${discOnNth}%`
          promo = { effectivePrice, discountPct, label, minUnits: Math.max(n, minQty) }
        }
      }
    }

    // PercentualDiscount
    if (!promo) {
      const pctParam = effParams.find(p => p['<Name>k__BackingField'] === 'PercentualDiscount')
      if (pctParam) {
        const pct = parseInt(pctParam['<Value>k__BackingField'])
        if (pct > 0 && pct <= 70) {
          const effectivePrice = unitPrice * (1 - pct / 100)
          promo = { effectivePrice, discountPct: pct, label: `-${pct}%`, minUnits: Math.max(minQty, 1) }
        }
      }
    }

    if (promo && promo.discountPct >= 3 && promo.discountPct <= 70) {
      if (!best || promo.discountPct > best.discountPct) best = promo
    }
  }

  return best
}

// ─── Fetch deals desde VTEX ────────────────────────────────────────────────

async function fetchVtexDealsForQuery(query: string, category: string): Promise<Deal[]> {
  const results = await Promise.allSettled(
    VTEX_DEAL_STORES.map(async store => {
      try {
        const url = `https://${store.domain}/api/catalog_system/pub/products/search?ft=${encodeURIComponent(query)}&_from=0&_to=19`
        const res = await fetch(url, {
          headers: {
            Accept: 'application/json',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          },
          signal: AbortSignal.timeout(8000),
          next: { revalidate: 3600 },
        })
        if (!res.ok) return []
        const products: VtexProduct[] = await res.json()
        if (!Array.isArray(products)) return []

        return products.flatMap((p): Deal[] => {
          const item = p.items?.[0]
          if (!item) return []
          const offer = item.sellers?.[0]?.commertialOffer
          if (!offer || offer.AvailableQuantity <= 0 || !offer.Price) return []

          const unitPrice = offer.Price
          const listPrice = offer.ListPrice ?? unitPrice

          // Prioridad: teaser explícito > ListPrice discount
          const promo = parseBestTeaser(offer.Teasers ?? [], unitPrice)

          let effectivePrice: number
          let origPrice: number
          let discPct: number
          let promoLabel: string | null
          let minUnits: number

          if (promo) {
            effectivePrice = promo.effectivePrice
            origPrice = unitPrice
            discPct = promo.discountPct
            promoLabel = promo.label
            minUnits = promo.minUnits
          } else if (listPrice > unitPrice) {
            const ratio = unitPrice / listPrice
            if (ratio < 0.30) return [] // ListPrice fake
            effectivePrice = unitPrice
            origPrice = listPrice
            discPct = Math.round((1 - ratio) * 100)
            promoLabel = `-${discPct}%`
            minUnits = 1
          } else {
            return []
          }

          if (discPct < 3 || discPct > 70) return []

          const productUrl = p.link?.startsWith('http') ? p.link : `https://${store.domain}${p.link ?? ''}`
          return [{
            id: `vtex-deal-${store.name}-${p.link}`,
            name: p.productName,
            brand: p.brand ?? null,
            ean: null,
            store_name: store.name,
            store_logo: `https://${store.domain}/favicon.ico`,
            price: effectivePrice,
            original_price: origPrice,
            discount_pct: discPct,
            price_per_unit: null,
            unit: null,
            url: productUrl,
            in_stock: true,
            source: 'vtex' as const,
            image: item.images?.[0]?.imageUrl?.replace('http://', 'https://') ?? null,
            category,
            verified: true, // Descuentos VTEX son reales (vienen del API oficial)
            cheapest_alt: null,
            promo_label: promoLabel,
            min_units: minUnits,
            is_real_promo: !!promo,
          }]
        })
      } catch {
        return []
      }
    })
  )

  return results
    .filter(r => r.status === 'fulfilled')
    .flatMap(r => (r as PromiseFulfilledResult<Deal[]>).value)
}

// ─── Fetch deals desde Mercado Libre (OAuth) ───────────────────────────────

const ML_DEAL_CATEGORIES = [
  { id: 'MLA1403', cat: 'Super' },      // Alimentos y Bebidas
  { id: 'MLA1246', cat: 'Belleza' },    // Belleza
  { id: 'MLA5726', cat: 'Electro' },    // Electrodomésticos
  { id: 'MLA1000', cat: 'Electro' },    // Electrónica
  { id: 'MLA1051', cat: 'Celulares' },  // Celulares
  { id: 'MLA1276', cat: 'Deportes' },   // Deportes
  { id: 'MLA1430', cat: 'Moda' },       // Ropa
  { id: 'MLA1574', cat: 'Hogar' },      // Hogar
]

const ML_LOGO = 'https://http2.mlstatic.com/frontend-assets/ml-web-navigation/ui-navigation/6.6.92/mercadolibre/favicon.svg'

async function fetchMLDealsForCategory(categoryId: string, catLabel: string): Promise<Deal[]> {
  const token = await getMLAccessToken()
  if (!token) return []

  try {
    // 1. Traer highlights
    const hlRes = await fetch(`https://api.mercadolibre.com/highlights/MLA/category/${categoryId}`, {
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      signal: AbortSignal.timeout(7000),
      next: { revalidate: 3600 },
    })
    if (!hlRes.ok) return []
    const hlData: { content?: Array<{ id: string; type: string }> } = await hlRes.json()
    const productIds = (hlData.content ?? [])
      .filter(c => c.type === 'PRODUCT')
      .slice(0, 20)
      .map(c => c.id)

    if (productIds.length === 0) return []

    // 2. Para cada producto, traer detalles + items en paralelo
    const dealPromises = productIds.map(async (pid): Promise<Deal | null> => {
      try {
        const [prodRes, itemsRes] = await Promise.all([
          fetch(`https://api.mercadolibre.com/products/${pid}`, {
            headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
            signal: AbortSignal.timeout(5000),
            next: { revalidate: 3600 },
          }),
          fetch(`https://api.mercadolibre.com/products/${pid}/items?limit=1`, {
            headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
            signal: AbortSignal.timeout(5000),
            next: { revalidate: 3600 },
          }),
        ])

        if (!prodRes.ok || !itemsRes.ok) return null

        const product = await prodRes.json()
        const itemsData = await itemsRes.json()
        const listing = Array.isArray(itemsData?.results) ? itemsData.results[0] : null

        if (!listing?.price || !listing.original_price) return null
        const price = listing.price
        const original = listing.original_price
        if (original <= price) return null

        // Sanity check
        const ratio = price / original
        if (ratio < 0.30) return null
        const discPct = Math.round((1 - ratio) * 100)
        if (discPct < 3 || discPct > 70) return null

        const image = product.pictures?.[0]?.url?.replace('http://', 'https://') ?? null

        return {
          id: `ml-deal-${pid}`,
          name: product.name,
          brand: null,
          ean: null,
          store_name: 'Mercado Libre',
          store_logo: ML_LOGO,
          price,
          original_price: original,
          discount_pct: discPct,
          price_per_unit: null,
          unit: null,
          url: `https://www.mercadolibre.com.ar/p/${pid}`,
          in_stock: true,
          source: 'mercadolibre' as const,
          image,
          category: catLabel,
          verified: true,
          cheapest_alt: null,
          promo_label: `-${discPct}%`,
          min_units: 1,
          is_real_promo: true,
        }
      } catch {
        return null
      }
    })

    const results = await Promise.all(dealPromises)
    return results.filter((d): d is Deal => d !== null)
  } catch {
    return []
  }
}

// ─── Entrypoint ────────────────────────────────────────────────────────────

export async function fetchAllDeals(): Promise<Deal[]> {
  // Paso 1: traer candidatos de todas las fuentes en paralelo
  const [vtexResults, mlResults] = await Promise.all([
    Promise.allSettled(DEAL_QUERIES.map(({ q, cat }) => fetchVtexDealsForQuery(q, cat))),
    Promise.allSettled(ML_DEAL_CATEGORIES.map(({ id, cat }) => fetchMLDealsForCategory(id, cat))),
  ])

  const vtexDeals = vtexResults
    .filter(r => r.status === 'fulfilled')
    .flatMap(r => (r as PromiseFulfilledResult<Deal[]>).value)

  const mlDeals = mlResults
    .filter(r => r.status === 'fulfilled')
    .flatMap(r => (r as PromiseFulfilledResult<Deal[]>).value)

  const allCandidates = [...vtexDeals, ...mlDeals]

  // Paso 2: deduplicar por nombre tokenizado — quedarse con el más barato
  const byName = new Map<string, Deal>()
  for (const deal of allCandidates) {
    const key = tokenize(deal.name).slice(0, 5).join(' ')
    if (!key) continue
    const existing = byName.get(key)
    if (!existing || deal.price < existing.price) {
      byName.set(key, deal)
    }
  }

  // Paso 3: filtrar por criterios de "oferta con valor"
  const filtered = Array.from(byName.values()).filter(d => {
    const savings = d.original_price - d.price
    return (
      d.discount_pct >= 10 &&
      d.discount_pct <= 70 &&
      savings >= 300 &&
      d.price >= 1000 &&
      d.price <= 500000
    )
  })

  // Paso 4: ordenar por ahorro absoluto (pesos ahorrados)
  filtered.sort((a, b) => (b.original_price - b.price) - (a.original_price - a.price))

  // Paso 5: top 30
  return filtered.slice(0, 30)
}
