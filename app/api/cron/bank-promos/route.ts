import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const maxDuration = 60

// ─── Catálogo de bancos ────────────────────────────────────────────────────────

const BANK_CATALOG: Record<string, { icon: string; color: string; tarjeta: string }> = {
  'Banco Nación':    { icon: '🇦🇷', color: '#009cde', tarjeta: 'Visa / Mastercard' },
  'Santander':       { icon: '🔴', color: '#ec0000', tarjeta: 'Visa / Mastercard' },
  'Galicia':         { icon: '🟠', color: '#e95b0c', tarjeta: 'Visa / Mastercard' },
  'BBVA':            { icon: '🔵', color: '#004481', tarjeta: 'Visa / Mastercard' },
  'HSBC':            { icon: '⬜', color: '#db0011', tarjeta: 'Visa / Mastercard' },
  'Banco Macro':     { icon: '🟡', color: '#f5b400', tarjeta: 'Visa / Mastercard' },
  'Banco Provincia': { icon: '🏦', color: '#0057a8', tarjeta: 'Cuenta DNI / Mastercard' },
  'Naranja X':       { icon: '🍊', color: '#ff6a00', tarjeta: 'Naranja Visa' },
  'MODO':            { icon: '💳', color: '#6c11e8', tarjeta: 'Múltiples bancos' },
  'Uala':            { icon: '💜', color: '#7b2d8b', tarjeta: 'Mastercard Prepaga' },
  'Mercado Pago':    { icon: '💙', color: '#009ee3', tarjeta: 'Tarjeta MP / QR' },
  'Personal Pay':    { icon: '🟢', color: '#00a550', tarjeta: 'Visa Prepaga' },
  'Brubank':         { icon: '🟣', color: '#6a0dad', tarjeta: 'Visa Débito' },
  'Banco Patagonia': { icon: '🏔️', color: '#2563eb', tarjeta: 'Visa / Mastercard' },
  'ICBC':            { icon: '🔷', color: '#1a5fa8', tarjeta: 'Visa / Mastercard' },
}

const DIAS_VALIDOS = ['Lunes','Martes','Miércoles','Jueves','Viernes','Sábado','Domingo','Siempre']

// ─── Búsqueda web (Tavily) ────────────────────────────────────────────────────

async function searchForBank(banco: string): Promise<string> {
  const mes = new Date().toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })
  const query = `descuento ${banco} supermercado tarjeta ${mes} argentina porcentaje días tope`

  const tavilyKey = process.env.TAVILY_API_KEY
  if (!tavilyKey) throw new Error('Sin TAVILY_API_KEY')

  const res = await fetch('https://api.tavily.com/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      api_key: tavilyKey,
      query,
      search_depth: 'basic',
      max_results: 5,
      include_answer: true,
    }),
  })
  const data = await res.json()
  const parts: string[] = []
  if (data.answer) parts.push(data.answer)
  for (const r of (data.results ?? [])) parts.push(`${r.title}: ${r.content}`)
  return parts.join(' | ')
}

// ─── Parser con Gemini ────────────────────────────────────────────────────────

type ParsedPromo = {
  descuento: number | null
  dias: string[]
  supers: string[]
  tope: string | null
  nota: string | null
}

