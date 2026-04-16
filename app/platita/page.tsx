'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

// ─── Tipos ───────────────────────────────────────────────────────────────────

type DolarBlue = {
  compra: number
  venta: number
}

type Plazo = {
  label: string
  dias: number
}

// ─── Constantes ──────────────────────────────────────────────────────────────

const TNA = 0.23 // Tasa Nominal Anual promedio plazo fijo (abril 2026)
const INFLACION_MENSUAL = 0.034 // 3.4% mensual (INDEC marzo 2026)

const PLAZOS: Plazo[] = [
  { label: '30 días', dias: 30 },
  { label: '60 días', dias: 60 },
  { label: '90 días', dias: 90 },
  { label: '180 días', dias: 180 },
  { label: '365 días', dias: 365 },
]

const fmt = (n: number) =>
  new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(n)

const fmtUSD = (n: number) =>
  new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  }).format(n)

const pct = (n: number) => (n * 100).toFixed(1) + '%'

// ─── Estilos ─────────────────────────────────────────────────────────────────

const styles = {
  page: {
    minHeight: '100vh',
    background: '#fafafa',
    fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
  } as React.CSSProperties,
  container: {
    maxWidth: 900,
    margin: '0 auto',
    padding: 'clamp(16px, 4vw, 32px)',
  } as React.CSSProperties,
  backBtn: {
    fontSize: 13,
    fontWeight: 700,
    background: '#f4f4f5',
    border: '1px solid #e4e4e7',
    borderRadius: 10,
    padding: '7px 14px',
    textDecoration: 'none',
    color: '#18181b',
    display: 'inline-block',
  } as React.CSSProperties,
  iconBox: {
    width: 64,
    height: 64,
    borderRadius: 18,
    background: 'linear-gradient(135deg, #2563eb, #3b82f6)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 32,
    margin: '0 auto 12px',
  } as React.CSSProperties,
  h1: {
    fontSize: 'clamp(24px, 6vw, 36px)',
    fontWeight: 900,
    color: '#18181b',
    margin: '0 0 4px',
  } as React.CSSProperties,
  subtitle: {
    fontSize: 15,
    color: '#71717a',
    margin: 0,
  } as React.CSSProperties,
  card: {
    background: '#fff',
    borderRadius: 20,
    padding: 'clamp(16px, 4vw, 24px)',
    border: '1px solid #e4e4e7',
    boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
  } as React.CSSProperties,
  label: {
    fontSize: 12,
    fontWeight: 700,
    color: '#71717a',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.08em',
    margin: '0 0 6px',
    display: 'block',
  } as React.CSSProperties,
  input: {
    width: '100%',
    padding: '12px 14px 12px 32px',
    fontSize: 18,
    fontWeight: 700,
    border: '1px solid #e4e4e7',
    borderRadius: 12,
    outline: 'none',
    background: '#fafafa',
    color: '#18181b',
    boxSizing: 'border-box' as const,
  } as React.CSSProperties,
  selectWrap: {
    display: 'flex',
    gap: 8,
    flexWrap: 'wrap' as const,
  } as React.CSSProperties,
  badge: {
    display: 'inline-block',
    fontSize: 11,
    fontWeight: 800,
    background: '#22c55e',
    color: '#fff',
    borderRadius: 8,
    padding: '3px 10px',
    marginTop: 8,
    letterSpacing: '0.04em',
  } as React.CSSProperties,
  gridCards: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: 16,
    marginTop: 24,
  } as React.CSSProperties,
}

// ─── Componente ──────────────────────────────────────────────────────────────

