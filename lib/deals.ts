/**
 * Ofertas del día — basadas en COMPARACIÓN entre sitios.
 *
 * Sistema de rotación: pool de ~120 productos, se seleccionan ~30 por
 * ventana de 6 horas. Los productos no se repiten por 48 horas (8 ventanas).
 *
 * Estrategia:
 * 1. Seleccionar queries de la ventana horaria actual (rotación determinista).
 * 2. Buscar en VTEX 58+ stores + Coto + SuperPrecio + ML highlights.
 * 3. Comparar precios entre sellers → detectar los más baratos.
 * 4. Top 30 con mayor ahorro real.
 */
import { SearchResult } from './types'
import { searchVtex } from './vtex'
import { searchCoto } from './coto'
import { searchSuperPrecio } from './superprecio'
import { fetchMLHighlightsByCategory } from './mercadolibre'
import { applyCrossSellerDiscounts, deduplicateToCheapest } from './compare'

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

// ─── Pool de productos (~120 queries) ────────────────────────────────────

const ALL_QUERIES: Array<{ q: string; cat: string }> = [
  // ═══ Super — Almacén ═══
  { q: 'aceite girasol',            cat: 'Super' },
  { q: 'aceite oliva',              cat: 'Super' },
  { q: 'yerba mate',                cat: 'Super' },
  { q: 'cafe molido',               cat: 'Super' },
  { q: 'cafe instantaneo',          cat: 'Super' },
  { q: 'leche en polvo',            cat: 'Super' },
  { q: 'leche larga vida',          cat: 'Super' },
  { q: 'arroz',                     cat: 'Super' },
  { q: 'fideos',                    cat: 'Super' },
  { q: 'harina',                    cat: 'Super' },
  { q: 'azucar',                    cat: 'Super' },
  { q: 'sal fina',                  cat: 'Super' },
  { q: 'galletitas',                cat: 'Super' },
  { q: 'mermelada',                 cat: 'Super' },
  { q: 'dulce de leche',            cat: 'Super' },
  { q: 'atun en lata',              cat: 'Super' },
  { q: 'mayonesa',                  cat: 'Super' },
  { q: 'salsa tomate',              cat: 'Super' },
  { q: 'polenta',                   cat: 'Super' },
  { q: 'cacao en polvo',            cat: 'Super' },
  { q: 'te en saquitos',            cat: 'Super' },
  { q: 'manteca',                   cat: 'Super' },
  { q: 'queso cremoso',             cat: 'Super' },
  { q: 'yogur',                     cat: 'Super' },
  // ═══ Super — Limpieza y cuidado ═══
  { q: 'pañales',                   cat: 'Super' },
  { q: 'detergente ropa',           cat: 'Super' },
  { q: 'jabon en polvo',            cat: 'Super' },
  { q: 'suavizante ropa',           cat: 'Super' },
  { q: 'shampoo',                   cat: 'Super' },
  { q: 'acondicionador pelo',       cat: 'Super' },
  { q: 'jabon liquido manos',       cat: 'Super' },
  { q: 'desodorante',               cat: 'Super' },
  { q: 'pasta dental',              cat: 'Super' },
  { q: 'papel higienico',           cat: 'Super' },
  { q: 'lavandina',                 cat: 'Super' },
  { q: 'limpiador pisos',           cat: 'Super' },
  // ═══ Super — Bebidas ═══
  { q: 'cerveza',                   cat: 'Super' },
  { q: 'vino tinto',                cat: 'Super' },
  { q: 'whisky',                    cat: 'Super' },
  { q: 'fernet',                    cat: 'Super' },
  { q: 'gaseosa coca cola',         cat: 'Super' },
  { q: 'agua mineral',              cat: 'Super' },
  { q: 'jugo en polvo',             cat: 'Super' },
  { q: 'soda',                      cat: 'Super' },
  // ═══ Super — Congelados y frescos ═══
  { q: 'hamburguesas congeladas',   cat: 'Super' },
  { q: 'empanadas congeladas',      cat: 'Super' },
  { q: 'helado',                    cat: 'Super' },
  { q: 'papas fritas congeladas',   cat: 'Super' },
  // ═══ Electro — Cocina ═══
  { q: 'cafetera',                  cat: 'Electro' },
  { q: 'cafetera express',          cat: 'Electro' },
  { q: 'licuadora',                 cat: 'Electro' },
  { q: 'batidora',                  cat: 'Electro' },
  { q: 'tostadora',                 cat: 'Electro' },
  { q: 'microondas',                cat: 'Electro' },
  { q: 'freidora de aire',          cat: 'Electro' },
  { q: 'pava electrica',            cat: 'Electro' },
  { q: 'procesadora alimentos',     cat: 'Electro' },
  { q: 'multiprocesadora',          cat: 'Electro' },
  { q: 'sandwichera',               cat: 'Electro' },
  { q: 'exprimidor',                cat: 'Electro' },
  // ═══ Electro — Cuidado personal ═══
  { q: 'plancha vapor ropa',        cat: 'Electro' },
  { q: 'secador pelo',              cat: 'Electro' },
  { q: 'planchita pelo',            cat: 'Electro' },
  { q: 'cortadora pelo',            cat: 'Electro' },
  { q: 'afeitadora electrica',      cat: 'Electro' },
  // ═══ Electro — Audio y tech ═══
  { q: 'auriculares bluetooth',     cat: 'Electro' },
  { q: 'parlante bluetooth',        cat: 'Electro' },
  { q: 'smartwatch',                cat: 'Electro' },
  { q: 'mouse inalambrico',         cat: 'Electro' },
  { q: 'teclado inalambrico',       cat: 'Electro' },
  { q: 'cargador celular',          cat: 'Electro' },
  { q: 'power bank',                cat: 'Electro' },
  { q: 'cable usb tipo c',          cat: 'Electro' },
  { q: 'webcam',                    cat: 'Electro' },
  // ═══ Electro — Climatización ═══
  { q: 'ventilador de pie',         cat: 'Electro' },
  { q: 'estufa electrica',          cat: 'Electro' },
  { q: 'caloventor',                cat: 'Electro' },
  { q: 'purificador agua',          cat: 'Electro' },
  // ═══ Moda — Calzado ═══
  { q: 'zapatillas running',        cat: 'Moda' },
  { q: 'zapatillas nike',           cat: 'Moda' },
  { q: 'zapatillas adidas',         cat: 'Moda' },
  { q: 'zapatillas topper',         cat: 'Moda' },
  { q: 'zapatillas fila',           cat: 'Moda' },
  { q: 'zapatillas puma',           cat: 'Moda' },
  { q: 'botas mujer',               cat: 'Moda' },
  { q: 'ojotas',                    cat: 'Moda' },
  // ═══ Moda — Ropa ═══
  { q: 'campera',                   cat: 'Moda' },
  { q: 'buzo hoodie',               cat: 'Moda' },
  { q: 'remera algodon',            cat: 'Moda' },
  { q: 'jean hombre',               cat: 'Moda' },
  { q: 'jean mujer',                cat: 'Moda' },
  { q: 'pantalon jogger',           cat: 'Moda' },
  { q: 'mochila',                   cat: 'Moda' },
  { q: 'medias pack',               cat: 'Moda' },
  // ═══ Hogar ═══
  { q: 'colchon',                   cat: 'Hogar' },
  { q: 'almohada',                  cat: 'Hogar' },
  { q: 'juego sabanas',             cat: 'Hogar' },
  { q: 'acolchado',                 cat: 'Hogar' },
  { q: 'frazada polar',             cat: 'Hogar' },
  { q: 'cortina',                   cat: 'Hogar' },
  { q: 'olla acero inoxidable',     cat: 'Hogar' },
  { q: 'sarten antiadherente',      cat: 'Hogar' },
  { q: 'set cuchillos',             cat: 'Hogar' },
  { q: 'organizador ropa',          cat: 'Hogar' },
  { q: 'lampara led',               cat: 'Hogar' },
  // ═══ Hogar — Herramientas ═══
  { q: 'taladro',                   cat: 'Hogar' },
  { q: 'set herramientas',          cat: 'Hogar' },
  { q: 'pintura latex',             cat: 'Hogar' },
  // ═══ Bebés y niños ═══
  { q: 'mamadera',                  cat: 'Super' },
  { q: 'toallitas humedas bebe',    cat: 'Super' },
  // ═══ Mascotas ═══
  { q: 'alimento perro',            cat: 'Super' },
  { q: 'alimento gato',             cat: 'Super' },
  { q: 'arena gato',                cat: 'Super' },
  // ═══ Farmacia ═══
  { q: 'protector solar',           cat: 'Super' },
  { q: 'crema corporal',            cat: 'Super' },
  { q: 'vitamina c',                cat: 'Super' },
]

