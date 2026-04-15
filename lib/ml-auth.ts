/**
 * Mercado Libre OAuth — client credentials flow.
 *
 * ML deprecó la API pública anónima. Ahora hay que registrarse como
 * developer, crear una app y usar OAuth. Client credentials es el flow
 * que corresponde cuando la app consume su propia info, sin usuario
 * intermedio.
 *
 * El token dura 6 horas (21600s). Lo cacheamos en memoria del proceso
 * para no pedir uno nuevo en cada request. Al vencer, se refresca.
 *
 * Variables de entorno requeridas:
 *   ML_APP_ID         — App ID de developers.mercadolibre.com.ar
 *   ML_SECRET_KEY     — Secret Key de la app
 */

type CachedToken = {
  token: string
  expiresAt: number // timestamp ms
}

let cached: CachedToken | null = null
let inFlight: Promise<string | null> | null = null

async function requestNewToken(): Promise<string | null> {
  const appId = process.env.ML_APP_ID
  const secret = process.env.ML_SECRET_KEY

  if (!appId || !secret) {
    console.warn('[ML-auth] Missing ML_APP_ID or ML_SECRET_KEY env vars')
    return null
  }

  try {
    const res = await fetch('https://api.mercadolibre.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
      },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: appId,
        client_secret: secret,
      }).toString(),
      signal: AbortSignal.timeout(6000),
    })

    if (!res.ok) {
      console.warn('[ML-auth] Token request failed', res.status, await res.text())
      return null
    }

    const data = await res.json()
    if (!data.access_token) return null

    // Cachear con margen de 10 minutos antes del vencimiento real
    const expiresIn = (data.expires_in ?? 21600) * 1000
    cached = {
      token: data.access_token,
      expiresAt: Date.now() + expiresIn - 600_000,
    }

    console.log('[ML-auth] New token cached, expires in', Math.round(expiresIn / 60000), 'min')
    return cached.token
  } catch (err) {
    console.warn('[ML-auth] Token request error', err)
    return null
  }
}

/**
 * Devuelve un access token válido de Mercado Libre.
 * Cachea en memoria hasta 5h50min.
 */
export async function getMLAccessToken(): Promise<string | null> {
  if (cached && cached.expiresAt > Date.now()) {
    return cached.token
  }

  // Si ya hay una request en vuelo, esperarla
  if (inFlight) return inFlight

  inFlight = requestNewToken()
  const token = await inFlight
  inFlight = null
  return token
}
