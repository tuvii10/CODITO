'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'

// ─── Types ───────────────────────────────────────────────────────────────────

type DolarRate = {
  moneda: string
  casa: string
  nombre: string
  compra: number | null
  venta: number | null
  fechaActualizacion: string
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmt(n: number) {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 2,
  }).format(n)
}

function fmtUsd(n: number) {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  }).format(n)
}

function spread(compra: number | null, venta: number | null): string {
  if (!compra || !venta || compra === 0) return '-'
  return ((venta - compra) / compra * 100).toFixed(1) + '%'
}

function timeAgo(dateStr: string): string {
  const now = new Date()
  const date = new Date(dateStr)
  const diffMs = now.getTime() - date.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  if (diffMin < 1) return 'hace instantes'
  if (diffMin < 60) return `hace ${diffMin} min`
  const diffHrs = Math.floor(diffMin / 60)
  if (diffHrs < 24) return `hace ${diffHrs}h`
  return date.toLocaleDateString('es-AR')
}

// Order and display config for dollar types
const CASA_ORDER = ['blue', 'oficial', 'tarjeta', 'mep', 'bolsa', 'contadoconliqui', 'mayorista', 'cripto']

const CASA_LABELS: Record<string, string> = {
  blue: 'Dólar Blue',
  oficial: 'Dólar Oficial',
  tarjeta: 'Dólar Tarjeta',
  mep: 'Dólar MEP',
  bolsa: 'Dólar Bolsa',
  contadoconliqui: 'Dólar CCL',
  mayorista: 'Dólar Mayorista',
  cripto: 'Dólar Cripto',
}

