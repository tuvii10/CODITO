import { NextResponse } from 'next/server'

export const maxDuration = 30

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
]

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const test = searchParams.get('test') ?? 'tavily'
  const banco = searchParams.get('banco') ?? 'Banco Nación'

  // TEST: Tavily + regex para un banco
  if (test === 'tavily') {
    const tavilyKey = process.env.TAVILY_API_KEY
    if (!tavilyKey) return NextResponse.json({ error: 'Sin TAVILY_API_KEY' })

    const mes = new Date().toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })
    const query = `descuento ${banco} supermercado tarjeta ${mes} argentina porcentaje días tope`

    try {
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
      const text = parts.join(' | ')

      // Aplicar regex
      const KW = '(?:descuento|reintegro|cashback|beneficio|devoluci[oó]n|ahorro)'
      const reA = new RegExp(`(\\d{1,2})\\s*%\\s*(?:de\\s+)?${KW}`, 'gi')
      const reB = new RegExp(`${KW}\\s+de[l]?\\s+(\\d{1,2})\\s*%`, 'gi')
      const pcts = [
        ...[...text.matchAll(reA)].map(m => parseInt(m[1])),
        ...[...text.matchAll(reB)].map(m => parseInt(m[1])),
      ].filter(n => n >= 5 && n <= 70)

      const dias: string[] = []
      for (const [re, dia] of DIAS_REGEX) {
        if (re.test(text) && !dias.includes(dia)) dias.push(dia)
      }

      const supers: string[] = []
      for (const [re, nombre] of SUPERS_REGEX) {
        if (re.test(text) && !supers.includes(nombre)) supers.push(nombre)
      }

      const topeMatch = text.match(/\$\s*([\d.,]+)\s*(?:por|\/)\s*(semana|mes|compra)/i)

      return NextResponse.json({
        banco,
        query,
        text_preview: text.slice(0, 800),
        parsed: {
          pcts_found: pcts,
          descuento: pcts.length > 0 ? Math.max(...pcts) : null,
          dias,
          supers,
          tope: topeMatch ? `$${topeMatch[1]} por ${topeMatch[2]}` : null,
        },
      })
    } catch (e) {
      return NextResponse.json({ error: String(e) })
    }
  }

  return NextResponse.json({ usage: '?test=tavily&banco=Banco+Nación' })
}
