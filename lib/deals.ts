import { SearchResult } from './types'

export type Deal = SearchResult & {
  original_price: number       // precio unitario sin promo
  discount_pct: number         // % descuento efectivo (considerando promo)
  category: string
  verified: boolean
  cheapest_alt: number | null
  promo_label: string | null   // ej: "2do al 80%", "4x3"
  min_units: number            // unidades mínimas para activar la promo (1 = sin mínimo)
}

const DEAL_QUERIES = [
  // Electrodomésticos chicos (accesibles, bajo $400k)
  { q: 'cafetera express',          cat: 'Electro' },
  { q: 'licuadora',                 cat: 'Electro' },
  { q: 'plancha a vapor',           cat: 'Electro' },
  { q: 'microondas 20 litros',      cat: 'Electro' },
  { q: 'auriculares bluetooth',     cat: 'Electro' },
  { q: 'smartwatch',                cat: 'Electro' },
  { q: 'parlante bluetooth',        cat: 'Electro' },
  { q: 'tostadora',                 cat: 'Electro' },
  { q: 'batidora',                  cat: 'Electro' },
  { q: 'ventilador de pie',         cat: 'Electro' },
  { q: 'pava electrica',            cat: 'Electro' },
  { q: 'secador de pelo',           cat: 'Electro' },
  // Moda (valor medio, todos bajo $400k)
  { q: 'zapatillas running',        cat: 'Moda' },
  { q: 'zapatillas adidas',         cat: 'Moda' },
  { q: 'zapatillas nike',           cat: 'Moda' },
  { q: 'zapatillas topper',         cat: 'Moda' },
  { q: 'campera inflable',          cat: 'Moda' },
  { q: 'buzo hoodie',               cat: 'Moda' },
  { q: 'botines futbol',            cat: 'Moda' },
  // Hogar accesible
  { q: 'colchon 1 plaza',           cat: 'Hogar' },
  { q: 'taladro inalambrico',       cat: 'Hogar' },
  { q: 'juego sabanas',             cat: 'Hogar' },
  { q: 'frazada polar',             cat: 'Hogar' },
  { q: 'olla',                      cat: 'Hogar' },
  // Supermercado (valor medio)
  { q: 'aceite oliva',              cat: 'Supermercado' },
  { q: 'yerba mate 1 kg',           cat: 'Supermercado' },
  { q: 'cafe en grano',             cat: 'Supermercado' },
  { q: 'whisky',                    cat: 'Supermercado' },
  { q: 'pañales',                   cat: 'Supermercado' },
  { q: 'leche en polvo',            cat: 'Supermercado' },
  { q: 'detergente ropa 3 litros',  cat: 'Supermercado' },
]

// ─── Normalización de nombres ──────────────────────────────────────────────

const STOP_WORDS = new Set([
  'de','del','la','el','los','las','y','con','sin','para','en','por',
  'un','una','x','ml','cc','gr','kg','lt','lts','litro','litros',
  'pack','caja','botella','bolsa','unidad','unidades','und',
])

function tokenize(name: string): string[] {
  return name
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')  // quitar tildes
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 1 && !STOP_WORDS.has(w))
}

/** Porcentaje de tokens compartidos (Jaccard simplificado) */
function nameSimilarity(a: string, b: string): number {
  const ta = new Set(tokenize(a))
  const tb = new Set(tokenize(b))
  if (ta.size === 0 || tb.size === 0) return 0
  const intersection = [...ta].filter(t => tb.has(t)).length
  return intersection / Math.max(ta.size, tb.size)
}

/** Query de búsqueda: primeras 3 palabras relevantes */
function toSearchQuery(name: string): string {
  return tokenize(name).slice(0, 3).join(' ')
}

// ─── VTEX Teasers (promos tipo "2do al 80%", "4x3", etc.) ─────────────────

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

type PromoResult = {
  effectivePrice: number   // precio efectivo por unidad
  discountPct: number      // % de descuento sobre el precio unitario
  label: string            // texto a mostrar: "2do al 80%", "4x3", etc.
  minUnits: number         // unidades mínimas requeridas
}

