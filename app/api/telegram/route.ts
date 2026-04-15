import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Webhook de Telegram — recibe updates del bot @CoditoPreciosBot
// Configurar con: POST https://api.telegram.org/bot{TOKEN}/setWebhook?url=https://codito.com.ar/api/telegram

export async function POST(req: NextRequest) {
  try {
    const botToken = process.env.TELEGRAM_BOT_TOKEN
    if (!botToken) return NextResponse.json({ ok: false })

    const update = await req.json()
    const message = update?.message
    if (!message) return NextResponse.json({ ok: true })

    const chatId = message.chat?.id
    const username = message.from?.username?.toLowerCase()
    const text: string = message.text ?? ''

    if (text.startsWith('/start')) {
      // Registrar chat_id para este username
      if (username) {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
        if (supabaseUrl && supabaseKey) {
          const supabase = createClient(supabaseUrl, supabaseKey)
          // Upsert chat_id en price_alerts para este username
          await supabase
            .from('telegram_users')
            .upsert({ username, chat_id: String(chatId) }, { onConflict: 'username' })
        }
      }

      // Responder con bienvenida
      await sendMessage(botToken, chatId, [
        '¡Hola! 👋 Soy *Codito*, el bot de alertas de precios.',
        '',
        'Cuando registres una alerta de precio en *codito.com.ar*, te voy a avisar aquí en Telegram cuando el producto baje del precio que elijas.',
        '',
        '¡Ya estás conectado! Ahora podés crear alertas desde la web. 🛒',
      ].join('\n'))
    }

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: false })
  }
}

async function sendMessage(token: string, chatId: number, text: string) {
  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'Markdown' }),
  })
}
