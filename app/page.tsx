'use client'

import { useState } from 'react'
import Link from 'next/link'
import SearchBar from '@/components/SearchBar'
import ResultsTable from '@/components/ResultsTable'
import FeaturedProducts from '@/components/FeaturedProducts'
import { SearchResult } from '@/lib/types'
import { searchMercadoLibreClient } from '@/lib/ml-client'

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
      // Paralelo: servidor (VTEX + Coto) y cliente (Mercado Libre desde el navegador)
      const [serverRes, mlResults] = await Promise.all([
        fetch(`/api/search?q=${encodeURIComponent(query)}`).then(r => r.json()),
        searchMercadoLibreClient(query, 20),
      ])

      const serverResults: SearchResult[] = serverRes.results || []

      // Deduplicar por URL y unir
      const seen = new Set(serverResults.map(r => r.url).filter(Boolean))
      const mergedMl = mlResults.filter(r => !r.url || !seen.has(r.url))

      // Juntar y ordenar por precio
      const combined = [...serverResults, ...mergedMl]
      combined.sort((a, b) => (a.price || Infinity) - (b.price || Infinity))

      setResults(combined)
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
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo.png"
            alt="Codito"
            style={{
              height: 'clamp(110px, 20vw, 180px)',
              width: 'auto',
              margin: '0 auto 4px',
              display: 'block',
              filter: 'drop-shadow(0 6px 20px rgba(2,132,199,0.25))',
            }}
          />
          <p style={{
            fontSize: 11,
            fontWeight: 800,
            color: '#c2410c',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            marginBottom: 6,
          }}>
            ¿Cuánto sale hoy?
          </p>
          <h2 style={{
            fontSize: 'clamp(22px, 5.5vw, 38px)',
            fontWeight: 800,
            marginBottom: 10,
            color: '#0c4a6e',
            lineHeight: 1.15,
            maxWidth: 620,
            margin: '0 auto 10px',
            padding: '0 4px',
          }}>
            Encontrá el <span style={{ color: '#0284c7' }}>precio más bajo</span> de Argentina
          </h2>
          <p style={{
            color: '#1e3a5f',
            fontSize: 'clamp(12px, 3.2vw, 15px)',
            maxWidth: 460,
            margin: '0 auto',
            lineHeight: 1.45,
            padding: '0 12px',
          }}>
            Buscá cualquier producto y te mostramos dónde está más barato.
          </p>

          {/* Indicador de frecuencia — compacto en mobile */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            marginTop: 12,
            padding: '6px 14px',
            borderRadius: 999,
            background: 'rgba(255,255,255,0.8)',
            border: '1px solid #60a5fa',
            fontSize: 11,
            color: '#0c4a6e',
            fontWeight: 700,
            boxShadow: '0 2px 8px rgba(2,132,199,0.10)',
          }}>
            <span style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: '#16a34a',
              boxShadow: '0 0 0 3px rgba(22,163,74,0.25)',
              flexShrink: 0,
            }} />
            <span>En vivo · datos en tiempo real</span>
          </div>
        </div>
      )}

      {/* Buscador — destacado, primer elemento al que llega el ojo */}
      <div style={{
        background: '#ffffff',
        borderRadius: 20,
        padding: 'clamp(14px, 4vw, 22px)',
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
