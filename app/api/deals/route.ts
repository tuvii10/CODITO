import { NextResponse } from 'next/server'
import { fetchAllDeals } from '@/lib/deals'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const deals = await fetchAllDeals()
    return NextResponse.json({ deals, updated_at: new Date().toISOString() })
  } catch {
    return NextResponse.json({ deals: [], updated_at: null }, { status: 500 })
  }
}
