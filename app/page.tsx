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
      {/* Hero */}
      {!searched && (
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo.png"
            alt="Codito"
            style={{
              height: 'clamp(140px, 22vw, 200px)',
              width: 'auto',
              margin: '0 auto 8px',
              display: 'block',
              filter: 'drop-shadow(0 6px 20px rgba(2,132,199,0.25))',
            }}
          />
          <p style={{
            fontSize: 12,
            fontWeight: 800,
            color: '#c2410c',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            marginBottom: 6,
          }}>
            ¿Cuánto sale hoy?
          </p>
          <h2 style={{
            fontSize: 'clamp(24px, 5.5vw, 40px)',
            fontWeight: 800,
            marginBottom: 12,
            color: '#0c4a6e',
            lineHeight: 1.15,
            maxWidth: 620,
            margin: '0 auto 12px',
            padding: '0 8px',
          }}>
            Encontrá el <span style={{ color: '#0284c7' }}>precio más bajo</span> de Argentina
          </h2>
          <p style={{
            color: '#1e3a5f',
            fontSize: 'clamp(13px, 3.5vw, 15px)',
            maxWidth: 480,
            margin: '0 auto',
            lineHeight: 1.5,
            padding: '0 12px',
          }}>
            Buscá cualquier producto y te mostramos al instante dónde está más barato.
            Sin vueltas, sin cuentas, sin perder guita.
          </p>

          {/* Indicador de frecuencia */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            marginTop: 14,
            padding: '7px 16px',
            borderRadius: 999,
            background: 'rgba(255,255,255,0.7)',
            border: '1px solid #60a5fa',
            fontSize: 11,
            color: '#0c4a6e',
            fontWeight: 600,
            flexWrap: 'wrap',
            justifyContent: 'center',
          }}>
            <span style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: '#16a34a',
              boxShadow: '0 0 0 3px rgba(22,163,74,0.25)',
            }} />
            <span>Búsquedas al instante</span>
            <span style={{ color: '#60a5fa' }}>·</span>
            <span>Destacados cada 1 hora</span>
            <span style={{ color: '#60a5fa' }}>·</span>
            <span>Ofertas cada 24 hs</span>
          </div>
        </div>
      )}

      {/* Buscador — destacado, primer elemento al que llega el ojo */}
      <div style={{
        background: '#ffffff',
        borderRadius: 20,
        padding: 22,
        boxShadow: '0 8px 32px rgba(2,132,199,0.12)',
        border: '2px solid #bfdbfe',
      }}>
        <SearchBar onSearch={handleSearch} loading={loading} />
      </div>

      {/* Banner Ofertas — debajo del buscador, más chico, no roba el show */}
      {!searched && (
        <Link href="/ofertas" style={{ textDecoration: 'none', display: 'block', marginTop: 16 }}>
          <div style={{
            borderRadius: 14,
            padding: '12px 18px',
            background: 'linear-gradient(135deg, #f97316 0%, #ef4444 70%, #dc2626 100%)',
            boxShadow: '0 4px 14px rgba(239,68,68,0.25)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 10,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 22 }}>🏷️</span>
              <div>
                <p style={{ color: '#fff', fontWeight: 800, fontSize: 14, lineHeight: 1.2 }}>
                  Ofertas del día
                </p>
                <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: 11, marginTop: 1 }}>
                  30 productos con descuento real
                </p>
              </div>
            </div>
            <div style={{
              flexShrink: 0,
              color: '#fff',
              fontWeight: 700,
              fontSize: 12,
              whiteSpace: 'nowrap',
            }}>
              Ver ofertas →
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
              <p style={{ color: '#4d7fa8', fontWeight: 600 }}>Buscando el mejor precio...</p>
            </div>
          ) : results.length === 0 ? (
            <div style={{
              textAlign: 'center', padding: '60px 0',
              background: '#fff', borderRadius: 16,
              border: '1.5px solid #bfdbfe',
            }}>
              <div style={{ fontSize: 40, marginBottom: 14 }}>😕</div>
              <p style={{ fontSize: 16, fontWeight: 700, marginBottom: 6, color: '#0c1a2e' }}>
                Sin resultados para &quot;{lastQuery}&quot;
              </p>
              <p style={{ fontSize: 13, color: '#4d7fa8' }}>Probá con otro nombre o una búsqueda más corta.</p>
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
