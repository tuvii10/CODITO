/**
 * Búsqueda web general — Tavily + Serper
 *
 * Tavily:  1.000 búsquedas gratis/mes, sin tarjeta
 *          → tavily.com → Sign up → copiar API key
 *
 * Serper:  2.500 búsquedas gratis totales, sin tarjeta
 *          → serper.dev → Sign up → copiar API key
 *
 * Agregar en .env.local:
 *   TAVILY_API_KEY=tvly-xxxxx
 *   SERPER_API_KEY=xxxxxxxxxxxx
 */
import { SearchResult } from './types'

// ── Helpers ───────────────────────────────────────────────────────────────────

// Dominios que NO son tiendas: noticias, blogs, foros, redes sociales, comparadores, etc.
const BLOCKED_DOMAINS = [
  // Noticias
  'lavoz', 'infobae', 'clarin', 'lanacion', 'pagina12', 'ambito', 'cronista',
  'iprofesional', 'tn.com', 'telam', 'perfil.com', 'minutouno', 'eldestape',
  'diarioregistrado', 'eldiario', 'rosario3', 'losandes', 'diariopopular',
  'chequeado', 'bae.com', 'canal26', 'c5n.com', 'todonoticias',
  // Redes sociales
  'wikipedia', 'reddit', 'twitter', 'facebook', 'instagram', 'tiktok',
  'youtube', 'linkedin', 'pinterest', 'quora', 'taringa',
  // Blogs/foros
  'blogspot', 'wordpress', 'medium.com', 'tumblr',
  'stackoverflow', 'github', 'gitlab',
  // Buscadores
  'google.com', 'google.com.ar', 'bing.com', 'yahoo.com',
  // Comparadores (muestran precios viejos/agregados)
  'buscaprecios', 'hardgamers', 'comparaencasa', 'preciosd', 'preciosclaros',
  'compraensanjuan', 'elmejoracuerdo', 'knasta',
  // Empleo
  'glassdoor', 'computrabajo', 'zonajobs', 'bumeran',
  // MercadoLibre listados (no productos)
  'listado.mercadolibre',
  // Recetas, salud, educación
  'recetasgratis', 'paulinacocina', 'cocineros', 'allrecipes',
  'mayoclinic', 'medlineplus',
]

// Patrones de URL que indican listados/categorías, no productos individuales
const BLOCKED_URL_PATTERNS = [
  '/listado/', '/listados/', '/categoria/', '/categorias/', '/category/',
  '/search?', '/buscar?', '/resultados?', '/search/',
  '/tag/', '/tags/', '/archivo/', '/blog/',
  '/noticias/', '/nota/', '/articulo/',
  '/collection/', '/collections/', '/coleccion/',
  '/productos?', '/products?',
  'provinciacompras.com', 'dfrancia.com', 'novogar.com.ar',
]

// Palabras en el título que indican que NO es un producto
const BLOCKED_TITLE_PATTERNS = [
  /^ofertas?\s+(en|de)\s+/i,
  /^listado/i,
  /\|\s*MercadoLibre$/i,
  /mejores?\s+precios?\s+y\s+variedad/i,
  /cotizaci[oó]n/i,
  /noticias?\s+(de|sobre|del)/i,
  /^cu[aá]nto\s+(cuesta|sale|vale)/i,
  /^c[oó]mo\s+(hacer|preparar|cocinar)/i,
  /recetas?\s+(de|para|con)/i,
  /^el\s+inexplicable/i,
  /^por\s+qu[eé]/i,
  /^ranking\s+de/i,
  /^los\s+\d+\s+mejores/i,
  /^gu[ií]a\s+(de|para)/i,
]

function isBlockedUrl(url: string): boolean {
  try {
    const lower = url.toLowerCase()
    const host = new URL(url).hostname.toLowerCase()
    if (BLOCKED_DOMAINS.some(d => host.includes(d))) return true
    if (BLOCKED_URL_PATTERNS.some(p => lower.includes(p))) return true
    return false
  } catch {
    return true
  }
}

function isBlockedTitle(title: string): boolean {
  return BLOCKED_TITLE_PATTERNS.some(p => p.test(title))
}

function storeFromUrl(url: string): string {
  try {
    const host = new URL(url).hostname.replace('www.', '').replace('.com.ar', '').replace('.com', '')
    return host.charAt(0).toUpperCase() + host.slice(1)
  } catch {
    return 'Tienda'
  }
}

