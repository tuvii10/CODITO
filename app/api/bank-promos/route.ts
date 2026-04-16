import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const revalidate = 3600 // revalidar cada hora

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!
  return createClient(url, key)
}

export async function GET() {
  try {
    const supabase = getSupabase()
    const { data, error } = await supabase
      .from('bank_promos')
      .select('*')
      .eq('activo', true)
      .order('descuento', { ascending: false })

    if (error) throw error

    return NextResponse.json({
      promos: data,
      updated_at: data?.[0]?.updated_at ?? null,
    })
  } catch (err) {
    console.error('[bank-promos] Error:', err)
    return NextResponse.json({ promos: [], updated_at: null }, { status: 500 })
  }
}
