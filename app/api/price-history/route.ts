import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const revalidate = 300 // 5 minutos

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get('q')?.toLowerCase().trim()
  if (!query) return NextResponse.json({ error: 'Falta q' }, { status: 400 })

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return NextResponse.json({ points: [] })

  const supabase = createClient(url, key)

  // Últimos 30 días, agrupado por día — tomamos el mínimo precio del día
  const { data, error } = await supabase
    .from('price_history')
    .select('price, recorded_at')
    .eq('query', query)
    .gte('recorded_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
    .order('recorded_at', { ascending: true })

  if (error || !data) return NextResponse.json({ points: [] })

  // Agrupar por día y tomar el mínimo
  const byDay = new Map<string, number>()
  for (const row of data) {
    const day = row.recorded_at.slice(0, 10) // YYYY-MM-DD
    const existing = byDay.get(day)
    if (existing === undefined || row.price < existing) {
      byDay.set(day, row.price)
    }
  }

  const points = Array.from(byDay.entries())
    .map(([date, price]) => ({ date, price }))
    .sort((a, b) => a.date.localeCompare(b.date))

  return NextResponse.json({ points }, {
    headers: { 'Access-Control-Allow-Origin': '*' },
  })
}
