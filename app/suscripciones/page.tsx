'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

// ─── Tipos ────────────────────────────────────────────────────────────────────

type DolarRates = { blue: number | null; oficial: number | null; mep: number | null }

type Plan = {
  name: string
  // Para servicios en USD: precio en dólares
  usd?: number
  // Para servicios con precio local en ARS (Netflix, Spotify, etc.)
  ars?: number
  highlight?: boolean
}

type Service = {
  id: string
  name: string
  icon: string
  category: string
  // 'ars'  = cobra en pesos argentinos directamente
  // 'usd'  = cobra en dólares (se convierte con oficial + IVA)
  billing: 'ars' | 'usd'
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
//
// Precios ARS = precios locales oficiales de cada servicio en Argentina.
// Precios USD = precio del plan en dólares (se convierte al cobrar con tarjeta).
// Última actualización: abril 2025.

const SERVICES: Service[] = [
  // ── Streaming video ─────────────────────────────────────────────────────────
  {
    id: 'netflix', name: 'Netflix', icon: '🎬', category: 'Streaming', billing: 'ars',
    plans: [
      { name: 'Básico con anuncios', ars: 4899, highlight: false },
      { name: 'Estándar',            ars: 9499, highlight: true  },
      { name: 'Premium',             ars: 14999 },
    ],
    note: 'Cobra directamente en pesos. No aplica percepción de tarjeta.',
  },
  {
    id: 'disney', name: 'Disney+', icon: '🏰', category: 'Streaming', billing: 'ars',
    plans: [
      { name: 'Estándar', ars: 6299, highlight: true },
      { name: 'Premium',  ars: 9999 },
    ],
  },
  {
    id: 'max', name: 'Max (HBO)', icon: '📺', category: 'Streaming', billing: 'ars',
    plans: [
      { name: 'Con anuncios',  ars: 5699              },
      { name: 'Sin anuncios',  ars: 9199, highlight: true },
      { name: 'Ultimate',      ars: 12499 },
    ],
  },
  {
    id: 'prime', name: 'Amazon Prime', icon: '📦', category: 'Streaming', billing: 'ars',
    plans: [
      { name: 'Prime (video + envíos + music)', ars: 3999, highlight: true },
    ],
    note: 'Incluye Prime Video, Prime Music y envíos gratis en Amazon.',
  },
  {
    id: 'appletv', name: 'Apple TV+', icon: '🍎', category: 'Streaming', billing: 'ars',
    plans: [
      { name: 'Individual', ars: 4999, highlight: true },
    ],
    note: 'Apple cobra en pesos a través de la App Store Argentina.',
  },
  {
    id: 'youtube', name: 'YouTube Premium', icon: '▶️', category: 'Streaming', billing: 'ars',
    plans: [
      { name: 'Individual', ars: 2299, highlight: true },
      { name: 'Familiar',   ars: 3899 },
    ],
    note: 'Incluye YouTube Music y YouTube Kids Premium.',
  },
  {
    id: 'paramount', name: 'Paramount+', icon: '⭐', category: 'Streaming', billing: 'usd',
    plans: [
      { name: 'Essential',       usd: 7.99, highlight: true },
      { name: 'Con Showtime',    usd: 12.99 },
    ],
    note: 'Cobra en USD. Se aplica tipo de cambio oficial + IVA 21%.',
  },
  {
    id: 'crunchyroll', name: 'Crunchyroll', icon: '🎌', category: 'Streaming', billing: 'usd',
    plans: [
      { name: 'Fan',      usd: 7.99, highlight: true },
      { name: 'Mega Fan', usd: 9.99 },
    ],
    note: 'Cobra en USD. Se aplica tipo de cambio oficial + IVA 21%.',
  },

  // ── Música ──────────────────────────────────────────────────────────────────
  {
    id: 'spotify', name: 'Spotify', icon: '🟢', category: 'Música', billing: 'ars',
    plans: [
      { name: 'Individual', ars: 3999,  highlight: true },
      { name: 'Duo',        ars: 4999 },
      { name: 'Familiar',   ars: 6299 },
    ],
    note: 'Cobra directamente en pesos. Uno de los más baratos del mercado.',
  },
  {
    id: 'applemusic', name: 'Apple Music', icon: '🎵', category: 'Música', billing: 'ars',
    plans: [
      { name: 'Individual', ars: 3999, highlight: true },
      { name: 'Familiar',   ars: 5999 },
    ],
  },
  {
    id: 'ytmusic', name: 'YouTube Music', icon: '🎶', category: 'Música', billing: 'ars',
    plans: [
      { name: 'Individual (incluido en YT Premium)', ars: 2299, highlight: true },
    ],
    note: 'Incluido automáticamente con YouTube Premium.',
  },
  {
    id: 'tidal', name: 'Tidal', icon: '🌊', category: 'Música', billing: 'usd',
    plans: [
      { name: 'Individual', usd: 10.99, highlight: true },
      { name: 'HiFi Plus',  usd: 19.99 },
    ],
    note: 'Cobra en USD. Se aplica tipo de cambio oficial + IVA 21%.',
  },

  // ── Gaming ──────────────────────────────────────────────────────────────────
  {
    id: 'gamepass', name: 'Xbox Game Pass', icon: '🎮', category: 'Gaming', billing: 'ars',
    plans: [
      { name: 'PC Game Pass', ars: 3499 },
      { name: 'Ultimate',     ars: 5699, highlight: true },
    ],
    note: 'Microsoft cobra directamente en pesos en la tienda Argentina.',
  },
  {
    id: 'ps', name: 'PlayStation Plus', icon: '🕹️', category: 'Gaming', billing: 'usd',
    plans: [
      { name: 'Essential', usd: 9.99, highlight: true },
      { name: 'Extra',     usd: 14.99 },
      { name: 'Premium',   usd: 17.99 },
    ],
    note: 'Sony cobra en USD. Se aplica tipo de cambio oficial + IVA 21%.',
  },
  {
    id: 'eaplay', name: 'EA Play', icon: '⚽', category: 'Gaming', billing: 'usd',
    plans: [
      { name: 'Individual', usd: 4.99, highlight: true },
      { name: 'Pro',        usd: 14.99 },
    ],
    note: 'Cobra en USD. Se aplica tipo de cambio oficial + IVA 21%.',
  },
  {
    id: 'nintendo', name: 'Nintendo Online', icon: '🔴', category: 'Gaming', billing: 'usd',
    plans: [
      { name: 'Individual (anual)', usd: 3.99, highlight: true },
      { name: 'Familiar (anual)',   usd: 7.99 },
    ],
    note: 'Precio mensualizado del plan anual. Cobra en USD.',
  },

  // ── IA y Productividad ───────────────────────────────────────────────────────
  {
    id: 'claude', name: 'Claude Pro', icon: '🤖', category: 'IA & Prod.', billing: 'usd',
    plans: [{ name: 'Pro', usd: 20, highlight: true }],
    note: 'Anthropic cobra en USD. Se aplica tipo de cambio oficial + IVA 21%.',
  },
  {
    id: 'chatgpt', name: 'ChatGPT Plus', icon: '💬', category: 'IA & Prod.', billing: 'usd',
    plans: [
      { name: 'Plus', usd: 20, highlight: true },
      { name: 'Team', usd: 25 },
    ],
    note: 'OpenAI cobra en USD. Se aplica tipo de cambio oficial + IVA 21%.',
  },
  {
    id: 'perplexity', name: 'Perplexity', icon: '🔍', category: 'IA & Prod.', billing: 'usd',
    plans: [{ name: 'Pro', usd: 20, highlight: true }],
  },
  {
    id: 'notion', name: 'Notion', icon: '📝', category: 'IA & Prod.', billing: 'usd',
    plans: [{ name: 'Plus', usd: 10, highlight: true }],
  },
  {
    id: 'canva', name: 'Canva Pro', icon: '🎨', category: 'IA & Prod.', billing: 'usd',
    plans: [{ name: 'Pro', usd: 14.99, highlight: true }],
  },

  // ── Diseño y Dev ─────────────────────────────────────────────────────────────
  {
    id: 'adobe', name: 'Adobe CC', icon: '🅰️', category: 'Diseño & Dev', billing: 'usd',
    plans: [
      { name: 'Plan individual', usd: 54.99, highlight: true },
      { name: 'Todo incluido',   usd: 89.99 },
    ],
    note: 'Precio puede variar. Cobra en USD + tipo de cambio oficial + IVA 21%.',
  },
  {
    id: 'figma', name: 'Figma', icon: '🖼️', category: 'Diseño & Dev', billing: 'usd',
    plans: [
      { name: 'Professional', usd: 12, highlight: true },
      { name: 'Organization', usd: 45 },
    ],
  },
  {
    id: 'github', name: 'GitHub Copilot', icon: '🐙', category: 'Diseño & Dev', billing: 'usd',
    plans: [{ name: 'Individual', usd: 10, highlight: true }],
  },

  // ── VPN y Seguridad ──────────────────────────────────────────────────────────
  {
    id: 'nordvpn', name: 'NordVPN', icon: '🛡️', category: 'VPN & Seg.', billing: 'usd',
    plans: [{ name: 'Complete (mensual)', usd: 14.99, highlight: true }],
    note: 'Precio mensual sin plan anual. Con plan anual baja a ~$4.99/mes.',
  },
  {
    id: 'expressvpn', name: 'ExpressVPN', icon: '⚡', category: 'VPN & Seg.', billing: 'usd',
    plans: [{ name: 'Mensual', usd: 12.95, highlight: true }],
  },
  {
    id: '1password', name: '1Password', icon: '🔑', category: 'VPN & Seg.', billing: 'usd',
    plans: [
      { name: 'Individual', usd: 2.99, highlight: true },
      { name: 'Familiar',   usd: 4.99 },
    ],
  },
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

// Convierte USD → ARS usando tipo de cambio oficial + IVA 21%
function usdToARS(usd: number, oficialRate: number) {
  return usd * oficialRate * 1.21
}

// ─── Página ───────────────────────────────────────────────────────────────────

export default function Suscripciones() {
  const [tab, setTab] = useState<'suscripciones' | 'descuentos'>('suscripciones')
  const [rates, setRates] = useState<DolarRates>({ blue: null, oficial: null, mep: null })
  const [diaFilter, setDiaFilter] = useState<string>('Hoy')
  const [catFilter, setCatFilter] = useState('Todos')
  const [loadingRates, setLoadingRates] = useState(true)

  const diaHoy = getDiaHoy()

  useEffect(() => {
    fetch('/api/dolares')
      .then(r => r.json())
      .then((d: DolarRates) => { setRates(d); setLoadingRates(false) })
      .catch(() => setLoadingRates(false))
  }, [])

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

  const arsServices  = filteredServices.filter(s => s.billing === 'ars')
  const usdServices  = filteredServices.filter(s => s.billing === 'usd')

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
          Precios reales de todas las suscripciones en pesos + los mejores descuentos en supermercados con tu tarjeta.
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
          {/* Panel cotización USD → ARS */}
          <div style={{
            background: '#fff',
            borderRadius: 20,
            padding: '16px 20px',
            border: '1px solid #e4e4e7',
            marginBottom: 16,
          }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
              💵 Tipo de cambio para servicios en USD
            </p>

            {/* Cotizaciones */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
              {(['oficial', 'mep', 'blue'] as const).map(t => (
                <div key={t} style={{
                  flex: 1,
                  minWidth: 80,
                  background: t === 'oficial' ? '#eff6ff' : '#fafafa',
                  border: `1.5px solid ${t === 'oficial' ? '#bfdbfe' : '#e4e4e7'}`,
                  borderRadius: 12,
                  padding: '10px 14px',
                  textAlign: 'center',
                }}>
                  <p style={{ fontSize: 11, fontWeight: 700, color: t === 'oficial' ? '#1d4ed8' : '#71717a', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 4 }}>
                    {t === 'blue' ? 'Blue' : t === 'mep' ? 'MEP / bolsa' : 'Oficial ✓'}
                  </p>
                  {loadingRates ? (
                    <p style={{ fontSize: 14, color: '#a1a1aa' }}>—</p>
                  ) : (
                    <p style={{ fontSize: 18, fontWeight: 900, color: '#09090b', letterSpacing: '-0.03em', lineHeight: 1 }}>
                      {rates[t] ? fmtARS(rates[t]!) : '—'}
                    </p>
                  )}
                </div>
              ))}
            </div>

            {/* Explicación */}
            <div style={{
              background: '#eff6ff',
              border: '1px solid #bfdbfe',
              borderRadius: 10,
              padding: '10px 14px',
              fontSize: 12,
              color: '#1e40af',
              lineHeight: 1.6,
            }}>
              <strong>¿Qué cotización aplica cuando pagás?</strong><br />
              Los servicios digitales internacionales (Paramount+, PlayStation, AI, Adobe, VPNs…) cobran en pesos
              al <strong>tipo de cambio oficial</strong> del BCRA, más <strong>IVA 21%</strong>.
              No aplica dólar blue. El dólar MEP o blue solo te interesa si comprás divisas para pagar manualmente.
            </div>
          </div>

          {/* Leyenda de badges */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16, alignItems: 'center' }}>
            <span style={{ fontSize: 11, color: '#71717a', fontWeight: 600 }}>Referencias:</span>
            <span style={{
              fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 999,
              background: '#f0fdf4', color: '#15803d', border: '1px solid #bbf7d0',
            }}>
              🏠 Precio local en ARS
            </span>
            <span style={{
              fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 999,
              background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe',
            }}>
              💵 Cobra en USD (oficial + IVA)
            </span>
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

          {/* ── Servicios que cobran en ARS ───────────────────────────────── */}
          {arsServices.length > 0 && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <div style={{ height: 1, flex: 1, background: '#e4e4e7' }} />
                <span style={{
                  fontSize: 11, fontWeight: 700, padding: '3px 12px', borderRadius: 999,
                  background: '#f0fdf4', color: '#15803d', border: '1px solid #bbf7d0',
                }}>
                  🏠 Cobran directamente en pesos argentinos
                </span>
                <div style={{ height: 1, flex: 1, background: '#e4e4e7' }} />
              </div>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 340px), 1fr))',
                gap: 12,
                marginBottom: 28,
              }}>
                {arsServices.map(service => (
                  <ServiceCard key={service.id} service={service} oficialRate={rates.oficial} />
                ))}
              </div>
            </>
          )}

          {/* ── Servicios que cobran en USD ────────────────────────────────── */}
          {usdServices.length > 0 && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <div style={{ height: 1, flex: 1, background: '#e4e4e7' }} />
                <span style={{
                  fontSize: 11, fontWeight: 700, padding: '3px 12px', borderRadius: 999,
                  background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe',
                }}>
                  💵 Cobran en USD — se convierten al oficial + IVA 21%
                </span>
                <div style={{ height: 1, flex: 1, background: '#e4e4e7' }} />
              </div>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 340px), 1fr))',
                gap: 12,
                marginBottom: 32,
              }}>
                {usdServices.map(service => (
                  <ServiceCard key={service.id} service={service} oficialRate={rates.oficial} />
                ))}
              </div>
            </>
          )}

          <p style={{ fontSize: 11, color: '#a1a1aa', textAlign: 'center', lineHeight: 1.6, marginBottom: 40 }}>
            Precios orientativos, actualizados a abril 2025. Los precios en ARS pueden variar por inflación.<br />
            Los servicios en USD aplican IVA 21% + tipo de cambio oficial del BCRA al momento del cobro.
          </p>
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

