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
  // ── Supermercados ───────────────────────────────────────
  { name: 'Carrefour',      domain: 'www.carrefour.com.ar',      category: 'supermercado' },
  { name: 'Disco',          domain: 'www.disco.com.ar',          category: 'supermercado' },
  { name: 'Vea',            domain: 'www.vea.com.ar',            category: 'supermercado' },
  { name: 'Jumbo',          domain: 'www.jumbo.com.ar',          category: 'supermercado' },
  { name: 'Chango Más',     domain: 'www.masonline.com.ar',      category: 'supermercado' },
  { name: 'Libertad',       domain: 'www.hiperlibertad.com.ar',  category: 'supermercado' },
  { name: 'Toledo',         domain: 'www.toledodigital.com.ar',  category: 'supermercado' },
  { name: 'Josimar',        domain: 'www.josimar.com.ar',        category: 'supermercado' },

  // ── Electro / tecnología ────────────────────────────────
  { name: 'Frávega',        domain: 'www.fravega.com',           category: 'electro' },
  { name: 'Naldo',          domain: 'www.naldo.com.ar',          category: 'electro' },
  { name: 'Motorola',       domain: 'www.motorola.com.ar',       category: 'electro' },
  { name: 'BGH',            domain: 'www.bgh.com.ar',            category: 'electro' },
  { name: 'Samsung',        domain: 'shop.samsung.com.ar',       category: 'electro' },
  { name: 'Whirlpool',      domain: 'www.whirlpool.com.ar',      category: 'electro' },
  { name: 'KitchenAid',     domain: 'www.kitchenaid.com.ar',     category: 'electro' },

  // ── Hogar / construcción ────────────────────────────────
  { name: 'Easy',           domain: 'www.easy.com.ar',           category: 'hogar' },
  { name: 'Pardo Hogar',    domain: 'www.pardo.com.ar',          category: 'hogar' },
  { name: 'Tramontina',     domain: 'www.tramontina.com.ar',     category: 'hogar' },
  { name: 'Arredo',         domain: 'www.arredo.com.ar',         category: 'hogar' },
  { name: 'Blaisten',       domain: 'www.blaisten.com.ar',       category: 'hogar' },

  // ── Farmacia / belleza / mascotas ───────────────────────
  { name: 'Farmacity',      domain: 'www.farmacity.com',         category: 'farmacia' },
  { name: 'Farmaonline',    domain: 'www.farmaonline.com',       category: 'farmacia' },
  { name: 'Farmalife',      domain: 'www.farmalife.com.ar',      category: 'farmacia' },
  { name: 'Farmaplus',      domain: 'www.farmaplus.com.ar',      category: 'farmacia' },
  { name: 'Get The Look',   domain: 'www.getthelook.com.ar',     category: 'belleza' },
  { name: 'Puppis',         domain: 'www.puppis.com.ar',         category: 'mascotas' },

  // ── Moda / indumentaria ────────────────────────────────
  { name: 'Topper',         domain: 'www.topper.com.ar',         category: 'moda' },
  { name: 'Mimo',           domain: 'www.mimo.com.ar',           category: 'moda' },
  { name: 'Taverniti',      domain: 'www.taverniti.com.ar',      category: 'moda' },
  { name: '47 Street',      domain: 'www.47street.com.ar',       category: 'moda' },
  { name: 'Portsaid',       domain: 'www.portsaid.com.ar',       category: 'moda' },
  { name: 'Ricky Sarkany',  domain: 'www.rickysarkany.com',      category: 'moda' },
  { name: 'Viamo',          domain: 'www.viamo.com',             category: 'moda' },
  { name: 'Tienda River',   domain: 'www.tiendariver.com',       category: 'moda' },
  { name: 'Equus',          domain: 'www.equus.com.ar',          category: 'moda' },
  { name: 'GRID',           domain: 'www.grid.com.ar',           category: 'moda' },

  // ── Deportes ────────────────────────────────────────────
  { name: 'Sporting',       domain: 'www.sporting.com.ar',       category: 'deportes' },
  { name: 'Sportotal',      domain: 'www.sportotal.com.ar',      category: 'deportes' },
  { name: 'XL Shop',        domain: 'www.xlshop.com.ar',         category: 'deportes' },
  { name: 'Rossetti',       domain: 'www.rossettideportes.com',  category: 'deportes' },
  { name: 'Marathon',       domain: 'www.marathon.com.ar',       category: 'deportes' },
  { name: 'Batistella',     domain: 'www.calzadosbatistella.com.ar', category: 'deportes' },
  { name: 'Woker',          domain: 'www.wokerbysporting.com.ar', category: 'deportes' },
  { name: 'Las Margaritas', domain: 'www.lasmargaritas.com.ar',  category: 'moda' },

  // ── Multimarca ──────────────────────────────────────────
  { name: 'Coppel',         domain: 'www.coppel.com.ar',         category: 'multi' },
]

