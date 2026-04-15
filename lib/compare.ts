/**
 * Comparador de sellers: agrupa productos similares entre tiendas y calcula
 * descuentos REALES comparando el precio contra la mediana de las otras tiendas.
 *
 * Reemplaza los descuentos falsos basados en ListPrice inflado.
 */
import { SearchResult } from './types'

const STOP_WORDS = new Set([
  'de', 'del', 'la', 'el', 'los', 'las', 'y', 'con', 'sin', 'para', 'en', 'por',
  'un', 'una', 'x', 'ml', 'cc', 'gr', 'kg', 'lt', 'lts', 'litro', 'litros',
  'pack', 'caja', 'botella', 'bolsa', 'unidad', 'unidades', 'und',
])

function tokenize(name: string): string[] {
  return name
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    // unir decimales: "2.25l" → "225l", "1,5 lt" → "15 lt"
    .replace(/(\d)[.,](\d)/g, '$1$2')
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 1 && !STOP_WORDS.has(w))
}

function similarity(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0
  let common = 0
  for (const t of a) if (b.has(t)) common++
  return common / Math.max(a.size, b.size)
}

/**
 * Agrupa productos similares por nombre tokenizado.
 * @param threshold — umbral de similitud Jaccard (default 0.45)
 */
function groupSimilarProducts(results: SearchResult[], threshold = 0.45): SearchResult[][] {
  const groups: { items: SearchResult[]; tokens: Set<string> }[] = []

  for (const r of results) {
    const tokens = new Set(tokenize(r.name))
    if (tokens.size === 0) {
      groups.push({ items: [r], tokens })
      continue
    }

    let placed = false
    for (const g of groups) {
      if (similarity(tokens, g.tokens) >= threshold) {
        g.items.push(r)
        // Achicar el set a la intersección para que el grupo no "crezca"
        // incluyendo productos cada vez más distintos
        for (const t of g.tokens) {
          if (!tokens.has(t)) g.tokens.delete(t)
        }
        placed = true
        break
      }
    }
    if (!placed) groups.push({ items: [r], tokens })
  }

  return groups.map(g => g.items)
}

/**
 * Calcula la mediana de un array de números.
 */
function median(nums: number[]): number {
  if (nums.length === 0) return 0
  const sorted = [...nums].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid]
}

/**
 * Para cada producto, calcula el descuento REAL comparando su precio contra
 * la mediana de los precios del MISMO producto en otras tiendas del grupo.
 *
 * - Mantiene promo_label existente si ya viene de un teaser legítimo (2x1, 4x3, etc.)
 * - Solo sobrescribe los descuentos cuando hay 2+ sellers del mismo producto
 * - Si hay un seller solo (no podemos comparar), limpia el promo_label fake
 */
export function applyCrossSellerDiscounts(results: SearchResult[]): SearchResult[] {
  const groups = groupSimilarProducts(results)
  const output: SearchResult[] = []

  for (const group of groups) {
    if (group.length < 2) {
      // Grupo de 1: no hay con quien comparar.
      // Si el promo_label viene de un teaser real (no termina en "%" solo),
      // lo mantenemos. Los "-X%" planos los tiramos porque son ListPrice fake.
      for (const r of group) {
        const isRealTeaser = r.is_real_promo === true
        output.push({
          ...r,
          promo_label: isRealTeaser ? r.promo_label : null,
          original_price: isRealTeaser ? r.original_price : null,
        })
      }
      continue
    }

    // Hay 2+ sellers del mismo producto → comparar
    for (const r of group) {
      // Precio de referencia = mediana de los OTROS sellers del grupo
      const otherPrices = group.filter(g => g !== r).map(g => g.price)
      const refPrice = median(otherPrices)

      const isRealTeaser = r.is_real_promo === true

      // Si el producto tiene un teaser real (2x1, 4x3), lo conservamos
      if (isRealTeaser) {
        output.push(r)
        continue
      }

      // Calcular descuento vs mediana de otras tiendas
      if (refPrice > 0 && r.price < refPrice) {
        const discPct = Math.round((1 - r.price / refPrice) * 100)
        if (discPct >= 5) {
          output.push({
            ...r,
            promo_label: `-${discPct}%`,
            original_price: Math.round(refPrice),
          })
          continue
        }
      }

      // Sin descuento real: limpiar cualquier promo_label fake
      output.push({
        ...r,
        promo_label: null,
        original_price: null,
      })
    }
  }

  return output
}

/**
 * Deduplica productos similares y deja solo el más barato POR FUENTE de cada grupo.
 * Así, si Coca 2.25L está en 5 tiendas VTEX y 3 vendedores de ML,
 * queda el más barato de VTEX + el más barato de ML (2 productos en total).
 * Esto preserva la variedad entre fuentes en vez de colapsar todo a una.
 */
export function deduplicateToCheapest(results: SearchResult[]): SearchResult[] {
  const groups = groupSimilarProducts(results, 0.60)
  const output: SearchResult[] = []

  for (const group of groups) {
    // Por cada grupo, quedarse con el más barato de cada fuente
    const bySource = new Map<string, SearchResult>()
    for (const r of group) {
      const existing = bySource.get(r.source)
      if (!existing || r.price < existing.price) {
        bySource.set(r.source, r)
      }
    }
    for (const r of bySource.values()) output.push(r)
  }

  return output
}
