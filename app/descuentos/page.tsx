'use client'

import { useState } from 'react'
import Link from 'next/link'

type BankPromo = {
  banco: string; icon: string; color: string; tarjeta: string
  descuento: number; dias: string[]; supers: string[]; tope?: string; nota?: string
}

const DIAS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo', 'Siempre']

const BANK_PROMOS: BankPromo[] = [
  { banco: 'Santander', icon: '🔴', color: '#ec0000', tarjeta: 'Visa / Mastercard',
    descuento: 25, dias: ['Miércoles'], supers: ['Carrefour', 'Disco', 'Vea', 'Jumbo'], tope: '$5.000 de descuento' },
  { banco: 'Galicia', icon: '🟠', color: '#e95b0c', tarjeta: 'Visa / Mastercard',
    descuento: 20, dias: ['Martes', 'Jueves'], supers: ['Coto', 'Jumbo'], nota: 'Aplicable en compras presenciales' },
  { banco: 'BBVA', icon: '🔵', color: '#004481', tarjeta: 'Visa / Mastercard',
    descuento: 25, dias: ['Lunes'], supers: ['Carrefour'], tope: '$3.000 de descuento' },
  { banco: 'Banco Macro', icon: '🟡', color: '#f5b400', tarjeta: 'Visa / Mastercard',
    descuento: 20, dias: ['Miércoles'], supers: ['Changomás', 'La Anónima'] },
  { banco: 'Banco Nación', icon: '🇦🇷', color: '#009cde', tarjeta: 'Visa',
    descuento: 20, dias: ['Miércoles', 'Viernes'], supers: ['Changomás', 'Vea', 'Carrefour'], nota: 'Programa Precios Cuidados / BNA+' },
  { banco: 'Naranja X', icon: '🍊', color: '#ff6a00', tarjeta: 'Naranja Visa',
    descuento: 20, dias: ['Viernes'], supers: ['Carrefour', 'Día', 'Supermercados varios'] },
  { banco: 'HSBC', icon: '⬜', color: '#db0011', tarjeta: 'Visa / Mastercard',
    descuento: 25, dias: ['Jueves'], supers: ['Jumbo', 'Disco', 'Vea'], tope: '$4.000 de descuento' },
  { banco: 'Brubank', icon: '🟣', color: '#6a0dad', tarjeta: 'Visa Débito',
    descuento: 10, dias: ['Siempre'], supers: ['Carrefour'], nota: 'Sin tope de descuento' },
  { banco: 'Personal Pay', icon: '🟢', color: '#00a550', tarjeta: 'Visa Prepaga',
    descuento: 15, dias: ['Siempre'], supers: ['Supermercados seleccionados'], nota: 'Verificar en la app' },
  { banco: 'Uala', icon: '💜', color: '#7b2d8b', tarjeta: 'Mastercard Prepaga',
    descuento: 10, dias: ['Lunes', 'Martes'], supers: ['Coto', 'Carrefour'] },
  { banco: 'Mercado Pago', icon: '💙', color: '#009ee3', tarjeta: 'Tarjeta MP / QR',
    descuento: 10, dias: ['Siempre'], supers: ['Supermercados seleccionados'], nota: 'Verificar descuento activo en la app' },
  { banco: 'Banco Provincia', icon: '🏦', color: '#0057a8', tarjeta: 'Visa / Mastercard',
    descuento: 20, dias: ['Martes'], supers: ['Carrefour', 'Changomás'], nota: 'Solo provincia de Buenos Aires' },
]

function getDiaHoy() {
  return ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'][new Date().getDay()]
}

