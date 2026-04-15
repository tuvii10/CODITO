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
      {/* Banner Ofertas */}
      <Link href="/ofertas" style={{ textDecoration: 'none', display: 'block', marginBottom: 28 }}>
        <div style={{
          borderRadius: 18,
          padding: '16px 22px',
          background: 'linear-gradient(135deg, #f97316 0%, #ef4444 60%, #dc2626 100%)',
          boxShadow: '0 6px 24px rgba(239,68,68,0.30)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <span style={{ fontSize: 36, flexShrink: 0 }}>🏷️</span>
            <div>
              <p style={{ color: '#fff', fontWeight: 800, fontSize: 17, lineHeight: 1.2 }}>
                Ofertas del día
              </p>
              <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: 13, marginTop: 3 }}>
                30 productos con descuento real · se renuevan cada 24 hs
              </p>
            </div>
          </div>
          <div style={{
            flexShrink: 0,
            background: 'rgba(255,255,255,0.22)',
            border: '1.5px solid rgba(255,255,255,0.45)',
            borderRadius: 10,
            padding: '7px 16px',
            color: '#fff',
            fontWeight: 700,
            fontSize: 13,
            whiteSpace: 'nowrap',
          }}>
            Ver ofertas →
          </div>
        </div>
      </Link>

      {/* Hero */}
      {!searched && (
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo.png"
            alt="Codito"
            style={{ height: 130, width: 'auto', margin: '0 auto 4px', display: 'block' }}
          />
          <h2 style={{
            fontSize: 'clamp(24px, 5vw, 36px)',
            fontWeight: 800,
            marginBottom: 10,
            color: '#0284c7',
          }}>
            ¿Cuánto sale hoy?
          </h2>
          <p style={{ color: '#4d7fa8', fontSize: 15, maxWidth: 400, margin: '0 auto' }}>
            Buscá por producto y modelo para comparar precios en supermercados y Mercado Libre.
          </p>
        </div>
      )}

      {/* Buscador */}
      <div style={{
        background: '#ffffff',
        borderRadius: 20,
        padding: 20,
        boxShadow: '0 2px 20px rgba(2,132,199,0.10)',
        border: '1.5px solid #bfdbfe',
      }}>
        <SearchBar onSearch={handleSearch} loading={loading} />
      </div>

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
              <p style={{ color: '#4d7fa8', fontWeight: 600 }}>Buscando en supermercados y Mercado Libre...</p>
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
