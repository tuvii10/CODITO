/**
 * Health check endpoint — verifica que todas las fuentes de datos respondan.
 * Lo llama un cron diario de Vercel (ver vercel.json).
 *
 * GET /api/health → reporte de estado de cada fuente
 * GET /api/health?q=query → permite pasar una query custom
 */
import { NextRequest, NextResponse } from 'next/server'
import { searchVtex, VTEX_STORE_NAMES } from '@/lib/vtex'
import { searchMercadoLibre } from '@/lib/mercadolibre'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

type StoreStatus = {
  store: string
  status: 'ok' | 'fail'
  products: number
}

export async function GET(req: NextRequest) {
  const testQuery = req.nextUrl.searchParams.get('q')?.trim() || 'leche'

  const started = Date.now()

  const [vtexResults, mlResults] = await Promise.allSettled([
    searchVtex(testQuery),
    searchMercadoLibre(testQuery, 5),
  ])

  const vtex = vtexResults.status === 'fulfilled' ? vtexResults.value : []
  const ml = mlResults.status === 'fulfilled' ? mlResults.value : []

  // Agrupar VTEX por tienda y contar productos por cada una
  const vtexByStore = new Map<string, number>()
  for (const r of vtex) {
    vtexByStore.set(r.store_name, (vtexByStore.get(r.store_name) ?? 0) + 1)
  }

  const vtexDetails: StoreStatus[] = VTEX_STORE_NAMES.map(name => ({
    store: name,
    status: (vtexByStore.get(name) ?? 0) > 0 ? 'ok' : 'fail',
    products: vtexByStore.get(name) ?? 0,
  }))

  const vtexOk = vtexDetails.filter(s => s.status === 'ok').length
  const vtexFail = vtexDetails.filter(s => s.status === 'fail').length

  const overall: 'healthy' | 'degraded' | 'down' =
    vtexOk === 0 && ml.length === 0
      ? 'down'
      : vtexFail > 0 || ml.length === 0
        ? 'degraded'
        : 'healthy'

  const report = {
    timestamp: new Date().toISOString(),
    duration_ms: Date.now() - started,
    test_query: testQuery,
    overall,
    summary: {
      vtex_total: vtex.length,
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
