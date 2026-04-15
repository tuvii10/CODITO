import { NextResponse } from 'next/server'

export const revalidate = 1800 // 30 minutos

type Dolar = { casa: string; nombre: string; compra: number; venta: number }

export async function GET() {
  try {
    const res = await fetch('https://dolarapi.com/v1/dolares', {
      next: { revalidate: 1800 },
      signal: AbortSignal.timeout(5000),
    })
    if (!res.ok) throw new Error('API error')
    const data: Dolar[] = await res.json()
    const blue    = data.find(d => d.casa === 'blue')
    const oficial = data.find(d => d.casa === 'oficial')
    const mep     = data.find(d => d.casa === 'bolsa')
    return NextResponse.json({
      blue:    blue?.venta    ?? null,
      oficial: oficial?.venta ?? null,
      mep:     mep?.venta     ?? null,
    })
  } catch {
    return NextResponse.json({ blue: null, oficial: null, mep: null }, { status: 500 })
  }
}
