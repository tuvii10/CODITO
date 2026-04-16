'use client'

import { useState } from 'react'
import Link from 'next/link'

// ─── Lógica ───────────────────────────────────────────────────────────────────
//
// Para cada cuota k (k = 1..n), su valor en pesos de HOY es:
//   VP(k) = cuota / (1 + inflacion_mensual)^k
//
// La suma de todos los VP es el "costo real" de pagar en cuotas.
// Si ese costo real < precio contado → convienen las cuotas.

function calcularCuotas(contado: number, totalCuotas: number, nCuotas: number, inflacion: number) {
  const i     = inflacion / 100
  const cuota = totalCuotas / nCuotas
  let valorPresente = 0
  for (let k = 1; k <= nCuotas; k++) {
    valorPresente += cuota / Math.pow(1 + i, k)
  }
  const diferencia    = contado - valorPresente  // positivo = convienen cuotas
  const porcentaje    = (diferencia / contado) * 100
  const convieneCuota = valorPresente < contado
  return { valorPresente, cuota, diferencia, porcentaje, convieneCuota }
}

function fmtARS(n: number) {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(n)
}

function parseNum(s: string): number {
  return parseFloat(s.replace(/\./g, '').replace(',', '.')) || 0
}

// ─── Página ───────────────────────────────────────────────────────────────────

