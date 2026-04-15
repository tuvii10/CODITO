'use client'

import { useState, FormEvent } from 'react'

type Props = {
  onSearch: (query: string) => void
  loading: boolean
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  border: '1px solid #e4e4e7',
  borderRadius: 12,
  padding: '13px 14px',
  fontSize: 15,
  fontWeight: 500,
  background: '#fafafa',
  color: '#09090b',
  outline: 'none',
  boxSizing: 'border-box',
  transition: 'border-color 0.15s, background 0.15s',
}

const labelStyle: React.CSSProperties = {
  position: 'absolute', top: -9, left: 12,
  fontSize: 10, fontWeight: 700, color: '#71717a',
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

  const canSearch = producto.trim().length > 0

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
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

        <div style={{ flex: '1.5 1 160px', position: 'relative', minWidth: 0 }}>
          <label style={labelStyle}>
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

      <button
        type="submit"
        disabled={loading || !canSearch}
        style={{
          width: '100%',
          background: loading || !canSearch ? '#e4e4e7' : '#18181b',
          color: loading || !canSearch ? '#a1a1aa' : '#ffffff',
          border: 'none',
          borderRadius: 12,
          padding: '14px 26px',
          fontWeight: 700,
          fontSize: 15,
          cursor: loading || !canSearch ? 'not-allowed' : 'pointer',
          whiteSpace: 'nowrap',
          minHeight: 50,
          transition: 'background 0.15s',
          letterSpacing: '-0.01em',
        }}
      >
        {loading ? 'Buscando...' : 'Buscar'}
      </button>
    </form>
  )
}
