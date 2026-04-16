'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'

// ─── Datos IPC INDEC (tasa mensual %) ────────────────────────────────────────

const MONTHLY_INFLATION: Record<string, number> = {
  '2026-03': 3.4, '2026-02': 2.9, '2026-01': 2.5,
  '2025-12': 2.7, '2025-11': 2.4, '2025-10': 2.7,
  '2025-09': 3.5, '2025-08': 4.2, '2025-07': 4.0,
  '2025-06': 4.6, '2025-05': 3.3, '2025-04': 3.4,
  '2025-03': 3.7, '2025-02': 2.4, '2025-01': 2.2,
  '2024-12': 2.7, '2024-11': 2.4, '2024-10': 2.7,
  '2024-09': 3.5, '2024-08': 4.2, '2024-07': 4.0,
  '2024-06': 4.6, '2024-05': 4.2, '2024-04': 8.8,
  '2024-03': 11.0, '2024-02': 13.2, '2024-01': 20.6,
  '2023-12': 25.5, '2023-11': 12.8, '2023-10': 8.3,
  '2023-09': 12.7, '2023-08': 12.4, '2023-07': 6.3,
  '2023-06': 6.0, '2023-05': 7.8, '2023-04': 8.4,
  '2023-03': 7.7, '2023-02': 6.6, '2023-01': 6.0,
  '2022-12': 5.1, '2022-11': 4.9, '2022-10': 6.3,
  '2022-09': 6.2, '2022-08': 7.0, '2022-07': 7.4,
  '2022-06': 5.3, '2022-05': 5.1, '2022-04': 6.0,
  '2022-03': 6.7, '2022-02': 4.7, '2022-01': 3.9,
  '2021-12': 3.8, '2021-11': 2.5, '2021-10': 3.5,
  '2021-09': 3.5, '2021-08': 2.5, '2021-07': 3.0,
  '2021-06': 3.2, '2021-05': 3.3, '2021-04': 4.1,
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const TIME_OPTIONS = [
  { label: 'Hace 1 mes', months: 1 },
  { label: 'Hace 3 meses', months: 3 },
  { label: 'Hace 6 meses', months: 6 },
  { label: 'Hace 1 año', months: 12 },
  { label: 'Hace 2 años', months: 24 },
  { label: 'Hace 3 años', months: 36 },
  { label: 'Hace 5 años', months: 60 },
]

const FUN_FACTS = [
  { name: 'Café', price: 1500, emoji: '☕' },
  { name: 'Kilo de pan', price: 2000, emoji: '🍞' },
  { name: 'Nafta súper (litro)', price: 800, emoji: '⛽' },
]

function formatARS(value: number): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(value)
}

function getMonthKey(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  return `${y}-${m}`
}