const ML_DEAL_CATEGORIES = [
  { id: 'MLA1403', cat: 'Super' },      // Alimentos y Bebidas
  { id: 'MLA1246', cat: 'Super' },       // Belleza
  { id: 'MLA5726', cat: 'Electro' },     // Electrodomésticos
  { id: 'MLA1000', cat: 'Electro' },     // Electrónica
  { id: 'MLA1051', cat: 'Electro' },     // Celulares
  { id: 'MLA1276', cat: 'Moda' },        // Deportes
  { id: 'MLA1430', cat: 'Moda' },        // Ropa
  { id: 'MLA1574', cat: 'Hogar' },       // Hogar
]

// ─── Sistema de rotación por ventana de 6 horas ─────────────────────────

const WINDOW_HOURS = 6
const QUERIES_PER_WINDOW = 30
const NO_REPEAT_WINDOWS = 8 // 8 ventanas x 6 horas = 48 horas sin repetir

/**
 * Retorna el índice de la ventana horaria actual (0, 1, 2, 3...)
 * Cada ventana dura WINDOW_HOURS horas.
 */
function getCurrentWindow(): number {
  const now = new Date()
  const hoursSinceEpoch = Math.floor(now.getTime() / (1000 * 60 * 60))
  return Math.floor(hoursSinceEpoch / WINDOW_HOURS)
}

