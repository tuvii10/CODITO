'use client'

import { useState, useEffect } from 'react'

const WINDOW_HOURS = 6

function getTimeLeft() {
  const now = new Date()
  const hoursSinceEpoch = now.getTime() / (1000 * 60 * 60)
  const currentWindowStart = Math.floor(hoursSinceEpoch / WINDOW_HOURS) * WINDOW_HOURS
  const nextWindow = currentWindowStart + WINDOW_HOURS
  const msUntilNext = (nextWindow - hoursSinceEpoch) * 60 * 60 * 1000
  const totalSeconds = Math.max(0, Math.floor(msUntilNext / 1000))
  const h = Math.floor(totalSeconds / 3600)
  const m = Math.floor((totalSeconds % 3600) / 60)
  const s = totalSeconds % 60
  return { h, m, s }
}

export default function MiniCountdown() {
  const [time, setTime] = useState(getTimeLeft())

  useEffect(() => {
    const interval = setInterval(() => setTime(getTimeLeft()), 1000)
    return () => clearInterval(interval)
  }, [])

  const pad = (n: number) => String(n).padStart(2, '0')

  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      fontSize: 11, fontWeight: 800, color: '#fff',
      background: 'rgba(0,0,0,0.25)',
      padding: '3px 10px', borderRadius: 999,
      fontVariantNumeric: 'tabular-nums',
      letterSpacing: '0.02em',
    }}>
      ⏳ Nuevas en {pad(time.h)}:{pad(time.m)}:{pad(time.s)}
    </span>
  )
}
