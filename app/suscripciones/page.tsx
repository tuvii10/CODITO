'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

// ─── Tipos ────────────────────────────────────────────────────────────────────

type DolarRates = { blue: number | null; oficial: number | null; mep: number | null }

type Plan = { name: string; usd: number; highlight?: boolean }
type Service = {
  id: string
  name: string
  icon: string
  category: string
  plans: Plan[]
  note?: string
}

type BankPromo = {
  banco: string
  icon: string
  color: string
  tarjeta: string
  descuento: number
  dias: string[]
  supers: string[]
  tope?: string
  nota?: string
}

// ─── Datos: suscripciones ─────────────────────────────────────────────────────

const SERVICES: Service[] = [
  // Streaming video
  { id: 'netflix', name: 'Netflix', icon: '🎬', category: 'Streaming',
    plans: [{ name: 'Básico c/anuncios', usd: 7 }, { name: 'Estándar', usd: 15.49, highlight: true }, { name: 'Premium', usd: 22.99 }] },
  { id: 'disney', name: 'Disney+', icon: '🏰', category: 'Streaming',
    plans: [{ name: 'Estándar', usd: 7.99, highlight: true }, { name: 'Premium', usd: 13.99 }] },
  { id: 'max', name: 'Max (HBO)', icon: '📺', category: 'Streaming',
    plans: [{ name: 'Con anuncios', usd: 9.99 }, { name: 'Sin anuncios', usd: 15.99, highlight: true }, { name: 'Ultimate', usd: 20.99 }] },
  { id: 'prime', name: 'Amazon Prime', icon: '📦', category: 'Streaming',
    plans: [{ name: 'Prime (todo incluido)', usd: 14.99, highlight: true }] },
  { id: 'appletv', name: 'Apple TV+', icon: '🍎', category: 'Streaming',
    plans: [{ name: 'Individual', usd: 9.99, highlight: true }] },
  { id: 'youtube', name: 'YouTube Premium', icon: '▶️', category: 'Streaming',
    plans: [{ name: 'Individual', usd: 13.99, highlight: true }, { name: 'Familiar', usd: 22.99 }] },
  { id: 'paramount', name: 'Paramount+', icon: '⭐', category: 'Streaming',
    plans: [{ name: 'Essential', usd: 7.99, highlight: true }, { name: 'Con Showtime', usd: 12.99 }] },
  { id: 'crunchyroll', name: 'Crunchyroll', icon: '🎌', category: 'Streaming',
    plans: [{ name: 'Fan', usd: 7.99, highlight: true }, { name: 'Mega Fan', usd: 9.99 }] },

  // Música
  { id: 'spotify', name: 'Spotify', icon: '🟢', category: 'Música',
    plans: [{ name: 'Individual', usd: 11.99, highlight: true }, { name: 'Duo', usd: 14.99 }, { name: 'Familiar', usd: 17.99 }] },
  { id: 'applemusic', name: 'Apple Music', icon: '🎵', category: 'Música',
    plans: [{ name: 'Individual', usd: 10.99, highlight: true }, { name: 'Familiar', usd: 16.99 }] },
  { id: 'ytmusic', name: 'YouTube Music', icon: '🎶', category: 'Música',
    plans: [{ name: 'Individual', usd: 10.99, highlight: true }, { name: 'Familiar', usd: 16.99 }] },
  { id: 'tidal', name: 'Tidal', icon: '🌊', category: 'Música',
    plans: [{ name: 'Individual', usd: 10.99, highlight: true }, { name: 'HiFi Plus', usd: 19.99 }] },

  // Gaming
  { id: 'gamepass', name: 'Xbox Game Pass', icon: '🎮', category: 'Gaming',
    plans: [{ name: 'PC', usd: 11.99 }, { name: 'Ultimate', usd: 19.99, highlight: true }] },
  { id: 'ps', name: 'PlayStation Plus', icon: '🕹️', category: 'Gaming',
    plans: [{ name: 'Essential', usd: 9.99, highlight: true }, { name: 'Extra', usd: 14.99 }, { name: 'Premium', usd: 17.99 }] },
  { id: 'eaplay', name: 'EA Play', icon: '⚽', category: 'Gaming',
    plans: [{ name: 'Individual', usd: 4.99, highlight: true }, { name: 'Pro', usd: 14.99 }] },
  { id: 'nintendo', name: 'Nintendo Online', icon: '🔴', category: 'Gaming',
    plans: [{ name: 'Individual', usd: 3.99, highlight: true }, { name: 'Familiar', usd: 7.99 }] },

  // IA y Productividad
  { id: 'claude', name: 'Claude Pro', icon: '🤖', category: 'IA & Prod.',
    plans: [{ name: 'Pro', usd: 20, highlight: true }] },
  { id: 'chatgpt', name: 'ChatGPT Plus', icon: '💬', category: 'IA & Prod.',
    plans: [{ name: 'Plus', usd: 20, highlight: true }, { name: 'Team', usd: 25 }] },
  { id: 'perplexity', name: 'Perplexity', icon: '🔍', category: 'IA & Prod.',
    plans: [{ name: 'Pro', usd: 20, highlight: true }] },
  { id: 'notion', name: 'Notion', icon: '📝', category: 'IA & Prod.',
    plans: [{ name: 'Plus', usd: 10, highlight: true }] },
  { id: 'canva', name: 'Canva Pro', icon: '🎨', category: 'IA & Prod.',
    plans: [{ name: 'Pro', usd: 14.99, highlight: true }] },

  // Diseño y Dev
  { id: 'adobe', name: 'Adobe CC', icon: '🅰️', category: 'Diseño & Dev',
    plans: [{ name: 'Individual', usd: 54.99, highlight: true }, { name: 'Todo incluido', usd: 89.99 }],
    note: 'Precio puede variar según plan y región' },
  { id: 'figma', name: 'Figma', icon: '🖼️', category: 'Diseño & Dev',
    plans: [{ name: 'Professional', usd: 12, highlight: true }, { name: 'Organization', usd: 45 }] },
  { id: 'github', name: 'GitHub Copilot', icon: '🐙', category: 'Diseño & Dev',
    plans: [{ name: 'Individual', usd: 10, highlight: true }] },

  // VPN y Seguridad
  { id: 'nordvpn', name: 'NordVPN', icon: '🛡️', category: 'VPN & Seg.',
    plans: [{ name: 'Complete (mensual)', usd: 14.99, highlight: true }],
    note: 'Precio mensual — baja mucho en planes anuales' },
  { id: 'expressvpn', name: 'ExpressVPN', icon: '⚡', category: 'VPN & Seg.',
    plans: [{ name: 'Mensual', usd: 12.95, highlight: true }] },
  { id: '1password', name: '1Password', icon: '🔑', category: 'VPN & Seg.',
    plans: [{ name: 'Individual', usd: 2.99, highlight: true }, { name: 'Familiar', usd: 4.99 }] },
]

