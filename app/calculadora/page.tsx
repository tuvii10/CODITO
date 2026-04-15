'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'

// ─── Datos ────────────────────────────────────────────────────────────────────

type PaymentMethod = {
  id: string
  label: string
  icon: string
  cuotas: number
  cft: number        // costo financiero total anual (0 = sin interés)
  discount: number   // descuento directo en % (0 = sin descuento)
  note?: string
}

const PAYMENT_METHODS: PaymentMethod[] = [
  { id: 'efectivo',  label: 'Efectivo / Débito', icon: '💵', cuotas: 1,  cft: 0,    discount: 0 },
  { id: '3ssi',      label: '3 cuotas s/interés', icon: '💳', cuotas: 3,  cft: 0,    discount: 0, note: 'Visa/MC seleccionadas' },
  { id: '6ssi',      label: '6 cuotas s/interés', icon: '💳', cuotas: 6,  cft: 0,    discount: 0, note: 'Visa/MC seleccionadas' },
  { id: '12ssi',     label: '12 cuotas s/interés',icon: '💳', cuotas: 12, cft: 0,    discount: 0, note: 'Visa/MC seleccionadas' },
  { id: '3ci',       label: '3 cuotas c/interés', icon: '📊', cuotas: 3,  cft: 85,   discount: 0 },
  { id: '6ci',       label: '6 cuotas c/interés', icon: '📊', cuotas: 6,  cft: 95,   discount: 0 },
  { id: '12ci',      label: '12 cuotas c/interés',icon: '📊', cuotas: 12, cft: 110,  discount: 0 },
  { id: '18ci',      label: '18 cuotas c/interés',icon: '📊', cuotas: 18, cft: 125,  discount: 0 },
  { id: 'mp',        label: 'Mercado Pago',       icon: '💙', cuotas: 1,  cft: 0,    discount: 0, note: 'Precio sin tarjeta' },
  { id: 'debin',     label: 'Débito inmediato',   icon: '🏦', cuotas: 1,  cft: 0,    discount: 5, note: 'Descuento habitual' },
]

type BankPromo = {
  bank: string
  icon: string
  day: string
  discount: number
  where: string
  color: string
}

const BANK_PROMOS: BankPromo[] = [
  { bank: 'Santander',  icon: '🔴', day: 'Miércoles',  discount: 25, where: 'Carrefour, Disco, Vea', color: '#dc2626' },
  { bank: 'Galicia',    icon: '🟠', day: 'Martes',     discount: 20, where: 'Coto, Jumbo',           color: '#ea580c' },
  { bank: 'BBVA',       icon: '🔵', day: 'Lunes',      discount: 20, where: 'Carrefour',              color: '#1d4ed8' },
  { bank: 'Naranja X',  icon: '🟡', day: 'Viernes',    discount: 20, where: 'Supermercados varios',  color: '#ca8a04' },
  { bank: 'Banco Nación',icon: '🇦🇷', day: 'Miércoles', discount: 15, where: 'Changomás, Vea',        color: '#15803d' },
  { bank: 'HSBC',       icon: '⚫', day: 'Jueves',     discount: 20, where: 'Jumbo, Disco',           color: '#374151' },
  { bank: 'Brubank',    icon: '🟣', day: 'Todos',      discount: 10, where: 'Carrefour',              color: '#7c3aed' },
  { bank: 'Personal Pay',icon:'🟢', day: 'Todos',      discount: 10, where: 'Supermercados varios',  color: '#16a34a' },
]

// ─── Cálculo ──────────────────────────────────────────────────────────────────

function calcularCuotas(precio: number, method: PaymentMethod) {
  if (method.cft === 0) {
    // sin interés o efectivo
    const total = precio * (1 - method.discount / 100)
    return { total, cuotaValor: total / method.cuotas, extra: total - precio }
  }
  // Con interés: fórmula de cuota francesa
  const tasaMensual = method.cft / 100 / 12
  const n = method.cuotas
  const cuotaValor = precio * (tasaMensual * Math.pow(1 + tasaMensual, n)) / (Math.pow(1 + tasaMensual, n) - 1)
  const total = cuotaValor * n
  return { total, cuotaValor, extra: total - precio }
}

