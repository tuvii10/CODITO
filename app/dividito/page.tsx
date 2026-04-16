'use client'

import { useState } from 'react'
import Link from 'next/link'

// ─── Types ───────────────────────────────────────────────────────────────────

type Amigo = {
  id: number
  nombre: string
}

type Gasto = {
  id: number
  descripcion: string
  monto: string
  pagadoPor: number       // id del amigo que pagó
  participantes: number[] // ids de los amigos que participan de este gasto
}

let nextAmigoId = 3
let nextGastoId = 2

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmt(n: number) {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency', currency: 'ARS', maximumFractionDigits: 0,
  }).format(n)
}

function parseMonto(val: string) {
  return parseFloat(val.replace(/\./g, '').replace(',', '.')) || 0
}

// ─── Componente ──────────────────────────────────────────────────────────────

export default function Dividito() {
  const [amigos, setAmigos] = useState<Amigo[]>([
    { id: 1, nombre: '' },
    { id: 2, nombre: '' },
  ])

  const [gastos, setGastos] = useState<Gasto[]>([
    { id: 1, descripcion: '', monto: '', pagadoPor: 1, participantes: [1, 2] },
  ])

  const [propinaPct, setPropinaPct] = useState('')

  // ── Nombres display ──
  const nombreAmigo = (id: number) => {
    const a = amigos.find(a => a.id === id)
    return a?.nombre || `Amigo ${amigos.indexOf(a!) + 1}`
  }

  // ── Cálculos ──
  const propinaMultiplier = 1 + (parseFloat(propinaPct) || 0) / 100

  const totalGastos = gastos.reduce((sum, g) => sum + parseMonto(g.monto), 0)
  const totalConPropina = totalGastos * propinaMultiplier

  // Calcular cuánto pagó y cuánto debería pagar cada amigo
  const balances = new Map<number, number>()
  amigos.forEach(a => balances.set(a.id, 0))

  gastos.forEach(g => {
    const monto = parseMonto(g.monto) * propinaMultiplier
    if (monto <= 0 || g.participantes.length === 0) return

    // El que pagó suma lo que pagó
    balances.set(g.pagadoPor, (balances.get(g.pagadoPor) ?? 0) + monto)

    // Cada participante resta su parte
    const parte = monto / g.participantes.length
    g.participantes.forEach(pid => {
      balances.set(pid, (balances.get(pid) ?? 0) - parte)
    })
  })

  // Calcular transferencias con algoritmo greedy
  const deudas: { de: string; deId: number; a: string; aId: number; monto: number }[] = []

  if (totalGastos > 0) {
    const deudores: { id: number; nombre: string; monto: number }[] = []
    const acreedores: { id: number; nombre: string; monto: number }[] = []

    balances.forEach((balance, id) => {
      if (balance < -1) deudores.push({ id, nombre: nombreAmigo(id), monto: Math.abs(balance) })
      if (balance > 1) acreedores.push({ id, nombre: nombreAmigo(id), monto: balance })
    })

    deudores.sort((a, b) => b.monto - a.monto)
    acreedores.sort((a, b) => b.monto - a.monto)

    let i = 0, j = 0
    while (i < deudores.length && j < acreedores.length) {
      const monto = Math.min(deudores[i].monto, acreedores[j].monto)
      if (monto > 1) {
        deudas.push({
          de: deudores[i].nombre, deId: deudores[i].id,
          a: acreedores[j].nombre, aId: acreedores[j].id,
          monto,
        })
      }
      deudores[i].monto -= monto
      acreedores[j].monto -= monto
      if (deudores[i].monto < 1) i++
      if (acreedores[j].monto < 1) j++
    }
  }

  // ── Detalle por persona ──
  const detallePorPersona = amigos.map(a => {
    let totalPagado = 0
    let totalDeberia = 0

    gastos.forEach(g => {
      const monto = parseMonto(g.monto) * propinaMultiplier
      if (monto <= 0) return
      if (g.pagadoPor === a.id) totalPagado += monto
      if (g.participantes.includes(a.id)) {
        totalDeberia += monto / g.participantes.length
      }
    })

    return {
      id: a.id,
      nombre: nombreAmigo(a.id),
      pagado: totalPagado,
      deberia: totalDeberia,
      balance: totalPagado - totalDeberia,
    }
  })

  // ── Compartir por WhatsApp ──
  const compartirWhatsApp = () => {
    let msg = `🍕 *Dividito — Resumen de gastos*\n\n`
    msg += `💰 Total: ${fmt(totalConPropina)}`
    if (propinaPct && parseFloat(propinaPct) > 0) msg += ` (con ${propinaPct}% propina)`
    msg += `\n👥 ${amigos.length} personas\n\n`

    msg += `📋 *Gastos:*\n`
    gastos.forEach(g => {
      const monto = parseMonto(g.monto)
      if (monto <= 0) return
      msg += `• ${g.descripcion || 'Gasto'}: ${fmt(monto)} (pagó ${nombreAmigo(g.pagadoPor)})\n`
    })

    if (deudas.length > 0) {
      msg += `\n💸 *Transferencias:*\n`
      deudas.forEach(d => {
        msg += `• ${d.de} ➜ ${d.a}: ${fmt(d.monto)}\n`
      })
    } else {
      msg += `\n✅ Están todos parejos, no hay deudas.`
    }

    msg += `\n_Calculado con Dividito by Codito_`

    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank')
  }

  // ── Actions ──
  const addAmigo = () => {
    const newId = nextAmigoId++
    setAmigos(prev => [...prev, { id: newId, nombre: '' }])
    // Agregar nuevo amigo a todos los gastos existentes
    setGastos(prev => prev.map(g => ({ ...g, participantes: [...g.participantes, newId] })))
  }

  const removeAmigo = (id: number) => {
    if (amigos.length <= 2) return
    setAmigos(prev => prev.filter(a => a.id !== id))
    setGastos(prev => prev.map(g => ({
      ...g,
      pagadoPor: g.pagadoPor === id ? amigos.find(a => a.id !== id)!.id : g.pagadoPor,
      participantes: g.participantes.filter(p => p !== id),
    })))
  }

  const addGasto = () => {
    setGastos(prev => [...prev, {
      id: nextGastoId++,
      descripcion: '',
      monto: '',
      pagadoPor: amigos[0].id,
      participantes: amigos.map(a => a.id),
    }])
  }

  const removeGasto = (id: number) => {
    if (gastos.length <= 1) return
    setGastos(prev => prev.filter(g => g.id !== id))
  }

  const updateGasto = (id: number, field: keyof Gasto, value: string | number | number[]) => {
    setGastos(prev => prev.map(g => g.id === id ? { ...g, [field]: value } : g))
  }

  const toggleParticipante = (gastoId: number, amigoId: number) => {
    setGastos(prev => prev.map(g => {
      if (g.id !== gastoId) return g
      const has = g.participantes.includes(amigoId)
      if (has && g.participantes.length <= 1) return g // mínimo 1 participante
      return {
        ...g,
        participantes: has
          ? g.participantes.filter(p => p !== amigoId)
          : [...g.participantes, amigoId],
      }
    }))
  }

  const resetAll = () => {
    nextAmigoId = 3
    nextGastoId = 2
    setAmigos([{ id: 1, nombre: '' }, { id: 2, nombre: '' }])
    setGastos([{ id: 1, descripcion: '', monto: '', pagadoPor: 1, participantes: [1, 2] }])
    setPropinaPct('')
  }

  return (
    <div style={{ maxWidth: 680, margin: '0 auto' }}>

      {/* Back */}
      <div style={{ marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link href="/" style={{ fontSize: 13, fontWeight: 700, color: '#09090b', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6, background: '#f4f4f5', border: '1px solid #e4e4e7', borderRadius: 10, padding: '7px 14px' }}>
          ← Inicio
        </Link>
        {totalGastos > 0 && (
          <button onClick={resetAll} style={{
            fontSize: 12, fontWeight: 700, color: '#dc2626', background: '#fef2f2',
            border: '1px solid #fecaca', borderRadius: 10, padding: '7px 14px', cursor: 'pointer',
          }}>
            Borrar todo
          </button>
        )}
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
          Dividí los gastos entre amigos sin vueltas. Agregá gastos, elegí quién pagó y quiénes participan.
        </p>
      </div>

      {/* ═══ PASO 1: Amigos ═══ */}
      <div style={{
        background: '#fff', borderRadius: 20, padding: 'clamp(16px,4vw,24px)',
        border: '1px solid #e4e4e7', boxShadow: '0 2px 12px rgba(0,0,0,0.04)', marginBottom: 16,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          <span style={{
            width: 26, height: 26, borderRadius: 8, background: '#f97316', color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800,
          }}>1</span>
          <label style={{ fontSize: 13, fontWeight: 800, color: '#09090b', letterSpacing: '-0.01em' }}>
            ¿Quiénes son?
          </label>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {amigos.map((a, idx) => (
            <div key={a.id} style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '8px 12px', borderRadius: 12,
              border: '1.5px solid #e4e4e7', background: '#fafafa',
            }}>
              <span style={{
                width: 28, height: 28, borderRadius: 8,
                background: `hsl(${idx * 55}, 70%, 95%)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 12, fontWeight: 800, color: `hsl(${idx * 55}, 60%, 40%)`,
                flexShrink: 0,
              }}>
                {idx + 1}
              </span>
              <input
                type="text"
                placeholder={`Amigo ${idx + 1}`}
                value={a.nombre}
                onChange={e => setAmigos(prev => prev.map(x => x.id === a.id ? { ...x, nombre: e.target.value } : x))}
                style={{
                  border: 'none', outline: 'none', background: 'transparent',
                  fontSize: 14, fontWeight: 600, color: '#09090b', width: 100,
                }}
              />
              {amigos.length > 2 && (
                <button onClick={() => removeAmigo(a.id)} style={{
                  width: 22, height: 22, borderRadius: 6, border: 'none', background: '#fee2e2',
                  cursor: 'pointer', fontSize: 11, color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>✕</button>
              )}
            </div>
          ))}
          <button onClick={addAmigo} style={{
            padding: '8px 16px', borderRadius: 12, border: '2px dashed #d4d4d8',
            background: 'transparent', cursor: 'pointer', fontSize: 13, fontWeight: 700, color: '#71717a',
          }}>
            + Agregar
          </button>
        </div>
      </div>

      {/* ═══ PASO 2: Gastos ═══ */}
      <div style={{
        background: '#fff', borderRadius: 20, padding: 'clamp(16px,4vw,24px)',
        border: '1px solid #e4e4e7', boxShadow: '0 2px 12px rgba(0,0,0,0.04)', marginBottom: 16,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          <span style={{
            width: 26, height: 26, borderRadius: 8, background: '#f97316', color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800,
          }}>2</span>
          <label style={{ fontSize: 13, fontWeight: 800, color: '#09090b', letterSpacing: '-0.01em' }}>
            ¿Qué se gastó?
          </label>
        </div>

        <div style={{ display: 'grid', gap: 12 }}>
          {gastos.map((g, gIdx) => (
            <div key={g.id} style={{
              padding: '14px 16px', borderRadius: 16,
              border: '1.5px solid #e4e4e7', background: '#fafafa',
            }}>
              {/* Descripción + monto */}
              <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                <input
                  type="text"
                  placeholder={`Gasto ${gIdx + 1} (ej: Asado, Birra, Uber...)`}
                  value={g.descripcion}
                  onChange={e => updateGasto(g.id, 'descripcion', e.target.value)}
                  style={{
                    flex: 1, border: '1.5px solid #e4e4e7', borderRadius: 10, padding: '10px 12px',
                    fontSize: 14, fontWeight: 600, color: '#09090b', background: '#fff', outline: 'none',
                    minWidth: 0,
                  }}
                />
                <div style={{
                  display: 'flex', alignItems: 'center',
                  border: '1.5px solid #e4e4e7', borderRadius: 10, overflow: 'hidden', background: '#fff', flexShrink: 0,
                }}>
                  <span style={{ padding: '10px', fontSize: 14, fontWeight: 700, color: '#71717a', borderRight: '1px solid #e4e4e7', background: '#f4f4f5' }}>$</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="0"
                    value={g.monto}
                    onChange={e => updateGasto(g.id, 'monto', e.target.value.replace(/[^0-9.,]/g, ''))}
                    style={{
                      border: 'none', outline: 'none', background: 'transparent',
                      fontSize: 16, fontWeight: 800, color: '#09090b',
                      width: 80, padding: '10px',
                      fontVariantNumeric: 'tabular-nums',
                    }}
                  />
                </div>
                {gastos.length > 1 && (
                  <button onClick={() => removeGasto(g.id)} style={{
                    width: 36, height: 36, borderRadius: 10, border: '1px solid #e4e4e7',
                    background: '#fafafa', cursor: 'pointer', fontSize: 14, color: '#a1a1aa',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, alignSelf: 'center',
                  }}>✕</button>
                )}
              </div>

              {/* Quién pagó */}
              <div style={{ marginBottom: 8 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#71717a', marginBottom: 6, display: 'block' }}>Pagó:</span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {amigos.map((a, idx) => {
                    const selected = g.pagadoPor === a.id
                    return (
                      <button key={a.id} onClick={() => updateGasto(g.id, 'pagadoPor', a.id)} style={{
                        padding: '5px 10px', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer',
                        border: selected ? '2px solid #f97316' : '1.5px solid #e4e4e7',
                        background: selected ? '#fff7ed' : '#fff',
                        color: selected ? '#f97316' : '#71717a',
                        transition: 'all 0.1s',
                      }}>
                        {a.nombre || `Amigo ${idx + 1}`}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Quiénes participan */}
              <div>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#71717a', marginBottom: 6, display: 'block' }}>Dividen:</span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {amigos.map((a, idx) => {
                    const included = g.participantes.includes(a.id)
                    return (
                      <button key={a.id} onClick={() => toggleParticipante(g.id, a.id)} style={{
                        padding: '5px 10px', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer',
                        border: included ? '2px solid #16a34a' : '1.5px solid #e4e4e7',
                        background: included ? '#f0fdf4' : '#fff',
                        color: included ? '#16a34a' : '#a1a1aa',
                        transition: 'all 0.1s',
                      }}>
                        {included ? '✓ ' : ''}{a.nombre || `Amigo ${idx + 1}`}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>

        <button onClick={addGasto} style={{
          marginTop: 12, width: '100%', padding: '12px', borderRadius: 12,
          border: '2px dashed #d4d4d8', background: 'transparent', cursor: 'pointer',
          fontSize: 13, fontWeight: 700, color: '#71717a',
        }}>
          + Agregar otro gasto
        </button>
      </div>

      {/* ═══ Propina ═══ */}
      <div style={{
        background: '#fff', borderRadius: 20, padding: 'clamp(14px,3vw,20px) clamp(16px,4vw,24px)',
        border: '1px solid #e4e4e7', boxShadow: '0 2px 12px rgba(0,0,0,0.04)', marginBottom: 16,
        display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap',
      }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: '#09090b' }}>Propina</span>
        <div style={{ display: 'flex', gap: 6 }}>
          {['0', '10', '15', '20'].map(pct => (
            <button key={pct} onClick={() => setPropinaPct(pct === '0' ? '' : pct)} style={{
              padding: '6px 12px', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer',
              border: (propinaPct || '0') === pct || (!propinaPct && pct === '0') ? '2px solid #f97316' : '1.5px solid #e4e4e7',
              background: (propinaPct || '0') === pct || (!propinaPct && pct === '0') ? '#fff7ed' : '#fff',
              color: (propinaPct || '0') === pct || (!propinaPct && pct === '0') ? '#f97316' : '#71717a',
            }}>
              {pct === '0' ? 'Sin' : `${pct}%`}
            </button>
          ))}
        </div>
        {propinaPct && parseFloat(propinaPct) > 0 && (
          <span style={{ fontSize: 12, color: '#f97316', fontWeight: 600 }}>
            +{fmt(totalGastos * (parseFloat(propinaPct) / 100))}
          </span>
        )}
      </div>

      {/* ═══ RESUMEN ═══ */}
      {totalGastos > 0 && (
        <div style={{
          background: 'linear-gradient(135deg, #fff7ed, #ffedd5)',
          border: '2px solid #fed7aa', borderRadius: 20,
          padding: 'clamp(20px,5vw,28px)', marginBottom: 16,
        }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 16 }}>
            Resumen
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px,1fr))', gap: 16, marginBottom: 20 }}>
            <div>
              <p style={{ fontSize: 11, color: '#71717a', marginBottom: 4, fontWeight: 600 }}>Total gastado</p>
              <p style={{ fontSize: 'clamp(24px,6vw,36px)', fontWeight: 900, color: '#09090b', letterSpacing: '-0.03em', lineHeight: 1 }}>
                {fmt(totalConPropina)}
              </p>
            </div>
            <div>
              <p style={{ fontSize: 11, color: '#71717a', marginBottom: 4, fontWeight: 600 }}>Gastos</p>
              <p style={{ fontSize: 'clamp(20px,5vw,28px)', fontWeight: 800, color: '#ea580c', letterSpacing: '-0.02em', lineHeight: 1 }}>
                {gastos.filter(g => parseMonto(g.monto) > 0).length}
              </p>
            </div>
            <div>
              <p style={{ fontSize: 11, color: '#71717a', marginBottom: 4, fontWeight: 600 }}>Personas</p>
              <p style={{ fontSize: 'clamp(20px,5vw,28px)', fontWeight: 800, color: '#09090b', letterSpacing: '-0.02em', lineHeight: 1 }}>
                {amigos.length}
              </p>
            </div>
          </div>

          {/* Detalle por persona */}
          <div style={{ marginBottom: 16 }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
              Detalle por persona
            </p>
            <div style={{ display: 'grid', gap: 6 }}>
              {detallePorPersona.map((p, idx) => (
                <div key={p.id} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '10px 14px', borderRadius: 12,
                  background: 'rgba(255,255,255,0.8)', border: '1px solid #fed7aa',
                }}>
                  <span style={{
                    width: 28, height: 28, borderRadius: 8,
                    background: `hsl(${idx * 55}, 70%, 95%)`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 12, fontWeight: 800, color: `hsl(${idx * 55}, 60%, 40%)`,
                    flexShrink: 0,
                  }}>{idx + 1}</span>
                  <span style={{ flex: 1, fontSize: 13, fontWeight: 700, color: '#09090b' }}>{p.nombre}</span>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <p style={{ fontSize: 11, color: '#71717a' }}>Pagó {fmt(p.pagado)} · Debe {fmt(p.deberia)}</p>
                    <p style={{
                      fontSize: 13, fontWeight: 800,
                      color: p.balance > 1 ? '#16a34a' : p.balance < -1 ? '#dc2626' : '#71717a',
                    }}>
                      {p.balance > 1 ? `Le deben ${fmt(p.balance)}` : p.balance < -1 ? `Debe ${fmt(Math.abs(p.balance))}` : 'Está al día'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Transferencias */}
          {deudas.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
                Transferencias
              </p>
              <div style={{ display: 'grid', gap: 8 }}>
                {deudas.map((d, i) => (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '12px 16px', borderRadius: 14,
                    background: 'rgba(255,255,255,0.8)', border: '1px solid #fed7aa',
                  }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: '#dc2626', flex: 1 }}>{d.de}</span>
                    <span style={{ fontSize: 18 }}>➜</span>
                    <span style={{ fontSize: 14, fontWeight: 700, color: '#16a34a', flex: 1, textAlign: 'right' }}>{d.a}</span>
                    <span style={{
                      fontSize: 16, fontWeight: 900, color: '#09090b',
                      background: '#fff', padding: '6px 12px', borderRadius: 10,
                      border: '1px solid #e4e4e7', flexShrink: 0,
                    }}>{fmt(d.monto)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {deudas.length === 0 && (
            <div style={{
              padding: '14px', borderRadius: 12, background: 'rgba(255,255,255,0.7)',
              textAlign: 'center', fontSize: 14, color: '#16a34a', fontWeight: 700, marginBottom: 16,
            }}>
              Están todos parejos, no hay deudas.
            </div>
          )}

          {/* Botón compartir WhatsApp */}
          <button onClick={compartirWhatsApp} style={{
            width: '100%', padding: '14px', borderRadius: 14,
            border: 'none', background: '#25d366', color: '#fff',
            fontSize: 15, fontWeight: 800, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            boxShadow: '0 4px 14px rgba(37,211,102,0.4)',
            transition: 'transform 0.1s',
          }}>
            📱 Compartir por WhatsApp
          </button>
        </div>
      )}

      {/* Estado vacío */}
      {totalGastos === 0 && (
        <div style={{
          padding: '28px 20px', borderRadius: 20, background: '#f4f4f5',
          textAlign: 'center', color: '#a1a1aa', fontSize: 14, marginBottom: 16,
        }}>
          Agregá los gastos y te armamos las cuentas al instante
        </div>
      )}

      {/* Footer */}
      <p style={{ fontSize: 11, color: '#a1a1aa', textAlign: 'center', lineHeight: 1.6, marginBottom: 40 }}>
        Dividito by Codito — dividí gastos sin vueltas.
      </p>
    </div>
  )
}
