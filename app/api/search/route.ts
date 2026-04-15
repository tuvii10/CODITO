import { NextRequest, NextResponse } from 'next/server'
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

  // ML no se incluye en la búsqueda libre: su API search está deprecada.
  // Ver /api/featured donde sí traemos best sellers de ML por categoría.
  const [vtexRes, cotoRes, webRes] = await Promise.allSettled([
    searchVtex(query),
    searchCoto(query),
    searchWeb(query),
  ])

  const vtex = vtexRes.status === 'fulfilled' ? vtexRes.value : []
  const coto = cotoRes.status === 'fulfilled' ? cotoRes.value : []
  const web  = webRes.status  === 'fulfilled' ? webRes.value  : []

  // Deduplicar web contra resultados directos
  const directUrls = new Set([...vtex, ...coto].map(r => r.url).filter(Boolean))
  const webFiltered = web.filter(r => !r.url || !directUrls.has(r.url))

  // Juntar todo (con precio primero, sin precio al final)
  const rawWithPrice = [...vtex, ...coto, ...webFiltered.filter(r => r.price > 0)]
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
      tiendas_vtex: vtex.length,
      coto: coto.length,
      web: webFiltered.length,
    },
  })
}
