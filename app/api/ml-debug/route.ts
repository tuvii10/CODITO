/**
 * Debug endpoint para ver EXACTAMENTE qué responde Mercado Libre desde Vercel.
 * No usa cache. Prueba los dos caminos (API oficial + scraping) y devuelve
 * todos los detalles.
 *
 * GET /api/ml-debug           → query default 'leche'
 * GET /api/ml-debug?q=coca    → query custom
 */
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

type DebugResult = {
  attempt: string
  url: string
  status: number | 'error'
  ok: boolean
  content_type: string | null
  response_length: number
  sample: string
  error?: string
  products_found?: number
}

async function tryApi(query: string): Promise<DebugResult> {
  const url = `https://api.mercadolibre.com/sites/MLA/search?q=${encodeURIComponent(query)}&limit=5&condition=new`
  try {
    const res = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'Accept-Language': 'es-AR,es;q=0.9',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      },
      cache: 'no-store',
      signal: AbortSignal.timeout(8000),
    })
    const text = await res.text()
    let productsFound = 0
    try {
      const parsed = JSON.parse(text)
      productsFound = Array.isArray(parsed?.results) ? parsed.results.length : 0
    } catch { /* not json */ }
    return {
      attempt: 'api.mercadolibre.com',
      url,
      status: res.status,
      ok: res.ok,
      content_type: res.headers.get('content-type'),
      response_length: text.length,
      sample: text.slice(0, 300),
      products_found: productsFound,
    }
  } catch (err) {
    return {
      attempt: 'api.mercadolibre.com',
      url,
      status: 'error',
      ok: false,
      content_type: null,
      response_length: 0,
      sample: '',
      error: String(err),
    }
  }
}

async function tryScraping(query: string): Promise<DebugResult> {
  const slug = query.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9\-áéíóúüñ]/g, '')
  const url = `https://listado.mercadolibre.com.ar/${encodeURIComponent(slug)}`
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9',
        'Accept-Language': 'es-AR,es;q=0.9,en;q=0.8',
        'Referer': 'https://www.google.com.ar/',
      },
      cache: 'no-store',
      redirect: 'follow',
      signal: AbortSignal.timeout(8000),
    })
    const text = await res.text()
    const productListCount = (text.match(/"product_list":\[/g) || []).length
    return {
      attempt: 'listado.mercadolibre.com.ar (scraping)',
      url,
      status: res.status,
      ok: res.ok,
      content_type: res.headers.get('content-type'),
      response_length: text.length,
      sample: text.slice(0, 300),
      products_found: productListCount,
    }
  } catch (err) {
    return {
      attempt: 'listado.mercadolibre.com.ar (scraping)',
      url,
      status: 'error',
      ok: false,
      content_type: null,
      response_length: 0,
      sample: '',
      error: String(err),
    }
  }
}

async function tryApiWithDifferentHeaders(query: string): Promise<DebugResult> {
  const url = `https://api.mercadolibre.com/sites/MLA/search?q=${encodeURIComponent(query)}&limit=5`
  try {
    const res = await fetch(url, {
      headers: {
        'Accept': 'application/json, text/plain, */*',
      },
      cache: 'no-store',
      signal: AbortSignal.timeout(8000),
    })
    const text = await res.text()
    return {
      attempt: 'api.mercadolibre.com (minimal headers)',
      url,
      status: res.status,
      ok: res.ok,
      content_type: res.headers.get('content-type'),
      response_length: text.length,
      sample: text.slice(0, 300),
    }
  } catch (err) {
    return {
      attempt: 'api.mercadolibre.com (minimal headers)',
      url,
      status: 'error',
      ok: false,
      content_type: null,
      response_length: 0,
      sample: '',
      error: String(err),
    }
  }
}

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get('q')?.trim() || 'leche'

  const [api, apiMinimal, scrape] = await Promise.all([
    tryApi(query),
    tryApiWithDifferentHeaders(query),
    tryScraping(query),
  ])

  return NextResponse.json({
    timestamp: new Date().toISOString(),
    query,
    attempts: [api, apiMinimal, scrape],
  }, {
    headers: { 'Cache-Control': 'no-store' },
  })
}
