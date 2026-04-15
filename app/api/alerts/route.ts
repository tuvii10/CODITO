import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getServiceSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Faltan variables de entorno de Supabase')
  return createClient(url, key)
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { email, query, max_price } = body

    if (!email || !query || !max_price) {
      return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 })
    }

    // Validar email básico
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Email inválido' }, { status: 400 })
    }

    const price = parseFloat(max_price)
    if (isNaN(price) || price <= 0) {
      return NextResponse.json({ error: 'Precio inválido' }, { status: 400 })
    }

    const supabase = getServiceSupabase()
    const { error } = await supabase
      .from('price_alerts')
      .insert({ email: email.trim().toLowerCase(), query: query.trim(), max_price: price })

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json({ error: 'No se pudo guardar la alerta' }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
