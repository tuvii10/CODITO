'use client'

import { useState, FormEvent } from 'react'

type Props = {
  onSearch: (query: string) => void
  loading: boolean
}

const SUGGESTIONS = [
  { producto: 'Leche',   modelo: 'Entera' },
  { producto: 'Fideos',  modelo: 'Spaghetti' },
  { producto: 'Aceite',  modelo: 'Girasol' },
  { producto: 'Arroz',   modelo: 'Largo fino' },
  { producto: 'Yerba',   modelo: 'Mate' },
  { producto: 'Detergente', modelo: '' },
  { producto: 'Shampoo', modelo: '' },
]

export default function SearchBar({ onSearch, loading }: Props) {
  const [producto, setProducto] = useState('')
  const [modelo, setModelo] = useState('')

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const query = [producto.trim(), modelo.trim()].filter(Boolean).join(' ')
    if (query) onSearch(query)
  }

  function applySuggestion(s: { producto: string; modelo: string }) {
    setProducto(s.producto)
    setModelo(s.modelo)
    const query = [s.producto, s.modelo].filter(Boolean).join(' ')
    onSearch(query)
  }

  const canSearch = producto.trim().length > 0

  return (
    <div>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {/* Fila de campos */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {/* Campo Producto */}
          <div style={{ flex: '2 1 180px', position: 'relative' }}>
            <label style={{
              position: 'absolute', top: -9, left: 12,
              fontSize: 11, fontWeight: 700, color: 'var(--accent)',
              background: 'var(--background)', padding: '0 4px',
              letterSpacing: '0.05em', textTransform: 'uppercase',
              zIndex: 1,
            }}>
              Producto
            </label>
            <input
              type="text"
              value={producto}
              onChange={e => setProducto(e.target.value)}
              placeholder="Ej: Leche, Aceite, Fideos..."
              disabled={loading}
              autoFocus
              style={{
                width: '100%',
                border: '1.5px solid var(--border)',
                borderRadius: 14,
                padding: '12px 14px',
                fontSize: 15,
                fontWeight: 500,
                background: '#fff',
                color: 'var(--foreground)',
                outline: 'none',
                boxSizing: 'border-box',
                boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
              }}
            />
          </div>

          {/* Campo Modelo */}
          <div style={{ flex: '1.5 1 140px', position: 'relative' }}>
            <label style={{
              position: 'absolute', top: -9, left: 12,
              fontSize: 11, fontWeight: 700, color: 'var(--muted)',
              background: 'var(--background)', padding: '0 4px',
              letterSpacing: '0.05em', textTransform: 'uppercase',
              zIndex: 1,
            }}>
              Modelo / Marca <span style={{ fontWeight: 400 }}>(opcional)</span>
            </label>
            <input
              type="text"
              value={modelo}
              onChange={e => setModelo(e.target.value)}
              placeholder="Ej: Entera, Girasol, 1L..."
              disabled={loading}
              style={{
                width: '100%',
                border: '1.5px solid var(--border)',
                borderRadius: 14,
                padding: '12px 14px',
                fontSize: 15,
                background: '#fff',
                color: 'var(--foreground)',
                outline: 'none',
                boxSizing: 'border-box',
                boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
              }}
            />
          </div>

          {/* Botón */}
          <button
            type="submit"
            disabled={loading || !canSearch}
            style={{
              flex: '0 0 auto',
              alignSelf: 'stretch',
              background: loading || !canSearch
                ? '#bae6fd'
                : 'linear-gradient(135deg, #0284c7 0%, #0ea5e9 100%)',
              color: '#fff',
              border: 'none',
              borderRadius: 14,
              padding: '0 24px',
              fontWeight: 700,
              fontSize: 15,
              cursor: loading || !canSearch ? 'not-allowed' : 'pointer',
              boxShadow: loading || !canSearch ? 'none' : '0 4px 16px rgba(14,165,233,0.35)',
              whiteSpace: 'nowrap',
              transition: 'all 0.2s',
              minHeight: 48,
            }}
          >
            {loading ? '...' : 'Buscar'}
          </button>
        </div>
      </form>

      {/* Sugerencias */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 12 }}>
        {SUGGESTIONS.map(s => (
          <button
            key={s.producto + s.modelo}
            onClick={() => applySuggestion(s)}
            style={{
              background: '#f8fafc',
              border: '1px solid var(--border)',
              color: 'var(--muted)',
              borderRadius: 999,
              padding: '4px 14px',
              fontSize: 12,
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLButtonElement).style.background = '#e0f2fe'
              ;(e.currentTarget as HTMLButtonElement).style.color = 'var(--accent)'
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLButtonElement).style.background = '#f8fafc'
              ;(e.currentTarget as HTMLButtonElement).style.color = 'var(--muted)'
            }}
          >
            {s.producto}{s.modelo ? ` · ${s.modelo}` : ''}
          </button>
        ))}
      </div>
    </div>
  )
}
