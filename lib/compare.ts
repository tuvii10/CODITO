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
 * Usa similitud Jaccard con umbral 0.55.
 */
function groupSimilarProducts(results: SearchResult[]): SearchResult[][] {
  const groups: { items: SearchResult[]; tokens: Set<string> }[] = []

  for (const r of results) {
    const tokens = new Set(tokenize(r.name))
    if (tokens.size === 0) {
      groups.push({ items: [r], tokens })
      continue
    }

    let placed = false
    for (const g of groups) {
      if (similarity(tokens, g.tokens) >= 0.55) {
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
        const isRealTeaser = r.promo_label && !/^-\d+%$/.test(r.promo_label)
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

      const isRealTeaser = r.promo_label && !/^-\d+%$/.test(r.promo_label)

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
