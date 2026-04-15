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
  padding: '14px 16px',
  fontSize: 15,
  fontWeight: 500,
  background: '#fafafa',
  color: '#09090b',
  outline: 'none',
  boxSizing: 'border-box',
  transition: 'border-color 0.15s, background 0.15s',
}

export default function SearchBar({ onSearch, loading }: Props) {
  const [producto, setProducto] = useState('')

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const q = producto.trim()
    if (q) onSearch(q)
  }

  const canSearch = producto.trim().length > 0

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <input
        type="text"
        value={producto}
        onChange={e => setProducto(e.target.value)}
        placeholder="Buscá un producto..."
        disabled={loading}
        autoFocus
        style={inputStyle}
      />

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
