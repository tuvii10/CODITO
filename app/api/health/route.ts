/**
 * Health check endpoint — verifica que todas las fuentes de datos respondan.
 * Lo llama un cron diario de Vercel (ver vercel.json).
 *
 * GET /api/health → reporte de estado de cada fuente
 * GET /api/health?q=query → permite pasar una query custom
 */
import { NextRequest, NextResponse } from 'next/server'
import { searchVtex, VTEX_STORES_WITH_CATEGORY, VTEX_STORE_NAMES } from '@/lib/vtex'
import { fetchMLHighlightsByCategory } from '@/lib/mercadolibre'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// Query de prueba por categoría de tienda — evita falsos negativos
// (ej: buscar "leche" en Topper o Sporting devuelve vacío aunque funcionen bien)
const CATEGORY_TEST_QUERY: Record<string, string> = {
  supermercado: 'leche',
  electro:      'cafetera',
  hogar:        'olla',
  farmacia:     'shampoo',
  belleza:      'crema',
  mascotas:     'alimento perro',
  moda:         'zapatillas',
  deportes:     'zapatillas',
  libros:       'libro',
  multi:        'leche',
}

type StoreStatus = {
  store: string
  status: 'ok' | 'fail'
  products: number
  query: string
}

export async function GET(req: NextRequest) {
  const overrideQuery = req.nextUrl.searchParams.get('q')?.trim()

  const started = Date.now()

  // Probar cada tienda con una query relevante a su categoría
  const storeResults = await Promise.allSettled(
    VTEX_STORES_WITH_CATEGORY.map(async ({ name, category }) => {
      const q = overrideQuery ?? CATEGORY_TEST_QUERY[category] ?? 'leche'
      const results = await searchVtex(q, name)
      return { name, q, count: results.length }
    })
  )

  const vtexByStore = new Map<string, { count: number; q: string }>()
  for (const r of storeResults) {
    if (r.status === 'fulfilled') {
      vtexByStore.set(r.value.name, { count: r.value.count, q: r.value.q })
    }
  }

  // ML se prueba con MLA1403 (Alimentos y Bebidas)
  const mlResult = await Promise.allSettled([fetchMLHighlightsByCategory('MLA1403', 3)])
  const ml = mlResult[0].status === 'fulfilled' ? mlResult[0].value : []

  const vtexDetails: StoreStatus[] = VTEX_STORE_NAMES.map(name => {
    const info = vtexByStore.get(name)
    return {
      store: name,
      status: (info?.count ?? 0) > 0 ? 'ok' : 'fail',
      products: info?.count ?? 0,
      query: info?.q ?? '',
    }
  })

  const vtexOk = vtexDetails.filter(s => s.status === 'ok').length
  const vtexFail = vtexDetails.filter(s => s.status === 'fail').length

  const overall: 'healthy' | 'degraded' | 'down' =
    vtexOk === 0 && ml.length === 0
      ? 'down'
      : vtexFail > 0 || ml.length === 0
        ? 'degraded'
        : 'healthy'

  const totalProducts = vtexDetails.reduce((sum, s) => sum + s.products, 0)

  const report = {
    timestamp: new Date().toISOString(),
    duration_ms: Date.now() - started,
    overall,
    summary: {
      vtex_total: totalProducts,
      vtex_stores_ok: vtexOk,
      vtex_stores_fail: vtexFail,
      ml_products: ml.length,
      ml_status: ml.length > 0 ? 'ok' : 'fail',
    },
    vtex_details: vtexDetails,
    failed_stores: vtexDetails.filter(s => s.status === 'fail').map(s => s.store),
  }

  // Log amigable en consola (aparece en los logs de Vercel)
  console.log('[HEALTH]', JSON.stringify({
    overall: report.overall,
    vtex_ok: vtexOk,
    vtex_fail: vtexFail,
    ml: ml.length,
    failed: report.failed_stores,
  }))

  return NextResponse.json(report, {
    status: overall === 'down' ? 503 : 200,
    headers: { 'Cache-Control': 'no-store' },
  })
}