export default function PlatitaPage() {
  const [monto, setMonto] = useState<number>(100000)
  const [plazoIdx, setPlazoIdx] = useState<number>(0)
  const [dolar, setDolar] = useState<DolarBlue | null>(null)
  const [dolarLoading, setDolarLoading] = useState(true)
  const [dolarError, setDolarError] = useState(false)

  const dias = PLAZOS[plazoIdx].dias

  // Fetch dólar blue
  useEffect(() => {
    setDolarLoading(true)
    setDolarError(false)
    fetch('https://dolarapi.com/v1/dolares/blue')
      .then((r) => {
        if (!r.ok) throw new Error('Error')
        return r.json()
      })
      .then((data: DolarBlue) => {
        setDolar(data)
        setDolarLoading(false)
      })
      .catch(() => {
        setDolarError(true)
        setDolarLoading(false)
      })
  }, [])

  // ── Cálculos ──

  // Plazo fijo
  const pf_final = monto * (1 + (TNA / 365) * dias)
  const pf_ganancia = pf_final - monto
  const pf_tasa_efectiva = pf_ganancia / monto

  // Dólar
  const dolarVenta = dolar?.venta ?? 0
  const dolares_comprados = dolarVenta > 0 ? monto / dolarVenta : 0
  const dolar_scenarios = [
    { label: 'Si se mantiene', pctChange: 0 },
    { label: 'Si el dólar sube 5%', pctChange: 0.05 },
    { label: 'Si el dólar sube 10%', pctChange: 0.1 },
  ]
  const dolar_results = dolar_scenarios.map((s) => ({
    ...s,
    valorFinal: dolares_comprados * dolarVenta * (1 + s.pctChange),
    ganancia: dolares_comprados * dolarVenta * s.pctChange,
  }))

  // Inflación (colchón)
  const meses = dias / 30
  const inflacion_acumulada = Math.pow(1 + INFLACION_MENSUAL, meses) - 1
  const poder_compra_real = monto / (1 + inflacion_acumulada)
  const perdida_inflacion = monto - poder_compra_real

  // ── Winner logic ──
  // Compare: plazo fijo ganancia, best dolar scenario ganancia, vs colchón (negative)
  const best_dolar_ganancia = Math.max(...dolar_results.map((d) => d.ganancia))
  const options = [
    { name: 'plazo', value: pf_ganancia },
    { name: 'dolar', value: best_dolar_ganancia },
    { name: 'colchon', value: -perdida_inflacion },
  ]
  const winner = options.reduce((a, b) => (a.value > b.value ? a : b)).name

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        {/* Back */}
        <Link href="/" style={styles.backBtn}>
          ← Volver
        </Link>

        {/* Header */}
        <div style={{ textAlign: 'center', marginTop: 24, marginBottom: 28 }}>
          <div style={styles.iconBox}>💰</div>
          <h1 style={styles.h1}>Platita</h1>
          <p style={styles.subtitle}>
            Compará: Plazo Fijo vs Dólar vs Inflación
          </p>
        </div>

        {/* Inputs card */}
        <div style={{ ...styles.card, marginBottom: 20 }}>
          {/* Monto */}
          <label style={styles.label}>¿Cuánto tenés para invertir?</label>
          <div style={{ position: 'relative', marginBottom: 18 }}>
            <span
              style={{
                position: 'absolute',
                left: 12,
                top: '50%',
                transform: 'translateY(-50%)',
                fontSize: 18,
                fontWeight: 700,
                color: '#a1a1aa',
                pointerEvents: 'none',
              }}
            >
              $
            </span>
            <input
              type="number"
              min={0}
              value={monto || ''}
              onChange={(e) => setMonto(Number(e.target.value))}
              placeholder="100000"
              style={styles.input}
            />
          </div>

          {/* Plazo */}
          <label style={styles.label}>¿Por cuánto tiempo?</label>
          <div style={styles.selectWrap}>
            {PLAZOS.map((p, i) => (
              <button
                key={p.dias}
                onClick={() => setPlazoIdx(i)}
                style={{
                  padding: '8px 16px',
                  fontSize: 14,
                  fontWeight: 700,
                  borderRadius: 10,
                  border:
                    i === plazoIdx
                      ? '2px solid #2563eb'
                      : '1px solid #e4e4e7',
                  background: i === plazoIdx ? '#eff6ff' : '#f4f4f5',
                  color: i === plazoIdx ? '#2563eb' : '#52525b',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Results grid */}
        <div style={styles.gridCards}>
          {/* Card 1: Plazo Fijo */}
          <div
            style={{
              ...styles.card,
              borderTop: '4px solid #2563eb',
              position: 'relative',
            }}
          >
            <div
              style={{
                fontSize: 28,
                marginBottom: 8,
              }}
            >
              🏦
            </div>
            <h2
              style={{
                fontSize: 18,
                fontWeight: 800,
                margin: '0 0 4px',
                color: '#18181b',
              }}
            >
              Plazo Fijo
            </h2>
            <p
              style={{
                fontSize: 12,
                color: '#a1a1aa',
                margin: '0 0 16px',
              }}
            >
              TNA {pct(TNA)} — {PLAZOS[plazoIdx].label}
            </p>

            <label style={styles.label}>Recibís al vencimiento</label>
            <p
              style={{
                fontSize: 'clamp(20px, 5vw, 28px)',
                fontWeight: 900,
                color: '#2563eb',
                margin: '0 0 4px',
              }}
            >
              {fmt(pf_final)}
            </p>

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginTop: 12,
              }}
            >
              <div>
                <label style={{ ...styles.label, marginBottom: 2 }}>
                  Ganancia
                </label>
                <span
                  style={{ fontSize: 16, fontWeight: 800, color: '#16a34a' }}
                >
                  +{fmt(pf_ganancia)}
                </span>
              </div>
              <div style={{ textAlign: 'right' }}>
                <label style={{ ...styles.label, marginBottom: 2 }}>
                  Tasa efectiva
                </label>
                <span
                  style={{ fontSize: 16, fontWeight: 800, color: '#18181b' }}
                >
                  {pct(pf_tasa_efectiva)}
                </span>
              </div>
            </div>

            {winner === 'plazo' && (
              <div style={styles.badge}>Mejor opción</div>
            )}
          </div>

          {/* Card 2: Dólar */}
          <div
            style={{
              ...styles.card,
              borderTop: '4px solid #16a34a',
              position: 'relative',
            }}
          >
            <div style={{ fontSize: 28, marginBottom: 8 }}>💵</div>
            <h2
              style={{
                fontSize: 18,
                fontWeight: 800,
                margin: '0 0 4px',
                color: '#18181b',
              }}
            >
              Comprar Dólares
            </h2>
            <p
              style={{
                fontSize: 12,
                color: '#a1a1aa',
                margin: '0 0 16px',
              }}
            >
              {dolarLoading
                ? 'Cargando cotización...'
                : dolarError
                  ? 'Error al cargar cotización'
                  : `Blue: $${dolarVenta} venta`}
            </p>

            {!dolarLoading && !dolarError && dolar && (
              <>
                <label style={styles.label}>Comprás</label>
                <p
                  style={{
                    fontSize: 'clamp(20px, 5vw, 28px)',
                    fontWeight: 900,
                    color: '#16a34a',
                    margin: '0 0 16px',
                  }}
                >
                  {fmtUSD(dolares_comprados)}
                </p>

                {dolar_results.map((s) => (
                  <div
                    key={s.label}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '8px 0',
                      borderTop: '1px solid #f4f4f5',
                    }}
                  >
                    <span
                      style={{
                        fontSize: 12,
                        fontWeight: 600,
                        color: '#71717a',
                      }}
                    >
                      {s.label}
                    </span>
                    <div style={{ textAlign: 'right' }}>
                      <span
                        style={{
                          fontSize: 14,
                          fontWeight: 800,
                          color:
                            s.ganancia > 0
                              ? '#16a34a'
                              : s.ganancia < 0
                                ? '#dc2626'
                                : '#71717a',
                        }}
                      >
                        {s.ganancia >= 0 ? '+' : ''}
                        {fmt(s.ganancia)}
                      </span>
                      <span
                        style={{
                          fontSize: 11,
                          color: '#a1a1aa',
                          marginLeft: 6,
                        }}
                      >
                        ({fmt(s.valorFinal)})
                      </span>
                    </div>
                  </div>
                ))}
              </>
            )}

            {dolarLoading && (
              <div
                style={{
                  padding: 24,
                  textAlign: 'center',
                  color: '#a1a1aa',
                  fontSize: 14,
                }}
              >
                Cargando...
              </div>
            )}

            {dolarError && (
              <div
                style={{
                  padding: 24,
                  textAlign: 'center',
                  color: '#dc2626',
                  fontSize: 14,
                }}
              >
                No se pudo obtener la cotización del dólar blue.
              </div>
            )}

            {winner === 'dolar' && (
              <div style={styles.badge}>Mejor opción</div>
            )}
          </div>

          {/* Card 3: Inflación */}
          <div
            style={{
              ...styles.card,
              borderTop: '4px solid #dc2626',
              position: 'relative',
            }}
          >
            <div style={{ fontSize: 28, marginBottom: 8 }}>📉</div>
            <h2
              style={{
                fontSize: 18,
                fontWeight: 800,
                margin: '0 0 4px',
                color: '#18181b',
              }}
            >
              Dejarlo en el Colchón
            </h2>
            <p
              style={{
                fontSize: 12,
                color: '#a1a1aa',
                margin: '0 0 16px',
              }}
            >
              Inflación estimada {pct(INFLACION_MENSUAL)} mensual
            </p>

            <label style={styles.label}>Tu plata vale en poder de compra</label>
            <p
              style={{
                fontSize: 'clamp(20px, 5vw, 28px)',
                fontWeight: 900,
                color: '#dc2626',
                margin: '0 0 4px',
              }}
            >
              {fmt(poder_compra_real)}
            </p>

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginTop: 12,
              }}
            >
              <div>
                <label style={{ ...styles.label, marginBottom: 2 }}>
                  Perdés
                </label>
                <span
                  style={{ fontSize: 16, fontWeight: 800, color: '#dc2626' }}
                >
                  -{fmt(perdida_inflacion)}
                </span>
              </div>
              <div style={{ textAlign: 'right' }}>
                <label style={{ ...styles.label, marginBottom: 2 }}>
                  Inflación período
                </label>
                <span
                  style={{ fontSize: 16, fontWeight: 800, color: '#18181b' }}
                >
                  {pct(inflacion_acumulada)}
                </span>
              </div>
            </div>

            {winner === 'colchon' && (
              <div style={styles.badge}>Mejor opción</div>
            )}
          </div>
        </div>

        {/* Disclaimer */}
        <p
          style={{
            textAlign: 'center',
            fontSize: 12,
            color: '#a1a1aa',
            marginTop: 32,
            padding: '0 16px',
            lineHeight: 1.5,
          }}
        >
          Esto es informativo, no es asesoramiento financiero. Las tasas y
          valores pueden variar. Consultá con un profesional antes de tomar
          decisiones de inversión.
        </p>
      </div>
    </div>
  )
}
