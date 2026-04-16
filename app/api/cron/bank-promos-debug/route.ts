import { NextResponse } from 'next/server'

export const maxDuration = 30

export async function GET(req: Request) {
  const test = new URL(req.url).searchParams.get('test') ?? 'gemini'

  // TEST 1: solo Gemini con texto hardcodeado
  if (test === 'gemini') {
    const geminiKey = process.env.GEMINI_API_KEY
    if (!geminiKey) return NextResponse.json({ error: 'Sin GEMINI_API_KEY' })

    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`,
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

  // TEST 2: solo Tavily
  if (test === 'tavily') {
    const tavilyKey = process.env.TAVILY_API_KEY
    if (!tavilyKey) return NextResponse.json({ error: 'Sin TAVILY_API_KEY' })

    try {
      const res = await fetch('https://api.tavily.com/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          api_key: tavilyKey,
          query: 'descuento Banco Nación supermercado abril 2026',
          search_depth: 'basic',
          max_results: 2,
          include_answer: true,
        }),
      })
      const data = await res.json()
      return NextResponse.json({ status: res.status, answer: data.answer, results: data.results?.length })
    } catch (e) {
      return NextResponse.json({ error: String(e) })
    }
  }

  return NextResponse.json({ usage: '?test=gemini  o  ?test=tavily' })
}
