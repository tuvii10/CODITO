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
    const { email, telegram, query, max_price, channel = 'email' } = body

    if (!query || !max_price) {
      return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 })
    }

    const price = parseFloat(max_price)
    if (isNaN(price) || price <= 0) {
      return NextResponse.json({ error: 'Precio inválido' }, { status: 400 })
    }

    if (channel === 'email') {
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return NextResponse.json({ error: 'Email inválido' }, { status: 400 })
      }

      const supabase = getServiceSupabase()
      const { error } = await supabase
        .from('price_alerts')
        .insert({
          email: email.trim().toLowerCase(),
          query: query.trim(),
          max_price: price,
          channel: 'email',
        })

      if (error) {
        console.error('Supabase error:', error)
        return NextResponse.json({ error: 'No se pudo guardar la alerta' }, { status: 500 })
      }
    } else if (channel === 'telegram') {
      if (!telegram || telegram.trim().length < 3) {
        return NextResponse.json({ error: 'Usuario de Telegram inválido' }, { status: 400 })
      }

      const telegramUser = telegram.trim().replace('@', '')

      // Guardar en Supabase
      const supabase = getServiceSupabase()
      const { error } = await supabase
        .from('price_alerts')
        .insert({
          telegram_username: telegramUser,
          query: query.trim(),
          max_price: price,
          channel: 'telegram',
        })

      if (error) {
        console.error('Supabase error:', error)
        return NextResponse.json({ error: 'No se pudo guardar la alerta' }, { status: 500 })
      }

      // Notificar al usuario por Telegram (si tiene el bot configurado)
      const botToken = process.env.TELEGRAM_BOT_TOKEN
      if (botToken) {
        // Intentamos enviar un mensaje de confirmación si tenemos el chat_id
        // El chat_id se obtiene cuando el usuario hace /start en el bot
        // Por ahora guardamos solo el username y lo resolvemos en el cron de alertas
      }
    } else {
      return NextResponse.json({ error: 'Canal inválido' }, { status: 400 })
    }

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
