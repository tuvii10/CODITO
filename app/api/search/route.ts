import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { searchVtex } from '@/lib/vtex'
import { searchCoto } from '@/lib/coto'
import { searchSuperPrecio } from '@/lib/superprecio'
import { searchWeb } from '@/lib/web-search'
import { searchMercadoLibreWeb } from '@/lib/ml-search'
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

  // Fuentes en paralelo — ahora incluye MercadoLibre directo
  const [vtexRes, cotoRes, spRes, mlRes, webRes] = await Promise.allSettled([
    searchVtex(query),
    searchCoto(query),
    searchSuperPrecio(query, 30),
    searchMercadoLibreWeb(query, 20),
    searchWeb(query),
  ])

  const vtex = vtexRes.status === 'fulfilled' ? vtexRes.value : []
  const coto = cotoRes.status === 'fulfilled' ? cotoRes.value : []
  const sp   = spRes.status   === 'fulfilled' ? spRes.value   : []
  const ml   = mlRes.status   === 'fulfilled' ? mlRes.value   : []
  const web  = webRes.status  === 'fulfilled' ? webRes.value  : []

  // Deduplicar contra resultados directos
  const directUrls = new Set([...vtex, ...coto, ...ml].map(r => r.url).filter(Boolean))
  const spFiltered = sp.filter(r => !r.url || !directUrls.has(r.url))
  const webFiltered = web.filter(r => !r.url || !directUrls.has(r.url))

  // Juntar todo — solo con precio > 0
  // ML tiene prioridad alta (resultados confiables con precios precisos)
  const rawWithPrice = [
    ...ml.filter(r => r.price > 0),
    ...vtex.filter(r => r.price > 0),
    ...coto.filter(r => r.price > 0),
    ...spFiltered.filter(r => r.price > 0),
    ...webFiltered.filter(r => r.price > 0),
  ]

  // ═══ PIPELINE DE FILTRADO ═══

  // 1. Filtrar nombres que NO son productos
  const nonProductPatterns = [
    /\|\s*MercadoLibre$/i,
    /Listado\./i,
    /mejores?\s+precios?\s+y\s+variedad/i,
    /^ofertas?\s+(en|de)\s+/i,
    /cotizaci[oó]n/i,
    /^el\s+inexplicable/i,
    /^cu[aá]nto\s+(cuesta|sale|vale)/i,
    /recetas?\s+(de|para)/i,
    /noticias?\s+/i,
    /en cuotas sin inter[eé]s/i,
    /los mejores precios/i,
    /precio y variedad/i,
    /comprar online/i,
    /^\d+\s+resultados/i,
    /env[ií]o gratis/i,
  ]

  // 2. Filtrar nombres genéricos de categoría (web)
  const isGenericCategory = (r: SearchResult) => {
    if (r.source !== 'searxng') return false
    const words = r.name.replace(/[-–—|·:,]/g, ' ').split(/\s+/).filter(w => w.length > 2)
    return words.length <= 3
  }

  // 3. Scoring de relevancia mejorado
  const queryTokens = tokenize(query)

  const scored = rawWithPrice
    .filter(r => !nonProductPatterns.some(p => p.test(r.name)))
    .filter(r => !isGenericCategory(r))
    .map(r => {
      const score = queryTokens.length === 0 ? 1 : relevanceScore(r.name, queryTokens)
      // ML y tiendas directas (VTEX/Coto/SuperPrecio) ya filtran por relevancia
      // Web scraping (Tavily/Serper) necesita penalización
      const isDirectSource = r.store_name === 'MercadoLibre' || r.source !== 'searxng'
      const sourceBoost = isDirectSource ? 1.0 : 0.75
      return { ...r, __score: score * sourceBoost }
    })
    // Mínimo 40% de las palabras del query deben matchear
    // (las tiendas directas ya pre-filtran, el threshold es para web)
    .filter(r => r.__score >= 0.4)

  // 4. Ordenar por relevancia primero, después por precio
  scored.sort((a, b) => {
    // Primero: resultados con score perfecto (1.0) van arriba
    const scoreDiff = b.__score - a.__score
    if (Math.abs(scoreDiff) > 0.3) return scoreDiff
    // Dentro del mismo rango de relevancia, ordenar por precio
    return a.price - b.price
  })

  // 5. Deduplicar por tienda+nombre
  const deduped = deduplicateByName(scored)

  // 6. Aplicar descuentos cross-seller
  const withDiscounts = applyCrossSellerDiscounts(deduped)

  // 7. Ordenar final por precio (el usuario espera ver lo más barato primero)
  withDiscounts.sort((a, b) => a.price - b.price)

  // 8. Filtrar outliers de precio
  const results = filterOutlierPrices(withDiscounts)

  // Guardar historial (fire-and-forget)
  recordPriceHistory(query, results).catch(() => {})

  return NextResponse.json({
    results,
    total: results.length,
    query,
    sources: {
      mercadolibre: ml.length,
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

  const rows = results.slice(0, 5).map(r => ({
    query: normalizedQuery,
    store_name: r.store_name,
    product_name: r.name.slice(0, 200),
    price: r.price,
    url: r.url ?? null,
  }))

  await supabase.from('price_history').insert(rows)
}

// ─── Relevancia mejorada ─────────────────────────────────────────────────────

const STOP_WORDS = new Set([
  'de','del','la','el','los','las','y','con','sin','para','en','por',
  'un','una','x','ml','cc','gr','kg','lt','lts','cm','mm',
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
  const nameNorm = name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  const nameTokens = tokenize(name)
  if (nameTokens.length === 0) return 0

  let matchedTokens = 0

  for (const qt of queryTokens) {
    // Match exacto de token
    if (nameTokens.some(nt => nt === qt)) {
      matchedTokens++
      continue
    }
    // Match en el nombre completo (para términos compuestos como "coca cola")
    if (nameNorm.includes(qt)) {
      matchedTokens++
      continue
    }
    // Substring match solo si ambos tokens son largos (5+ chars)
    if (qt.length >= 5 && nameTokens.some(nt => nt.length >= 5 && (nt.includes(qt) || qt.includes(nt)))) {
      matchedTokens += 0.8 // partial credit
      continue
    }
  }

  return matchedTokens / queryTokens.length
}

// ─── Filtro de outliers ──────────────────────────────────────────────────────

function filterOutlierPrices(results: SearchResult[]) {
  if (results.length < 4) return results
  // Calcular mediana
  const prices = results.map(r => r.price).sort((a, b) => a - b)
  const median = prices[Math.floor(prices.length / 2)]
  // Calcular Q1 (primer cuartil)
  const q1 = prices[Math.floor(prices.length * 0.25)]
  // Un precio es outlier si es menor al 10% de la mediana O menor a Q1/3
  const threshold = Math.max(median * 0.10, q1 / 3)
  return results.filter(r => r.price >= threshold)
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