// ── Promo / Teaser parsing ──────────────────────────────────────────────────

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

function parseBestPromo(teasers: VtexTeaser[], unitPrice: number): { label: string; effectivePrice: number } | null {
  let best: { label: string; effectivePrice: number; discountPct: number } | null = null

  // Convertir ordinales en palabras a número
  const ordinalWordToNum: Record<string, number> = {
    'primera': 1, 'primero': 1,
    'segunda': 2, 'segundo': 2,
    'tercera': 3, 'tercero': 3,
    'cuarta': 4, 'cuarto': 4,
    'quinta': 5, 'quinto': 5,
  }

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

    let label = ''
    let effectivePrice = unitPrice
    let discountPct = 0

    // ── Tipo "NxM" ──────────────────────────────────────────────
    // "4x3", "3x2", "2x1", "Llevando 2 pagá 1" (variantes)
    const nxmMatch = name.match(/(\d+)\s*[xX]\s*(\d+)/)
      ?? name.match(/llevand[oa]?\s+(\d+)\s+pag[áa]\s+(\d+)/i)
    if (nxmMatch) {
      const buy = parseInt(nxmMatch[1])
      const pay = parseInt(nxmMatch[2])
      if (buy > pay && pay > 0) {
        effectivePrice = unitPrice * pay / buy
        discountPct = Math.round((1 - pay / buy) * 100)
        label = `${buy}x${pay}`
      }
    }

    // ── Tipo "Ndo/Nda al X%" ─────────────────────────────────────
    // "2do al 50%", "2da al 50%", "3ro al 80%", "segunda al 70%"
    if (!label) {
      // Formato numérico con ordinal masculino/femenino
      const ndoMatch = name.match(/(\d+)(?:do|da|ro|ra|to|ta)\s+(?:unidad\s+)?al\s+(\d+)\s*%/i)
        // Formato con palabra: "segunda al 50%", "segunda unidad al 80%"
        ?? (() => {
          const m = name.match(/(primera|segunda|tercera|cuarta|quinta|primero|segundo|tercero|cuarto|quinto)\s+(?:unidad\s+)?al\s+(\d+)\s*%/i)
          if (!m) return null
          const n = ordinalWordToNum[m[1].toLowerCase()]
          return n ? ([m[0], String(n), m[2]] as RegExpMatchArray) : null
        })()
        // Formato corto "Reg-N-X"
        ?? name.match(/[Rr]eg-(\d+)-(\d+)/)

      if (ndoMatch) {
        const n = parseInt(ndoMatch[1])
        const discOnNth = parseInt(ndoMatch[2])
        if (n >= 2 && discOnNth > 0 && discOnNth <= 100) {
          effectivePrice = ((n - 1) * unitPrice + unitPrice * (1 - discOnNth / 100)) / n
          discountPct = Math.round((1 - effectivePrice / unitPrice) * 100)
          label = discOnNth === 100 ? `${n}x${n - 1}` : `${n}do al ${discOnNth}%`
        }
      }
    }

    // ── "Llevando N" con descuento genérico ─────────────────────
    // "Llevando 2 pagá el 50%" o similar
    if (!label) {
      const llevandoMatch = name.match(/llevand[oa]?\s+(\d+).*?(\d+)\s*%/i)
      if (llevandoMatch) {
        const n = parseInt(llevandoMatch[1])
        const pct = parseInt(llevandoMatch[2])
        if (n >= 2 && pct > 0 && pct <= 90) {
          // Asumimos que el descuento aplica a la Nth unidad
          effectivePrice = ((n - 1) * unitPrice + unitPrice * (1 - pct / 100)) / n
          discountPct = Math.round((1 - effectivePrice / unitPrice) * 100)
          label = `Llevando ${n} -${pct}%`
        }
      }
    }

    // ── Descuento porcentual directo en Effects ─────────────────
    if (!label) {
      const pctParam = effParams.find(p => p['<Name>k__BackingField'] === 'PercentualDiscount')
      if (pctParam) {
        const pct = parseInt(pctParam['<Value>k__BackingField'])
        if (pct > 0 && pct <= 80) {
          // Si hay MinimumQuantity > 1, el descuento aplica a esa cantidad
          // (muchas veces el pct ya viene calculado como "promedio efectivo")
          if (minQty > 1) {
            effectivePrice = unitPrice * (1 - pct / 100)
            label = `-${pct}% (x${minQty})`
          } else {
            effectivePrice = unitPrice * (1 - pct / 100)
            label = `-${pct}%`
          }
          discountPct = pct
        }
      }
    }

    // ── Descuento absoluto en Effects (menos común) ─────────────
    if (!label) {
      const amtParam = effParams.find(p => p['<Name>k__BackingField'] === 'AbsoluteDiscount')
      if (amtParam) {
        const amt = parseFloat(amtParam['<Value>k__BackingField'])
        if (amt > 0 && amt < unitPrice) {
          effectivePrice = unitPrice - amt
          discountPct = Math.round((amt / unitPrice) * 100)
          label = `-${discountPct}%`
        }
      }
    }

    if (label && discountPct >= 3 && discountPct <= 70) {
      if (!best || discountPct > best.discountPct) best = { label, effectivePrice, discountPct }
    }
  }

  return best ? { label: best.label, effectivePrice: best.effectivePrice } : null
}