export default function Descuentos() {
  const [diaFilter, setDiaFilter] = useState('Hoy')
  const diaHoy = getDiaHoy()

  const diaActivo      = diaFilter === 'Hoy' ? diaHoy : diaFilter
  const filteredPromos = BANK_PROMOS.filter(p => p.dias.includes('Siempre') || p.dias.includes(diaActivo))
  const otrosPromos    = BANK_PROMOS.filter(p => !p.dias.includes('Siempre') && !p.dias.includes(diaActivo))

  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      <div style={{ marginBottom: 20 }}>
        <Link href="/" style={{ fontSize: 13, color: '#71717a', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          ← Volver
        </Link>
      </div>

      {/* Hero */}
      <div style={{ marginBottom: 28, textAlign: 'center', padding: '0 8px' }}>
        <div style={{ fontSize: 48, marginBottom: 10 }}>🏪</div>
        <h1 style={{ fontSize: 'clamp(24px, 6vw, 40px)', fontWeight: 900, color: '#09090b', letterSpacing: '-0.04em', lineHeight: 1.05, marginBottom: 8 }}>
          Descuentos en supermercados
        </h1>
        <p style={{ fontSize: 14, color: '#71717a', maxWidth: 500, margin: '0 auto', lineHeight: 1.6 }}>
          Los mejores descuentos por banco y tarjeta, organizados por día de la semana.
        </p>
      </div>

      {/* Filtro día */}
      <div style={{ background: '#fff', borderRadius: 20, padding: '14px 18px', border: '1px solid #e4e4e7', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, flexWrap: 'wrap', gap: 8 }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Filtrar por día</p>
          <span style={{ fontSize: 11, fontWeight: 700, background: '#f0fdf4', color: '#15803d', border: '1px solid #bbf7d0', borderRadius: 999, padding: '3px 10px' }}>
            🟢 Hoy es {diaHoy}
          </span>
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {(['Hoy', ...DIAS]).map(d => (
            <button key={d} onClick={() => setDiaFilter(d)} style={{
              padding: '6px 12px', borderRadius: 999, border: '1px solid #e4e4e7',
              background: diaFilter === d ? (d === 'Hoy' ? '#16a34a' : '#09090b') : '#fafafa',
              color: diaFilter === d ? '#fff' : '#71717a',
              fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s', whiteSpace: 'nowrap',
            }}>
              {d === 'Hoy' ? `🟢 Hoy (${diaHoy})` : d}
            </button>
          ))}
        </div>
      </div>

      {/* Promos activas */}
      {filteredPromos.length > 0 && (
        <>
          <p style={{ fontSize: 12, fontWeight: 700, color: '#16a34a', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
            ✅ {filteredPromos.length} descuento{filteredPromos.length > 1 ? 's' : ''} disponible{filteredPromos.length > 1 ? 's' : ''}
            {diaFilter === 'Hoy' ? ` hoy (${diaHoy})` : ` los ${diaFilter}`}
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%,340px),1fr))', gap: 12, marginBottom: 20 }}>
            {filteredPromos.map(p => <PromoCard key={p.banco} promo={p} active />)}
          </div>
        </>
      )}

      {/* Otros días */}
      {otrosPromos.length > 0 && (
        <>
          <p style={{ fontSize: 12, fontWeight: 600, color: '#a1a1aa', marginBottom: 10, marginTop: 8 }}>Otros descuentos (días distintos)</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%,340px),1fr))', gap: 12, marginBottom: 32 }}>
            {otrosPromos.map(p => <PromoCard key={p.banco} promo={p} active={false} />)}
          </div>
        </>
      )}

      <p style={{ fontSize: 11, color: '#a1a1aa', textAlign: 'center', lineHeight: 1.6, marginBottom: 40 }}>
        Los descuentos pueden variar. Verificar en el sitio de tu banco antes de comprar.
      </p>
    </div>
  )
}

function PromoCard({ promo, active }: { promo: BankPromo; active: boolean }) {
  return (
    <div style={{
      background: active ? '#fff' : '#fafafa',
      border: `1.5px solid ${active ? promo.color + '40' : '#e4e4e7'}`,
      borderRadius: 18, padding: '16px 18px', opacity: active ? 1 : 0.7,
      position: 'relative', overflow: 'hidden',
    }}>
      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, background: promo.color, borderRadius: '18px 0 0 18px' }} />
      <div style={{ paddingLeft: 8 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 22 }}>{promo.icon}</span>
            <div>
              <p style={{ fontSize: 14, fontWeight: 800, color: '#09090b', letterSpacing: '-0.01em' }}>{promo.banco}</p>
              <p style={{ fontSize: 11, color: '#71717a' }}>{promo.tarjeta}</p>
            </div>
          </div>
          <div style={{ background: active ? promo.color : '#e4e4e7', color: '#fff', borderRadius: 12, padding: '6px 12px', fontSize: 20, fontWeight: 900, letterSpacing: '-0.03em', lineHeight: 1, flexShrink: 0 }}>
            -{promo.descuento}%
          </div>
        </div>
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 8 }}>
          {promo.dias.map(d => (
            <span key={d} style={{ fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 999, background: d === 'Siempre' ? '#f0fdf4' : '#eff6ff', color: d === 'Siempre' ? '#15803d' : '#1d4ed8', border: `1px solid ${d === 'Siempre' ? '#bbf7d0' : '#bfdbfe'}` }}>
              {d === 'Siempre' ? '🟢 Todos los días' : `📅 ${d}`}
            </span>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: promo.tope || promo.nota ? 8 : 0 }}>
          {promo.supers.map(s => (
            <span key={s} style={{ fontSize: 11, padding: '2px 8px', borderRadius: 999, background: '#f4f4f5', color: '#374151', fontWeight: 500 }}>
              🏪 {s}
            </span>
          ))}
        </div>
        {(promo.tope || promo.nota) && (
          <p style={{ fontSize: 10, color: '#a1a1aa', marginTop: 4, lineHeight: 1.4 }}>
            {promo.tope && `⚠️ Tope: ${promo.tope}. `}{promo.nota}
          </p>
        )}
      </div>
    </div>
  )
}