/**
 * Parsea los Teasers de VTEX y devuelve la mejor promo universal (sin tarjeta).
 * Calcula el precio efectivo por unidad considerando la promo.
 */
function parseBestTeaser(teasers: VtexTeaser[], unitPrice: number): PromoResult | null {
  let best: PromoResult | null = null

  for (const t of teasers) {
    const name: string = t['<Name>k__BackingField'] ?? ''
    const conditions = t['<Conditions>k__BackingField']
    const effects = t['<Effects>k__BackingField']
    const minQty: number = conditions?.['<MinimumQuantity>k__BackingField'] ?? 0
    const condParams: VtexTeaserParam[] = conditions?.['<Parameters>k__BackingField'] ?? []
    const effParams: VtexTeaserParam[] = effects?.['<Parameters>k__BackingField'] ?? []

    // Saltar promos que requieren tarjeta/medio de pago específico
    const requiresCard = condParams.some(p => p['<Name>k__BackingField'] === 'RestrictionsBins')
    if (requiresCard) continue

    let promo: PromoResult | null = null

    // ── Tipo "NxM" primero: "4x3", "3x2", "2x1" ─────────────────────────
    const nxmMatch = name.match(/(\d+)[xX](\d+)/)
    if (nxmMatch) {
      const buy = parseInt(nxmMatch[1])
      const pay = parseInt(nxmMatch[2])
      if (buy > pay && pay > 0) {
        const effectivePrice = unitPrice * pay / buy
        const discountPct = Math.round((1 - pay / buy) * 100)
        promo = { effectivePrice, discountPct, label: `${buy}x${pay}`, minUnits: Math.max(buy, minQty) }
      }
    }

    // ── Tipo "2do al X%" / "3ro al X%" ───────────────────────────────────
    if (!promo) {
      const ndoMatch = name.match(/(\d+)(?:do|ro|to)\s+al\s+(\d+)%/i)
        ?? name.match(/[Rr]eg-(\d+)-(\d+)/)  // fallback: "Reg-2-70"
      if (ndoMatch) {
        const n = parseInt(ndoMatch[1])
        const discOnNth = parseInt(ndoMatch[2])
        if (n >= 2 && discOnNth > 0 && discOnNth <= 100) {
          const effectivePrice = ((n - 1) * unitPrice + unitPrice * (1 - discOnNth / 100)) / n
          const discountPct = Math.round((1 - effectivePrice / unitPrice) * 100)
          // Si el descuento es 100% en la Nth unidad → mostrar como NxN-1
          const label = discOnNth === 100 ? `${n}x${n - 1}` : `${n}do al ${discOnNth}%`
          promo = { effectivePrice, discountPct, label, minUnits: Math.max(n, minQty) }
        }
      }
    }

    // ── Descuento porcentual directo en Effects ───────────────────────────
    if (!promo) {
      const pctParam = effParams.find(p => p['<Name>k__BackingField'] === 'PercentualDiscount')
      if (pctParam) {
        const pct = parseInt(pctParam['<Value>k__BackingField'])
        const effectivePrice = unitPrice * (1 - pct / 100)
        const minU = Math.max(minQty, 1)
        promo = { effectivePrice, discountPct: pct, label: `-${pct}%`, minUnits: minU }
      }
    }

    if (promo && promo.discountPct >= 3 && promo.discountPct <= 80) {
      if (!best || promo.discountPct > best.discountPct) best = promo
    }
  }

  return best
}

// ─── VTEX helpers ──────────────────────────────────────────────────────────

type VtexOffer = {
  Price: number
  ListPrice: number
  AvailableQuantity: number
  Teasers: VtexTeaser[]
}
type VtexProduct = {
  productName: string
  brand: string
  link: string
  items: { images: { imageUrl: string }[]; sellers: { commertialOffer: VtexOffer }[] }[]
}