const CATEGORIES = ['Todos', ...Array.from(new Set(SERVICES.map(s => s.category)))]

// ─── Datos: descuentos supermercados ─────────────────────────────────────────

const DIAS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo', 'Siempre']

const BANK_PROMOS: BankPromo[] = [
  {
    banco: 'Santander', icon: '🔴', color: '#ec0000', tarjeta: 'Visa / Mastercard',
    descuento: 25, dias: ['Miércoles'],
    supers: ['Carrefour', 'Disco', 'Vea', 'Jumbo'],
    tope: '$5.000 de descuento',
  },
  {
    banco: 'Galicia', icon: '🟠', color: '#e95b0c', tarjeta: 'Visa / Mastercard',
    descuento: 20, dias: ['Martes', 'Jueves'],
    supers: ['Coto', 'Jumbo'],
    nota: 'Aplicable en compras presenciales',
  },
  {
    banco: 'BBVA', icon: '🔵', color: '#004481', tarjeta: 'Visa / Mastercard',
    descuento: 25, dias: ['Lunes'],
    supers: ['Carrefour'],
    tope: '$3.000 de descuento',
  },
  {
    banco: 'Banco Macro', icon: '🟡', color: '#f5b400', tarjeta: 'Visa / Mastercard',
    descuento: 20, dias: ['Miércoles'],
    supers: ['Changomás', 'La Anónima'],
  },
  {
    banco: 'Banco Nación', icon: '🇦🇷', color: '#009cde', tarjeta: 'Visa',
    descuento: 20, dias: ['Miércoles', 'Viernes'],
    supers: ['Changomás', 'Vea', 'Carrefour'],
    nota: 'Programa Precios Cuidados / BNA+',
  },
  {
    banco: 'Naranja X', icon: '🍊', color: '#ff6a00', tarjeta: 'Naranja Visa',
    descuento: 20, dias: ['Viernes'],
    supers: ['Carrefour', 'Día', 'Supermercados varios'],
  },
  {
    banco: 'HSBC', icon: '⬜', color: '#db0011', tarjeta: 'Visa / Mastercard',
    descuento: 25, dias: ['Jueves'],
    supers: ['Jumbo', 'Disco', 'Vea'],
    tope: '$4.000 de descuento',
  },
  {
    banco: 'Brubank', icon: '🟣', color: '#6a0dad', tarjeta: 'Visa Débito',
    descuento: 10, dias: ['Siempre'],
    supers: ['Carrefour'],
    nota: 'Sin tope de descuento',
  },
  {
    banco: 'Personal Pay', icon: '🟢', color: '#00a550', tarjeta: 'Visa Prepaga',
    descuento: 15, dias: ['Siempre'],
    supers: ['Supermercados seleccionados'],
    nota: 'Verificar en la app',
  },
  {
    banco: 'Uala', icon: '💜', color: '#7b2d8b', tarjeta: 'Mastercard Prepaga',
    descuento: 10, dias: ['Lunes', 'Martes'],
    supers: ['Coto', 'Carrefour'],
  },
  {
    banco: 'Mercado Pago', icon: '💙', color: '#009ee3', tarjeta: 'Tarjeta MP / QR',
    descuento: 10, dias: ['Siempre'],
    supers: ['Supermercados seleccionados'],
    nota: 'Verificar descuento activo en la app',
  },
  {
    banco: 'Banco Provincia', icon: '🏦', color: '#0057a8', tarjeta: 'Visa / Mastercard',
    descuento: 20, dias: ['Martes'],
    supers: ['Carrefour', 'Changomás'],
    nota: 'Solo provincia de Buenos Aires',
  },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getDiaHoy(): string {
  const dias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
  return dias[new Date().getDay()]
}

function fmtARS(n: number) {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency', currency: 'ARS', maximumFractionDigits: 0,
  }).format(n)
}

