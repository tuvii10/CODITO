'use client'

import { useState, useEffect } from 'react'

const WINDOW_HOURS = 6

function getTimeUntilNextWindow(): { hours: number; minutes: number; seconds: number } {
  const now = new Date()
  const hoursSinceEpoch = now.getTime() / (1000 * 60 * 60)
  const currentWindowStart = Math.floor(hoursSinceEpoch / WINDOW_HOURS) * WINDOW_HOURS
  const nextWindow = currentWindowStart + WINDOW_HOURS
  const msUntilNext = (nextWindow - hoursSinceEpoch) * 60 * 60 * 1000

  const totalSeconds = Math.max(0, Math.floor(msUntilNext / 1000))
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  return { hours, minutes, seconds }
}

export default function CountdownTimer() {
  const [time, setTime] = useState(getTimeUntilNextWindow())

  useEffect(() => {
    const interval = setInterval(() => {
      setTime(getTimeUntilNextWindow())
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  const pad = (n: number) => String(n).padStart(2, '0')

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      background: '#fafafa', borderRadius: 14, padding: '10px 16px',
      border: '1px solid #e4e4e7',
    }}>
      <span style={{ fontSize: 18 }}>🔄</span>
      <div style={{ flex: 1 }}>
        <p style={{ fontSize: 12, fontWeight: 700, color: '#09090b', marginBottom: 2 }}>
          Nuevas ofertas en
        </p>
        <p style={{ fontSize: 11, color: '#71717a' }}>
          Se actualizan cada 6 horas con productos nuevos
        </p>
      </div>
      <div style={{
        display: 'flex', gap: 4, alignItems: 'center',
      }}>
        <div style={{
          background: '#09090b', color: '#fff', borderRadius: 8,
          padding: '6px 8px', fontSize: 16, fontWeight: 900,
          fontVariantNumeric: 'tabular-nums', minWidth: 36, textAlign: 'center',
          letterSpacing: '-0.02em',
        }}>{pad(time.hours)}</div>
        <span style={{ fontSize: 16, fontWeight: 900, color: '#09090b' }}>:</span>
        <div style={{
          background: '#09090b', color: '#fff', borderRadius: 8,
          padding: '6px 8px', fontSize: 16, fontWeight: 900,
          fontVariantNumeric: 'tabular-nums', minWidth: 36, textAlign: 'center',
          letterSpacing: '-0.02em',
        }}>{pad(time.minutes)}</div>
        <span style={{ fontSize: 16, fontWeight: 900, color: '#09090b' }}>:</span>
        <div style={{
          background: '#09090b', color: '#fff', borderRadius: 8,
          padding: '6px 8px', fontSize: 16, fontWeight: 900,
          fontVariantNumeric: 'tabular-nums', minWidth: 36, textAlign: 'center',
          letterSpacing: '-0.02em',
        }}>{pad(time.seconds)}</div>
      </div>
    </div>
  )
}
