'use client'

import { useState } from 'react'
import Link from 'next/link'

export type BankPromo = {
  banco: string; icon: string; color: string; tarjeta: string
  descuento: number; dias: string[]; supers: string[]; tope?: string | null; nota?: string | null
  updated_at?: string
}

const DIAS_ORDER = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']

function getDiaHoy() {
  return ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'][new Date().getDay()]
}

// Formatea el array de días en texto legible
function formatDias(dias: string[]): { text: string; siempre: boolean } {
  if (dias.includes('Siempre')) return { text: 'Todos los días', siempre: true }
  const sorted = dias
    .filter(d => DIAS_ORDER.includes(d))
    .sort((a, b) => DIAS_ORDER.indexOf(a) - DIAS_ORDER.indexOf(b))
  if (sorted.length === 0) return { text: '—', siempre: false }
  if (sorted.length === 1) return { text: sorted[0], siempre: false }
  const last = sorted[sorted.length - 1]
  const rest = sorted.slice(0, -1)
  return { text: `${rest.join(', ')} y ${last}`, siempre: false }
}

export default function DescuentosClient({ promos, updatedAt }: { promos: BankPromo[]; updatedAt: string | null }) {
  const [diaFilter, setDiaFilter] = useState('Hoy')
  const diaHoy = getDiaHoy()

  const diaActivo      = diaFilter === 'Hoy' ? diaHoy : diaFilter
  const filteredPromos = promos.filter(p => p.dias.includes('Siempre') || p.dias.includes(diaActivo))

  const lastUpdate = updatedAt
    ? new Date(updatedAt).toLocaleDateString('es-AR', { day: 'numeric', month: 'long' })
    : null

  const DIAS_FILTRO = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']

  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      <div style={{ marginBottom: 20 }}>
        <Link href="/" style={{ fontSize: 13, fontWeight: 700, color: '#09090b', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6, background: '#f4f4f5', border: '1px solid #e4e4e7', borderRadius: 10, padding: '7px 14px' }}>
          ← Inicio
        </Link>
      </div>

      {/* Hero */}
      <div style={{ marginBottom: 24, textAlign: 'center', padding: '0 8px' }}>
        <div style={{ fontSize: 44, marginBottom: 8 }}>🏪</div>
        <h1 style={{ fontSize: 'clamp(22px, 6vw, 38px)', fontWeight: 900, color: '#09090b', letterSpacing: '-0.04em', lineHeight: 1.05, marginBottom: 8 }}>
          Descuentos en supermercados
        </h1>
        <p style={{ fontSize: 14, color: '#71717a', maxWidth: 500, margin: '0 auto', lineHeight: 1.6 }}>
          Los mejores descuentos por banco y tarjeta, organizados por día de la semana.
        </p>
        {lastUpdate && (
          <p style={{ fontSize: 11, color: '#a1a1aa', marginTop: 6 }}>
            Verificado: {lastUpdate}
          </p>
        )}
      </div>

      {/* Filtro día */}
      <div style={{ background: '#fff', borderRadius: 18, padding: '14px 18px', border: '1px solid #e4e4e7', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, flexWrap: 'wrap', gap: 6 }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Filtrar por día
          </p>
          <span style={{ fontSize: 11, fontWeight: 700, background: '#f0fdf4', color: '#15803d', border: '1px solid #bbf7d0', borderRadius: 999, padding: '3px 10px' }}>
            🟢 Hoy es {diaHoy}
          </span>
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <button
            onClick={() => setDiaFilter('Hoy')}
            style={{
              padding: '6px 14px', borderRadius: 999,
              border: '1.5px solid ' + (diaFilter === 'Hoy' ? '#16a34a' : '#e4e4e7'),
              background: diaFilter === 'Hoy' ? '#16a34a' : '#fafafa',
              color: diaFilter === 'Hoy' ? '#fff' : '#71717a',
              fontSize: 12, fontWeight: 700, cursor: 'pointer',
            }}
          >
            🟢 Hoy ({diaHoy})
          </button>
          {DIAS_FILTRO.map(d => (
            <button
              key={d}
              onClick={() => setDiaFilter(d)}
              style={{
                padding: '6px 12px', borderRadius: 999,
                border: '1.5px solid ' + (diaFilter === d ? '#09090b' : '#e4e4e7'),
                background: diaFilter === d ? '#09090b' : '#fafafa',
                color: diaFilter === d ? '#fff' : '#71717a',
                fontSize: 12, fontWeight: 600, cursor: 'pointer',
              }}
            >
              {d}
            </button>
          ))}
        </div>
      </div>

      {/* Resultados */}
      {filteredPromos.length > 0 ? (
        <>
          <p style={{ fontSize: 12, fontWeight: 700, color: '#16a34a', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
            ✅ {filteredPromos.length} descuento{filteredPromos.length !== 1 ? 's' : ''}{' '}
            {diaFilter === 'Hoy' ? `disponibles hoy (${diaHoy})` : `los ${diaFilter}`}
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 340px), 1fr))', gap: 12, marginBottom: 24 }}>
            {filteredPromos
              .sort((a, b) => b.descuento - a.descuento)
              .map(p => <PromoCard key={p.banco} promo={p} />)
            }
          </div>
        </>
      ) : (
        <div style={{ textAlign: 'center', padding: '40px 0', color: '#a1a1aa' }}>
          <p style={{ fontSize: 32, marginBottom: 10 }}>😴</p>
          <p style={{ fontSize: 14, fontWeight: 600 }}>No hay descuentos registrados para este día.</p>
        </div>
      )}

      {/* Disclaimer */}
      <div style={{
        background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 14,
        padding: '12px 16px', marginBottom: 40, display: 'flex', gap: 10, alignItems: 'flex-start',
      }}>
        <span style={{ fontSize: 16, flexShrink: 0 }}>⚠️</span>
        <p style={{ fontSize: 12, color: '#92400e', lineHeight: 1.6 }}>
          <strong>Datos orientativos.</strong> Las promociones pueden cambiar sin aviso. Verificá siempre en el sitio o app oficial de tu banco antes de ir al supermercado.
        </p>
      </div>
    </div>
  )
}

