import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Vercel Cron: llamado automáticamente cada 24hs (ver vercel.json)
// También puede llamarse manualmente con el header Authorization correcto

export const maxDuration = 60

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!
  return createClient(url, key)
}

async function searchWeb(query: string): Promise<string> {
  // Intenta Tavily primero, luego Serper
  const tavilyKey = process.env.TAVILY_API_KEY
  if (tavilyKey) {
    try {
      const res = await fetch('https://api.tavily.com/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          api_key: tavilyKey,
          query,
          search_depth: 'basic',
          max_results: 8,
          include_answer: true,
        }),
      })
      const data = await res.json()
      const snippets = (data.results ?? []).map((r: { title: string; content: string; url: string }) =>
        `[${r.title}]\n${r.content}\nFuente: ${r.url}`
      )
      if (data.answer) snippets.unshift(`Resumen: ${data.answer}`)
      return snippets.join('\n\n---\n\n')
    } catch { /* fallback */ }
  }

  const serperKey = process.env.SERPER_API_KEY
  if (serperKey) {
    const res = await fetch('https://google.serper.dev/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-API-KEY': serperKey },
      body: JSON.stringify({ q: query, gl: 'ar', hl: 'es', num: 8 }),
    })
    const data = await res.json()
    const snippets = (data.organic ?? []).map((r: { title: string; snippet: string; link: string }) =>
      `[${r.title}]\n${r.snippet}\nFuente: ${r.link}`
    )
    return snippets.join('\n\n---\n\n')
  }

  throw new Error('No hay API de búsqueda configurada (TAVILY_API_KEY o SERPER_API_KEY)')
}

async function extractPromosWithClaude(searchText: string): Promise<BankPromo[]> {
  const anthropicKey = process.env.ANTHROPIC_API_KEY
  if (!anthropicKey) throw new Error('Falta ANTHROPIC_API_KEY')

  const today = new Date().toLocaleDateString('es-AR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })

  const prompt = `Hoy es ${today}.

Analizá los siguientes resultados de búsqueda sobre descuentos bancarios en supermercados de Argentina y extraé las promociones actuales vigentes.

RESULTADOS DE BÚSQUEDA:
${searchText}

Extraé SOLO las promociones que parecen actualmente vigentes (no pasadas). Para cada una, devolvé un JSON con este formato exacto:
{
  "banco": "Nombre del banco",
  "icon": "emoji representativo del banco",
  "color": "color hexadecimal del banco",
  "tarjeta": "tipo de tarjeta (ej: Visa / Mastercard)",
  "descuento": número_entero (ej: 25),
  "dias": ["Lunes", "Martes", etc. — solo días vigentes, o ["Siempre"] si es todos los días],
  "supers": ["Carrefour", "Coto", etc.],
  "tope": "descripción del tope o null",
  "nota": "nota adicional relevante o null"
}

Los días válidos son: Lunes, Martes, Miércoles, Jueves, Viernes, Sábado, Domingo, Siempre.

Devolvé SOLO un array JSON válido, sin texto adicional, sin markdown, sin explicaciones.`

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': anthropicKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }],
    }),
  })

  if (!res.ok) throw new Error(`Claude API error: ${res.status}`)
  const data = await res.json()
  const text = data.content?.[0]?.text ?? '[]'

  // Extraer JSON del response (puede venir con markdown)
  const jsonMatch = text.match(/\[[\s\S]*\]/)
  if (!jsonMatch) return []
  return JSON.parse(jsonMatch[0])
}

type BankPromo = {
  banco: string
  icon: string
  color: string
  tarjeta: string
  descuento: number
  dias: string[]
  supers: string[]
  tope?: string | null
  nota?: string | null
}

export async function GET(req: Request) {
  // Verificar que viene de Vercel Cron o tiene token de autorización
  const auth = req.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret && auth !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const supabase = getSupabase()

    // Buscar promociones actuales
    const query = `descuentos supermercados banco tarjeta argentina ${new Date().toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })}`
    console.log('[bank-promos cron] Buscando:', query)

    const searchResults = await searchWeb(query)
    console.log('[bank-promos cron] Resultados obtenidos, parseando con Claude...')

    const promos = await extractPromosWithClaude(searchResults)
    console.log('[bank-promos cron] Promociones extraídas:', promos.length)

    if (promos.length < 3) {
      // Muy pocas — algo salió mal, no actualizar
      return NextResponse.json({
        ok: false,
        message: `Solo se extrajeron ${promos.length} promos, abortando actualización`,
        promos,
      })
    }

    // Reemplazar todas las promociones activas con las nuevas
    const now = new Date().toISOString()

    // Desactivar todas las actuales
    await supabase.from('bank_promos').update({ activo: false }).eq('activo', true)

    // Insertar las nuevas
    const rows = promos.map(p => ({
      banco:     p.banco,
      icon:      p.icon || '🏦',
      color:     p.color || '#71717a',
      tarjeta:   p.tarjeta,
      descuento: p.descuento,
      dias:      p.dias,
      supers:    p.supers,
      tope:      p.tope ?? null,
      nota:      p.nota ?? null,
      activo:    true,
      updated_at: now,
    }))

    const { error } = await supabase.from('bank_promos').insert(rows)
    if (error) throw error

    console.log('[bank-promos cron] Actualizado exitosamente:', rows.length, 'promociones')

    return NextResponse.json({
      ok: true,
      updated: rows.length,
      updated_at: now,
      promos: rows.map(r => ({ banco: r.banco, descuento: r.descuento, dias: r.dias })),
    })
  } catch (err) {
    console.error('[bank-promos cron] Error:', err)
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 })
  }
}