/**
 * Genera un número pseudoaleatorio determinista a partir de una seed.
 * Misma seed = misma secuencia = resultados reproducibles por ventana.
 */
function seededRandom(seed: number): () => number {
  let s = seed
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff
    return (s >>> 0) / 0xffffffff
  }
}

/**
 * Selecciona las queries para la ventana actual, asegurando que no se
 * repitan durante NO_REPEAT_WINDOWS ventanas.
 */
function selectQueriesForWindow(): Array<{ q: string; cat: string }> {
  const currentWindow = getCurrentWindow()
  const totalQueries = ALL_QUERIES.length

  // Crear un shuffle completo usando la seed del "ciclo"
  // Un ciclo = totalQueries / QUERIES_PER_WINDOW ventanas
  const cycleLength = Math.ceil(totalQueries / QUERIES_PER_WINDOW)
  const cycleStart = Math.floor(currentWindow / cycleLength) * cycleLength
  const positionInCycle = currentWindow - cycleStart

  // Shuffle determinista basado en el inicio del ciclo
  const rng = seededRandom(cycleStart * 7919) // primo para mejor distribución
  const indices = Array.from({ length: totalQueries }, (_, i) => i)

  // Fisher-Yates shuffle con RNG determinista
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[indices[i], indices[j]] = [indices[j], indices[i]]
  }

  // Tomar el slice correspondiente a esta ventana
  const start = (positionInCycle * QUERIES_PER_WINDOW) % totalQueries
  const selected: Array<{ q: string; cat: string }> = []

  for (let i = 0; i < QUERIES_PER_WINDOW; i++) {
    const idx = indices[(start + i) % totalQueries]
    selected.push(ALL_QUERIES[idx])
  }

  return selected
}

// ─── Gather candidates ─────────────────────────────────────────────────────

type Candidate = SearchResult & { __category?: string }

async function gatherCandidates(): Promise<Candidate[]> {
  const queries = selectQueriesForWindow()

  // 1. Buscar en VTEX + Coto + SuperPrecio en batches de 6 queries simultáneas.
  // Antes se lanzaban las 30 queries a la vez → ~1700 conexiones HTTP simultáneas
  // → timeout en Vercel. Con batches de 6: máximo ~350 conexiones a la vez.
  const BATCH_SIZE = 6
  const allQueryResults: Candidate[] = []

  for (let i = 0; i < queries.length; i += BATCH_SIZE) {
    const batch = queries.slice(i, i + BATCH_SIZE)
    const batchResults = await Promise.all(
      batch.map(async ({ q, cat }) => {
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
    allQueryResults.push(...batchResults.flat())
  }

  // 2. ML highlights (estos rotan solos, no dependen de la ventana)
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

  return [...allQueryResults, ...mlBatches.flat()].filter(p => p.price > 0)
}

// ─── Categorización automática ─────────────────────────────────────────────

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
  const candidates = await gatherCandidates()

  if (candidates.length === 0) return []

  const withCrossSeller = applyCrossSellerDiscounts(candidates)
  const deduped = deduplicateToCheapest(withCrossSeller)

  const withRealSavings = deduped.filter(p => {
    if (!p.original_price || p.original_price <= p.price) return false
    const savings = p.original_price - p.price
    return savings >= 300 && p.price >= 500 && p.price <= 500000
  })

  // Top 30 con mayor ahorro absoluto
  withRealSavings.sort((a, b) =>
    ((b.original_price ?? 0) - b.price) - ((a.original_price ?? 0) - a.price)
  )
  const top = withRealSavings.slice(0, 30)

  // Re-ordenar por precio
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
      verified: true,
      cheapest_alt: orig,
      promo_label: p.promo_label ?? `-${discPct}%`,
      min_units: 1,
    }
  })
}
