/**
 * Ofertas del día — basadas en COMPARACIÓN entre sitios.
 *
 * Un producto es una oferta porque está MÁS BARATO que en otros lugares,
 * no porque tenga un cartel de "-X%".
 *
 * Estrategia:
 * 1. Recolectar un pool grande de productos buscando en TODAS las tiendas
 *    (VTEX 58+ + Coto + Mercado Libre highlights).
 * 2. Enriquecer con comparaciones externas (scrape de La Anónima, DIA)
 *    para tiendas que no tienen API.
 * 3. Agrupar productos similares y comparar precios entre sellers.
 * 4. Solo quedan los que son el más barato del grupo (o muy cerca del mínimo).
 * 5. Ordenar por ahorro absoluto en pesos.
 * 6. Top 30.
 */
import { SearchResult } from './types'
import { searchVtex } from './vtex'
import { searchCoto } from './coto'
import { searchSuperPrecio } from './superprecio'
import { fetchMLHighlightsByCategory } from './mercadolibre'
import { applyCrossSellerDiscounts, deduplicateToCheapest } from './compare'

// ─── Tipos ─────────────────────────────────────────────────────────────────

export type Deal = SearchResult & {
  original_price: number       // precio más alto entre competidores (referencia)
  discount_pct: number          // % ahorro vs la competencia
  category: string
  verified: boolean
  cheapest_alt: number | null
  promo_label: string | null
  min_units: number
}

// ─── Queries y categorías ─────────────────────────────────────────────────

const DEAL_QUERIES: Array<{ q: string; cat: string }> = [
  // Super
  { q: 'aceite',                 cat: 'Super' },
  { q: 'yerba mate',             cat: 'Super' },
  { q: 'cafe molido',            cat: 'Super' },
  { q: 'leche en polvo',         cat: 'Super' },
  { q: 'pañales',                cat: 'Super' },
  { q: 'detergente ropa',        cat: 'Super' },
  { q: 'shampoo',                cat: 'Super' },
  { q: 'whisky',                 cat: 'Super' },
  // Electro accesible
  { q: 'cafetera',               cat: 'Electro' },
  { q: 'licuadora',              cat: 'Electro' },
  { q: 'plancha vapor',          cat: 'Electro' },
  { q: 'microondas',             cat: 'Electro' },
  { q: 'auriculares bluetooth',  cat: 'Electro' },
  { q: 'parlante bluetooth',     cat: 'Electro' },
  { q: 'tostadora',              cat: 'Electro' },
  { q: 'secador pelo',           cat: 'Electro' },
  { q: 'batidora',               cat: 'Electro' },
  { q: 'smartwatch',             cat: 'Electro' },
  // Moda
  { q: 'zapatillas running',     cat: 'Moda' },
  { q: 'zapatillas nike',        cat: 'Moda' },
  { q: 'zapatillas adidas',      cat: 'Moda' },
  { q: 'zapatillas topper',      cat: 'Moda' },
  { q: 'campera',                cat: 'Moda' },
  { q: 'buzo',                   cat: 'Moda' },
  // Hogar
  { q: 'colchon',                cat: 'Hogar' },
  { q: 'taladro',                cat: 'Hogar' },
  { q: 'juego sabanas',          cat: 'Hogar' },
  { q: 'olla',                   cat: 'Hogar' },
]

const ML_DEAL_CATEGORIES = [
  { id: 'MLA1403', cat: 'Super' },      // Alimentos y Bebidas
  { id: 'MLA1246', cat: 'Super' },      // Belleza
  { id: 'MLA5726', cat: 'Electro' },    // Electrodomésticos
  { id: 'MLA1000', cat: 'Electro' },    // Electrónica
  { id: 'MLA1051', cat: 'Electro' },    // Celulares
  { id: 'MLA1276', cat: 'Moda' },       // Deportes
  { id: 'MLA1430', cat: 'Moda' },       // Ropa
  { id: 'MLA1574', cat: 'Hogar' },      // Hogar
]

// ─── Gather candidates ─────────────────────────────────────────────────────

type Candidate = SearchResult & { __category?: string }

