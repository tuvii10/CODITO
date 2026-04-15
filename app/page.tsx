'use client'

import { useState } from 'react'
import Link from 'next/link'
import SearchBar from '@/components/SearchBar'
import ResultsTable from '@/components/ResultsTable'
import FeaturedProducts from '@/components/FeaturedProducts'
import { SearchResult } from '@/lib/types'

export default function Home() {
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const [lastQuery, setLastQuery] = useState('')

  async function handleSearch(query: string) {
    if (!query.trim()) return
    setLoading(true)
    setSearched(true)
    setLastQuery(query)
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

  return (
    <div>
      {/* Hero futurista */}
      {!searched && (
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo.png"
            alt="Codito"
            style={{
              height: 'clamp(130px, 22vw, 200px)',
              width: 'auto',
              margin: '0 auto 4px',
              display: 'block',
              filter: 'drop-shadow(0 10px 30px rgba(139, 92, 246, 0.25))',
            }}
          />
          <p style={{
            fontSize: 11,
            fontWeight: 700,
            background: 'linear-gradient(135deg, #6366f1, #ec4899)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
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
            color: '#0f172a',
            lineHeight: 1.05,
            maxWidth: 620,
            margin: '0 auto 8px',
            padding: '0 4px',
            letterSpacing: '-0.03em',
          }}>
            Buscá.{' '}
            <span style={{
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6, #ec4899)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>
              Comprá barato.
            </span>
          </h2>
          <p style={{
            color: '#64748b',
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
            background: 'rgba(255, 255, 255, 0.6)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            border: '1px solid #c7d2fe',
            fontSize: 11,
            color: '#0f172a',
            fontWeight: 700,
            letterSpacing: '0.02em',
          }}>
            <span className="live-dot" style={{
              width: 7, height: 7, borderRadius: '50%',
              background: '#10b981',
            }} />
            En vivo
          </div>
        </div>
      )}

      {/* Buscador — glass card */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.75)',
        backdropFilter: 'blur(20px) saturate(160%)',
        WebkitBackdropFilter: 'blur(20px) saturate(160%)',
        borderRadius: 20,
        padding: 'clamp(14px, 4vw, 22px)',
        boxShadow: '0 10px 40px -10px rgba(99, 102, 241, 0.20)',
        border: '1px solid rgba(199, 210, 254, 0.6)',
      }}>
        <SearchBar onSearch={handleSearch} loading={loading} />
      </div>

      {/* Banner Ofertas — futurista */}
      {!searched && (
        <Link href="/ofertas" style={{ textDecoration: 'none', display: 'block', marginTop: 14 }}>
          <div style={{
            borderRadius: 14,
            padding: '13px 18px',
            background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #ec4899 100%)',
            boxShadow: '0 8px 24px -6px rgba(139, 92, 246, 0.40)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 10,
            position: 'relative',
            overflow: 'hidden',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{
                width: 32, height: 32, borderRadius: 10,
                background: 'rgba(255, 255, 255, 0.25)',
                backdropFilter: 'blur(10px)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 16,
                border: '1px solid rgba(255, 255, 255, 0.3)',
              }}>⚡</div>
              <div>
                <p style={{ color: '#fff', fontWeight: 800, fontSize: 15, lineHeight: 1.15, letterSpacing: '-0.01em' }}>
                  Ofertas del día
                </p>
                <p style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: 11, marginTop: 2, fontWeight: 500 }}>
                  Descuentos verificados
                </p>
              </div>
            </div>
            <div style={{
              flexShrink: 0,
              color: '#fff',
              fontWeight: 700,
              fontSize: 18,
              whiteSpace: 'nowrap',
            }}>
              →
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
            <ResultsTable results={results} query={lastQuery} />
          )}
        </div>
      )}

      {/* Productos destacados — solo en estado inicial */}
      {!searched && <FeaturedProducts />}
    </div>
  )
}
