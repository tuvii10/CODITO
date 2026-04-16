'use client'

import { useState } from 'react'
import Link from 'next/link'

type Amigo = {
  id: number
  nombre: string
  pago: string
}

let nextId = 3

function fmt(n: number) {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency', currency: 'ARS', maximumFractionDigits: 0,
  }).format(n)
}

export default function Dividito() {
  const [amigos, setAmigos] = useState<Amigo[]>([
    { id: 1, nombre: '', pago: '' },
    { id: 2, nombre: '', pago: '' },
  ])

  const parsePago = (val: string) => parseFloat(val.replace(/\./g, '').replace(',', '.')) || 0

  const totalGasto = amigos.reduce((sum, a) => sum + parsePago(a.pago), 0)
  const cantAmigos = amigos.length
  const parteJusta = cantAmigos > 0 ? totalGasto / cantAmigos : 0

  const deudas: { de: string; a: string; monto: number }[] = []

  if (totalGasto > 0) {
    // Calcular balances
    const balances = amigos.map(a => ({
      nombre: a.nombre || `Amigo ${a.id}`,
      balance: parsePago(a.pago) - parteJusta,
    }))

    // Los que deben (balance negativo) le pagan a los que pusieron de más (balance positivo)
    const deudores = balances.filter(b => b.balance < 0).map(b => ({ ...b, balance: Math.abs(b.balance) }))
    const acreedores = balances.filter(b => b.balance > 0).map(b => ({ ...b }))

    // Algoritmo greedy para minimizar transferencias
    deudores.sort((a, b) => b.balance - a.balance)
    acreedores.sort((a, b) => b.balance - a.balance)

    let i = 0, j = 0
    while (i < deudores.length && j < acreedores.length) {
      const monto = Math.min(deudores[i].balance, acreedores[j].balance)
      if (monto > 1) {
        deudas.push({ de: deudores[i].nombre, a: acreedores[j].nombre, monto })
      }
      deudores[i].balance -= monto
      acreedores[j].balance -= monto
      if (deudores[i].balance < 1) i++
      if (acreedores[j].balance < 1) j++
    }
  }

  const updateAmigo = (id: number, field: 'nombre' | 'pago', value: string) => {
    setAmigos(prev => prev.map(a => a.id === id ? { ...a, [field]: value } : a))
  }

  const addAmigo = () => {
    setAmigos(prev => [...prev, { id: nextId++, nombre: '', pago: '' }])
  }

  const removeAmigo = (id: number) => {
    if (amigos.length <= 2) return
    setAmigos(prev => prev.filter(a => a.id !== id))
  }

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
          background: 'linear-gradient(135deg, #f97316, #ef4444)',
          fontSize: 30, marginBottom: 14,
          boxShadow: '0 8px 24px rgba(249,115,22,0.35)',
        }}>🍕</div>
        <h1 style={{ fontSize: 'clamp(24px, 6vw, 36px)', fontWeight: 900, color: '#09090b', letterSpacing: '-0.03em', marginBottom: 8 }}>
          Dividito
        </h1>
        <p style={{ fontSize: 14, color: '#71717a', maxWidth: 420, margin: '0 auto', lineHeight: 1.5 }}>
          Dividí los gastos entre amigos sin vueltas. Cada uno pone lo que pagó y te decimos quién le debe a quién.
        </p>
      </div>

      {/* Lista de amigos */}
      <div style={{
        background: '#fff',
        borderRadius: 20,
        padding: 'clamp(16px,4vw,24px)',
        border: '1px solid #e4e4e7',
        boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
        marginBottom: 16,
      }}>
        <label style={{ fontSize: 12, fontWeight: 700, color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 14, display: 'block' }}>
          ¿Quién pagó cuánto?
        </label>

        <div style={{ display: 'grid', gap: 10 }}>
          {amigos.map((a, idx) => (
            <div key={a.id} style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '10px 14px',
              borderRadius: 14,
              border: '1.5px solid #e4e4e7',
              background: '#fafafa',
              transition: 'border-color 0.15s',
            }}>
              <span style={{
                width: 32, height: 32, borderRadius: 10,
                background: `hsl(${idx * 55}, 70%, 95%)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 14, fontWeight: 800, color: `hsl(${idx * 55}, 60%, 40%)`,
                flexShrink: 0,
              }}>
                {idx + 1}
              </span>
              <input
                type="text"
                placeholder={`Amigo ${idx + 1}`}
                value={a.nombre}
                onChange={e => updateAmigo(a.id, 'nombre', e.target.value)}
                style={{
                  flex: 1,
                  border: 'none', outline: 'none', background: 'transparent',
                  fontSize: 14, fontWeight: 600, color: '#09090b',
                  minWidth: 0,
                }}
              />
              <div style={{
                display: 'flex', alignItems: 'center', gap: 0,
                border: '1.5px solid #e4e4e7', borderRadius: 10, overflow: 'hidden',
                background: '#fff', flexShrink: 0,
              }}>
                <span style={{ padding: '8px 10px', fontSize: 14, fontWeight: 700, color: '#71717a', borderRight: '1px solid #e4e4e7', background: '#f4f4f5' }}>$</span>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="0"
                  value={a.pago}
                  onChange={e => updateAmigo(a.id, 'pago', e.target.value.replace(/[^0-9.,]/g, ''))}
                  style={{
                    border: 'none', outline: 'none', background: 'transparent',
                    fontSize: 16, fontWeight: 800, color: '#09090b',
                    width: 90, padding: '8px 10px',
                    fontVariantNumeric: 'tabular-nums',
                  }}
                />
              </div>
              {amigos.length > 2 && (
                <button
                  onClick={() => removeAmigo(a.id)}
                  style={{
                    width: 28, height: 28, borderRadius: 8,
                    border: '1px solid #e4e4e7', background: '#fafafa',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 14, color: '#a1a1aa', flexShrink: 0,
                    transition: 'all 0.15s',
                  }}
                >
                  ✕
                </button>
              )}
            </div>
          ))}
        </div>

        <button
          onClick={addAmigo}
          style={{
            marginTop: 12,
            width: '100%',
            padding: '12px',
            borderRadius: 12,
            border: '2px dashed #d4d4d8',
            background: 'transparent',
            cursor: 'pointer',
            fontSize: 13,
            fontWeight: 700,
            color: '#71717a',
            transition: 'all 0.15s',
          }}
        >
          + Sumar un amigo
        </button>
      </div>

      {/* Resumen */}
      {totalGasto > 0 && (
        <div style={{
          background: 'linear-gradient(135deg, #fff7ed, #ffedd5)',
          border: '2px solid #fed7aa',
          borderRadius: 20,
          padding: 'clamp(20px,5vw,28px)',
          marginBottom: 16,
        }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 16 }}>
            Resumen
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px,1fr))', gap: 16, marginBottom: 20 }}>
            <div>
              <p style={{ fontSize: 11, color: '#71717a', marginBottom: 4, fontWeight: 600 }}>Total gastado</p>
              <p style={{ fontSize: 'clamp(24px,6vw,36px)', fontWeight: 900, color: '#09090b', letterSpacing: '-0.03em', lineHeight: 1 }}>
                {fmt(totalGasto)}
              </p>
            </div>
            <div>
              <p style={{ fontSize: 11, color: '#71717a', marginBottom: 4, fontWeight: 600 }}>Cada uno pone</p>
              <p style={{ fontSize: 'clamp(20px,5vw,28px)', fontWeight: 800, color: '#ea580c', letterSpacing: '-0.02em', lineHeight: 1 }}>
                {fmt(parteJusta)}
              </p>
            </div>
            <div>
              <p style={{ fontSize: 11, color: '#71717a', marginBottom: 4, fontWeight: 600 }}>Personas</p>
              <p style={{ fontSize: 'clamp(20px,5vw,28px)', fontWeight: 800, color: '#09090b', letterSpacing: '-0.02em', lineHeight: 1 }}>
                {cantAmigos}
              </p>
            </div>
          </div>

          {/* Transferencias */}
          {deudas.length > 0 && (
            <div>
              <p style={{ fontSize: 12, fontWeight: 700, color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
                Transferencias
              </p>
              <div style={{ display: 'grid', gap: 8 }}>
                {deudas.map((d, i) => (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '12px 16px',
                    borderRadius: 14,
                    background: 'rgba(255,255,255,0.8)',
                    border: '1px solid #fed7aa',
                  }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: '#dc2626', flex: 1 }}>
                      {d.de}
                    </span>
                    <span style={{ fontSize: 12, color: '#71717a', fontWeight: 600 }}>
                      le paga a
                    </span>
                    <span style={{ fontSize: 14, fontWeight: 700, color: '#16a34a', flex: 1, textAlign: 'right' }}>
                      {d.a}
                    </span>
                    <span style={{
                      fontSize: 16, fontWeight: 900, color: '#09090b',
                      background: '#fff', padding: '6px 12px', borderRadius: 10,
                      border: '1px solid #e4e4e7', flexShrink: 0,
                    }}>
                      {fmt(d.monto)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {deudas.length === 0 && (
            <div style={{
              padding: '14px',
              borderRadius: 12,
              background: 'rgba(255,255,255,0.7)',
              textAlign: 'center',
              fontSize: 14,
              color: '#16a34a',
              fontWeight: 700,
            }}>
              Todos pusieron lo mismo, no hay deudas.
            </div>
          )}
        </div>
      )}

      {/* Estado vacío */}
      {totalGasto === 0 && (
        <div style={{
          padding: '28px 20px',
          borderRadius: 20,
          background: '#f4f4f5',
          textAlign: 'center',
          color: '#a1a1aa',
          fontSize: 14,
          marginBottom: 16,
        }}>
          Poné cuánto pagó cada uno y te armamos las cuentas
        </div>
      )}

      {/* Footer */}
      <p style={{ fontSize: 11, color: '#a1a1aa', textAlign: 'center', lineHeight: 1.6, marginBottom: 40 }}>
        Dividito by Codito — dividí gastos sin vueltas.
      </p>
    </div>
  )
}