function compoundInflation(monthsAgo: number): number {
  const now = new Date(2026, 3, 1) // April 2026 (current month)
  let factor = 1
  for (let i = 1; i <= monthsAgo; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const key = getMonthKey(d)
    const rate = MONTHLY_INFLATION[key] ?? 0
    factor *= (1 + rate / 100)
  }
  return factor
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function InflacitoPage() {
  const [amount, setAmount] = useState<string>('')
  const [monthsAgo, setMonthsAgo] = useState<number>(12)

  const factor = useMemo(() => compoundInflation(monthsAgo), [monthsAgo])

  const parsedAmount = parseFloat(amount.replace(/\./g, '').replace(',', '.')) || 0
  const adjustedAmount = parsedAmount * factor
  const lossPercent = factor > 1 ? ((factor - 1) * 100) : 0
  const hasResult = parsedAmount > 0

  const barMaxWidth = 100
  const oldBarWidth = hasResult ? (parsedAmount / adjustedAmount) * barMaxWidth : 0
  const newBarWidth = barMaxWidth

  const selectedLabel = TIME_OPTIONS.find(o => o.months === monthsAgo)?.label ?? ''

  // Fun facts use 12 months ago
  const factorOneYear = useMemo(() => compoundInflation(12), [])

  return (
    <div style={{ minHeight: '100dvh', background: '#fafafa' }}>
      <div style={{
        maxWidth: 520,
        margin: '0 auto',
        padding: 'clamp(16px, 4vw, 32px)',
        display: 'flex',
        flexDirection: 'column',
        gap: 'clamp(16px, 4vw, 24px)',
      }}>

        {/* Back button */}
        <div>
          <Link href="/" style={{
            fontSize: 13,
            fontWeight: 700,
            background: '#f4f4f5',
            border: '1px solid #e4e4e7',
            borderRadius: 10,
            padding: '7px 14px',
            textDecoration: 'none',
            color: '#18181b',
            display: 'inline-block',
          }}>
            ← Volver
          </Link>
        </div>

        {/* Header */}
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: 64,
            height: 64,
            borderRadius: 16,
            background: 'linear-gradient(135deg, #ef4444, #f97316)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 32,
            margin: '0 auto 12px',
          }}>
            📈
          </div>
          <h1 style={{
            fontSize: 'clamp(24px, 6vw, 36px)',
            fontWeight: 900,
            margin: 0,
            color: '#18181b',
          }}>
            Inflacito
          </h1>
          <p style={{ color: '#71717a', fontSize: 14, margin: '4px 0 0' }}>
            Calculá cuánto poder de compra perdiste
          </p>
        </div>

        {/* Input Card */}
        <div style={{
          background: '#fff',
          borderRadius: 20,
          padding: 'clamp(16px, 4vw, 24px)',
          border: '1px solid #e4e4e7',
          boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
        }}>
          {/* Amount input */}
          <div>
            <label style={{
              fontSize: 12,
              fontWeight: 700,
              color: '#71717a',
              textTransform: 'uppercase' as const,
              letterSpacing: '0.08em',
              display: 'block',
              marginBottom: 6,
            }}>
              Monto en pesos
            </label>
            <div style={{ position: 'relative' }}>
              <span style={{
                position: 'absolute',
                left: 14,
                top: '50%',
                transform: 'translateY(-50%)',
                fontSize: 18,
                fontWeight: 700,
                color: '#a1a1aa',
              }}>$</span>
              <input
                type="text"
                inputMode="numeric"
                placeholder="10.000"
                value={amount}
                onChange={e => {
                  const raw = e.target.value.replace(/[^\d]/g, '')
                  setAmount(raw)
                }}
                style={{
                  width: '100%',
                  padding: '14px 14px 14px 34px',
                  fontSize: 20,
                  fontWeight: 700,
                  border: '1px solid #e4e4e7',
                  borderRadius: 12,
                  outline: 'none',
                  background: '#fafafa',
                  color: '#18181b',
                  boxSizing: 'border-box',
                }}
              />
            </div>
          </div>

          {/* Time selector */}
          <div>
            <label style={{
              fontSize: 12,
              fontWeight: 700,
              color: '#71717a',
              textTransform: 'uppercase' as const,
              letterSpacing: '0.08em',
              display: 'block',
              marginBottom: 6,
            }}>
              ¿Cuándo pagabas eso?
            </label>
            <select
              value={monthsAgo}
              onChange={e => setMonthsAgo(Number(e.target.value))}
              style={{
                width: '100%',
                padding: '14px',
                fontSize: 16,
                fontWeight: 600,
                border: '1px solid #e4e4e7',
                borderRadius: 12,
                outline: 'none',
                background: '#fafafa',
                color: '#18181b',
                cursor: 'pointer',
                boxSizing: 'border-box',
              }}
            >
              {TIME_OPTIONS.map(opt => (
                <option key={opt.months} value={opt.months}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Result Cards */}
        {hasResult && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {/* Today's equivalent */}
            <div style={{
              background: 'linear-gradient(135deg, #fef2f2, #fee2e2)',
              borderRadius: 20,
              padding: 'clamp(16px, 4vw, 24px)',
              border: '1px solid #fecaca',
              boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
            }}>
              <p style={{
                fontSize: 12,
                fontWeight: 700,
                color: '#71717a',
                textTransform: 'uppercase' as const,
                letterSpacing: '0.08em',
                margin: '0 0 4px',
              }}>
                Hoy necesitás
              </p>
              <p style={{
                fontSize: 'clamp(28px, 7vw, 40px)',
                fontWeight: 900,
                color: '#dc2626',
                margin: 0,
                lineHeight: 1.1,
              }}>
                {formatARS(adjustedAmount)}
              </p>
              <p style={{ fontSize: 13, color: '#71717a', margin: '6px 0 0' }}>
                para comprar lo mismo que antes costaba {formatARS(parsedAmount)}
              </p>
            </div>

            {/* Purchasing power loss */}
            <div style={{
              background: 'linear-gradient(135deg, #fff7ed, #ffedd5)',
              borderRadius: 20,
              padding: 'clamp(16px, 4vw, 24px)',
              border: '1px solid #fed7aa',
              boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
            }}>
              <p style={{
                fontSize: 12,
                fontWeight: 700,
                color: '#71717a',
                textTransform: 'uppercase' as const,
                letterSpacing: '0.08em',
                margin: '0 0 4px',
              }}>
                Perdiste de poder de compra
              </p>
              <p style={{
                fontSize: 'clamp(28px, 7vw, 40px)',
                fontWeight: 900,
                color: '#ea580c',
                margin: 0,
                lineHeight: 1.1,
              }}>
                {lossPercent.toFixed(1)}%
              </p>
              <p style={{ fontSize: 13, color: '#71717a', margin: '6px 0 0' }}>
                {selectedLabel.toLowerCase()}
              </p>
            </div>

            {/* Visual comparison bar */}
            <div style={{
              background: '#fff',
              borderRadius: 20,
              padding: 'clamp(16px, 4vw, 24px)',
              border: '1px solid #e4e4e7',
              boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
            }}>
              <p style={{
                fontSize: 12,
                fontWeight: 700,
                color: '#71717a',
                textTransform: 'uppercase' as const,
                letterSpacing: '0.08em',
                margin: '0 0 14px',
              }}>
                Comparación visual
              </p>

              {/* Old amount bar */}
              <div style={{ marginBottom: 10 }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: 12,
                  fontWeight: 600,
                  color: '#52525b',
                  marginBottom: 4,
                }}>
                  <span>Antes</span>
                  <span>{formatARS(parsedAmount)}</span>
                </div>
                <div style={{
                  height: 28,
                  background: '#f4f4f5',
                  borderRadius: 8,
                  overflow: 'hidden',
                }}>
                  <div style={{
                    width: `${oldBarWidth}%`,
                    height: '100%',
                    background: 'linear-gradient(90deg, #60a5fa, #3b82f6)',
                    borderRadius: 8,
                    transition: 'width 0.5s ease',
                  }} />
                </div>
              </div>

              {/* New amount bar */}
              <div>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: 12,
                  fontWeight: 600,
                  color: '#52525b',
                  marginBottom: 4,
                }}>
                  <span>Hoy</span>
                  <span>{formatARS(adjustedAmount)}</span>
                </div>
                <div style={{
                  height: 28,
                  background: '#f4f4f5',
                  borderRadius: 8,
                  overflow: 'hidden',
                }}>
                  <div style={{
                    width: `${newBarWidth}%`,
                    height: '100%',
                    background: 'linear-gradient(90deg, #f87171, #dc2626)',
                    borderRadius: 8,
                    transition: 'width 0.5s ease',
                  }} />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Fun Facts */}
        <div style={{
          background: '#fff',
          borderRadius: 20,
          padding: 'clamp(16px, 4vw, 24px)',
          border: '1px solid #e4e4e7',
          boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
        }}>
          <p style={{
            fontSize: 12,
            fontWeight: 700,
            color: '#71717a',
            textTransform: 'uppercase' as const,
            letterSpacing: '0.08em',
            margin: '0 0 14px',
          }}>
            Datos curiosos (hace 1 año)
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {FUN_FACTS.map(fact => {
              const todayPrice = fact.price * factorOneYear
              return (
                <div key={fact.name} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '12px 14px',
                  background: '#fafafa',
                  borderRadius: 12,
                  border: '1px solid #f4f4f5',
                }}>
                  <span style={{ fontSize: 28 }}>{fact.emoji}</span>
                  <div style={{ flex: 1 }}>
                    <p style={{
                      margin: 0,
                      fontSize: 14,
                      fontWeight: 700,
                      color: '#18181b',
                    }}>
                      {fact.name}
                    </p>
                    <p style={{
                      margin: '2px 0 0',
                      fontSize: 13,
                      color: '#71717a',
                    }}>
                      Costaba {formatARS(fact.price)} → hoy sale{' '}
                      <span style={{ fontWeight: 700, color: '#dc2626' }}>
                        {formatARS(todayPrice)}
                      </span>
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Footer */}
        <p style={{
          textAlign: 'center',
          fontSize: 11,
          color: '#a1a1aa',
          margin: 0,
          paddingBottom: 16,
        }}>
          Datos aproximados basados en IPC INDEC. Solo con fines ilustrativos.
        </p>
      </div>
    </div>
  )
}
