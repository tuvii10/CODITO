import { NextResponse } from 'next/server'
import { fetchAllDeals } from '@/lib/deals'

// Cachear 24 horas — las ofertas se refrescan una vez por día
export const revalidate = 86400

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