async function gatherCandidates(): Promise<Candidate[]> {
  // 1. Buscar cada query en VTEX + Coto + SuperPrecio en paralelo.
  // SuperPrecio aporta cobertura extra: DIA, Cordiez, y confirma precios
  // contra los VTEX que nosotros ya cubrimos.
  const queryBatches = await Promise.all(
    DEAL_QUERIES.map(async ({ q, cat }) => {
      const [vtex, coto, sp] = await Promise.allSettled([
        searchVtex(q),
        searchCoto(q),
        searchSuperPrecio(q, 25),
      ])
      const vtexRes = vtex.status === 'fulfilled' ? vtex.value : []
      const cotoRes = coto.status === 'fulfilled' ? coto.value : []
      const spRes = sp.status === 'fulfilled' ? sp.value : []
      return [...vtexRes, ...cotoRes, ...spRes].map(r => ({ ...r, __category: cat }))
    })
  )

  // 2. Mercado Libre por categoría (usa OAuth highlights)
  const mlBatches = await Promise.all(
    ML_DEAL_CATEGORIES.map(async ({ id, cat }) => {
      try {
        const products = await fetchMLHighlightsByCategory(id, 15)
        return products.map(p => ({ ...p, __category: cat }))
      } catch {
        return []
      }
    })
  )

  return [...queryBatches.flat(), ...mlBatches.flat()].filter(p => p.price > 0)
}

// ─── Categorización automática ─────────────────────────────────────────────

/** Intenta inferir categoría por nombre cuando no viene del query */
function inferCategory(name: string, hint?: string): string {
  if (hint) return hint
  const n = name.toLowerCase()
  if (/televisor|smart tv|tv\b/.test(n)) return 'TV'
  if (/celular|smartphone|galaxy|iphone/.test(n)) return 'Celulares'
  if (/notebook|laptop/.test(n)) return 'Electro'
  if (/heladera|lavarropa|microondas|cafetera|licuadora|plancha|tostadora|secador/.test(n)) return 'Electro'
  if (/zapatilla|remera|pantalon|jean|campera|buzo/.test(n)) return 'Moda'
  if (/colchon|sommier|sillon|taladro|olla|sabana/.test(n)) return 'Hogar'
  if (/aceite|yerba|cafe|leche|pañales|detergente|shampoo|whisky/.test(n)) return 'Super'
  return 'Otros'
}

// ─── Entrypoint ────────────────────────────────────────────────────────────

export async function fetchAllDeals(): Promise<Deal[]> {
  // Paso 1: juntar un pool grande de productos
  const candidates = await gatherCandidates()

  if (candidates.length === 0) return []

  // Paso 2: comparar entre sellers → esto calcula el descuento real
  // (cada producto se compara con sus similares en otras tiendas)
  const withCrossSeller = applyCrossSellerDiscounts(candidates)

  // Paso 3: dedupe a "cheapest por fuente" — evita mostrar el mismo producto 10 veces
  const deduped = deduplicateToCheapest(withCrossSeller)

  // Paso 4: filtrar solo los que tienen ahorro demostrable
  // (la comparación cross-seller les puso original_price cuando son más baratos)
  const withRealSavings = deduped.filter(p => {
    if (!p.original_price || p.original_price <= p.price) return false
    const savings = p.original_price - p.price
    // Umbrales mínimos: $300 ahorro o precio entre $500 y $500k
    return savings >= 300 && p.price >= 500 && p.price <= 500000
  })

  // Paso 5: tomar los 30 con mayor ahorro absoluto primero (para que
  // el top sea de los que más valor ofrecen)
  withRealSavings.sort((a, b) =>
    ((b.original_price ?? 0) - b.price) - ((a.original_price ?? 0) - a.price)
  )
  const top = withRealSavings.slice(0, 30)

  // Paso 6: re-ordenar el top por precio de menor a mayor (como pide el usuario)
  top.sort((a, b) => a.price - b.price)

  return top.map((p): Deal => {
    const orig = p.original_price ?? p.price
    const discPct = Math.round((1 - p.price / orig) * 100)
    const category = inferCategory(p.name, (p as Candidate).__category)
    return {
      ...p,
      original_price: orig,
      discount_pct: discPct,
      category,
      verified: true, // verificado porque se comparó contra múltiples sellers
      cheapest_alt: orig,
      promo_label: p.promo_label ?? `-${discPct}%`,
      min_units: 1,
    }
  })
}