const CASA_ICONS: Record<string, string> = {
  blue: '🔵',
  oficial: '🏛️',
  tarjeta: '💳',
  mep: '📈',
  bolsa: '📊',
  contadoconliqui: '🔄',
  mayorista: '🏭',
  cripto: '₿',
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function Dolarito() {
  const [rates, setRates] = useState<DolarRate[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [arsInput, setArsInput] = useState('')

  useEffect(() => {
    fetch('https://dolarapi.com/v1/dolares')
      .then(res => {
        if (!res.ok) throw new Error(`Error ${res.status}`)
        return res.json()
      })
      .then((data: DolarRate[]) => {
        setRates(data)
        setLoading(false)
      })
      .catch(err => {
        setError(err.message || 'No se pudieron cargar las cotizaciones')
        setLoading(false)
      })
  }, [])

  // Check if API already returns "tarjeta"; if not, compute it from oficial
  const processedRates = useMemo(() => {
    const hasTarjeta = rates.some(r => r.casa === 'tarjeta')
    let allRates = [...rates]

    if (!hasTarjeta) {
      const oficial = rates.find(r => r.casa === 'oficial')
      if (oficial && oficial.venta) {
        allRates.push({
          moneda: 'USD',
          casa: 'tarjeta',
          nombre: 'Tarjeta',
          compra: null,
          venta: Math.round(oficial.venta * 1.60 * 100) / 100,
          fechaActualizacion: oficial.fechaActualizacion,
        })
      }
    }

    // Sort by defined order
    allRates.sort((a, b) => {
      const ia = CASA_ORDER.indexOf(a.casa)
      const ib = CASA_ORDER.indexOf(b.casa)
      return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib)
    })

    return allRates
  }, [rates])

  const arsAmount = parseFloat(arsInput.replace(/\./g, '').replace(',', '.')) || 0

  const blueRate = processedRates.find(r => r.casa === 'blue')
  const oficialRate = processedRates.find(r => r.casa === 'oficial')

  const lastUpdate = rates.length > 0
    ? rates.reduce((latest, r) => {
        const d = new Date(r.fechaActualizacion)
        return d > latest ? d : latest
      }, new Date(0))
    : null

  return (
    <div style={{ maxWidth: 680, margin: '0 auto' }}>

      {/* Back */}
      <div style={{ marginBottom: 20 }}>
        <Link href="/" style={{ fontSize: 13, fontWeight: 700, color: '#09090b', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6, background: '#f4f4f5', border: '1px solid #e4e4e7', borderRadius: 10, padding: '7px 14px' }}>
          ← Inicio
        </Link>
      </div>

      {/* Header */}
      <div style={{ marginBottom: 32, textAlign: 'center' }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          width: 64, height: 64, borderRadius: 20,
          background: 'linear-gradient(135deg, #16a34a, #22c55e)',
          fontSize: 30, marginBottom: 14,
          boxShadow: '0 8px 24px rgba(22,163,74,0.35)',
        }}>💵</div>
        <h1 style={{ fontSize: 'clamp(24px, 6vw, 36px)', fontWeight: 900, color: '#09090b', letterSpacing: '-0.03em', marginBottom: 8 }}>
          Dolarito
        </h1>
        <p style={{ fontSize: 14, color: '#71717a', maxWidth: 420, margin: '0 auto', lineHeight: 1.5 }}>
          Cotizaciones del dólar en Argentina en tiempo real.
        </p>
        {lastUpdate && (
          <p style={{ fontSize: 12, color: '#a1a1aa', marginTop: 8 }}>
            Última actualización: {timeAgo(lastUpdate.toISOString())}
          </p>
        )}
      </div>

      {/* Loading */}
      {loading && (
        <div style={{
          padding: '48px 20px',
          textAlign: 'center',
        }}>
          <div style={{
            display: 'inline-block',
            width: 36,
            height: 36,
            border: '4px solid #e4e4e7',
            borderTopColor: '#16a34a',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
          }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
          <p style={{ fontSize: 14, color: '#71717a', marginTop: 12 }}>Cargando cotizaciones...</p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div style={{
          padding: '20px',
          borderRadius: 20,
          background: '#fef2f2',
          border: '1px solid #fca5a5',
          textAlign: 'center',
          marginBottom: 16,
        }}>
          <p style={{ fontSize: 14, fontWeight: 600, color: '#dc2626', marginBottom: 4 }}>Error al cargar datos</p>
          <p style={{ fontSize: 12, color: '#ef4444' }}>{error}</p>
        </div>
      )}

      {/* Converter */}
      {!loading && !error && (
        <div style={{
          background: '#fff',
          borderRadius: 20,
          padding: 'clamp(16px,4vw,24px)',
          border: '1px solid #e4e4e7',
          boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
          marginBottom: 16,
        }}>
          <label style={{ fontSize: 12, fontWeight: 700, color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8, display: 'block' }}>
            Convertir pesos a dólares
          </label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 0, border: '2px solid #e4e4e7', borderRadius: 14, overflow: 'hidden', background: '#fafafa', marginBottom: 14 }}>
            <span style={{ padding: '14px 16px', fontSize: 18, fontWeight: 700, color: '#71717a', borderRight: '1px solid #e4e4e7', background: '#f4f4f5', flexShrink: 0 }}>
              $
            </span>
            <input
              type="text"
              inputMode="numeric"
              value={arsInput}
              onChange={e => setArsInput(e.target.value.replace(/[^0-9.,]/g, ''))}
              placeholder="Monto en ARS"
              style={{
                flex: 1,
                border: 'none',
                outline: 'none',
                background: 'transparent',
                fontSize: 'clamp(18px,4vw,24px)',
                fontWeight: 800,
                color: '#09090b',
                padding: '12px 16px',
                letterSpacing: '-0.02em',
                fontVariantNumeric: 'tabular-nums',
              }}
            />
          </div>

          {arsAmount > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {/* Blue conversion */}
              <div style={{
                padding: '12px 14px',
                borderRadius: 14,
                background: '#eff6ff',
                border: '1px solid #bfdbfe',
              }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: '#3b82f6', marginBottom: 4 }}>USD BLUE</p>
                <p style={{ fontSize: 'clamp(18px,4vw,24px)', fontWeight: 900, color: '#1d4ed8', letterSpacing: '-0.02em' }}>
                  {blueRate?.venta ? fmtUsd(arsAmount / blueRate.venta) : '-'}
                </p>
              </div>
              {/* Oficial conversion */}
              <div style={{
                padding: '12px 14px',
                borderRadius: 14,
                background: '#f0fdf4',
                border: '1px solid #bbf7d0',
              }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: '#16a34a', marginBottom: 4 }}>USD OFICIAL</p>
                <p style={{ fontSize: 'clamp(18px,4vw,24px)', fontWeight: 900, color: '#15803d', letterSpacing: '-0.02em' }}>
                  {oficialRate?.venta ? fmtUsd(arsAmount / oficialRate.venta) : '-'}
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Rate cards */}
      {!loading && !error && (
        <div style={{ display: 'grid', gap: 12, marginBottom: 32 }}>
          {processedRates.map(rate => {
            const isBlue = rate.casa === 'blue'
            const label = CASA_LABELS[rate.casa] || rate.nombre
            const icon = CASA_ICONS[rate.casa] || '💱'

            return (
              <div
                key={rate.casa}
                style={{
                  background: isBlue
                    ? 'linear-gradient(135deg, #eff6ff, #dbeafe)'
                    : '#fff',
                  borderRadius: 20,
                  padding: 'clamp(16px,4vw,24px)',
                  border: isBlue
                    ? '2px solid #60a5fa'
                    : '1px solid #e4e4e7',
                  boxShadow: isBlue
                    ? '0 4px 20px rgba(59,130,246,0.15)'
                    : '0 2px 12px rgba(0,0,0,0.04)',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                {isBlue && (
                  <span style={{
                    position: 'absolute',
                    top: 12,
                    right: 14,
                    fontSize: 10,
                    fontWeight: 700,
                    color: '#2563eb',
                    background: '#bfdbfe',
                    padding: '3px 8px',
                    borderRadius: 999,
                  }}>
                    Más consultado
                  </span>
                )}

                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                  <span style={{ fontSize: 22 }}>{icon}</span>
                  <div>
                    <p style={{ fontSize: 15, fontWeight: 800, color: '#09090b' }}>{label}</p>
                    <p style={{ fontSize: 11, color: '#a1a1aa' }}>
                      {timeAgo(rate.fechaActualizacion)}
                    </p>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                  {/* Compra */}
                  <div>
                    <p style={{ fontSize: 12, fontWeight: 700, color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>
                      Compra
                    </p>
                    <p style={{
                      fontSize: 'clamp(18px,4vw,24px)',
                      fontWeight: 900,
                      color: '#16a34a',
                      letterSpacing: '-0.02em',
                    }}>
                      {rate.compra != null ? fmt(rate.compra) : '-'}
                    </p>
                  </div>
                  {/* Venta */}
                  <div>
                    <p style={{ fontSize: 12, fontWeight: 700, color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>
                      Venta
                    </p>
                    <p style={{
                      fontSize: 'clamp(18px,4vw,24px)',
                      fontWeight: 900,
                      color: '#dc2626',
                      letterSpacing: '-0.02em',
                    }}>
                      {rate.venta != null ? fmt(rate.venta) : '-'}
                    </p>
                  </div>
                  {/* Spread */}
                  <div>
                    <p style={{ fontSize: 12, fontWeight: 700, color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>
                      Spread
                    </p>
                    <p style={{
                      fontSize: 'clamp(18px,4vw,24px)',
                      fontWeight: 900,
                      color: '#71717a',
                      letterSpacing: '-0.02em',
                    }}>
                      {spread(rate.compra, rate.venta)}
                    </p>
                  </div>
                </div>

                {rate.casa === 'tarjeta' && (
                  <p style={{ fontSize: 11, color: '#a1a1aa', marginTop: 10, fontStyle: 'italic' }}>
                    Incluye 30% Impuesto PAIS + 30% Ganancias sobre el oficial
                  </p>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Footer */}
      <p style={{ fontSize: 11, color: '#a1a1aa', textAlign: 'center', lineHeight: 1.6, marginBottom: 40 }}>
        Datos provistos por <span style={{ fontWeight: 600 }}>dolarapi.com</span>. Las cotizaciones son informativas y pueden variar.
      </p>
    </div>
  )
}
