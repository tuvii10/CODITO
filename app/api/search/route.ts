import { NextRequest, NextResponse } from 'next/server'
import { searchMercadoLibre } from '@/lib/mercadolibre'
import { searchVtex } from '@/lib/vtex'
import { searchCoto } from '@/lib/coto'
import { searchWeb } from '@/lib/web-search'
import { applyCrossSellerDiscounts } from '@/lib/compare'

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

  // Juntar todo
  const rawWithPrice    = [...ml, ...vtex, ...coto, ...webFiltered.filter(r => r.price > 0)]
  const allWithoutPrice = webFiltered.filter(r => r.price === 0)

  // Descuentos reales: comparar entre sellers para calcular cuánto es más
  // barato cada producto respecto a la mediana del resto de las tiendas
  const allWithPrice = applyCrossSellerDiscounts(rawWithPrice)
  allWithPrice.sort((a, b) => a.price - b.price)

  const results = [...allWithPrice, ...allWithoutPrice]

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
