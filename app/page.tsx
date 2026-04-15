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
      {/* Hero minimal blanco/gris */}
      {!searched && (
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo.png"
            alt="Codito"
            style={{
              height: 'clamp(130px, 22vw, 200px)',
              width: 'auto',
              margin: '0 auto 6px',
              display: 'block',
              filter: 'drop-shadow(0 8px 20px rgba(0, 0, 0, 0.08))',
            }}
          />
          <p style={{
            fontSize: 11,
            fontWeight: 700,
            color: '#71717a',
            textTransform: 'uppercase',
            letterSpacing: '0.18em',
            marginBottom: 8,
          }}>
            ¿Cuánto sale hoy?
          </p>
          <h2 style={{
            fontSize: 'clamp(28px, 7vw, 48px)',
            fontWeight: 900,
            marginBottom: 8,
            color: '#09090b',
            lineHeight: 1.05,
            maxWidth: 620,
            margin: '0 auto 8px',
            padding: '0 4px',
            letterSpacing: '-0.03em',
          }}>
            Buscá. Comprá barato.
          </h2>
          <p style={{
            color: '#71717a',
            fontSize: 'clamp(12px, 3.2vw, 14px)',
            margin: '0 auto',
            fontWeight: 500,
          }}>
            Sin vueltas, sin perder guita.
          </p>

          {/* Indicador live */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 7,
            marginTop: 14,
            padding: '6px 13px',
            borderRadius: 999,
            background: '#ffffff',
            border: '1px solid #e4e4e7',
            fontSize: 11,
            color: '#09090b',
            fontWeight: 700,
          }}>
            <span className="live-dot" style={{
              width: 7, height: 7, borderRadius: '50%',
              background: '#16a34a',
            }} />
            En vivo
          </div>
        </div>
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

      {/* Banner Ofertas — protagonista de la home */}
      {!searched && (
        <Link
          href="/ofertas"
          className="ofertas-banner"
          style={{ textDecoration: 'none', display: 'block', marginTop: 18 }}
        >
          <div style={{
            position: 'relative',
            borderRadius: 20,
            padding: 'clamp(20px, 5vw, 28px) clamp(20px, 5vw, 32px)',
            background: 'linear-gradient(135deg, #09090b 0%, #1c1c1f 50%, #09090b 100%)',
            overflow: 'hidden',
            cursor: 'pointer',
            boxShadow: '0 20px 40px -15px rgba(0, 0, 0, 0.35)',
            transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.3s',
          }}>
            {/* Shimmer effect — linea diagonal sutil */}
            <div className="banner-shimmer" style={{
              position: 'absolute',
              top: 0, left: '-100%',
              width: '50%', height: '100%',
              background: 'linear-gradient(120deg, transparent 0%, rgba(255,255,255,0.08) 50%, transparent 100%)',
              transform: 'skewX(-20deg)',
              pointerEvents: 'none',
            }} />

            {/* Contenido */}
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                {/* Eyebrow con pulse */}
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 7,
                  padding: '4px 10px',
                  borderRadius: 999,
                  background: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid rgba(239, 68, 68, 0.35)',
                  marginBottom: 10,
                }}>
                  <span className="live-dot" style={{
                    width: 6, height: 6, borderRadius: '50%',
                    background: '#ef4444',
                  }} />
                  <span style={{
                    fontSize: 10,
                    fontWeight: 800,
                    color: '#fca5a5',
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                  }}>
                    HOY · en vivo
                  </span>
                </div>

                <h3 style={{
                  color: '#ffffff',
                  fontWeight: 900,
                  fontSize: 'clamp(20px, 5vw, 28px)',
                  lineHeight: 1.05,
                  letterSpacing: '-0.03em',
                  marginBottom: 6,
                }}>
                  Ofertas del día
                </h3>
                <p style={{
                  color: '#a1a1aa',
                  fontSize: 'clamp(12px, 3vw, 13px)',
                  fontWeight: 500,
                  lineHeight: 1.4,
                }}>
                  Los precios más bajos verificados entre{' '}
                  <strong style={{ color: '#e4e4e7' }}>60+ tiendas</strong>.
                </p>
              </div>

              {/* CTA arrow */}
              <div className="ofertas-arrow" style={{
                flexShrink: 0,
                width: 44,
                height: 44,
                borderRadius: 14,
                background: '#ffffff',
                color: '#09090b',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 22,
                fontWeight: 900,
                transition: 'transform 0.2s',
              }}>
                →
              </div>
            </div>
          </div>
        </Link>
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
              <p style={{ color: '#4d7fa8', fontWeight: 600 }}>Buscando...</p>
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
