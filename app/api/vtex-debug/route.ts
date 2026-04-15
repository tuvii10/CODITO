/**
 * Debug: dump completo de lo que devuelve la API de VTEX para un query.
 * Sirve para ver si los Teasers (promos tipo 2x1, 2do al 50%) están
 * presentes en la respuesta o no.
 *
 * GET /api/vtex-debug?store=vea&q=schweppes
 */
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const STORE_DOMAINS: Record<string, string> = {
  carrefour: 'www.carrefour.com.ar',
  disco: 'www.disco.com.ar',
  vea: 'www.vea.com.ar',
  jumbo: 'www.jumbo.com.ar',
  changomas: 'www.masonline.com.ar',
  fravega: 'www.fravega.com',
  easy: 'www.easy.com.ar',
  farmacity: 'www.farmacity.com',
}

export async function GET(req: NextRequest) {
  const store = req.nextUrl.searchParams.get('store') || 'vea'
  const query = req.nextUrl.searchParams.get('q') || 'schweppes tonica'
  const domain = STORE_DOMAINS[store] || store

  const url = `https://${domain}/api/catalog_system/pub/products/search?ft=${encodeURIComponent(query)}&_from=0&_to=2`

  try {
    const res = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      },
      cache: 'no-store',
      signal: AbortSignal.timeout(8000),
    })

    if (!res.ok) {
      return NextResponse.json({
        url,
        status: res.status,
        error: await res.text(),
      })
    }

    const text = await res.text()
    let data: unknown
    try {
      data = JSON.parse(text)
    } catch {
      return NextResponse.json({ url, status: res.status, raw: text.slice(0, 1000) })
    }

    // Extraer solo los campos clave para no saturar
    const arr = data as Array<Record<string, unknown>>
    if (!Array.isArray(arr)) {
      return NextResponse.json({ url, unexpected: data })
    }

    const summary = arr.map(product => {
      const p = product as { productName: string; link: string; items?: Array<{ sellers?: Array<{ commertialOffer?: Record<string, unknown> }> }> }
      const item = p.items?.[0]
      const offer = item?.sellers?.[0]?.commertialOffer
      return {
        productName: p.productName,
        link: p.link,
        Price: offer?.Price,
        ListPrice: offer?.ListPrice,
        PriceWithoutDiscount: offer?.PriceWithoutDiscount,
        Teasers: offer?.Teasers,
        PromotionTeasers: offer?.PromotionTeasers,
        DiscountHighLight: offer?.DiscountHighLight,
        raw_offer_keys: offer ? Object.keys(offer) : [],
      }
    })

    return NextResponse.json({
      store,
      query,
      url,
      total: arr.length,
      products: summary,
    }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (err) {
    return NextResponse.json({ url, error: String(err) }, { status: 500 })
  }
}
