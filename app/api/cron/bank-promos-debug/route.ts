import { NextResponse } from 'next/server'

export async function GET(req: Request) {
  const banco = new URL(req.url).searchParams.get('banco') ?? 'Banco Nación'

  // 1. Buscar con Tavily
  const mes = new Date().toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })
  const query = `descuento ${banco} supermercado tarjeta ${mes} argentina porcentaje días tope`

  const tavilyKey = process.env.TAVILY_API_KEY
  if (!tavilyKey) return NextResponse.json({ error: 'Sin TAVILY_API_KEY' })

  const tavilyRes = await fetch('https://api.tavily.com/search', {
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
  const tavilyData = await tavilyRes.json()
  const parts: string[] = []
  if (tavilyData.answer) parts.push(tavilyData.answer)
  for (const r of (tavilyData.results ?? [])) parts.push(`${r.title}: ${r.content}`)
  const text = parts.join(' | ')

  // 2. Llamar a Gemini
  const geminiKey = process.env.GEMINI_API_KEY
  if (!geminiKey) return NextResponse.json({ error: 'Sin GEMINI_API_KEY' })

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

  const geminiRes = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0, maxOutputTokens: 512 },
      }),
    }
  )

  const geminiData = await geminiRes.json()
  const rawGemini = geminiData.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
  const clean = rawGemini.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()

  let parsed = null
  let parseError = null
  try {
    parsed = JSON.parse(clean)
  } catch (e) {
    parseError = String(e)
  }

  return NextResponse.json({
    banco,
    query,
    tavily_answer: tavilyData.answer ?? null,
    tavily_text_length: text.length,
    tavily_text_preview: text.slice(0, 500),
    gemini_raw: rawGemini,
    gemini_clean: clean,
    gemini_parsed: parsed,
    parse_error: parseError,
    gemini_status: geminiRes.status,
  })
}
