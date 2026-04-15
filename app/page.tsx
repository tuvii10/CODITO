'use client'

import { useState } from 'react'
import SearchBar from '@/components/SearchBar'
import ResultsTable from '@/components/ResultsTable'
import DealsSection from '@/components/DealsSection'
import { SearchResult } from '@/lib/types'

const STORES = ['Carrefour','Disco','Vea','Chango Más','Walmart','Coto','Frávega','Garbarino','Farmacity','Musimundo','Mercado Libre']

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
        <div style={{ textAlign: 'center', marginBottom: 40, padding: '0 8px' }}>
          <div style={{
            width: 96,
            height: 96,
            borderRadius: 24,
            background: 'linear-gradient(135deg, #0284c7 0%, #38bdf8 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px',
            boxShadow: '0 8px 32px rgba(14,165,233,0.3)',
            fontSize: 48,
          }}>🐭</div>

          <h2 style={{
            fontSize: 'clamp(26px, 6vw, 40px)',
            fontWeight: 800,
            marginBottom: 12,
            background: 'linear-gradient(135deg, #0284c7 0%, #0ea5e9 50%, #38bdf8 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>
            ¿Cuánto sale hoy?
          </h2>
          <p style={{ color: 'var(--muted)', fontSize: 15, maxWidth: 400, margin: '0 auto' }}>
            Buscá cualquier producto y compará precios en supermercados y Mercado Libre.
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

      {/* Ofertas del día */}
      {!searched && <DealsSection />}

      {/* Tiendas */}
      {!searched && (
        <div style={{ marginTop: 48, padding: '0 4px' }}>
          <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--muted)', marginBottom: 16 }}>
            Buscamos en
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 8 }}>
            {STORES.map(store => (
              <span key={store} style={{
                padding: '6px 14px',
                borderRadius: 999,
                fontSize: 13,
                fontWeight: 500,
                background: '#f8fafc',
                border: '1px solid var(--border)',
                color: 'var(--foreground)',
              }}>
                {store}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