export default function CuotasPage() {
  const [contado,    setContado]    = useState('')
  const [totalCuota, setTotalCuota] = useState('')
  const [nCuotas,    setNCuotas]    = useState('12')
  const [inflacion,  setInflacion]  = useState('2.9')
  const [calculado,  setCalculado]  = useState(false)

  const contadoNum    = parseNum(contado)
  const totalNum      = parseNum(totalCuota)
  const nNum          = parseInt(nCuotas) || 12
  const inflacionNum  = parseFloat(inflacion) || 2.9

  const puedeCalcular = contadoNum > 0 && totalNum > 0 && nNum > 0

  const result = puedeCalcular
    ? calcularCuotas(contadoNum, totalNum, nNum, inflacionNum)
    : null

  const sobrePrecio = puedeCalcular && contadoNum > 0
    ? ((totalNum - contadoNum) / contadoNum) * 100
    : 0

  return (
    <div style={{ maxWidth: 560, margin: '0 auto' }}>
      {/* Nav */}
      <div style={{ marginBottom: 20 }}>
        <Link href="/" style={{ fontSize: 13, fontWeight: 700, color: '#09090b', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6, background: '#f4f4f5', border: '1px solid #e4e4e7', borderRadius: 10, padding: '7px 14px' }}>
          ← Inicio
        </Link>
      </div>

      {/* Hero */}
      <div style={{ marginBottom: 28, textAlign: 'center' }}>
        <div style={{ fontSize: 44, marginBottom: 8 }}>🧮</div>
        <h1 style={{ fontSize: 'clamp(22px, 6vw, 36px)', fontWeight: 900, color: '#09090b', letterSpacing: '-0.04em', lineHeight: 1.05, marginBottom: 8 }}>
          ¿Cuotas o contado?
        </h1>
        <p style={{ fontSize: 14, color: '#71717a', maxWidth: 420, margin: '0 auto', lineHeight: 1.6 }}>
          Con inflación, las cuotas pueden salir más baratas en pesos de hoy.
          Calculá si te conviene pagar ahora o en cuotas.
        </p>
      </div>

      {/* Formulario */}
      <div style={{ background: '#fff', border: '1px solid #e4e4e7', borderRadius: 20, padding: '24px 22px', marginBottom: 16 }}>

        {/* Precio contado */}
        <div style={{ marginBottom: 18 }}>
          <label style={{ fontSize: 12, fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 6 }}>
            💵 Precio al contado
          </label>
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 14, fontWeight: 700, color: '#71717a' }}>$</span>
            <input
              type="text"
              inputMode="numeric"
              placeholder="0"
              value={contado}
              onChange={e => { setContado(e.target.value); setCalculado(false) }}
              style={{
                width: '100%', boxSizing: 'border-box',
                border: '1.5px solid #e4e4e7', borderRadius: 12,
                padding: '12px 14px 12px 28px',
                fontSize: 18, fontWeight: 700, color: '#09090b',
                outline: 'none', background: '#fafafa',
              }}
            />
          </div>
        </div>

        {/* Cuotas */}
        <div style={{ marginBottom: 18 }}>
          <label style={{ fontSize: 12, fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 6 }}>
            📅 Cantidad de cuotas
          </label>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {[3, 6, 9, 12, 18, 24].map(n => (
              <button
                key={n}
                onClick={() => { setNCuotas(String(n)); setCalculado(false) }}
                style={{
                  padding: '8px 16px', borderRadius: 10, fontSize: 13, fontWeight: 700,
                  border: `1.5px solid ${nCuotas === String(n) ? '#09090b' : '#e4e4e7'}`,
                  background: nCuotas === String(n) ? '#09090b' : '#fafafa',
                  color: nCuotas === String(n) ? '#fff' : '#71717a',
                  cursor: 'pointer',
                }}
              >
                {n}x
              </button>
            ))}
            <input
              type="number"
              min={1}
              max={60}
              placeholder="otro"
              value={[3,6,9,12,18,24].includes(parseInt(nCuotas)) ? '' : nCuotas}
              onChange={e => { setNCuotas(e.target.value); setCalculado(false) }}
              style={{
                width: 70, border: '1.5px solid #e4e4e7', borderRadius: 10,
                padding: '8px 10px', fontSize: 13, fontWeight: 600, color: '#09090b',
                outline: 'none', background: '#fafafa', textAlign: 'center',
              }}
            />
          </div>
        </div>

        {/* Total en cuotas */}
        <div style={{ marginBottom: 18 }}>
          <label style={{ fontSize: 12, fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 6 }}>
            💳 Total a pagar en cuotas
          </label>
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 14, fontWeight: 700, color: '#71717a' }}>$</span>
            <input
              type="text"
              inputMode="numeric"
              placeholder="0"
              value={totalCuota}
              onChange={e => { setTotalCuota(e.target.value); setCalculado(false) }}
              style={{
                width: '100%', boxSizing: 'border-box',
                border: '1.5px solid #e4e4e7', borderRadius: 12,
                padding: '12px 14px 12px 28px',
                fontSize: 18, fontWeight: 700, color: '#09090b',
                outline: 'none', background: '#fafafa',
              }}
            />
          </div>
          {puedeCalcular && totalNum > 0 && nNum > 0 && (
            <p style={{ fontSize: 11, color: '#71717a', marginTop: 6 }}>
              = {fmtARS(totalNum / nNum)}/mes × {nNum} cuotas
              {sobrePrecio > 0 && (
                <span style={{ color: '#dc2626', fontWeight: 700, marginLeft: 6 }}>
                  (+{sobrePrecio.toFixed(0)}% sobre contado)
                </span>
              )}
              {sobrePrecio === 0 && totalNum === contadoNum && (
                <span style={{ color: '#16a34a', fontWeight: 700, marginLeft: 6 }}>
                  (sin interés nominal)
                </span>
              )}
            </p>
          )}
        </div>

        {/* Inflación mensual */}
        <div style={{ marginBottom: 22 }}>
          <label style={{ fontSize: 12, fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 6 }}>
            📈 Inflación mensual estimada
          </label>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {[2.5, 2.9, 3.5, 4.0, 5.0].map(v => (
              <button
                key={v}
                onClick={() => { setInflacion(String(v)); setCalculado(false) }}
                style={{
                  padding: '8px 14px', borderRadius: 10, fontSize: 13, fontWeight: 700,
                  border: `1.5px solid ${inflacion === String(v) ? '#7c3aed' : '#e4e4e7'}`,
                  background: inflacion === String(v) ? '#7c3aed' : '#fafafa',
                  color: inflacion === String(v) ? '#fff' : '#71717a',
                  cursor: 'pointer',
                }}
              >
                {v}%
              </button>
            ))}
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <input
                type="number"
                step={0.1}
                min={0}
                max={30}
                placeholder="otro"
                value={[2.5, 2.9, 3.5, 4.0, 5.0].includes(parseFloat(inflacion)) ? '' : inflacion}
                onChange={e => { setInflacion(e.target.value); setCalculado(false) }}
                style={{
                  width: 70, border: '1.5px solid #e4e4e7', borderRadius: 10,
                  padding: '8px 10px', fontSize: 13, fontWeight: 600, color: '#09090b',
                  outline: 'none', background: '#fafafa', textAlign: 'center',
                }}
              />
              <span style={{ fontSize: 13, color: '#71717a', fontWeight: 700 }}>%</span>
            </div>
          </div>
          <p style={{ fontSize: 10, color: '#a1a1aa', marginTop: 6 }}>
            IPC INDEC febrero 2026: 2.4% · marzo 2026: estimado ~2.9%
          </p>
        </div>

        {/* Botón calcular */}
        <button
          onClick={() => setCalculado(true)}
          disabled={!puedeCalcular}
          style={{
            width: '100%', padding: '14px', borderRadius: 14,
            background: puedeCalcular ? '#09090b' : '#e4e4e7',
            color: puedeCalcular ? '#fff' : '#a1a1aa',
            border: 'none', fontSize: 15, fontWeight: 800,
            cursor: puedeCalcular ? 'pointer' : 'not-allowed',
            letterSpacing: '-0.01em',
          }}
        >
          Calcular →
        </button>
      </div>

      {/* Resultado */}
      {calculado && result && (
        <div style={{
          border: `2px solid ${result.convieneCuota ? '#16a34a' : '#0284c7'}`,
          borderRadius: 20, overflow: 'hidden', marginBottom: 24,
          background: result.convieneCuota ? '#f0fdf4' : '#eff6ff',
        }}>
          {/* Veredicto */}
          <div style={{ padding: '20px 22px', textAlign: 'center' }}>
            <p style={{ fontSize: 36, marginBottom: 6 }}>
              {result.convieneCuota ? '✅' : '💵'}
            </p>
            <p style={{ fontSize: 20, fontWeight: 900, color: '#09090b', letterSpacing: '-0.03em', marginBottom: 4 }}>
              {result.convieneCuota
                ? `Convienen las cuotas`
                : `Conviene pagar al contado`}
            </p>
            <p style={{ fontSize: 14, color: '#52525b', lineHeight: 1.5 }}>
              {result.convieneCuota
                ? <>Las {nNum} cuotas equivalen a <strong>{fmtARS(result.valorPresente)}</strong> en pesos de hoy,<br />mientras que el contado sale <strong>{fmtARS(contadoNum)}</strong>.</>
                : <>Las {nNum} cuotas equivalen a <strong>{fmtARS(result.valorPresente)}</strong> en pesos de hoy,<br />más caro que el contado de <strong>{fmtARS(contadoNum)}</strong>.</>
              }
            </p>
          </div>

          {/* Desglose */}
          <div style={{ background: '#fff', borderTop: `1.5px solid ${result.convieneCuota ? '#bbf7d0' : '#bfdbfe'}`, padding: '16px 22px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <ResultRow
              label="Precio al contado"
              value={fmtARS(contadoNum)}
              color="#09090b"
              bold
            />
            <ResultRow
              label={`Total nominal (${nNum} cuotas de ${fmtARS(result.cuota)})`}
              value={fmtARS(totalNum)}
              color="#52525b"
            />
            <ResultRow
              label={`Valor real en pesos de hoy (con ${inflacionNum}%/mes)`}
              value={fmtARS(result.valorPresente)}
              color={result.convieneCuota ? '#16a34a' : '#0284c7'}
              bold
            />
            <div style={{ borderTop: '1px solid #f4f4f5', paddingTop: 10 }}>
              <ResultRow
                label={result.convieneCuota ? '✅ Ahorrás en cuotas' : '⚠️ Pagás de más en cuotas'}
                value={`${fmtARS(Math.abs(result.diferencia))} (${Math.abs(result.porcentaje).toFixed(1)}%)`}
                color={result.convieneCuota ? '#16a34a' : '#dc2626'}
                bold
              />
            </div>
          </div>
        </div>
      )}

      {/* Explicación */}
      <div style={{ background: '#fff', border: '1px solid #e4e4e7', borderRadius: 16, padding: '16px 18px', marginBottom: 40 }}>
        <p style={{ fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 8 }}>¿Cómo funciona el cálculo?</p>
        <p style={{ fontSize: 12, color: '#71717a', lineHeight: 1.7 }}>
          Con inflación, un peso de hoy vale más que un peso en el futuro.
          Cada cuota se "descuenta" al valor de hoy usando la inflación mensual.
          Si la suma de todas las cuotas en pesos de hoy es menor al precio contado,
          <strong> conviene pagar en cuotas</strong> — la inflación "come" parte del costo real.
        </p>
        <p style={{ fontSize: 11, color: '#a1a1aa', marginTop: 8, lineHeight: 1.5 }}>
          El resultado es una estimación. La inflación real puede variar.
          Fuente inflación: IPC INDEC.
        </p>
      </div>
    </div>
  )
}

function ResultRow({ label, value, color, bold }: {
  label: string; value: string; color: string; bold?: boolean
}) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
      <span style={{ fontSize: 12, color: '#52525b', lineHeight: 1.4, flex: 1 }}>{label}</span>
      <span style={{ fontSize: 14, fontWeight: bold ? 800 : 600, color, whiteSpace: 'nowrap' }}>{value}</span>
    </div>
  )
}