function ServiceCard({ service, oficialRate }: {
  service: Service
  oficialRate: number | null
}) {
  const [expanded, setExpanded] = useState(false)
  const mainPlan = service.plans.find(p => p.highlight) ?? service.plans[0]
  const otherPlans = service.plans.filter(p => p !== mainPlan)
  const isARS = service.billing === 'ars'

  function calcPrice(plan: Plan): number | null {
    if (plan.ars !== undefined) return plan.ars
    if (plan.usd !== undefined && oficialRate) return usdToARS(plan.usd, oficialRate)
    return null
  }

  const mainPrice = calcPrice(mainPlan)

  return (
    <div style={{
      background: '#fff',
      border: `1.5px solid ${isARS ? '#d1fae5' : '#dbeafe'}`,
      borderRadius: 18,
      overflow: 'hidden',
    }}>
      {/* Header del card */}
      <div style={{ padding: '14px 16px' }}>
        {/* Título + badge billing */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 12 }}>
          <span style={{ fontSize: 26, flexShrink: 0, lineHeight: 1 }}>{service.icon}</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontWeight: 800, fontSize: 15, color: '#09090b', letterSpacing: '-0.01em' }}>
              {service.name}
            </p>
            <p style={{ fontSize: 11, color: '#71717a', marginTop: 1 }}>{service.category}</p>
          </div>
          <span style={{
            fontSize: 10,
            fontWeight: 700,
            padding: '3px 8px',
            borderRadius: 999,
            flexShrink: 0,
            background: isARS ? '#f0fdf4' : '#eff6ff',
            color: isARS ? '#15803d' : '#1d4ed8',
            border: `1px solid ${isARS ? '#bbf7d0' : '#bfdbfe'}`,
            whiteSpace: 'nowrap',
          }}>
            {isARS ? '🏠 Local ARS' : '💵 USD'}
          </span>
        </div>

        {/* Precio principal */}
        <div style={{
          background: isARS ? '#f0fdf4' : '#f8faff',
          borderRadius: 12,
          padding: '12px 14px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 8,
        }}>
          <div>
            <p style={{ fontSize: 10, fontWeight: 600, color: '#71717a', marginBottom: 2 }}>
              {mainPlan.name}
            </p>
            {/* Fuente del precio */}
            {isARS ? (
              <p style={{ fontSize: 10, color: '#86efac', fontWeight: 600 }}>Precio local ✓</p>
            ) : mainPlan.usd !== undefined ? (
              <p style={{ fontSize: 10, color: '#93c5fd', fontWeight: 600 }}>
                {fmtUSD(mainPlan.usd)} × oficial{oficialRate ? ` (${fmtARS(oficialRate)})` : ''} + IVA 21%
              </p>
            ) : null}
          </div>
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            {mainPrice !== null ? (
              <p style={{
                fontSize: 'clamp(20px, 5vw, 26px)',
                fontWeight: 900,
                color: '#09090b',
                letterSpacing: '-0.04em',
                lineHeight: 1,
              }}>
                {fmtARS(mainPrice)}
              </p>
            ) : (
              <p style={{ fontSize: 14, color: '#a1a1aa', fontStyle: 'italic' }}>sin cotización</p>
            )}
            <p style={{ fontSize: 10, color: '#a1a1aa', marginTop: 2 }}>/mes</p>
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
              {otherPlans.map(plan => {
                const price = calcPrice(plan)
                return (
                  <div key={plan.name} style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 16px',
                    borderBottom: '1px solid #f9f9f9',
                    gap: 8,
                  }}>
                    <div style={{ minWidth: 0 }}>
                      <p style={{ fontSize: 12, fontWeight: 600, color: '#09090b' }}>{plan.name}</p>
                      {!isARS && plan.usd !== undefined && (
                        <p style={{ fontSize: 10, color: '#a1a1aa', marginTop: 1 }}>{fmtUSD(plan.usd)}/mes</p>
                      )}
                    </div>
                    {price !== null ? (
                      <p style={{ fontSize: 16, fontWeight: 800, color: '#09090b', letterSpacing: '-0.02em', whiteSpace: 'nowrap', flexShrink: 0 }}>
                        {fmtARS(price)}
                      </p>
                    ) : (
                      <p style={{ color: '#a1a1aa', fontSize: 13 }}>—</p>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}

      {service.note && (
        <p style={{ fontSize: 10, color: '#a1a1aa', padding: '6px 16px 10px', borderTop: '1px solid #f4f4f5', lineHeight: 1.5 }}>
          ℹ️ {service.note}
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
