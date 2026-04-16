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

const DIAS_REGEX: [RegExp, string][] = [
  [/\bsiempre\b|\btodos los d[ií]as\b|\bcualquier d[ií]a\b/i, 'Siempre'],
  [/\blunes\b/i,     'Lunes'],
  [/\bmartes\b/i,    'Martes'],
  [/\bmi[eé]rcoles\b/i, 'Miércoles'],
  [/\bjueves\b/i,    'Jueves'],
  [/\bviernes\b/i,   'Viernes'],
  [/\bs[aá]bados?\b/i, 'Sábado'],
  [/\bdomingos?\b/i,  'Domingo'],
]

const SUPERS_REGEX: [RegExp, string][] = [
  [/\bchangom[aá]s\b|\bchango\s*m[aá]s\b/i, 'ChangoMás'],
  [/\bcarrefour\b/i,   'Carrefour'],
  [/\bjumbo\b/i,       'Jumbo'],
  [/\bdisco\b/i,       'Disco'],
  [/\bvea\b/i,         'Vea'],
  [/\bcoto\b/i,        'Coto'],
  [/\bd[ií]a\b|\bdia\s*%|\bdia\s+super/i, 'Día'],
  [/\bla\s+an[oó]nima\b/i, 'La Anónima'],
  [/\bwalmarts?\b/i,   'Walmart'],
  [/\bprice\s*smart\b/i, 'PriceSmart'],
  [/\bbehappy\b/i,     'Behappy'],
]

// ─── Búsqueda web (Tavily) ────────────────────────────────────────────────────

async function searchForBank(banco: string): Promise<string> {
  const mes = new Date().toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })
  const query = `descuento ${banco} supermercado Carrefour Coto Jumbo ChangoMás tarjeta ${mes} argentina porcentaje días`

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
  // Usar solo el answer (resumen específico del banco) para evitar mezclar datos de otros bancos
  return data.answer ?? ''
}

// ─── Parser con regex ─────────────────────────────────────────────────────────

type ParsedPromo = {
  descuento: number | null
  dias: string[]
  supers: string[]
  tope: string | null
  nota: string | null
}

function parseWithRegex(text: string): ParsedPromo {
  const KW = '(?:descuento|reintegro|cashback|beneficio|devoluci[oó]n|ahorro)'
  // Patrón A: "30% de reintegro"
  const reA = new RegExp(`(\\d{1,2})\\s*%\\s*(?:de\\s+)?${KW}`, 'gi')
  // Patrón B: "reintegro del 30%"
  const reB = new RegExp(`${KW}\\s+de[l]?\\s+(\\d{1,2})\\s*%`, 'gi')
  const pcts = [
    ...[...text.matchAll(reA)].map(m => parseInt(m[1])),
    ...[...text.matchAll(reB)].map(m => parseInt(m[1])),
  ].filter(n => n >= 5 && n <= 70)
  const descuento = pcts.length > 0 ? Math.max(...pcts) : null

  // Días
  const dias: string[] = []
  for (const [re, dia] of DIAS_REGEX) {
    if (re.test(text) && !dias.includes(dia)) dias.push(dia)
  }
  // Si encontró "Siempre" no necesita días individuales
  const diasFinal = dias.includes('Siempre') ? ['Siempre'] : dias.filter(d => d !== 'Siempre')

  // Supermercados
  const supers: string[] = []
  for (const [re, nombre] of SUPERS_REGEX) {
    if (re.test(text) && !supers.includes(nombre)) supers.push(nombre)
  }

  // Tope: buscar "$X.XXX por semana/mes"
  const topeMatch = text.match(/\$\s*([\d.,]+)\s*(?:por|\/)\s*(semana|mes|compra)/i)
  const tope = topeMatch ? `$${topeMatch[1]} por ${topeMatch[2]}` : null

  return {
    descuento,
    dias: diasFinal.filter(d => DIAS_VALIDOS.includes(d)),
    supers,
    tope,
    nota: null,
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

        // 2. Parsear con regex
        const parsed = parseWithRegex(text)

        if (!parsed.descuento || parsed.dias.length === 0) {
          const existing = current?.find(p => p.banco === banco)
          if (existing) {
            await supabase.from('bank_promos')
              .update({ updated_at: now })
              .eq('banco', banco)
              .eq('activo', true)
          }
          skipped.push(banco)
          console.log(`[cron] ${banco}: datos insuficientes (pct=${parsed.descuento}, dias=${parsed.dias.length})`)
          await new Promise(r => setTimeout(r, 400))
          continue
        }

        // Si no encontró supers específicos, usar fallback genérico
        if (parsed.supers.length === 0) {
          parsed.supers = ['Supermercados adheridos']
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

        await new Promise(r => setTimeout(r, 400))
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
