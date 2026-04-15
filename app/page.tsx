'use client'

import { useState } from 'react'
import SearchBar from '@/components/SearchBar'
import ResultsTable from '@/components/ResultsTable'
import DealsSection from '@/components/DealsSection'
import { SearchResult } from '@/lib/types'

const STORES = ['Carrefour','Disco','Vea','Jumbo','Coto','Frávega','Easy','Farmacity','Mercado Libre','Libertad','BGH','Motorola','Topper','Mimo']

type Tab = 'buscar' | 'ofertas'

export default function Home() {
  const [tab, setTab] = useState<Tab>('buscar')
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
      {/* Hero — solo cuando no buscó nada */}
      {!searched && tab === 'buscar' && (
        <div style={{ textAlign: 'center', marginBottom: 36, padding: '0 8px' }}>
          <div style={{
            width: 80, height: 80, borderRadius: 20,
            background: 'linear-gradient(135deg, #0284c7 0%, #38bdf8 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px',
            boxShadow: '0 8px 32px rgba(14,165,233,0.3)',
            fontSize: 40,
          }}>🐭</div>
          <h2 style={{
            fontSize: 'clamp(24px, 5vw, 36px)', fontWeight: 800, marginBottom: 10,
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

      {/* Tabs */}
      <div style={{
        display: 'flex', gap: 6, marginBottom: 24,
        borderBottom: '1.5px solid var(--border)', paddingBottom: 0,
      }}>
        {([
          { key: 'buscar',  label: '🔍 Buscar' },
          { key: 'ofertas', label: '🏷️ Ofertas del día' },
        ] as { key: Tab; label: string }[]).map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              padding: '10px 20px',
              fontWeight: 700,
              fontSize: 14,
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              color: tab === t.key ? 'var(--accent)' : 'var(--muted)',
              borderBottom: tab === t.key ? '2.5px solid var(--accent)' : '2.5px solid transparent',
              marginBottom: -1.5,
              transition: 'all 0.15s',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab: Buscar */}
      {tab === 'buscar' && (
        <>
          <SearchBar onSearch={handleSearch} loading={loading} />

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

          {/* Tiendas — solo en estado inicial */}
          {!searched && (
            <div style={{ marginTop: 40, padding: '0 4px' }}>
              <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--muted)', marginBottom: 12 }}>
                Buscamos en
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 8 }}>
                {STORES.map(store => (
                  <span key={store} style={{
                    padding: '5px 14px', borderRadius: 999,
                    fontSize: 12, fontWeight: 500,
                    background: '#f8fafc', border: '1px solid var(--border)',
                    color: 'var(--foreground)',
                  }}>
                    {store}
                  </span>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Tab: Ofertas */}
      {tab === 'ofertas' && <DealsSection />}
    </div>
  )
}