function PromoCard({ promo }: { promo: BankPromo }) {
  const { text: diasText, siempre } = formatDias(promo.dias)

  return (
    <div style={{
      background: '#fff',
      border: `1.5px solid ${promo.color}30`,
      borderRadius: 18,
      overflow: 'hidden',
      position: 'relative',
    }}>
      {/* Barra de color lateral */}
      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, background: promo.color, borderRadius: '18px 0 0 18px' }} />

      <div style={{ paddingLeft: 12, padding: '16px 18px 16px 16px' }}>
        {/* Header: banco + descuento */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 24, lineHeight: 1 }}>{promo.icon}</span>
            <div>
              <p style={{ fontSize: 15, fontWeight: 800, color: '#09090b', letterSpacing: '-0.01em' }}>
                {promo.banco}
              </p>
              <p style={{ fontSize: 11, color: '#71717a', marginTop: 1 }}>{promo.tarjeta}</p>
            </div>
          </div>
          <div style={{
            background: promo.color, color: '#fff',
            borderRadius: 12, padding: '6px 14px',
            fontSize: 22, fontWeight: 900, letterSpacing: '-0.03em',
            lineHeight: 1, flexShrink: 0,
          }}>
            -{promo.descuento}%
          </div>
        </div>

        {/* Días — una sola línea limpia */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
          <span style={{ fontSize: 13 }}>{siempre ? '🟢' : '📅'}</span>
          <span style={{
            fontSize: 13, fontWeight: 700,
            color: siempre ? '#15803d' : '#09090b',
          }}>
            {diasText}
          </span>
        </div>

        {/* Supermercados */}
        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: (promo.tope || promo.nota) ? 10 : 0 }}>
          {promo.supers.map(s => (
            <span key={s} style={{
              fontSize: 11, padding: '3px 9px', borderRadius: 999,
              background: '#f4f4f5', color: '#374151', fontWeight: 500,
            }}>
              🏪 {s}
            </span>
          ))}
        </div>

        {/* Tope / nota */}
        {(promo.tope || promo.nota) && (
          <p style={{ fontSize: 10, color: '#a1a1aa', lineHeight: 1.5, marginTop: 2 }}>
            {promo.tope && <><span style={{ fontWeight: 700 }}>⚠️ Tope:</span> {promo.tope}. </>}
            {promo.nota}
          </p>
        )}
      </div>
    </div>
  )
}
