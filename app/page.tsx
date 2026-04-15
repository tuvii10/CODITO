'use client'

import { useState } from 'react'
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
      {/* Hero */}
      {!searched && (
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold mb-3">¿Cuánto sale hoy?</h2>
          <p style={{ color: 'var(--muted)' }} className="text-base">
            Buscá cualquier producto y compará precios en todos los supermercados y Mercado Libre.
          </p>
        </div>
      )}

      {/* Buscador */}
      <SearchBar onSearch={handleSearch} loading={loading} />

      {/* Resultados */}
      {searched && (
        <div className="mt-8">
          {loading ? (
            <div className="text-center py-16" style={{ color: 'var(--muted)' }}>
              <div className="text-4xl mb-4 animate-pulse">🔍</div>
              <p>Buscando en supermercados y Mercado Libre...</p>
            </div>
          ) : results.length === 0 ? (
            <div className="text-center py-16" style={{ color: 'var(--muted)' }}>
              <div className="text-4xl mb-4">😕</div>
              <p className="text-lg font-medium mb-1">Sin resultados para &quot;{lastQuery}&quot;</p>
              <p className="text-sm">Probá con otro nombre o una búsqueda más corta.</p>
            </div>
          ) : (
            <ResultsTable results={results} query={lastQuery} />
          )}
        </div>
      )}

      {/* Tiendas disponibles (solo en inicio) */}
      {!searched && (
        <div className="mt-16">
          <p className="text-center text-sm mb-6" style={{ color: 'var(--muted)' }}>Buscamos en</p>
          <div className="flex flex-wrap justify-center gap-3">
            {['Carrefour', 'Disco', 'Vea', 'Chango Más', 'Walmart', 'Coto', 'Frávega', 'Garbarino', 'Farmacity', 'Musimundo', 'Mercado Libre'].map(store => (
              <span
                key={store}
                className="px-4 py-2 rounded-full text-sm font-medium"
                style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
              >
                {store}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