const VTEX_SUPERMARKETS = [
  { name: 'Carrefour', domain: 'www.carrefour.com.ar' },
  { name: 'Disco',     domain: 'www.disco.com.ar' },
  { name: 'Vea',       domain: 'www.vea.com.ar' },
  { name: 'Jumbo',     domain: 'www.jumbo.com.ar' },
  { name: 'Chango Más', domain: 'www.masonline.com.ar' },
  { name: 'Frávega',   domain: 'www.fravega.com' },
  { name: 'Naldo',     domain: 'www.naldo.com.ar' },
  { name: 'Easy',      domain: 'www.easy.com.ar' },
  { name: 'Pardo Hogar', domain: 'www.pardo.com.ar' },
  { name: 'Farmacity', domain: 'www.farmacity.com' },
  { name: 'Puppis',    domain: 'www.puppis.com.ar' },
]

async function vtexSearch(domain: string, query: string): Promise<{ name: string; price: number }[]> {
  try {
    const res = await fetch(
      `https://${domain}/api/catalog_system/pub/products/search?ft=${encodeURIComponent(query)}&_from=0&_to=6`,
      { headers: { Accept: 'application/json', 'User-Agent': 'Mozilla/5.0' }, signal: AbortSignal.timeout(6000) }
    )
    if (!res.ok) return []
    const products: VtexProduct[] = await res.json()
    if (!Array.isArray(products)) return []
    return products.flatMap(p => {
      const offer = p.items?.[0]?.sellers?.[0]?.commertialOffer
      if (!offer?.Price || offer.AvailableQuantity <= 0) return []
      // Usar precio efectivo si hay promo
      const promo = parseBestTeaser(offer.Teasers ?? [], offer.Price)
      const effectivePrice = promo ? promo.effectivePrice : offer.Price
      return [{ name: p.productName, price: effectivePrice }]
    })
  } catch { return [] }
}

// ─── ML scraping ───────────────────────────────────────────────────────────

function extractMLDeals(html: string, category: string): Deal[] {
  // Mapa nombre → {url, image} desde product_list (schema.org)
  const imageMap = new Map<string, { url: string; image: string | null }>()
  const startStr = '"product_list":['
  const start = html.indexOf(startStr)
  if (start !== -1) {
    const dataStart = start + startStr.length
    let depth = 1, i = dataStart
    while (i < html.length && depth > 0) {
      if (html[i] === '[') depth++
      else if (html[i] === ']') depth--
      i++
    }
    try {
      const raw = html.slice(dataStart, i - 1).replace(/\\u002F/g, '/').replace(/\\u0026/g, '&')
      const items: { name: string; image?: string; item_offered?: { url: string } }[] = JSON.parse('[' + raw + ']')
      for (const item of items) {
        if (item.name && item.item_offered?.url)
          imageMap.set(item.name.toLowerCase().trim(), {
            url: item.item_offered.url.split('?')[0],
            image: item.image?.replace('http://', 'https://') ?? null,
          })
      }
    } catch { /* ignore */ }
  }

  const pattern = /\"name\":\{\"text\":\"([^\"]{8,120})\"\}[,{"a-z_]+\"price\":\{\"value\":(\d+),\"decimal_value\":\"(\d+)\",\"original_price\":(\d+)/g
  const seen = new Set<string>()
  const deals: Deal[] = []

  for (const m of html.matchAll(pattern)) {
    const name = m[1]
    const key = name.toLowerCase().trim()
    if (seen.has(key)) continue
    if (/^\d+%|^Ver más|^publicidad|mercadolibre/i.test(name)) continue
    seen.add(key)

    const price = parseFloat(m[2] + '.' + m[3])
    const original = parseInt(m[4])
    // Sanity check: precio original sospechosamente alto → fake
    if (price / original < 0.30) continue
    const discPct = Math.round((1 - price / original) * 100)
    if (discPct < 3 || discPct > 70) continue

    const meta = imageMap.get(key) ?? { url: null, image: null }
    const fallbackUrl = 'https://listado.mercadolibre.com.ar/' +
      name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
    deals.push({
      id: `ml-deal-${key.replace(/\s+/g, '-')}`,
      name, brand: null, ean: null,
      store_name: 'Mercado Libre',
      store_logo: 'https://http2.mlstatic.com/frontend-assets/ml-web-navigation/ui-navigation/6.6.92/mercadolibre/favicon.svg',
      price, original_price: original, discount_pct: discPct,
      price_per_unit: null, unit: null,
      url: meta.url ?? fallbackUrl, in_stock: true,
      source: 'mercadolibre' as const, image: meta.image,
      category, verified: false, cheapest_alt: null,
      promo_label: null, min_units: 1,
    })
  }
  return deals
}

