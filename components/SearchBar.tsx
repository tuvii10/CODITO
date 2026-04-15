'use client'

import { useState, FormEvent } from 'react'

type Props = {
  onSearch: (query: string) => void
  loading: boolean
}

const SUGGESTIONS = [
  { producto: 'Leche',      modelo: 'Entera' },
  { producto: 'Fideos',     modelo: 'Spaghetti' },
  { producto: 'Aceite',     modelo: 'Girasol' },
  { producto: 'Arroz',      modelo: 'Largo fino' },
  { producto: 'Yerba',      modelo: 'Mate' },
  { producto: 'Detergente', modelo: '' },
  { producto: 'Shampoo',    modelo: '' },
]

const inputStyle: React.CSSProperties = {
  width: '100%',
  border: '1.5px solid #e0e7ff',
  borderRadius: 12,
  padding: '12px 14px',
  fontSize: 15,
  fontWeight: 500,
  background: '#f5f3ff',
  color: '#0f172a',
  outline: 'none',
  boxSizing: 'border-box',
  transition: 'border-color 0.15s, background 0.15s',
}

const labelStyle: React.CSSProperties = {
  position: 'absolute', top: -9, left: 12,
  fontSize: 10, fontWeight: 700, color: '#6366f1',
  background: '#ffffff', padding: '0 5px',
  letterSpacing: '0.05em', textTransform: 'uppercase',
  zIndex: 1,
}

export default function SearchBar({ onSearch, loading }: Props) {
  const [producto, setProducto] = useState('')
  const [modelo, setModelo]   = useState('')

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const query = [producto.trim(), modelo.trim()].filter(Boolean).join(' ')
    if (query) onSearch(query)
  }

  function applySuggestion(s: { producto: string; modelo: string }) {
    setProducto(s.producto)
    setModelo(s.modelo)
    onSearch([s.producto, s.modelo].filter(Boolean).join(' '))
  }

  const canSearch = producto.trim().length > 0

  return (
    <div>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {/* Fila de inputs */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {/* Producto */}
          <div style={{ flex: '2 1 220px', position: 'relative', minWidth: 0 }}>
            <label style={labelStyle}>Producto</label>
            <input
              type="text"
              value={producto}
              onChange={e => setProducto(e.target.value)}
              placeholder="Ej: Leche, Aceite, Fideos..."
              disabled={loading}
              autoFocus
              style={inputStyle}
            />
          </div>

          {/* Modelo */}
          <div style={{ flex: '1.5 1 160px', position: 'relative', minWidth: 0 }}>
            <label style={{ ...labelStyle, color: '#4d7fa8' }}>
              Modelo / Marca{' '}
              <span style={{ fontWeight: 400, textTransform: 'none' }}>(opcional)</span>
            </label>
            <input
              type="text"
              value={modelo}
              onChange={e => setModelo(e.target.value)}
              placeholder="Ej: Entera, Girasol, 1L..."
              disabled={loading}
              style={inputStyle}
            />
          </div>
        </div>

        {/* Botón futurista */}
        <button
          type="submit"
          disabled={loading || !canSearch}
          style={{
            width: '100%',
            background: loading || !canSearch
              ? '#e0e7ff'
              : 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #06b6d4 100%)',
            color: '#fff',
            border: 'none',
            borderRadius: 12,
            padding: '14px 26px',
            fontWeight: 800,
            fontSize: 15,
            cursor: loading || !canSearch ? 'not-allowed' : 'pointer',
            boxShadow: loading || !canSearch ? 'none' : '0 10px 24px -6px rgba(99, 102, 241, 0.45)',
            whiteSpace: 'nowrap',
            minHeight: 50,
            transition: 'all 0.2s',
            letterSpacing: '-0.01em',
          }}
        >
          {loading ? 'Buscando...' : 'Buscar'}
        </button>
      </form>

      {/* Sugerencias — chips minimal */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 12 }}>
        {SUGGESTIONS.map(s => (
          <button
            key={s.producto + s.modelo}
            onClick={() => applySuggestion(s)}
            style={{
              background: 'rgba(224, 231, 255, 0.5)',
              border: '1px solid #e0e7ff',
              color: '#6366f1',
              borderRadius: 999,
              padding: '5px 13px',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLButtonElement).style.background = '#6366f1'
              ;(e.currentTarget as HTMLButtonElement).style.color = '#fff'
              ;(e.currentTarget as HTMLButtonElement).style.borderColor = '#6366f1'
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLButtonElement).style.background = 'rgba(224, 231, 255, 0.5)'
              ;(e.currentTarget as HTMLButtonElement).style.color = '#6366f1'
              ;(e.currentTarget as HTMLButtonElement).style.borderColor = '#e0e7ff'
            }}
          >
            {s.producto}{s.modelo ? ` · ${s.modelo}` : ''}
          </button>
        ))}
      </div>
    </div>
  )
}
