import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const maxDuration = 60

// ─── Catálogo de bancos conocidos ─────────────────────────────────────────────
// Para cada banco guardamos los metadatos fijos (icon, color, tarjeta)
// y buscamos si el texto menciona cambios en descuento/días/supers/tope.

const BANK_CATALOG: Record<string, { icon: string; color: string; tarjeta: string }> = {
  'Banco Nación':    { icon: '🇦🇷', color: '#009cde', tarjeta: 'Visa' },
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
}

const DIAS_SEMANA = ['Lunes','Martes','Miércoles','Jueves','Viernes','Sábado','Domingo']

const SUPERS_CONOCIDOS = [
  'Carrefour','Coto','Jumbo','Disco','Vea','Changomás','La Anónima',
  'Día','DIA','Makro','Supermercados Toledo','Walmart',
]

// ─── Parser de texto libre ─────────────────────────────────────────────────────

function extractFromText(banco: string, text: string): {
  descuento: number | null
  dias: string[]
  supers: string[]
  tope: string | null
} {
  const t = text.toLowerCase()

  // Descuento: primer número seguido de %
  const pctMatch = text.match(/(\d{1,2})\s*%/)
  const descuento = pctMatch ? parseInt(pctMatch[1]) : null

  // Días mencionados
  const dias = DIAS_SEMANA.filter(d => t.includes(d.toLowerCase()))
  if (t.includes('todos los días') || t.includes('siempre') || t.includes('todos los dias')) {
    dias.push('Siempre')
  }

  // Supermercados mencionados
  const supers = SUPERS_CONOCIDOS.filter(s => t.includes(s.toLowerCase()))

  // Tope: busca "$NNN.NNN" cerca de palabras clave de tope
  let tope: string | null = null
  const topeMatch = text.match(/(?:tope|hasta|máximo|maximo|límite|limite)[^$\n]*\$\s*([\d.,]+)/i)
    ?? text.match(/\$\s*([\d.,]+)[^$\n]*(?:tope|límite|semanal|mensual|por\s+semana|por\s+mes)/i)
  if (topeMatch) {
    // Buscar la unidad de tiempo cerca
    const nearby = text.slice(Math.max(0, text.indexOf(topeMatch[0]) - 30),
                              text.indexOf(topeMatch[0]) + topeMatch[0].length + 40)
    const unit = nearby.match(/semanal|por semana|mensual|por mes/i)?.[0] ?? ''
    tope = `$${topeMatch[1]}${unit ? ' ' + unit : ''}`
  }

  return { descuento, dias, supers, tope }
}

// ─── Búsqueda web ──────────────────────────────────────────────────────────────

async function searchForBank(banco: string): Promise<string> {
  const mes = new Date().toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })
  const query = `descuento ${banco} supermercado tarjeta ${mes} argentina`

  const tavilyKey = process.env.TAVILY_API_KEY
  if (tavilyKey) {
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

  const serperKey = process.env.SERPER_API_KEY
  if (serperKey) {
    const res = await fetch('https://google.serper.dev/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-API-KEY': serperKey },
      body: JSON.stringify({ q: query, gl: 'ar', hl: 'es', num: 5 }),
    })
    const data = await res.json()
    return (data.organic ?? []).map((r: { title: string; snippet: string }) =>
      `${r.title}: ${r.snippet}`
    ).join(' | ')
  }

  throw new Error('Sin API de búsqueda')
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

    // Leer las promociones actuales de Supabase para comparar
    const { data: current } = await supabase
      .from('bank_promos')
      .select('*')
      .eq('activo', true)

    const updates: string[] = []
    const now = new Date().toISOString()

    // Buscar cada banco y comparar con los datos actuales
    for (const [banco, meta] of Object.entries(BANK_CATALOG)) {
      try {
        const text = await searchForBank(banco)
        const extracted = extractFromText(banco, text)

        // Solo actualizar si encontramos datos concretos
        if (!extracted.descuento || extracted.dias.length === 0 || extracted.supers.length === 0) {
          console.log(`[cron] ${banco}: datos insuficientes, sin cambios`)
          continue
        }

        const existing = current?.find(p => p.banco === banco)

        const changed =
          !existing ||
          existing.descuento !== extracted.descuento ||
          JSON.stringify(existing.dias.sort()) !== JSON.stringify(extracted.dias.sort()) ||
          JSON.stringify(existing.supers.sort()) !== JSON.stringify(extracted.supers.sort())

        if (changed) {
          if (existing) {
            // Actualizar registro existente
            await supabase.from('bank_promos').update({
              descuento:  extracted.descuento,
              dias:       extracted.dias,
              supers:     extracted.supers,
              tope:       extracted.tope,
              updated_at: now,
            }).eq('banco', banco).eq('activo', true)
          } else {
            // Insertar banco nuevo
            await supabase.from('bank_promos').insert({
              banco,
              icon:       meta.icon,
              color:      meta.color,
              tarjeta:    meta.tarjeta,
              descuento:  extracted.descuento,
              dias:       extracted.dias,
              supers:     extracted.supers,
              tope:       extracted.tope,
              activo:     true,
              updated_at: now,
            })
          }
          updates.push(`${banco}: ${extracted.descuento}% los ${extracted.dias.join('/')}`)
          console.log(`[cron] ${banco}: actualizado →`, extracted)
        } else {
          // Sin cambios, solo tocar updated_at para mostrar que se verificó
          await supabase.from('bank_promos')
            .update({ updated_at: now })
            .eq('banco', banco)
            .eq('activo', true)
          console.log(`[cron] ${banco}: sin cambios`)
        }

        // Pausa entre búsquedas para no saturar la API
        await new Promise(r => setTimeout(r, 500))
      } catch (err) {
        console.warn(`[cron] ${banco}: error buscando —`, err)
      }
    }

    return NextResponse.json({
      ok: true,
      checked: Object.keys(BANK_CATALOG).length,
      updated: updates.length,
      changes: updates,
      updated_at: now,
    })
  } catch (err) {
    console.error('[bank-promos cron] Error:', err)
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 })
  }
}