async function fetchMLDeals(query: string, category: string): Promise<Deal[]> {
  try {
    const slug = query.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9\-áéíóúüñ]/g, '')
    const res = await fetch(`https://listado.mercadolibre.com.ar/${encodeURIComponent(slug)}`, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', 'Accept': 'text/html', 'Accept-Language': 'es-AR,es;q=0.9' },
    })
    if (!res.ok) return []
    return extractMLDeals(await res.text(), category)
  } catch { return [] }
}

async function fetchVtexDeals(query: string, category: string): Promise<Deal[]> {
  const results = await Promise.allSettled(
    VTEX_SUPERMARKETS.map(async store => {
      try {
        const res = await fetch(
          `https://${store.domain}/api/catalog_system/pub/products/search?ft=${encodeURIComponent(query)}&_from=0&_to=24`,
          { headers: { Accept: 'application/json', 'User-Agent': 'Mozilla/5.0' }, signal: AbortSignal.timeout(8000) }
        )
        if (!res.ok) return []
        const products: VtexProduct[] = await res.json()
        if (!Array.isArray(products)) return []

        return products.flatMap(p => {
          const item = p.items?.[0]
          if (!item) return []
          const offer = item.sellers?.[0]?.commertialOffer
          if (!offer || offer.AvailableQuantity <= 0 || !offer.Price) return []

          const unitPrice = offer.Price
          const listPrice = offer.ListPrice ?? unitPrice

          // Primero: buscar promo en Teasers (2do al X%, 4x3, etc.)
          const promo = parseBestTeaser(offer.Teasers ?? [], unitPrice)

          // Calcular precio efectivo y descuento
          let effectivePrice: number
          let discPct: number
          let promoLabel: string | null
          let minUnits: number

          if (promo) {
            effectivePrice = promo.effectivePrice
            discPct = promo.discountPct
            promoLabel = promo.label
            minUnits = promo.minUnits
          } else if (listPrice > unitPrice) {
            // Descuento tradicional ListPrice vs Price
            // Sanity check: si el ratio es absurdo (<0.30 = desc >70%)
            // el ListPrice es fake y lo descartamos
            const ratio = unitPrice / listPrice
            if (ratio < 0.30) return []
            effectivePrice = unitPrice
            discPct = Math.round((1 - unitPrice / listPrice) * 100)
            promoLabel = null
            minUnits = 1
          } else {
            return [] // sin descuento
          }

          if (discPct < 3 || discPct > 70) return []

          const productUrl = p.link?.startsWith('http') ? p.link : `https://${store.domain}${p.link ?? ''}`
          return [{
            id: `vtex-deal-${store.name}-${p.link}`,
            name: p.productName, brand: p.brand ?? null, ean: null,
            store_name: store.name, store_logo: `https://${store.domain}/favicon.ico`,
            price: effectivePrice,
            original_price: listPrice > unitPrice ? listPrice : unitPrice,
            discount_pct: discPct,
            price_per_unit: null, unit: null, url: productUrl, in_stock: true,
            source: 'vtex' as const,
            image: item.images?.[0]?.imageUrl?.replace('http://', 'https://') ?? null,
            category, verified: false, cheapest_alt: null,
            promo_label: promoLabel,
            min_units: minUnits,
          } as Deal]
        })
      } catch { return [] }
    })
  )
  return results.filter(r => r.status === 'fulfilled').flatMap(r => (r as PromiseFulfilledResult<Deal[]>).value)
}

// ─── Verificación por nombre ───────────────────────────────────────────────

/**
 * Para un deal dado, busca el mismo producto en las tiendas competidoras.
 * Devuelve el deal con `verified=true` si su precio es el más bajo del mercado,
 * o `verified=false` con `cheapest_alt` si otro es más barato.
 * Devuelve null si se encontró el mismo producto más barato en otro lado.
 */
