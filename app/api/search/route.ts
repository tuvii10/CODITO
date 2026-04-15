import { NextRequest, NextResponse } from 'next/server'
import { searchMercadoLibre } from '@/lib/mercadolibre'
import { searchVtex } from '@/lib/vtex'
import { searchCoto } from '@/lib/coto'
import { searchWeb } from '@/lib/web-search'
import { SearchResult } from '@/lib/types'

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get('q')?.trim()

  if (!query || query.length < 2) {
    return NextResponse.json({ error: 'Búsqueda muy corta' }, { status: 400 })
  }
  if (query.length > 100) {
    return NextResponse.json({ error: 'Búsqueda demasiado larga' }, { status: 400 })
  }

  // Todas las fuentes en paralelo
  const [mlRes, vtexRes, cotoRes, webRes] = await Promise.allSettled([
    searchMercadoLibre(query, 20),
    searchVtex(query),
    searchCoto(query),
    searchWeb(query),
  ])

  const ml    = mlRes.status    === 'fulfilled' ? mlRes.value    : []
  const vtex  = vtexRes.status  === 'fulfilled' ? vtexRes.value  : []
  const coto  = cotoRes.status  === 'fulfilled' ? cotoRes.value  : []
  const web   = webRes.status   === 'fulfilled' ? webRes.value   : []

  // Deduplicar web contra resultados directos
  const directUrls = new Set([...ml, ...vtex, ...coto].map(r => r.url))
  const webFiltered = web.filter(r => !r.url || !directUrls.has(r.url))

  // Juntar resultados con precio
  const allWithPrice    = [...ml, ...vtex, ...coto, ...webFiltered.filter(r => r.price > 0)]
  const allWithoutPrice = webFiltered.filter(r => r.price === 0)

  // Filtrar por relevancia: al menos 1 token del query debe estar en el nombre
  const queryTokens = tokenize(query)
  const relevant = queryTokens.length === 0
    ? allWithPrice
    : allWithPrice.filter(r => relevanceScore(r.name, queryTokens) >= 0.2)

  // Deduplicar por nombre normalizado: si dos resultados de distintas fuentes
  // tienen el mismo nombre, quedarse con el de menor precio
  const deduped = deduplicateByName(relevant)

  deduped.sort((a, b) => a.price - b.price)

  const results = [...deduped, ...allWithoutPrice]

  return NextResponse.json({
    results,
    total: results.length,
    query,
    sources: {
      mercadolibre: ml.length,
      tiendas: vtex.length + coto.length,
      web: webFiltered.length,
    },
  })
}

// ─── Relevancia ───────────────────────────────────────────────────────────────

const STOP_WORDS = new Set([
  'de','del','la','el','los','las','y','con','sin','para','en','por',
  'un','una','x','ml','cc','gr','kg','lt','lts',
])

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 1 && !STOP_WORDS.has(w))
}

function relevanceScore(name: string, queryTokens: string[]): number {
  const nameTokens = tokenize(name)
  if (nameTokens.length === 0) return 0
  const matches = queryTokens.filter(qt =>
    nameTokens.some(nt => nt.includes(qt) || qt.includes(nt))
  )
  return matches.length / queryTokens.length
}

// ─── Dedup por nombre normalizado ─────────────────────────────────────────────

function normalizeName(name: string): string {
  return tokenize(name).slice(0, 5).join(' ')
}

function deduplicateByName(results: SearchResult[]): SearchResult[] {
  // Para cada nombre normalizado, guardar el de menor precio
  // pero mantener todos si son de distinta tienda (comparar precios es el punto)
  const byStoreAndName = new Map<string, SearchResult>()
  for (const r of results) {
    const key = `${r.store_name}::${normalizeName(r.name)}`
    const existing = byStoreAndName.get(key)
    if (!existing || r.price < existing.price) {
      byStoreAndName.set(key, r)
    }
  }
  return Array.from(byStoreAndName.values())
}