function fmtUSD(n: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency', currency: 'USD', minimumFractionDigits: 2,
  }).format(n)
}

// ─── Página ───────────────────────────────────────────────────────────────────

export default function Suscripciones() {
  const [tab, setTab] = useState<'suscripciones' | 'descuentos'>('suscripciones')
  const [rates, setRates] = useState<DolarRates>({ blue: null, oficial: null, mep: null })
  const [rateType, setRateType] = useState<'blue' | 'oficial' | 'mep'>('blue')
  const [catFilter, setCatFilter] = useState('Todos')
  const [diaFilter, setDiaFilter] = useState<string>('Hoy')
  const [loadingRates, setLoadingRates] = useState(true)

  const diaHoy = getDiaHoy()

  useEffect(() => {
    fetch('/api/dolares')
      .then(r => r.json())
      .then((d: DolarRates) => { setRates(d); setLoadingRates(false) })
      .catch(() => setLoadingRates(false))
  }, [])

  const dolarValue = rates[rateType]

  const filteredServices = catFilter === 'Todos'
    ? SERVICES
    : SERVICES.filter(s => s.category === catFilter)

  const diaActivo = diaFilter === 'Hoy' ? diaHoy : diaFilter
  const filteredPromos = BANK_PROMOS.filter(p =>
    p.dias.includes('Siempre') || p.dias.includes(diaActivo)
  )
  const otrosPromos = BANK_PROMOS.filter(p =>
    !p.dias.includes('Siempre') && !p.dias.includes(diaActivo)
  )

  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>

      {/* Back */}
      <div style={{ marginBottom: 20 }}>
        <Link href="/" style={{ fontSize: 13, color: '#71717a', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          ← Volver
        </Link>
      </div>

      {/* Hero */}
      <div style={{ marginBottom: 32, textAlign: 'center', padding: '0 8px' }}>
        <div style={{ fontSize: 52, marginBottom: 12 }}>💸</div>
        <h1 style={{
          fontSize: 'clamp(26px, 6vw, 42px)',
          fontWeight: 900,
          color: '#09090b',
          letterSpacing: '-0.04em',
          lineHeight: 1.05,
          marginBottom: 10,
        }}>
          Lo que pagás sin darte cuenta
        </h1>
        <p style={{ fontSize: 14, color: '#71717a', maxWidth: 500, margin: '0 auto', lineHeight: 1.6 }}>
          Precios reales de todas las suscripciones en pesos argentinos + los mejores descuentos en supermercados con tu tarjeta.
        </p>
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex',
        gap: 6,
        background: '#f4f4f5',
        borderRadius: 16,
        padding: 4,
        marginBottom: 24,
      }}>
        {([
          { key: 'suscripciones', label: '📱 Suscripciones' },
          { key: 'descuentos',    label: '🏪 Descuentos en super' },
        ] as const).map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              flex: 1,
              padding: '10px 12px',
              borderRadius: 12,
              border: 'none',
              background: tab === t.key ? '#ffffff' : 'transparent',
              fontWeight: 700,
              fontSize: 'clamp(12px, 3vw, 14px)',
              color: tab === t.key ? '#09090b' : '#71717a',
              cursor: 'pointer',
              transition: 'all 0.15s',
              boxShadow: tab === t.key ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ─── TAB SUSCRIPCIONES ─────────────────────────────────────────────── */}
      {tab === 'suscripciones' && (
        <>
          {/* Cotización dólar */}
          <div style={{
            background: '#fff',
            borderRadius: 20,
            padding: '16px 20px',
            border: '1px solid #e4e4e7',
            marginBottom: 16,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            flexWrap: 'wrap',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 180 }}>
              <span style={{ fontSize: 20 }}>💵</span>
              <div>
                <p style={{ fontSize: 11, fontWeight: 700, color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Cotización del dólar
                </p>
                {loadingRates ? (
                  <p style={{ fontSize: 13, color: '#a1a1aa' }}>Cargando...</p>
                ) : (
                  <p style={{ fontSize: 18, fontWeight: 800, color: '#09090b', letterSpacing: '-0.02em' }}>
                    {dolarValue ? fmtARS(dolarValue) : '—'}
                    <span style={{ fontSize: 11, fontWeight: 500, color: '#71717a', marginLeft: 4 }}>/ USD</span>
                  </p>
                )}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              {(['blue', 'mep', 'oficial'] as const).map(t => (
                <button key={t} onClick={() => setRateType(t)} style={{
                  padding: '6px 12px',
                  borderRadius: 999,
                  border: '1px solid #e4e4e7',
                  background: rateType === t ? '#09090b' : '#fafafa',
                  color: rateType === t ? '#fff' : '#71717a',
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}>
                  {t === 'blue' ? 'Blue' : t === 'mep' ? 'MEP' : 'Oficial'}
                  {rates[t] ? ` $${Math.round(rates[t]!)}` : ''}
                </button>
              ))}
            </div>
            <p style={{ fontSize: 10, color: '#a1a1aa', width: '100%', marginTop: 2 }}>
              * Los precios incluyen IVA (21%). Pueden aplicar percepciones adicionales según tarjeta y provincia.
            </p>
          </div>

          {/* Filtro categorías */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 20, overflowX: 'auto', paddingBottom: 2 }}>
            {CATEGORIES.map(cat => (
              <button key={cat} onClick={() => setCatFilter(cat)} style={{
                padding: '6px 14px',
                borderRadius: 999,
                border: '1px solid #e4e4e7',
                background: catFilter === cat ? '#09090b' : '#fafafa',
                color: catFilter === cat ? '#fff' : '#71717a',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s',
                whiteSpace: 'nowrap',
                flexShrink: 0,
              }}>
                {cat}
              </button>
            ))}
          </div>

          {/* Grilla de servicios */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 340px), 1fr))',
            gap: 12,
            marginBottom: 32,
          }}>
            {filteredServices.map(service => (
              <ServiceCard key={service.id} service={service} dolarValue={dolarValue} />
            ))}
          </div>
        </>
      )}

      {/* ─── TAB DESCUENTOS ────────────────────────────────────────────────── */}
      {tab === 'descuentos' && (
        <>
          {/* Filtro día */}
          <div style={{
            background: '#fff',
            borderRadius: 20,
            padding: '14px 18px',
            border: '1px solid #e4e4e7',
            marginBottom: 16,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, flexWrap: 'wrap', gap: 8 }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Filtrar por día
              </p>
              <span style={{
                fontSize: 11, fontWeight: 700,
                background: '#f0fdf4', color: '#15803d',
                border: '1px solid #bbf7d0',
                borderRadius: 999, padding: '3px 10px',
              }}>
                🟢 Hoy es {diaHoy}
              </span>
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {(['Hoy', ...DIAS]).map(d => (
                <button key={d} onClick={() => setDiaFilter(d)} style={{
                  padding: '6px 12px',
                  borderRadius: 999,
                  border: '1px solid #e4e4e7',
                  background: diaFilter === d
                    ? (d === 'Hoy' ? '#16a34a' : '#09090b')
                    : '#fafafa',
                  color: diaFilter === d ? '#fff' : '#71717a',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                  whiteSpace: 'nowrap',
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
                <span>✅</span> {filteredPromos.length} descuento{filteredPromos.length > 1 ? 's' : ''} disponible{filteredPromos.length > 1 ? 's' : ''}
                {diaFilter === 'Hoy' ? ` hoy (${diaHoy})` : ` los ${diaFilter}`}
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 340px), 1fr))', gap: 12, marginBottom: 20 }}>
                {filteredPromos.map(p => <PromoCard key={p.banco} promo={p} active />)}
              </div>
            </>
          )}

          {/* Otros días */}
          {otrosPromos.length > 0 && (
            <>
              <p style={{ fontSize: 12, fontWeight: 600, color: '#a1a1aa', marginBottom: 10, marginTop: 8 }}>
                Otros descuentos (días distintos)
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 340px), 1fr))', gap: 12, marginBottom: 32 }}>
                {otrosPromos.map(p => <PromoCard key={p.banco} promo={p} active={false} />)}
              </div>
            </>
          )}

          <p style={{ fontSize: 11, color: '#a1a1aa', textAlign: 'center', lineHeight: 1.6, marginBottom: 40 }}>
            Los descuentos pueden variar. Siempre verificá las promociones vigentes en el sitio de tu banco antes de hacer la compra.
          </p>
        </>
      )}
    </div>
  )
}

