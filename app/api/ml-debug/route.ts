/**
 * Debug del flow de Mercado Libre paso a paso.
 * GET /api/ml-debug → corre las 3 etapas y reporta dónde falla
 *
 * 1. Env vars presentes?
 * 2. OAuth token se obtiene?
 * 3. Highlights endpoint devuelve product IDs?
 * 4. /products/{id} y /products/{id}/items devuelven datos?
 */
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

type Step = {
  step: string
  ok: boolean
  details: unknown
}

async function runDebug(): Promise<Step[]> {
  const steps: Step[] = []

  // ── Paso 1: verificar env vars ────────────────────────────
  const appId = process.env.ML_APP_ID
  const secret = process.env.ML_SECRET_KEY
  steps.push({
    step: '1. Env vars',
    ok: !!(appId && secret),
    details: {
      ML_APP_ID: appId ? `${appId.slice(0, 4)}...${appId.slice(-4)}` : 'MISSING',
      ML_SECRET_KEY: secret ? `${secret.slice(0, 4)}...${secret.slice(-4)}` : 'MISSING',
    },
  })

  if (!appId || !secret) return steps

  // ── Paso 2: obtener token OAuth ──────────────────────────
  let token: string | null = null
  try {
    const res = await fetch('https://api.mercadolibre.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: appId,
        client_secret: secret,
      }).toString(),
      cache: 'no-store',
      signal: AbortSignal.timeout(8000),
    })
    const text = await res.text()
    let parsed: { access_token?: string; expires_in?: number; error?: string; message?: string } = {}
    try { parsed = JSON.parse(text) } catch { /* ignore */ }
    token = parsed.access_token ?? null
    steps.push({
      step: '2. OAuth token',
      ok: res.ok && !!token,
      details: {
        status: res.status,
        has_token: !!token,
        expires_in: parsed.expires_in,
        error: parsed.error,
        message: parsed.message,
        response_sample: text.slice(0, 300),
      },
    })
  } catch (err) {
    steps.push({ step: '2. OAuth token', ok: false, details: { error: String(err) } })
    return steps
  }

  if (!token) return steps

  // ── Paso 3: highlights de una categoría ──────────────────
  let productIds: string[] = []
  try {
    const res = await fetch('https://api.mercadolibre.com/highlights/MLA/category/MLA1403', {
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      cache: 'no-store',
      signal: AbortSignal.timeout(8000),
    })
    const text = await res.text()
    let parsed: { content?: Array<{ id: string; type: string }>; error?: string; message?: string } = {}
    try { parsed = JSON.parse(text) } catch { /* ignore */ }
    productIds = (parsed.content ?? []).filter(c => c.type === 'PRODUCT').slice(0, 3).map(c => c.id)
    steps.push({
      step: '3. /highlights/MLA/category/MLA1403',
      ok: res.ok && productIds.length > 0,
      details: {
        status: res.status,
        product_count: parsed.content?.length ?? 0,
        first_3_product_ids: productIds,
        error: parsed.error,
        message: parsed.message,
      },
    })
  } catch (err) {
    steps.push({ step: '3. highlights', ok: false, details: { error: String(err) } })
    return steps
  }

  if (productIds.length === 0) return steps

  // ── Paso 4: detalles del primer producto ─────────────────
  const firstId = productIds[0]
  try {
    const [productRes, itemsRes] = await Promise.all([
      fetch(`https://api.mercadolibre.com/products/${firstId}`, {
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
        cache: 'no-store',
        signal: AbortSignal.timeout(6000),
      }),
      fetch(`https://api.mercadolibre.com/products/${firstId}/items?limit=1`, {
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
        cache: 'no-store',
        signal: AbortSignal.timeout(6000),
      }),
    ])
    const productData = await productRes.json().catch(() => ({}))
    const itemsData = await itemsRes.json().catch(() => ({}))
    const firstItem = Array.isArray(itemsData?.results) ? itemsData.results[0] : null
    steps.push({
      step: `4. /products/${firstId}`,
      ok: productRes.ok && !!productData.name && itemsRes.ok && !!firstItem?.price,
      details: {
        product_status: productRes.status,
        product_name: productData.name,
        items_status: itemsRes.status,
        first_price: firstItem?.price,
        first_original_price: firstItem?.original_price,
      },
    })
  } catch (err) {
    steps.push({ step: '4. product details', ok: false, details: { error: String(err) } })
  }

  return steps
}

export async function GET() {
  const steps = await runDebug()
  const allOk = steps.every(s => s.ok)
  return NextResponse.json({
    version: 'ml-debug-v1',
    timestamp: new Date().toISOString(),
    overall: allOk ? 'OK' : 'FAIL',
    hint: 'Busca el primer step con "ok: false" para saber dónde falla',
    steps,
  }, { headers: { 'Cache-Control': 'no-store' } })
}