function fmt(n: number) {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency', currency: 'ARS', maximumFractionDigits: 0,
  }).format(n)
}

function fmtPct(n: number) {
  return (n >= 0 ? '+' : '') + n.toFixed(0) + '%'
}

// ─── Componentes ──────────────────────────────────────────────────────────────

export default function Calculadora() {
  const [rawInput, setRawInput] = useState('')
  const [selectedMethod, setSelectedMethod] = useState('efectivo')
  const [bankPromo, setBankPromo] = useState<string | null>(null)

  const precio = parseFloat(rawInput.replace(/\./g, '').replace(',', '.')) || 0
  const method = PAYMENT_METHODS.find(m => m.id === selectedMethod)!
  const promo  = BANK_PROMOS.find(b => b.bank === bankPromo)

  const resultado = useMemo(() => {
    if (precio <= 0) return null
    const base = calcularCuotas(precio, method)
    // Aplicar descuento bancario sobre el total
    const descuentoBanco = promo ? promo.discount / 100 : 0
    const totalFinal = base.total * (1 - descuentoBanco)
    const cuotaFinal = base.cuotaValor * (1 - descuentoBanco)
    return {
      total: totalFinal,
      cuota: cuotaFinal,
      extraVsEfectivo: totalFinal - precio,
      extraPct: ((totalFinal - precio) / precio) * 100,
    }
  }, [precio, method, promo])

  const today = new Date().toLocaleDateString('es-AR', { weekday: 'long' })
  const todayPromos = BANK_PROMOS.filter(b =>
    b.day === 'Todos' ||
    b.day.toLowerCase() === today.toLowerCase()
  )

  return (
    <div style={{ maxWidth: 680, margin: '0 auto' }}>

      {/* Back */}
      <div style={{ marginBottom: 20 }}>
        <Link href="/" style={{ fontSize: 13, color: '#71717a', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          ← Volver
        </Link>
      </div>

      {/* Header */}
      <div style={{ marginBottom: 32, textAlign: 'center' }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          width: 64, height: 64, borderRadius: 20,
          background: 'linear-gradient(135deg, #7c3aed, #a855f7)',
          fontSize: 30, marginBottom: 14,
          boxShadow: '0 8px 24px rgba(124,58,237,0.35)',
        }}>🧮</div>
        <h1 style={{ fontSize: 'clamp(24px, 6vw, 36px)', fontWeight: 900, color: '#09090b', letterSpacing: '-0.03em', marginBottom: 8 }}>
          ¿Cuánto pagás en realidad?
        </h1>
        <p style={{ fontSize: 14, color: '#71717a', maxWidth: 420, margin: '0 auto', lineHeight: 1.5 }}>
          Ingresá el precio de un producto y te mostramos cuánto terminás pagando según tu forma de pago.
        </p>
      </div>

      {/* Input precio */}
      <div style={{
        background: '#fff',
        borderRadius: 20,
        padding: 'clamp(16px,4vw,24px)',
        border: '1px solid #e4e4e7',
        boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
        marginBottom: 16,
      }}>
        <label style={{ fontSize: 12, fontWeight: 700, color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8, display: 'block' }}>
          Precio del producto
        </label>
        <div style={{ display: 'flex', alignItems: 'center', gap: 0, border: '2px solid #e4e4e7', borderRadius: 14, overflow: 'hidden', transition: 'border-color 0.15s', background: '#fafafa' }}>
          <span style={{ padding: '14px 16px', fontSize: 18, fontWeight: 700, color: '#71717a', borderRight: '1px solid #e4e4e7', background: '#f4f4f5', flexShrink: 0 }}>
            $
          </span>
          <input
            type="text"
            inputMode="numeric"
            value={rawInput}
            onChange={e => setRawInput(e.target.value.replace(/[^0-9.,]/g, ''))}
            placeholder="0"
            style={{
              flex: 1,
              border: 'none',
              outline: 'none',
              background: 'transparent',
              fontSize: 'clamp(20px,5vw,28px)',
              fontWeight: 800,
              color: '#09090b',
              padding: '12px 16px',
              letterSpacing: '-0.02em',
              fontVariantNumeric: 'tabular-nums',
            }}
          />
        </div>
      </div>

      {/* Selector método de pago */}
      <div style={{
        background: '#fff',
        borderRadius: 20,
        padding: 'clamp(16px,4vw,24px)',
        border: '1px solid #e4e4e7',
        boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
        marginBottom: 16,
      }}>
        <label style={{ fontSize: 12, fontWeight: 700, color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12, display: 'block' }}>
          Forma de pago
        </label>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%,180px),1fr))', gap: 8 }}>
          {PAYMENT_METHODS.map(m => {
            const active = selectedMethod === m.id
            return (
              <button
                key={m.id}
                onClick={() => setSelectedMethod(m.id)}
                style={{
                  padding: '10px 12px',
                  borderRadius: 12,
                  border: active ? '2px solid #7c3aed' : '1.5px solid #e4e4e7',
                  background: active ? '#faf5ff' : '#fafafa',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.15s',
                  boxShadow: active ? '0 2px 10px rgba(124,58,237,0.15)' : 'none',
                }}
              >
                <div style={{ fontSize: 16, marginBottom: 2 }}>{m.icon}</div>
                <div style={{ fontSize: 12, fontWeight: 700, color: active ? '#7c3aed' : '#09090b', lineHeight: 1.2 }}>{m.label}</div>
                {m.note && <div style={{ fontSize: 10, color: '#a1a1aa', marginTop: 2 }}>{m.note}</div>}
                {m.cft > 0 && <div style={{ fontSize: 10, color: '#dc2626', marginTop: 2, fontWeight: 600 }}>CFT ~{m.cft}% anual</div>}
                {m.discount > 0 && <div style={{ fontSize: 10, color: '#16a34a', marginTop: 2, fontWeight: 600 }}>-{m.discount}% descuento</div>}
              </button>
            )
          })}
        </div>
      </div>

      {/* Selector descuento bancario */}
      <div style={{
        background: '#fff',
        borderRadius: 20,
        padding: 'clamp(16px,4vw,24px)',
        border: '1px solid #e4e4e7',
        boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
        marginBottom: 16,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <label style={{ fontSize: 12, fontWeight: 700, color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Descuento bancario
          </label>
          {todayPromos.length > 0 && (
            <span style={{
              fontSize: 10, fontWeight: 700, color: '#ea580c',
              background: '#fff7ed', border: '1px solid #fed7aa',
              borderRadius: 999, padding: '2px 8px',
            }}>
              🔥 {todayPromos.length} promoc. hoy
            </span>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%,150px),1fr))', gap: 8 }}>
          <button
            onClick={() => setBankPromo(null)}
            style={{
              padding: '10px 12px',
              borderRadius: 12,
              border: bankPromo === null ? '2px solid #09090b' : '1.5px solid #e4e4e7',
              background: bankPromo === null ? '#f4f4f5' : '#fafafa',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'all 0.15s',
            }}
          >
            <div style={{ fontSize: 16, marginBottom: 2 }}>🚫</div>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#09090b' }}>Sin descuento</div>
          </button>

          {BANK_PROMOS.map(b => {
            const active = bankPromo === b.bank
            const esHoy = b.day === 'Todos' || b.day.toLowerCase() === today.toLowerCase()
            return (
              <button
                key={b.bank}
                onClick={() => setBankPromo(active ? null : b.bank)}
                style={{
                  padding: '10px 12px',
                  borderRadius: 12,
                  border: active ? `2px solid ${b.color}` : '1.5px solid #e4e4e7',
                  background: active ? '#fafafa' : '#fafafa',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.15s',
                  boxShadow: active ? `0 2px 10px ${b.color}30` : 'none',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                {esHoy && (
                  <div style={{
                    position: 'absolute', top: 4, right: 4,
                    width: 6, height: 6, borderRadius: '50%',
                    background: '#16a34a',
                    boxShadow: '0 0 4px #16a34a',
                  }} />
                )}
                <div style={{ fontSize: 16, marginBottom: 2 }}>{b.icon}</div>
                <div style={{ fontSize: 11, fontWeight: 700, color: active ? b.color : '#09090b', lineHeight: 1.2 }}>{b.bank}</div>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#16a34a', marginTop: 2 }}>-{b.discount}% {b.day !== 'Todos' ? b.day : 'siempre'}</div>
                <div style={{ fontSize: 9, color: '#a1a1aa', marginTop: 1 }}>{b.where}</div>
              </button>
            )
          })}
        </div>

        {todayPromos.length > 0 && (
          <div style={{
            marginTop: 12,
            padding: '10px 14px',
            borderRadius: 12,
            background: '#f0fdf4',
            border: '1px solid #bbf7d0',
            fontSize: 12,
            color: '#15803d',
            fontWeight: 500,
          }}>
            💡 Hoy ({today}) tenés descuento con: <strong>{todayPromos.map(p => p.bank).join(', ')}</strong>
          </div>
        )}
      </div>

      {/* Resultado */}
      {resultado && precio > 0 ? (
        <div style={{
          background: resultado.extraPct <= 0
            ? 'linear-gradient(135deg, #f0fdf4, #dcfce7)'
            : resultado.extraPct > 30
              ? 'linear-gradient(135deg, #fef2f2, #fee2e2)'
              : 'linear-gradient(135deg, #faf5ff, #ede9fe)',
          border: `2px solid ${resultado.extraPct <= 0 ? '#86efac' : resultado.extraPct > 30 ? '#fca5a5' : '#c4b5fd'}`,
          borderRadius: 20,
          padding: 'clamp(20px,5vw,28px)',
          marginBottom: 16,
        }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 16 }}>
            Resultado
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px,1fr))', gap: 16, marginBottom: 16 }}>
            {/* Total */}
            <div>
              <p style={{ fontSize: 11, color: '#71717a', marginBottom: 4, fontWeight: 600 }}>Total a pagar</p>
              <p style={{
                fontSize: 'clamp(24px,6vw,36px)',
                fontWeight: 900,
                color: '#09090b',
                letterSpacing: '-0.03em',
                lineHeight: 1,
              }}>
                {fmt(resultado.total)}
              </p>
            </div>
            {/* Cuota */}
            {method.cuotas > 1 && (
              <div>
                <p style={{ fontSize: 11, color: '#71717a', marginBottom: 4, fontWeight: 600 }}>Por cuota</p>
                <p style={{ fontSize: 'clamp(18px,4vw,26px)', fontWeight: 800, color: '#09090b', letterSpacing: '-0.02em', lineHeight: 1 }}>
                  {fmt(resultado.cuota)}
                  <span style={{ fontSize: 12, fontWeight: 500, color: '#71717a', marginLeft: 4 }}>x{method.cuotas}</span>
                </p>
              </div>
            )}
            {/* Extra vs efectivo */}
            <div>
              <p style={{ fontSize: 11, color: '#71717a', marginBottom: 4, fontWeight: 600 }}>vs. precio base</p>
              <p style={{
                fontSize: 'clamp(18px,4vw,26px)',
                fontWeight: 800,
                letterSpacing: '-0.02em',
                lineHeight: 1,
                color: resultado.extraPct <= 0 ? '#16a34a' : resultado.extraPct > 30 ? '#dc2626' : '#7c3aed',
              }}>
                {fmtPct(resultado.extraPct)}
              </p>
              <p style={{ fontSize: 11, color: resultado.extraPct <= 0 ? '#16a34a' : '#dc2626', marginTop: 2, fontWeight: 600 }}>
                {resultado.extraVsEfectivo <= 0
                  ? `Ahorrás ${fmt(Math.abs(resultado.extraVsEfectivo))}`
                  : `Pagás ${fmt(resultado.extraVsEfectivo)} de más`
                }
              </p>
            </div>
          </div>

          {/* Resumen */}
          <div style={{
            padding: '10px 14px',
            borderRadius: 12,
            background: 'rgba(255,255,255,0.7)',
            fontSize: 13,
            color: '#374151',
            lineHeight: 1.5,
          }}>
            {method.cuotas === 1
              ? `Pagás ${fmt(resultado.total)} al contado con ${method.label.toLowerCase()}.`
              : `Pagás ${method.cuotas} cuotas de ${fmt(resultado.cuota)} = ${fmt(resultado.total)} en total.`
            }
            {promo && ` Con descuento ${promo.bank} (-${promo.discount}%).`}
          </div>
        </div>
      ) : (
        <div style={{
          padding: '28px 20px',
          borderRadius: 20,
          background: '#f4f4f5',
          textAlign: 'center',
          color: '#a1a1aa',
          fontSize: 14,
          marginBottom: 16,
        }}>
          Ingresá un precio arriba para ver el resultado 👆
        </div>
      )}

      {/* Tabla comparativa */}
      {precio > 0 && (
        <div style={{
          background: '#fff',
          borderRadius: 20,
          padding: 'clamp(16px,4vw,24px)',
          border: '1px solid #e4e4e7',
          boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
          marginBottom: 32,
        }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 16 }}>
            Comparativa de todas las opciones
          </p>
          <div style={{ display: 'grid', gap: 6 }}>
            {PAYMENT_METHODS.map(m => {
              const r = calcularCuotas(precio, m)
              const bankDiscount = promo ? promo.discount / 100 : 0
              const totalConBanco = r.total * (1 - bankDiscount)
              const extraPct = ((totalConBanco - precio) / precio) * 100
              const isBest = totalConBanco === Math.min(...PAYMENT_METHODS.map(mm => {
                const rr = calcularCuotas(precio, mm)
                return rr.total * (1 - bankDiscount)
              }))
              const isSelected = m.id === selectedMethod
              return (
                <button
                  key={m.id}
                  onClick={() => setSelectedMethod(m.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '10px 14px',
                    borderRadius: 12,
                    border: isSelected ? '2px solid #7c3aed' : '1.5px solid #e4e4e7',
                    background: isSelected ? '#faf5ff' : isBest ? '#f0fdf4' : '#fafafa',
                    cursor: 'pointer',
                    transition: 'all 0.1s',
                    textAlign: 'left',
                  }}
                >
                  <span style={{ fontSize: 16, flexShrink: 0 }}>{m.icon}</span>
                  <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: '#09090b' }}>{m.label}</span>
                  {isBest && <span style={{ fontSize: 10, fontWeight: 700, color: '#16a34a', background: '#dcfce7', padding: '2px 6px', borderRadius: 999 }}>✓ mejor opción</span>}
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <p style={{ fontSize: 14, fontWeight: 800, color: '#09090b' }}>{fmt(totalConBanco)}</p>
                    <p style={{ fontSize: 10, fontWeight: 600, color: extraPct <= 0 ? '#16a34a' : '#dc2626' }}>
                      {fmtPct(extraPct)}
                    </p>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Footer aclaración */}
      <p style={{ fontSize: 11, color: '#a1a1aa', textAlign: 'center', lineHeight: 1.6, marginBottom: 40 }}>
        Los CFT son estimativos. Los descuentos bancarios varían según promoción vigente y comercio.
        Siempre verificá en tu banco antes de pagar.
      </p>
    </div>
  )
}