// ── Tipos de producto VTEX ──────────────────────────────────────────────────

type VtexProduct = {
  productName: string
  brand: string
  link: string
  items: {
    images: { imageUrl: string }[]
    sellers: {
      commertialOffer: {
        Price: number
        ListPrice: number
        AvailableQuantity: number
        Teasers?: VtexTeaser[]
      }
    }[]
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
      // Buscar la combinación item+seller con el precio más bajo
      // (productos VTEX pueden tener varios items/variantes y sellers/vendedores)
      let bestItem: VtexProduct['items'][0] | null = null
      let bestOffer: VtexProduct['items'][0]['sellers'][0]['commertialOffer'] | null = null
      let lowestPrice = Infinity

      for (const item of p.items ?? []) {
        for (const seller of item.sellers ?? []) {
          const o = seller.commertialOffer
          if (!o || o.AvailableQuantity <= 0 || !o.Price) continue

          // Calcular precio efectivo (con promo teaser si hay)
          const promoHere = parseBestPromo(o.Teasers ?? [], o.Price)
          const effective = promoHere ? promoHere.effectivePrice : o.Price

          if (effective < lowestPrice) {
            lowestPrice = effective
            bestItem = item
            bestOffer = o
          }
        }
      }

      if (!bestItem || !bestOffer) return []
      const item = bestItem
      const offer = bestOffer

      const productUrl = p.link?.startsWith('http')
        ? p.link
        : `https://${store.domain}${p.link ?? ''}`
      const image = item.images?.[0]?.imageUrl?.replace('http://', 'https://') ?? null

      // Detectar promo en Teasers del mejor seller
      const promo = parseBestPromo(offer.Teasers ?? [], offer.Price)

      // Detectar descuento tradicional (ListPrice vs Price)
      // Validación de cordura: si el ratio Price/ListPrice es menor a 0.30
      // (descuento > 70%), el ListPrice es fake. Muchas tiendas cargan un
      // ListPrice absurdo solo para mostrar un "precio tachado" marketinero.
      const listDiscount = offer.ListPrice && offer.ListPrice > offer.Price
        ? offer.Price / offer.ListPrice
        : 1
      const hasListDiscount = listDiscount < 1 && listDiscount >= 0.30

      return [{
        id: `vtex-${store.name}-${p.link}`,
        name: p.productName,
        brand: p.brand ?? null,
        ean: null,
        store_name: store.name,
        store_logo: `https://${store.domain}/favicon.ico`,
        price: promo ? promo.effectivePrice : offer.Price,
        price_per_unit: null,
        unit: null,
        url: productUrl,
        in_stock: true,
        source: 'vtex' as const,
        image,
        promo_label: promo
          ? promo.label
          : hasListDiscount
            ? `-${Math.round((1 - offer.Price / offer.ListPrice) * 100)}%`
            : null,
        original_price: promo
          ? offer.Price
          : hasListDiscount
            ? offer.ListPrice
            : null,
        // Los teasers (2x1, 4x3, 2do al X%, % OFF real) son promos confiables.
        // Los ListPrice pueden ser falsos → no marcar como real
        is_real_promo: !!promo,
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
