'use client'

import { useEffect, useState } from 'react'

type Point = { date: string; price: number }

export default function PriceSparkline({ query }: { query: string }) {
  const [points, setPoints] = useState<Point[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!query) return
    setLoading(true)
    fetch(`/api/price-history?q=${encodeURIComponent(query.toLowerCase())}`)
      .then(r => r.json())
      .then(d => {
        setPoints(d.points ?? [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [query])

  if (loading || points.length < 2) return null

  const prices = points.map(p => p.price)
  const min = Math.min(...prices)
  const max = Math.max(...prices)
  const latest = prices[prices.length - 1]
  const first = prices[0]
  const trend = latest < first ? 'down' : latest > first ? 'up' : 'flat'
  const pctChange = first > 0 ? ((latest - first) / first) * 100 : 0

  const W = 120
  const H = 36
  const pad = 2

  function toX(i: number) {
    return pad + (i / (points.length - 1)) * (W - pad * 2)
  }
  function toY(price: number) {
    if (max === min) return H / 2
    return H - pad - ((price - min) / (max - min)) * (H - pad * 2)
  }

  const d = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'}${toX(i).toFixed(1)},${toY(p.price).toFixed(1)}`)
    .join(' ')

  const color = trend === 'down' ? '#16a34a' : trend === 'up' ? '#ef4444' : '#6b7280'
  const label = trend === 'down'
    ? `↓ ${Math.abs(pctChange).toFixed(0)}% en 30d`
    : trend === 'up'
    ? `↑ ${pctChange.toFixed(0)}% en 30d`
    : 'Sin cambios en 30d'

  return (
    <div style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 8,
      background: trend === 'down' ? '#f0fdf4' : trend === 'up' ? '#fef2f2' : '#f4f4f5',
      border: `1px solid ${trend === 'down' ? '#bbf7d0' : trend === 'up' ? '#fecaca' : '#e4e4e7'}`,
      borderRadius: 10,
      padding: '5px 10px',
      marginTop: 10,
    }}>
      <svg width={W} height={H} style={{ flexShrink: 0 }}>
        <path d={d} stroke={color} strokeWidth={2} fill="none" strokeLinecap="round" strokeLinejoin="round" />
        {/* Punto final */}
        <circle
          cx={toX(points.length - 1)}
          cy={toY(latest)}
          r={3}
          fill={color}
        />
      </svg>
      <div>
        <p style={{ fontSize: 11, fontWeight: 700, color, margin: 0 }}>{label}</p>
        <p style={{ fontSize: 10, color: '#71717a', margin: 0 }}>
          Mín: {fmt(min)} · Máx: {fmt(max)}
        </p>
      </div>
    </div>
  )
}

function fmt(n: number) {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency', currency: 'ARS', maximumFractionDigits: 0,
  }).format(n)
}
