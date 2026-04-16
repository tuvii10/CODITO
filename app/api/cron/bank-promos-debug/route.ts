import { NextResponse } from 'next/server'

export const maxDuration = 30

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const test = searchParams.get('test') ?? ''
  const banco = searchParams.get('banco') ?? 'Banco Nación'

  // TEST Gemini
  if (test === 'gemini') {
    const geminiKey = process.env.GEMINI_API_KEY
    if (!geminiKey) return NextResponse.json({ error: 'Sin GEMINI_API_KEY' })

    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash-latest:generateContent?key=${geminiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: 'Respondé solo: {"ok": true}' }] }],
            generationConfig: { temperature: 0, maxOutputTokens: 50 },
          }),
        }
      )
      const data = await res.json()
      return NextResponse.json({ status: res.status, data })
    } catch (e) {
      return NextResponse.json({ error: String(e) })
    }
  }

  // TEST Tavily + pipeline completo para un banco
  if (test === 'tavily') {
    const tavilyKey = process.env.TAVILY_API_KEY
    if (!tavilyKey) return NextResponse.json({ error: 'Sin TAVILY_API_KEY' })

    const mes = new Date().toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })
    const query = `descuento ${banco} supermercado Carrefour Coto Jumbo ChangoMás tarjeta ${mes} argentina porcentaje días`

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
      const answer = data.answer ?? ''

      return NextResponse.json({
        banco,
        answer,
        results_count: data.results?.length ?? 0,
      })
    } catch (e) {
      return NextResponse.json({ error: String(e) })
    }
  }

  return NextResponse.json({ usage: '?test=gemini  o  ?test=tavily&banco=Banco+Nación' })
}
