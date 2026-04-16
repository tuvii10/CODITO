'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import SearchBar from '@/components/SearchBar'
import ResultsTable from '@/components/ResultsTable'
import FeaturedProducts from '@/components/FeaturedProducts'
import PriceAlertBanner from '@/components/PriceAlertBanner'
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
            position: 'relative',
            left: '50%',
            marginLeft: '-50vw',
            marginRight: '-50vw',
            width: '100vw',
            marginBottom: 10,
          }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/header.png"
              alt="Codito — Buscá. Comprá barato."
              style={{ width: '100%', height: 'auto', display: 'block' }}
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
                  fontSize: 24,
                  fontWeight: 900,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                  transition: 'transform 0.2s',
                }}>
                  →
                </div>
                <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.85)' }}>
                  Ver todo
                </span>
              </div>
            </div>
          </div>
        </Link>
      )}

      {/* Herramientas */}
      {!searched && (
        <div style={{ marginTop: 24, marginBottom: 6 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <h2 style={{ fontSize: 18, fontWeight: 900, color: '#09090b', letterSpacing: '-0.02em', margin: 0 }}>
              Herramientas
            </h2>
            <span style={{
              fontSize: 11, fontWeight: 700, color: '#f97316',
              background: '#fff7ed', border: '1px solid #fed7aa',
              borderRadius: 999, padding: '3px 10px',
            }}>
              7 herramientas gratis
            </span>
          </div>
          <p style={{ fontSize: 13, color: '#71717a', margin: 0 }}>
            Todo lo que necesitás para cuidar tu bolsillo
          </p>
        </div>
      )}
      {!searched && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 260px), 1fr))', gap: 12, marginTop: 10 }}>
          <Link href="/suscripciones" style={{ textDecoration: 'none' }}>
            <div style={{
              background: '#fff', border: '1.5px solid #e4e4e7', borderRadius: 18,
              padding: '18px 20px', cursor: 'pointer', transition: 'border-color 0.15s, box-shadow 0.15s',
            }}
              onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = '#a5b4fc'; (e.currentTarget as HTMLDivElement).style.boxShadow = '0 4px 16px rgba(99,102,241,0.1)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = '#e4e4e7'; (e.currentTarget as HTMLDivElement).style.boxShadow = 'none' }}
            >
              <div style={{ fontSize: 28, marginBottom: 10 }}>💸</div>
              <p style={{ fontSize: 14, fontWeight: 800, color: '#09090b', marginBottom: 5, letterSpacing: '-0.01em' }}>Suscripciones</p>
              <p style={{ fontSize: 12, color: '#71717a', lineHeight: 1.5 }}>
                Cuánto pagás en pesos por Netflix, Spotify, ChatGPT y más, con impuestos incluidos.
              </p>
            </div>
          </Link>

