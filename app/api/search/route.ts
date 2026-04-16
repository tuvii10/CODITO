import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { searchVtex } from '@/lib/vtex'
import { searchCoto } from '@/lib/coto'
import { searchSuperPrecio } from '@/lib/superprecio'
import { searchWeb } from '@/lib/web-search'
import { applyCrossSellerDiscounts } from '@/lib/compare'
import { SearchResult } from '@/lib/types'

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get('q')?.trim()

  if (!query || query.length < 2) {
    return NextResponse.json({ error: 'Búsqueda muy corta' }, { status: 400 })
  }
  if (query.length > 100) {
    return NextResponse.json({ error: 'Búsqueda demasiado larga' }, { status: 400 })
  }

  // Fuentes en paralelo. ML no se incluye en búsqueda libre: su API search
  // está deprecada (ver /api/featured para best sellers por categoría).
  // SuperPrecio agrega cobertura de tiendas sin API propia (DIA, Cordiez, etc).
  const [vtexRes, cotoRes, spRes, webRes] = await Promise.allSettled([
    searchVtex(query),
    searchCoto(query),
    searchSuperPrecio(query, 30),
    searchWeb(query),
  ])

  const vtex = vtexRes.status === 'fulfilled' ? vtexRes.value : []
  const coto = cotoRes.status === 'fulfilled' ? cotoRes.value : []
  const sp   = spRes.status   === 'fulfilled' ? spRes.value   : []
  const web  = webRes.status  === 'fulfilled' ? webRes.value  : []

  // Deduplicar web + superprecio contra resultados directos
  const directUrls = new Set([...vtex, ...coto].map(r => r.url).filter(Boolean))
  const spFiltered = sp.filter(r => !r.url || !directUrls.has(r.url))
  const webFiltered = web.filter(r => !r.url || !directUrls.has(r.url))

  // Juntar todo (con precio primero, sin precio al final)
  // Filtrar price > 0 en todas las fuentes para evitar $0 falsos
  const rawWithPrice = [
    ...vtex.filter(r => r.price > 0),
    ...coto.filter(r => r.price > 0),
    ...spFiltered.filter(r => r.price > 0),
    ...webFiltered.filter(r => r.price > 0),
  ]
  // Resultados sin precio se descartan para evitar $0 falsos

  // Filtrar por relevancia: al menos 20% de los tokens del query deben estar en el nombre
  const queryTokens = tokenize(query)
  const relevant = queryTokens.length === 0
    ? rawWithPrice
    : rawWithPrice.filter(r => relevanceScore(r.name, queryTokens) >= 0.2)

  // Deduplicar por tienda+nombre normalizado (evita duplicados del mismo producto)
  const deduped = deduplicateByName(relevant)

  // Descuentos reales: comparar entre sellers
  const allWithPrice = applyCrossSellerDiscounts(deduped)
  allWithPrice.sort((a, b) => a.price - b.price)

  const results = [...allWithPrice]

  // Guardar historial (fire-and-forget, no bloqueamos la respuesta)
  recordPriceHistory(query, allWithPrice).catch(() => {})

  return NextResponse.json({
    results,
    total: results.length,
    query,
    sources: {
      tiendas_vtex: vtex.length,
      coto: coto.length,
      superprecio: sp.length,
      web: webFiltered.length,
    },
  }, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}

// ─── Historial de precios ─────────────────────────────────────────────────────

async function recordPriceHistory(query: string, results: SearchResult[]) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key || results.length === 0) return

  const supabase = createClient(url, key)
  const normalizedQuery = query.toLowerCase().trim()

  // Solo guardamos los 5 más baratos para no llenar la tabla
  const rows = results.slice(0, 5).map(r => ({
    query: normalizedQuery,
    store_name: r.store_name,
    product_name: r.name.slice(0, 200),
    price: r.price,
    url: r.url ?? null,
  }))

  await supabase.from('price_history').insert(rows)
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
    nameTokens.some(nt => {
      if (nt === qt) return true
      // Substring match solo para tokens largos (evita "cola" matcheando "chocolate")
      if (qt.length >= 5 && nt.includes(qt)) return true
      if (nt.length >= 5 && qt.includes(nt)) return true
      return false
    })
  )
  return matches.length / queryTokens.length
}

// ─── Dedup por tienda + nombre normalizado ────────────────────────────────────

function deduplicateByName(results: SearchResult[]): SearchResult[] {
  const byStoreAndName = new Map<string, SearchResult>()
  for (const r of results) {
    const key = `${r.store_name}::${tokenize(r.name).slice(0, 5).join(' ')}`
    const existing = byStoreAndName.get(key)
    if (!existing || r.price < existing.price) {
      byStoreAndName.set(key, r)
    }
  }
  return Array.from(byStoreAndName.values())
}
