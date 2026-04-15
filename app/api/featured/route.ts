import { NextResponse } from 'next/server'
import { searchVtex } from '@/lib/vtex'
import { searchMercadoLibre } from '@/lib/mercadolibre'
import { SearchResult } from '@/lib/types'

// 1 hora de cache — se renueva cada hora
export const revalidate = 3600

type Category = {
  key: string
  label: string
  emoji: string
  query: string
}

const CATEGORIES: Category[] = [
  { key: 'gaseosa',  label: 'Gaseosas',    emoji: '🥤', query: 'gaseosa' },
  { key: 'leche',    label: 'Lácteos',     emoji: '🥛', query: 'leche' },
  { key: 'yerba',    label: 'Yerba',       emoji: '🧉', query: 'yerba mate' },
  { key: 'aceite',   label: 'Aceites',     emoji: '🫒', query: 'aceite' },
  { key: 'fideos',   label: 'Pastas',      emoji: '🍝', query: 'fideos' },
  { key: 'arroz',    label: 'Arroz',       emoji: '🍚', query: 'arroz' },
  { key: 'cafe',     label: 'Café',        emoji: '☕', query: 'cafe molido' },
  { key: 'limpieza', label: 'Limpieza',    emoji: '🧼', query: 'detergente' },
]

async function searchCategory(query: string): Promise<SearchResult[]> {
  const [vtexRes, mlRes] = await Promise.allSettled([
    searchVtex(query),
    searchMercadoLibre(query, 8),
  ])

  const vtex = vtexRes.status === 'fulfilled' ? vtexRes.value : []
  const ml   = mlRes.status   === 'fulfilled' ? mlRes.value   : []

  // Deduplicar por URL
  const seen = new Set<string>()
  const combined: SearchResult[] = []
  for (const r of [...vtex, ...ml]) {
    if (!r.url || seen.has(r.url)) continue
    seen.add(r.url)
    combined.push(r)
  }

  // Ordenar por precio de menor a mayor, máximo 12 por categoría
  return combined
    .filter(r => r.price > 0)
    .sort((a, b) => a.price - b.price)
    .slice(0, 12)
}

export async function GET() {
  try {
    const results = await Promise.allSettled(
      CATEGORIES.map(c => searchCategory(c.query))
    )

    const categories = CATEGORIES.map((c, i) => ({
      key: c.key,
      label: c.label,
      emoji: c.emoji,
      products: results[i].status === 'fulfilled'
        ? (results[i] as PromiseFulfilledResult<SearchResult[]>).value
        : [],
    }))

    return NextResponse.json({
      categories,
      updated_at: new Date().toISOString(),
    })
  } catch {
    return NextResponse.json({ categories: [], updated_at: null }, { status: 500 })
  }
}