async function parseWithGemini(banco: string, text: string): Promise<ParsedPromo | null> {
  const geminiKey = process.env.GEMINI_API_KEY
  if (!geminiKey) throw new Error('Sin GEMINI_API_KEY')

  const prompt = `Sos un extractor de datos de promociones bancarias argentinas.
Dado el siguiente texto sobre promociones de "${banco}" en supermercados, extraé la información y devolvé SOLO un JSON válido con esta estructura exacta:

{
  "descuento": <número entero del porcentaje de descuento/reintegro, o null si no hay>,
  "dias": <array de strings con los días, solo valores de: "Lunes","Martes","Miércoles","Jueves","Viernes","Sábado","Domingo","Siempre">,
  "supers": <array de strings con los supermercados mencionados>,
  "tope": <string con el tope de reintegro como "$X.XXX por semana/mes", o null>,
  "nota": <string corto con info relevante adicional, o null>
}

Reglas:
- Si no encontrás descuento concreto para supermercados, devolvé null en descuento
- Solo incluí días donde se aplica el descuento en supermercados
- Solo incluí supermercados mencionados explícitamente
- Devolvé SOLO el JSON, sin texto adicional, sin markdown

Texto:
${text.slice(0, 3000)}`

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash-latest:generateContent?key=${geminiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0, maxOutputTokens: 512 },
      }),
    }
  )

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Gemini error ${res.status}: ${err}`)
  }

  const data = await res.json()
  const raw = data.candidates?.[0]?.content?.parts?.[0]?.text ?? ''

  // Limpiar markdown si Gemini lo agrega igual
  const clean = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()

  try {
    const parsed = JSON.parse(clean) as ParsedPromo
    // Validar que los días sean válidos
    parsed.dias = (parsed.dias ?? []).filter((d: string) => DIAS_VALIDOS.includes(d))
    return parsed
  } catch {
    console.warn(`[cron] ${banco}: Gemini devolvió JSON inválido:`, clean)
    return null
  }
}

// ─── Supabase ─────────────────────────────────────────────────────────────────

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

// ─── Handler ──────────────────────────────────────────────────────────────────

export async function GET(req: Request) {
  const auth = req.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret && auth !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const supabase = getSupabase()
    const { data: current } = await supabase
      .from('bank_promos')
      .select('*')
      .eq('activo', true)

    const updates: string[] = []
    const skipped: string[] = []
    const now = new Date().toISOString()

    for (const [banco, meta] of Object.entries(BANK_CATALOG)) {
      try {
        // 1. Buscar con Tavily
        const text = await searchForBank(banco)

        // 2. Parsear con Gemini
        const parsed = await parseWithGemini(banco, text)

        if (!parsed || !parsed.descuento || parsed.dias.length === 0 || parsed.supers.length === 0) {
          // Datos insuficientes: solo actualizar timestamp
          const existing = current?.find(p => p.banco === banco)
          if (existing) {
            await supabase.from('bank_promos')
              .update({ updated_at: now })
              .eq('banco', banco)
              .eq('activo', true)
          }
          skipped.push(banco)
          console.log(`[cron] ${banco}: datos insuficientes, sin cambios`)
          await new Promise(r => setTimeout(r, 500))
          continue
        }

        const existing = current?.find(p => p.banco === banco)

        const hasChanged = !existing ||
          existing.descuento !== parsed.descuento ||
          JSON.stringify([...(existing.dias ?? [])].sort()) !== JSON.stringify([...parsed.dias].sort()) ||
          JSON.stringify([...(existing.supers ?? [])].sort()) !== JSON.stringify([...parsed.supers].sort())

        if (hasChanged) {
          if (existing) {
            await supabase.from('bank_promos').update({
              descuento:  parsed.descuento,
              dias:       parsed.dias,
              supers:     parsed.supers,
              tope:       parsed.tope,
              nota:       parsed.nota,
              updated_at: now,
            }).eq('banco', banco).eq('activo', true)
          } else {
            await supabase.from('bank_promos').insert({
              banco,
              icon:       meta.icon,
              color:      meta.color,
              tarjeta:    meta.tarjeta,
              descuento:  parsed.descuento,
              dias:       parsed.dias,
              supers:     parsed.supers,
              tope:       parsed.tope,
              nota:       parsed.nota,
              activo:     true,
              updated_at: now,
            })
          }
          updates.push(`${banco}: ${parsed.descuento}% los ${parsed.dias.join('/')} en ${parsed.supers.join(', ')}`)
          console.log(`[cron] ${banco}: actualizado →`, parsed)
        } else {
          await supabase.from('bank_promos')
            .update({ updated_at: now })
            .eq('banco', banco)
            .eq('activo', true)
          console.log(`[cron] ${banco}: sin cambios`)
        }

        // Pausa para no saturar APIs
        await new Promise(r => setTimeout(r, 600))
      } catch (err) {
        console.warn(`[cron] ${banco}: error —`, err)
        skipped.push(banco)
      }
    }

    return NextResponse.json({
      ok: true,
      checked: Object.keys(BANK_CATALOG).length,
      updated: updates.length,
      skipped: skipped.length,
      changes: updates,
      updated_at: now,
    })
  } catch (err) {
    console.error('[bank-promos cron] Error:', err)
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 })
  }
}