// ─── ServiceCard ──────────────────────────────────────────────────────────────

function ServiceCard({ service, dolarValue }: { service: Service; dolarValue: number | null }) {
  const [expanded, setExpanded] = useState(false)
  const mainPlan = service.plans.find(p => p.highlight) ?? service.plans[0]
  const otherPlans = service.plans.filter(p => p !== mainPlan)

  function calcARS(usd: number) {
    if (!dolarValue) return null
    return usd * dolarValue * 1.21  // + IVA 21%
  }

  return (
    <div style={{
      background: '#fff',
      border: '1px solid #e4e4e7',
      borderRadius: 18,
      overflow: 'hidden',
      transition: 'box-shadow 0.15s',
    }}>
      {/* Main plan */}
      <div style={{ padding: '14px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
          <span style={{ fontSize: 26, flexShrink: 0 }}>{service.icon}</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontWeight: 800, fontSize: 15, color: '#09090b', letterSpacing: '-0.01em' }}>{service.name}</p>
            <p style={{ fontSize: 11, color: '#71717a', marginTop: 1 }}>{service.category}</p>
          </div>
          <div style={{
            background: '#f0fdf4',
            border: '1px solid #bbf7d0',
            borderRadius: 8,
            padding: '3px 8px',
            fontSize: 10,
            fontWeight: 700,
            color: '#15803d',
          }}>
            {mainPlan.name}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
          <div>
            <p style={{ fontSize: 10, color: '#a1a1aa', marginBottom: 2 }}>Precio en USD</p>
            <p style={{ fontSize: 14, fontWeight: 700, color: '#71717a' }}>{fmtUSD(mainPlan.usd)}/mes</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontSize: 10, color: '#a1a1aa', marginBottom: 2 }}>En pesos (c/IVA)</p>
            {dolarValue ? (
              <p style={{
                fontSize: 22,
                fontWeight: 900,
                color: '#09090b',
                letterSpacing: '-0.03em',
                lineHeight: 1,
              }}>
                {fmtARS(calcARS(mainPlan.usd)!)}
              </p>
            ) : (
              <p style={{ fontSize: 14, color: '#a1a1aa' }}>—</p>
            )}
          </div>
        </div>
      </div>

      {/* Otros planes */}
      {otherPlans.length > 0 && (
        <>
          <button
            onClick={() => setExpanded(!expanded)}
            style={{
              width: '100%',
              padding: '8px 16px',
              background: '#fafafa',
              border: 'none',
              borderTop: '1px solid #f4f4f5',
              cursor: 'pointer',
              fontSize: 11,
              fontWeight: 600,
              color: '#71717a',
              textAlign: 'left',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            {expanded ? '▲' : '▼'} Ver {otherPlans.length} plan{otherPlans.length > 1 ? 'es' : ''} más
          </button>
          {expanded && (
            <div style={{ borderTop: '1px solid #f4f4f5' }}>
              {otherPlans.map(plan => (
                <div key={plan.name} style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 16px',
                  borderBottom: '1px solid #f9f9f9',
                }}>
                  <div>
                    <p style={{ fontSize: 12, fontWeight: 600, color: '#09090b' }}>{plan.name}</p>
                    <p style={{ fontSize: 11, color: '#a1a1aa' }}>{fmtUSD(plan.usd)}/mes</p>
                  </div>
                  {dolarValue ? (
                    <p style={{ fontSize: 16, fontWeight: 800, color: '#09090b', letterSpacing: '-0.02em' }}>
                      {fmtARS(calcARS(plan.usd)!)}
                    </p>
                  ) : (
                    <p style={{ color: '#a1a1aa', fontSize: 13 }}>—</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {service.note && (
        <p style={{ fontSize: 10, color: '#a1a1aa', padding: '6px 16px 10px', borderTop: '1px solid #f4f4f5' }}>
          ⚠️ {service.note}
        </p>
      )}
    </div>
  )
}

// ─── PromoCard ────────────────────────────────────────────────────────────────

function PromoCard({ promo, active }: { promo: BankPromo; active: boolean }) {
  return (
    <div style={{
      background: active ? '#fff' : '#fafafa',
      border: `1.5px solid ${active ? promo.color + '40' : '#e4e4e7'}`,
      borderRadius: 18,
      padding: '16px 18px',
      opacity: active ? 1 : 0.7,
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Franja de color izquierda */}
      <div style={{
        position: 'absolute',
        left: 0, top: 0, bottom: 0,
        width: 4,
        background: promo.color,
        borderRadius: '18px 0 0 18px',
      }} />

      <div style={{ paddingLeft: 8 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 22 }}>{promo.icon}</span>
            <div>
              <p style={{ fontSize: 14, fontWeight: 800, color: '#09090b', letterSpacing: '-0.01em' }}>{promo.banco}</p>
              <p style={{ fontSize: 11, color: '#71717a' }}>{promo.tarjeta}</p>
            </div>
          </div>
          <div style={{
            background: active ? promo.color : '#e4e4e7',
            color: '#fff',
            borderRadius: 12,
            padding: '6px 12px',
            fontSize: 20,
            fontWeight: 900,
            letterSpacing: '-0.03em',
            lineHeight: 1,
            textAlign: 'center',
            flexShrink: 0,
          }}>
            -{promo.descuento}%
          </div>
        </div>

        {/* Días */}
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 8 }}>
          {promo.dias.map(d => (
            <span key={d} style={{
              fontSize: 11,
              fontWeight: 700,
              padding: '3px 8px',
              borderRadius: 999,
              background: d === 'Siempre' ? '#f0fdf4' : '#eff6ff',
              color: d === 'Siempre' ? '#15803d' : '#1d4ed8',
              border: `1px solid ${d === 'Siempre' ? '#bbf7d0' : '#bfdbfe'}`,
            }}>
              {d === 'Siempre' ? '🟢 Todos los días' : `📅 ${d}`}
            </span>
          ))}
        </div>

        {/* Supermercados */}
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: promo.tope || promo.nota ? 8 : 0 }}>
          {promo.supers.map(s => (
            <span key={s} style={{
              fontSize: 11,
              padding: '2px 8px',
              borderRadius: 999,
              background: '#f4f4f5',
              color: '#374151',
              fontWeight: 500,
            }}>
              🏪 {s}
            </span>
          ))}
        </div>

        {(promo.tope || promo.nota) && (
          <p style={{ fontSize: 10, color: '#a1a1aa', marginTop: 4, lineHeight: 1.4 }}>
            {promo.tope && `⚠️ Tope: ${promo.tope}. `}
            {promo.nota}
          </p>
        )}
      </div>
    </div>
  )
}
