/**
 * Debug: prueba múltiples endpoints de VTEX para ver dónde están las promos.
 * 1. Search API clásico (/api/catalog_system/pub/products/search)
 * 2. Intelligent Search (/api/io/_v/api/intelligent-search/product_search)
 * 3. PDP scraping (HTML del producto) — busca en el __STATE__ embebido
 *
 * GET /api/vtex-debug?store=vea&q=schweppes&slug=gaseosa-schweppes-tonica-1-5-l
 */
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const STORE_DOMAINS: Record<string, string> = {
  carrefour: 'www.carrefour.com.ar',
  disco: 'www.disco.com.ar',
  vea: 'www.vea.com.ar',
  jumbo: 'www.jumbo.com.ar',
}

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'

async function testSearchApi(domain: string, query: string) {
  try {
    const url = `https://${domain}/api/catalog_system/pub/products/search?ft=${encodeURIComponent(query)}&_from=0&_to=1`
    const res = await fetch(url, {
      headers: { Accept: 'application/json', 'User-Agent': UA },
      cache: 'no-store',
      signal: AbortSignal.timeout(8000),
    })
    const text = await res.text()
    return {
      endpoint: 'search',
      url,
      status: res.status,
      has_teasers: /"Teasers":\s*\[\s*\{/.test(text),
      has_promo_mention: /2do|3x|llevando|\bpromo/i.test(text),
      length: text.length,
    }
  } catch (err) {
    return { endpoint: 'search', error: String(err) }
  }
}

async function testIntelligentSearch(domain: string, query: string) {
  try {
    const url = `https://${domain}/api/io/_v/api/intelligent-search/product_search/?query=${encodeURIComponent(query)}&count=2`
    const res = await fetch(url, {
      headers: { Accept: 'application/json', 'User-Agent': UA },
      cache: 'no-store',
      signal: AbortSignal.timeout(8000),
    })
    const text = await res.text()
    let parsed: unknown = null
    try { parsed = JSON.parse(text) } catch {}

    const products: Array<{
      name: string
      offer: Record<string, unknown>
    }> = []

    if (parsed && typeof parsed === 'object') {
      const p = parsed as { products?: Array<{ productName?: string; items?: Array<{ sellers?: Array<{ commertialOffer?: Record<string, unknown> }> }> }> }
      for (const prod of p.products ?? []) {
        const offer = prod.items?.[0]?.sellers?.[0]?.commertialOffer
        if (offer) products.push({ name: prod.productName ?? '', offer })
      }
    }

    return {
      endpoint: 'intelligent-search',
      url,
      status: res.status,
      length: text.length,
      products: products.map(p => ({
        name: p.name,
        Price: p.offer.Price,
        ListPrice: p.offer.ListPrice,
        spotPrice: p.offer.spotPrice,
        PriceWithoutDiscount: p.offer.PriceWithoutDiscount,
        teasers: p.offer.teasers,
        Teasers: p.offer.Teasers,
        discountHighlights: p.offer.discountHighlights,
      })),
    }
  } catch (err) {
    return { endpoint: 'intelligent-search', error: String(err) }
  }
}

async function testPdpScraping(domain: string, slug: string) {
  try {
    const url = `https://${domain}/${slug}/p`
    const res = await fetch(url, {
      headers: {
        'User-Agent': UA,
        Accept: 'text/html',
        'Accept-Language': 'es-AR,es;q=0.9',
      },
      cache: 'no-store',
      redirect: 'follow',
      signal: AbortSignal.timeout(10000),
    })
    const html = await res.text()

    // Buscar patrones típicos de promos en el HTML
    const promoPatterns = {
      '2do al': (html.match(/\d\w+ al \d+%/gi) || []).slice(0, 5),
      'teasers keyword': (html.match(/"[tT]easer[s]?":\s*\[[^\]]{0,200}/g) || []).slice(0, 2),
      'promotion': (html.match(/"[pP]romotion[^"]*":\s*"[^"]{0,100}/g) || []).slice(0, 3),
      effectivePrice: (html.match(/"[eE]ffectivePrice[^"]*":\s*[\d.]+/g) || []).slice(0, 2),
      llevando: (html.match(/[Ll]levando\s+\d[^<"]{0,50}/g) || []).slice(0, 3),
    }

    return {
      endpoint: 'pdp-scraping',
      url,
      status: res.status,
      length: html.length,
      patterns: promoPatterns,
    }
  } catch (err) {
    return { endpoint: 'pdp-scraping', error: String(err) }
  }
}

export async function GET(req: NextRequest) {
  const store = req.nextUrl.searchParams.get('store') || 'vea'
  const query = req.nextUrl.searchParams.get('q') || 'schweppes tonica'
  const slug = req.nextUrl.searchParams.get('slug') || 'gaseosa-schweppes-tonica-1-5-l'
  const domain = STORE_DOMAINS[store] || store

  const [search, intelligent, pdp] = await Promise.all([
    testSearchApi(domain, query),
    testIntelligentSearch(domain, query),
    testPdpScraping(domain, slug),
  ])

  return NextResponse.json({
    version: 'v4-discount-highlights',
    store,
    query,
    slug,
    hint: 'Probá cambiar store=carrefour o store=fravega para ver si otras tiendas exponen teasers',
    tests: { search, intelligent, pdp },
  }, { headers: { 'Cache-Control': 'no-store' } })
}