async function verifyDeal(deal: Deal): Promise<Deal | null> {
  const query = toSearchQuery(deal.name)
  if (!query) return { ...deal, verified: false, cheapest_alt: null }

  // Buscar en todas las tiendas excepto la propia
  const storeNames = VTEX_SUPERMARKETS.map(s => s.name)
  const competitorStores = storeNames.filter(s => s !== deal.store_name)

  const searches = await Promise.allSettled(
    competitorStores.map(storeName => {
      const store = VTEX_SUPERMARKETS.find(s => s.name === storeName)!
      return vtexSearch(store.domain, query)
    })
  )

  const allCompetitorProducts = searches
    .filter(r => r.status === 'fulfilled')
    .flatMap(r => (r as PromiseFulfilledResult<{ name: string; price: number }[]>).value)

  // Filtrar por similitud de nombre (umbral: 50% para ser más estricto)
  const SIMILARITY_THRESHOLD = 0.50
  const matching = allCompetitorProducts.filter(
    c => nameSimilarity(deal.name, c.name) >= SIMILARITY_THRESHOLD && c.price > 0
  )

  if (matching.length === 0) {
    // No lo encontramos en otras tiendas → aceptamos solo si el descuento es muy fuerte
    // (>=25%) y asumimos que es una oferta exclusiva legítima
    if (deal.discount_pct >= 25) {
      return { ...deal, verified: false, cheapest_alt: null }
    }
    // Descuento menor a 25% sin poder verificar → rechazar para no mentir
    return null
  }

  const cheapestAlt = Math.min(...matching.map(m => m.price))

  // Tolerancia de 3% — aceptamos diferencias mínimas por variaciones de stock/envío
  const tolerance = cheapestAlt * 0.03

  if (deal.price <= cheapestAlt + tolerance) {
    // El precio con descuento ES (prácticamente) el más barato del mercado
    return { ...deal, verified: true, cheapest_alt: cheapestAlt }
  } else {
    // Hay alguien significativamente más barato → este "descuento" no es real
    return null
  }
}

// ─── Entrypoint ────────────────────────────────────────────────────────────

export async function fetchAllDeals(): Promise<Deal[]> {
  // Paso 1: recolectar candidatos
  const raw = await Promise.allSettled(
    DEAL_QUERIES.flatMap(({ q, cat }) => [fetchMLDeals(q, cat), fetchVtexDeals(q, cat)])
  )

  const candidates = raw
    .filter(r => r.status === 'fulfilled')
    .flatMap(r => (r as PromiseFulfilledResult<Deal[]>).value)

  // Dedup: mismo nombre normalizado → quedarse con mayor descuento
  const byName = new Map<string, Deal>()
  for (const deal of candidates) {
    const key = tokenize(deal.name).slice(0, 5).join(' ')
    const existing = byName.get(key)
    if (!existing || deal.discount_pct > existing.discount_pct) byName.set(key, deal)
  }

  // Criterios de "oferta con valor y accesible":
  // - Descuento mínimo 15%
  // - Ahorro absoluto mínimo $500
  // - Precio mínimo $1500 (descarta productos triviales)
  // - Precio máximo $400.000 (que sea accesible para el usuario común,
  //   nada de TVs de millón o heladeras de $2M)
  // - Descuento ≤70% (descarta listPrice fake)
  const deduped = Array.from(byName.values())
    .filter(d => {
      const savings = d.original_price - d.price
      return (
        d.discount_pct >= 15 &&
        savings >= 500 &&
        d.price >= 1500 &&
        d.price <= 400000 &&
        d.discount_pct <= 70
      )
    })
    .sort((a, b) => (b.original_price - b.price) - (a.original_price - a.price))
    .slice(0, 120) // verificar top 120 para asegurar 30 reales

  // Paso 2: verificar cada deal contra el mercado en paralelo
  const verified = await Promise.allSettled(deduped.map(verifyDeal))

  const final = verified
    .filter(r => r.status === 'fulfilled')
    .map(r => (r as PromiseFulfilledResult<Deal | null>).value)
    .filter((d): d is Deal => d !== null)
    // Ordenar por ahorro absoluto (pesos) descendente — lo que más valor tiene
    .sort((a, b) => (b.original_price - b.price) - (a.original_price - a.price))
    .slice(0, 30)

  return final
}
