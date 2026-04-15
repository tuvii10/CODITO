'use client'

import { useState } from 'react'
import Link from 'next/link'
import SearchBar from '@/components/SearchBar'
import ResultsTable from '@/components/ResultsTable'
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
      {/* Banner de Ofertas — siempre visible arriba */}
      <Link href="/ofertas" style={{ textDecoration: 'none', display: 'block', marginBottom: 24 }}>
        <div style={{
          borderRadius: 20,
          padding: '14px 20px',
          background: 'linear-gradient(135deg, #f97316 0%, #ef4444 60%, #dc2626 100%)',
          boxShadow: '0 6px 24px rgba(239,68,68,0.40)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          cursor: 'pointer',
          transition: 'transform 0.15s, box-shadow 0.15s',
        }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)'
            ;(e.currentTarget as HTMLDivElement).style.boxShadow = '0 10px 32px rgba(239,68,68,0.50)'
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)'
            ;(e.currentTarget as HTMLDivElement).style.boxShadow = '0 6px 24px rgba(239,68,68,0.40)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 32, flexShrink: 0 }}>🏷️</span>
            <div>
              <p style={{ color: '#fff', fontWeight: 800, fontSize: 16, lineHeight: 1.2 }}>
                Ofertas del día
              </p>
              <p style={{ color: 'rgba(255,255,255,0.80)', fontSize: 12, marginTop: 2 }}>
                30 productos con descuento real · se renuevan cada 24 hs
              </p>
            </div>
          </div>
          <div style={{
            flexShrink: 0,
            background: 'rgba(255,255,255,0.20)',
            border: '1.5px solid rgba(255,255,255,0.40)',
            borderRadius: 10,
            padding: '6px 14px',
            color: '#fff',
            fontWeight: 700,
            fontSize: 13,
            whiteSpace: 'nowrap',
          }}>
            Ver ofertas →
          </div>
        </div>
      </Link>

      {/* Hero — solo cuando no buscó nada */}
      {!searched && (
        <div style={{ textAlign: 'center', marginBottom: 32, padding: '0 8px' }}>
          <div style={{
            width: 80, height: 80, borderRadius: 20,
            background: 'linear-gradient(135deg, #0284c7 0%, #38bdf8 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px',
            boxShadow: '0 8px 32px rgba(14,165,233,0.3)',
            fontSize: 40,
          }}>🐭</div>
          <h2 style={{
            fontSize: 'clamp(22px, 5vw, 34px)', fontWeight: 800, marginBottom: 10,
            background: 'linear-gradient(135deg, #0284c7 0%, #0ea5e9 50%, #38bdf8 100%)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
          }}>
            ¿Cuánto sale hoy?
          </h2>
          <p style={{ color: 'var(--muted)', fontSize: 14, maxWidth: 380, margin: '0 auto' }}>
            Buscá por producto y modelo para comparar precios en supermercados y Mercado Libre.
          </p>
        </div>
      )}

      {/* Buscador */}
      <SearchBar onSearch={handleSearch} loading={loading} />

      {/* Resultados */}
      {searched && (
        <div style={{ marginTop: 28 }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--muted)' }}>
              <div style={{ fontSize: 40, marginBottom: 16 }}>⏳</div>
              <p>Buscando en supermercados y Mercado Libre...</p>
            </div>
          ) : results.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--muted)' }}>
              <div style={{ fontSize: 40, marginBottom: 16 }}>😕</div>
              <p style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>
                Sin resultados para &quot;{lastQuery}&quot;
              </p>
              <p style={{ fontSize: 13 }}>Probá con otro nombre o una búsqueda más corta.</p>
            </div>
          ) : (
            <ResultsTable results={results} query={lastQuery} />
          )}
        </div>
      )}
    </div>
  )
}