<Link href="/cuotas" style={{ textDecoration: 'none' }}>
            <div style={{
              background: '#fff', border: '1.5px solid #e4e4e7', borderRadius: 18,
              padding: '18px 20px', cursor: 'pointer', transition: 'border-color 0.15s, box-shadow 0.15s',
            }}
              onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = '#c4b5fd'; (e.currentTarget as HTMLDivElement).style.boxShadow = '0 4px 16px rgba(124,58,237,0.1)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = '#e4e4e7'; (e.currentTarget as HTMLDivElement).style.boxShadow = 'none' }}
            >
              <div style={{ fontSize: 28, marginBottom: 10 }}>🧮</div>
              <p style={{ fontSize: 14, fontWeight: 800, color: '#09090b', marginBottom: 5, letterSpacing: '-0.01em' }}>¿Cuotas o contado?</p>
              <p style={{ fontSize: 12, color: '#71717a', lineHeight: 1.5 }}>
                Calculá si te conviene pagar en cuotas ajustando por inflación real.
              </p>
            </div>
          </Link>

          <Link href="/dividito" style={{ textDecoration: 'none' }}>
            <div style={{
              background: '#fff', border: '1.5px solid #e4e4e7', borderRadius: 18,
              padding: '18px 20px', cursor: 'pointer', transition: 'border-color 0.15s, box-shadow 0.15s',
            }}
              onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = '#fdba74'; (e.currentTarget as HTMLDivElement).style.boxShadow = '0 4px 16px rgba(249,115,22,0.1)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = '#e4e4e7'; (e.currentTarget as HTMLDivElement).style.boxShadow = 'none' }}
            >
              <div style={{ fontSize: 28, marginBottom: 10 }}>🍕</div>
              <p style={{ fontSize: 14, fontWeight: 800, color: '#09090b', marginBottom: 5, letterSpacing: '-0.01em' }}>Dividito</p>
              <p style={{ fontSize: 12, color: '#71717a', lineHeight: 1.5 }}>
                Dividí los gastos entre amigos. Te decimos quién le debe a quién, sin vueltas.
              </p>
            </div>
          </Link>

          {/* Indicador deslizar */}
          <div style={{
            gridColumn: '1 / -1',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            padding: '8px 0',
          }}>
            <div style={{ flex: 1, height: 1, background: '#e4e4e7' }} />
            <span style={{
              fontSize: 12, fontWeight: 700, color: '#a1a1aa',
              display: 'inline-flex', alignItems: 'center', gap: 6,
              whiteSpace: 'nowrap',
            }}>
              Más herramientas
              <span style={{ animation: 'bounce 1.5s infinite', display: 'inline-block' }}>↓</span>
            </span>
            <div style={{ flex: 1, height: 1, background: '#e4e4e7' }} />
            <style>{`@keyframes bounce { 0%,100% { transform: translateY(0) } 50% { transform: translateY(4px) } }`}</style>
          </div>

          <Link href="/dolarito" style={{ textDecoration: 'none' }}>
            <div style={{
              background: '#fff', border: '1.5px solid #e4e4e7', borderRadius: 18,
              padding: '18px 20px', cursor: 'pointer', transition: 'border-color 0.15s, box-shadow 0.15s',
            }}
              onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = '#86efac'; (e.currentTarget as HTMLDivElement).style.boxShadow = '0 4px 16px rgba(22,163,74,0.1)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = '#e4e4e7'; (e.currentTarget as HTMLDivElement).style.boxShadow = 'none' }}
            >
              <div style={{ fontSize: 28, marginBottom: 10 }}>💵</div>
              <p style={{ fontSize: 14, fontWeight: 800, color: '#09090b', marginBottom: 5, letterSpacing: '-0.01em' }}>Dolarito</p>
              <p style={{ fontSize: 12, color: '#71717a', lineHeight: 1.5 }}>
                Todas las cotizaciones del dólar en vivo: Blue, Oficial, MEP, Tarjeta y más.
              </p>
            </div>
          </Link>

          <Link href="/inflacito" style={{ textDecoration: 'none' }}>
            <div style={{
              background: '#fff', border: '1.5px solid #e4e4e7', borderRadius: 18,
              padding: '18px 20px', cursor: 'pointer', transition: 'border-color 0.15s, box-shadow 0.15s',
            }}
              onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = '#fca5a5'; (e.currentTarget as HTMLDivElement).style.boxShadow = '0 4px 16px rgba(239,68,68,0.1)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = '#e4e4e7'; (e.currentTarget as HTMLDivElement).style.boxShadow = 'none' }}
            >
              <div style={{ fontSize: 28, marginBottom: 10 }}>📈</div>
              <p style={{ fontSize: 14, fontWeight: 800, color: '#09090b', marginBottom: 5, letterSpacing: '-0.01em' }}>Inflacito</p>
              <p style={{ fontSize: 12, color: '#71717a', lineHeight: 1.5 }}>
                ¿Cuánto vale hoy lo que costaba antes? Calculá cuánto perdiste por inflación.
              </p>
            </div>
          </Link>

          <Link href="/platita" style={{ textDecoration: 'none' }}>
            <div style={{
              background: '#fff', border: '1.5px solid #e4e4e7', borderRadius: 18,
              padding: '18px 20px', cursor: 'pointer', transition: 'border-color 0.15s, box-shadow 0.15s',
            }}
              onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = '#93c5fd'; (e.currentTarget as HTMLDivElement).style.boxShadow = '0 4px 16px rgba(37,99,235,0.1)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = '#e4e4e7'; (e.currentTarget as HTMLDivElement).style.boxShadow = 'none' }}
            >
              <div style={{ fontSize: 28, marginBottom: 10 }}>💰</div>
              <p style={{ fontSize: 14, fontWeight: 800, color: '#09090b', marginBottom: 5, letterSpacing: '-0.01em' }}>Platita</p>
              <p style={{ fontSize: 12, color: '#71717a', lineHeight: 1.5 }}>
                ¿Plazo fijo, dólares o colchón? Compará qué te conviene más.
              </p>
            </div>
          </Link>

          <Link href="/changito" style={{ textDecoration: 'none' }}>
            <div style={{
              background: '#fff', border: '1.5px solid #e4e4e7', borderRadius: 18,
              padding: '18px 20px', cursor: 'pointer', transition: 'border-color 0.15s, box-shadow 0.15s',
            }}
              onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = '#fcd34d'; (e.currentTarget as HTMLDivElement).style.boxShadow = '0 4px 16px rgba(245,158,11,0.1)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = '#e4e4e7'; (e.currentTarget as HTMLDivElement).style.boxShadow = 'none' }}
            >
              <div style={{ fontSize: 28, marginBottom: 10 }}>🛒</div>
              <p style={{ fontSize: 14, fontWeight: 800, color: '#09090b', marginBottom: 5, letterSpacing: '-0.01em' }}>Changito</p>
              <p style={{ fontSize: 12, color: '#71717a', lineHeight: 1.5 }}>
                Armá tu canasta básica y fijate cuánto te sale llenar el chango.
              </p>
            </div>
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
    </div>
  )
}
