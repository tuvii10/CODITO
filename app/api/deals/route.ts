import { NextResponse } from 'next/server'
import { fetchAllDeals } from '@/lib/deals'

// Cachear 6 horas — las ofertas rotan cada 6 horas con productos nuevos
export const revalidate = 21600

export async function GET() {
  try {
    const deals = await fetchAllDeals()
    return NextResponse.json({
      deals,
      total: deals.length,
      updated_at: new Date().toISOString(),
    })
  } catch {
    return NextResponse.json({ deals: [], total: 0, updated_at: null }, { status: 500 })
  }
}
