'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import SearchBar from '@/components/SearchBar'
import ResultsTable from '@/components/ResultsTable'
import FeaturedProducts from '@/components/FeaturedProducts'
import PriceAlertBanner from '@/components/PriceAlertBanner'
import MiniCountdown from '@/components/MiniCountdown'
import { SearchResult } from '@/lib/types'

export default function Home() {
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const [lastQuery, setLastQuery] = useState('')

  // Leer ?q= al cargar para que los links sean compartibles
  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get('q')
    if (q) handleSearch(q)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleSearch(query: string) {
    if (!query.trim()) return
    setLoading(true)
    setSearched(true)
    setLastQuery(query.trim())
    window.history.replaceState({}, '', `?q=${encodeURIComponent(query.trim())}`)
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`)
      const data = await res.json()
      setResults(data.results || [])
    } catch {
      setResults([])
    } finally {
      setLoading(false)
    }
  }

  function handleClearSearch() {
    setSearched(false)
    setResults([])
    setLastQuery('')
    window.history.replaceState({}, '', '/')
  }

  return (
    <div>
      {/* Hero — full width en desktop, normal en mobile */}
      {!searched && (
        <>
          {/* Desktop: full width */}
          <div className="hero-desktop" style={{
            marginBottom: 10,
          }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/header.png"
              alt="Codito — Buscá. Comprá barato."
              style={{ width: '100%', height: 'auto', display: 'block', borderRadius: 16 }}
            />
          </div>
          {/* Mobile: contenido normal */}
          <div className="hero-mobile" style={{ marginBottom: 10 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/header.png"
              alt="Codito — Buscá. Comprá barato."
              style={{ width: '100%', height: 'auto', display: 'block', borderRadius: 16 }}
            />
          </div>
        </>
      )}

      {/* Buscador — blanco minimal */}
      <div style={{
        background: '#ffffff',
        borderRadius: 20,
        padding: 'clamp(14px, 4vw, 22px)',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04), 0 10px 30px -10px rgba(0, 0, 0, 0.06)',
        border: '1px solid #e4e4e7',
      }}>
        <SearchBar onSearch={handleSearch} loading={loading} />
      </div>

      {/* Banner Ofertas — naranja llamativo */}
      {!searched && (
        <Link
          href="/ofertas"
          className="ofertas-banner"
          style={{ textDecoration: 'none', display: 'block', marginTop: 20 }}
        >
          <div style={{
            position: 'relative',
            borderRadius: 22,
            padding: 'clamp(20px, 5vw, 28px) clamp(20px, 5vw, 32px)',
            background: 'linear-gradient(135deg, #ea580c 0%, #f97316 40%, #ef4444 100%)',
            overflow: 'hidden',
            cursor: 'pointer',
            boxShadow: '0 16px 48px -10px rgba(234,88,12,0.55)',
            transition: 'transform 0.25s cubic-bezier(0.4,0,0.2,1), box-shadow 0.25s',
          }}>
            {/* Shimmer */}
            <div className="banner-shimmer" style={{
              position: 'absolute',
              top: 0, left: '-100%',
              width: '50%', height: '100%',
              background: 'linear-gradient(120deg, transparent 0%, rgba(255,255,255,0.18) 50%, transparent 100%)',
              transform: 'skewX(-20deg)',
              pointerEvents: 'none',
            }} />
            {/* Círculos decorativos de fondo */}
            <div style={{
              position: 'absolute', right: -30, top: -30,
              width: 140, height: 140, borderRadius: '50%',
              background: 'rgba(255,255,255,0.08)', pointerEvents: 'none',
            }} />
            <div style={{
              position: 'absolute', right: 40, bottom: -40,
              width: 100, height: 100, borderRadius: '50%',
              background: 'rgba(255,255,255,0.06)', pointerEvents: 'none',
            }} />

            {/* Contenido */}
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                {/* Badge NUEVO */}
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '4px 10px',
                  borderRadius: 999,
                  background: 'rgba(255,255,255,0.2)',
                  marginBottom: 10,
                }}>
                  <span className="live-dot" style={{
                    width: 6, height: 6, borderRadius: '50%',
                    background: '#fff',
                  }} />
                  <span style={{
                    fontSize: 10,
                    fontWeight: 800,
                    color: '#fff',
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                  }}>
                    HOY · actualizado
                  </span>
                </div>

                <h3 style={{
                  color: '#ffffff',
                  fontWeight: 900,
                  fontSize: 'clamp(22px, 5.5vw, 32px)',
                  lineHeight: 1.0,
                  letterSpacing: '-0.03em',
                  marginBottom: 8,
                  textShadow: '0 2px 8px rgba(0,0,0,0.15)',
                }}>
                  🔥 Ofertas del día
                </h3>
                <p style={{
                  color: 'rgba(255,255,255,0.88)',
                  fontSize: 'clamp(12px, 3vw, 14px)',
                  fontWeight: 500,
                  lineHeight: 1.4,
                }}>
                  Los mejores descuentos verificados en{' '}
                  <strong style={{ color: '#fff' }}>60+ tiendas</strong>
                </p>
                <div style={{ marginTop: 10 }}>
                  <MiniCountdown />
                </div>
              </div>

              {/* CTA */}
              <div className="ofertas-arrow" style={{
                flexShrink: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 4,
              }}>
                <div style={{
                  width: 52, height: 52,
                  borderRadius: 16,
                  background: '#ffffff',
                  color: '#ea580c',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                  transition: 'transform 0.2s',
                }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <line x1="5" y1="12" x2="19" y2="12"/>
                    <polyline points="12 5 19 12 12 19"/>
                  </svg>
                </div>
                <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.85)' }}>
                  Ver todo
                </span>
              </div>
            </div>
          </div>
        </Link>
      )}

      {/* Accesos rápidos */}
      {!searched && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 260px), 1fr))', gap: 12, marginTop: 14 }}>

          <Link href="/suscripciones" className="tool-card tool-card--indigo" aria-label="Suscripciones — precios en pesos con impuestos">
            <div className="tool-icon tool-icon--indigo" aria-hidden="true">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="5 3 19 12 5 21 5 3"/>
              </svg>
            </div>
            <p className="tool-card-title">Suscripciones</p>
            <p className="tool-card-desc">Cuánto pagás en pesos por Netflix, Spotify, ChatGPT y más, con impuestos incluidos.</p>
          </Link>

          <Link href="/cuotas" className="tool-card tool-card--violet" aria-label="¿Cuotas o contado? — calculadora de inflación">
            <div className="tool-icon tool-icon--violet" aria-hidden="true">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="4" y="2" width="16" height="20" rx="2"/>
                <line x1="8" y1="10" x2="16" y2="10"/>
                <line x1="8" y1="14" x2="16" y2="14"/>
                <line x1="8" y1="18" x2="12" y2="18"/>
              </svg>
            </div>
            <p className="tool-card-title">¿Cuotas o contado?</p>
            <p className="tool-card-desc">Calculá si te conviene pagar en cuotas ajustando por inflación real.</p>
          </Link>

          <Link href="/dividito" className="tool-card tool-card--orange" aria-label="Dividito — dividir gastos entre amigos">
            <div className="tool-icon tool-icon--orange" aria-hidden="true">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
            </div>
            <p className="tool-card-title">Dividito</p>
            <p className="tool-card-desc">Dividí los gastos entre amigos. Te decimos quién le debe a quién, sin vueltas.</p>
          </Link>

          <Link href="/dolarito" className="tool-card tool-card--green" aria-label="Dolarito — cotizaciones del dólar en vivo">
            <div className="tool-icon tool-icon--green" aria-hidden="true">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="1" x2="12" y2="23"/>
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
              </svg>
            </div>
            <p className="tool-card-title">Dolarito</p>
            <p className="tool-card-desc">Todas las cotizaciones del dólar en vivo: Blue, Oficial, MEP, Tarjeta y más.</p>
          </Link>

          <Link href="/inflacito" className="tool-card tool-card--red" aria-label="Inflacito — calculadora de inflación">
            <div className="tool-icon tool-icon--red" aria-hidden="true">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
                <polyline points="17 6 23 6 23 12"/>
              </svg>
            </div>
            <p className="tool-card-title">Inflacito</p>
            <p className="tool-card-desc">¿Cuánto vale hoy lo que costaba antes? Calculá cuánto perdiste por inflación.</p>
          </Link>

          <Link href="/platita" className="tool-card tool-card--blue" aria-label="Platita — comparador de inversiones">
            <div className="tool-icon tool-icon--blue" aria-hidden="true">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2a10 10 0 0 1 7.38 16.74"/>
                <path d="M12 8v4l3 3"/>
                <circle cx="12" cy="12" r="10" strokeDasharray="4 2"/>
              </svg>
            </div>
            <p className="tool-card-title">Platita</p>
            <p className="tool-card-desc">¿Plazo fijo, dólares o colchón? Compará qué te conviene más.</p>
          </Link>

          <Link href="/changuito" className="tool-card tool-card--amber" aria-label="Changuito — armá tu canasta básica">
            <div className="tool-icon tool-icon--amber" aria-hidden="true">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="9" cy="21" r="1"/>
                <circle cx="20" cy="21" r="1"/>
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
              </svg>
            </div>
            <p className="tool-card-title">Changuito</p>
            <p className="tool-card-desc">Armá tu canasta básica y fijate cuánto te sale llenar el chango.</p>
          </Link>

        </div>
      )}

      {/* Resultados */}
      {searched && (
        <div style={{ marginTop: 28 }}>
          {loading ? (
            <div style={{
              textAlign: 'center', padding: '60px 0',
              background: '#fff', borderRadius: 16,
              border: '1.5px solid #bfdbfe',
              boxShadow: '0 2px 12px rgba(2,132,199,0.07)',
            }}>
              <div style={{ fontSize: 40, marginBottom: 14 }}>⏳</div>
              <p style={{ color: '#4d7fa8', fontWeight: 600, marginBottom: 6 }}>Buscando los mejores precios...</p>
              <p style={{ color: '#94a3b8', fontSize: 13, fontWeight: 400 }}>Comparando en diferentes sitios web, puede demorar unos segundos</p>
            </div>
          ) : results.length === 0 ? (
            <div style={{
              textAlign: 'center', padding: '60px 0',
              background: '#fff', borderRadius: 16,
              border: '1.5px solid #bfdbfe',
            }}>
              <div style={{ fontSize: 40, marginBottom: 14 }}>😕</div>
              <p style={{ fontSize: 16, fontWeight: 700, marginBottom: 6, color: '#0c1a2e' }}>
                Nada para &quot;{lastQuery}&quot;
              </p>
              <p style={{ fontSize: 13, color: '#4d7fa8' }}>Probá con otro nombre.</p>
            </div>
          ) : (
            <>
              <ResultsTable results={results} query={lastQuery} onClear={handleClearSearch} />
              <PriceAlertBanner
                query={lastQuery}
                cheapestPrice={results.length > 0 ? Math.min(...results.map(r => r.price)) : undefined}
              />
            </>
          )}
        </div>
      )}

      {/* Productos destacados — temporalmente oculto */}
      {/* {!searched && <FeaturedProducts />} */}

      {/* Botón flotante "Descubrí más" */}
      {!searched && (
        <div
          className="floating-pill"
          role="button"
          aria-label="Ver más herramientas"
          tabIndex={0}
          onKeyDown={e => e.key === 'Enter' && window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })}
          onClick={() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })}
          style={{
            position: 'fixed',
            bottom: 24,
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex', alignItems: 'center', gap: 8,
            background: 'rgba(9, 9, 11, 0.85)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            color: '#fff',
            padding: '12px 22px',
            borderRadius: 999,
            fontSize: 13,
            fontWeight: 700,
            cursor: 'pointer',
            boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
            zIndex: 40,
            animation: 'fadeInUp 0.5s ease, floatPulse 2.5s ease-in-out infinite 1s',
            letterSpacing: '-0.01em',
          }}
        >
          <span style={{ fontSize: 16 }}>👇</span>
          Descubrí más herramientas
          <style>{`
            @keyframes fadeInUp { from { opacity: 0; transform: translateX(-50%) translateY(20px) } to { opacity: 1; transform: translateX(-50%) translateY(0) } }
            @keyframes floatPulse { 0%,100% { transform: translateX(-50%) translateY(0) } 50% { transform: translateX(-50%) translateY(-4px) } }
          `}</style>
        </div>
      )}
    </div>
  )
}