function faviconUrl(url: string): string {
  try {
    const { hostname } = new URL(url)
    return `https://www.google.com/s2/favicons?domain=${hostname}&sz=32`
  } catch {
    return ''
  }
}

function extractPrice(text: string): number | null {
  if (!text) return null
  const clean = text.replace(/\./g, '').replace(',', '.')
  const match = clean.match(/(?:ARS|AR\$|\$)?\s*(\d{3,}(?:\.\d{1,2})?)/i)
  if (!match) return null
  const val = parseFloat(match[1])
  return val > 100 ? val : null
}

// ── Tavily ────────────────────────────────────────────────────────────────────

export async function searchTavily(query: string): Promise<SearchResult[]> {
  const key = process.env.TAVILY_API_KEY
  if (!key) return []

  try {
    const res = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: key,
        query: `${query} precio comprar argentina site:.ar OR site:mercadolibre.com.ar`,
        search_depth: 'basic',
        max_results: 10,
        include_answer: false,
        include_raw_content: false,
      }),
      signal: AbortSignal.timeout(8000),
      next: { revalidate: 300 },
    })

    if (!res.ok) return []
    const data = await res.json()
    const items: { title: string; url: string; content?: string; score?: number }[] = data.results ?? []

    return items
      .filter(r => r.url && !isBlockedUrl(r.url) && !isBlockedTitle(r.title))
      .map(r => {
        const price = extractPrice(r.content ?? '')
        return {
          id: `tavily-${Buffer.from(r.url).toString('base64').slice(0, 12)}`,
          name: r.title,
          brand: null,
          ean: null,
          store_name: storeFromUrl(r.url),
          store_logo: faviconUrl(r.url),
          price: price ?? 0,
          price_per_unit: null,
          unit: null,
          url: r.url,
          in_stock: true,
          source: 'searxng' as const, // reutilizamos el tipo "web"
          image: null,
        } satisfies SearchResult
      })
  } catch {
    return []
  }
}

// ── Serper (Google Search) ────────────────────────────────────────────────────

export async function searchSerper(query: string): Promise<SearchResult[]> {
  const key = process.env.SERPER_API_KEY
  if (!key) return []

  try {
    const res = await fetch('https://google.serper.dev/shopping', {
      method: 'POST',
      headers: {
        'X-API-KEY': key,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        q: `${query}`,
        gl: 'ar',
        hl: 'es',
        num: 15,
      }),
      signal: AbortSignal.timeout(8000),
      next: { revalidate: 300 },
    })

    if (!res.ok) return []
    const data = await res.json()

    type SerperItem = { title: string; link: string; price?: string; source?: string; imageUrl?: string }
    const items: SerperItem[] = data.shopping ?? []

    return items
      .filter(r => r.link && !isBlockedUrl(r.link) && !isBlockedTitle(r.title))
      .map(r => {
        const price = r.price ? extractPrice(r.price) : null
        return {
          id: `serper-${Buffer.from(r.link ?? r.title).toString('base64').slice(0, 12)}`,
          name: r.title,
          brand: null,
          ean: null,
          store_name: r.source ?? storeFromUrl(r.link ?? ''),
          store_logo: r.link ? faviconUrl(r.link) : '',
          price: price ?? 0,
          price_per_unit: null,
          unit: null,
          url: r.link ?? null,
          in_stock: true,
          source: 'searxng' as const,
          image: r.imageUrl ?? null,
        } satisfies SearchResult
      })
  } catch {
    return []
  }
}

// ── Función combinada ─────────────────────────────────────────────────────────

export async function searchWeb(query: string): Promise<SearchResult[]> {
  const [tavilyRes, serperRes] = await Promise.allSettled([
    searchTavily(query),
    searchSerper(query),
  ])

  const tavily = tavilyRes.status === 'fulfilled' ? tavilyRes.value : []
  const serper = serperRes.status === 'fulfilled' ? serperRes.value : []

  // Deduplicar por URL
  const seen = new Set<string>()
  const combined: SearchResult[] = []

  // Serper primero (tiene precios más precisos de Google Shopping)
  for (const r of [...serper, ...tavily]) {
    if (!r.url || seen.has(r.url)) continue
    seen.add(r.url)
    combined.push(r)
  }

  return combined
}
