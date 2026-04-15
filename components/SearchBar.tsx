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
  border: '1.5px solid #bfdbfe',
  borderRadius: 12,
  padding: '11px 14px',
  fontSize: 15,
  fontWeight: 500,
  background: '#f0f7ff',
  color: '#0c1a2e',
  outline: 'none',
  boxSizing: 'border-box',
}

const labelStyle: React.CSSProperties = {
  position: 'absolute', top: -9, left: 12,
  fontSize: 11, fontWeight: 700, color: '#0284c7',
  background: '#ffffff', padding: '0 4px',
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

        {/* Botón full width para mejor mobile */}
        <button
          type="submit"
          disabled={loading || !canSearch}
          style={{
            width: '100%',
            background: loading || !canSearch
              ? '#bfdbfe'
              : 'linear-gradient(135deg, #0284c7 0%, #0ea5e9 100%)',
            color: '#fff',
            border: 'none',
            borderRadius: 12,
            padding: '14px 26px',
            fontWeight: 800,
            fontSize: 15,
            cursor: loading || !canSearch ? 'not-allowed' : 'pointer',
            boxShadow: loading || !canSearch ? 'none' : '0 4px 16px rgba(2,132,199,0.35)',
            whiteSpace: 'nowrap',
            minHeight: 50,
            transition: 'all 0.2s',
            letterSpacing: '0.02em',
          }}
        >
          {loading ? 'Buscando...' : '🔍 Buscar el mejor precio'}
        </button>
      </form>

      {/* Sugerencias */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 12 }}>
        {SUGGESTIONS.map(s => (
          <button
            key={s.producto + s.modelo}
            onClick={() => applySuggestion(s)}
            style={{
              background: '#e0f2fe',
              border: '1px solid #bfdbfe',
              color: '#0369a1',
              borderRadius: 999,
              padding: '4px 14px',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLButtonElement).style.background = '#0284c7'
              ;(e.currentTarget as HTMLButtonElement).style.color = '#fff'
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLButtonElement).style.background = '#e0f2fe'
              ;(e.currentTarget as HTMLButtonElement).style.color = '#0369a1'
            }}
          >
            {s.producto}{s.modelo ? ` · ${s.modelo}` : ''}
          </button>
        ))}
      </div>
    </div>
  )
}
