'use client'

import { useState, FormEvent } from 'react'

type Props = {
  onSearch: (query: string) => void
  loading: boolean
  initialQuery?: string
}

const SUGGESTIONS = [
  'aceite girasol',
  'leche entera',
  'fideos',
  'detergente',
  'papel higiénico',
  'arroz',
  'yerba mate',
]

export default function SearchBar({ onSearch, loading, initialQuery = '' }: Props) {
  const [query, setQuery] = useState(initialQuery)

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    onSearch(query)
  }

  return (
    <div>
      <form onSubmit={handleSubmit} style={{
        background: '#ffffff',
        border: '1.5px solid var(--border)',
        borderRadius: 20,
        padding: '6px 6px 6px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
      }}>
        <span style={{ fontSize: 20, opacity: 0.5, flexShrink: 0 }}>🔍</span>
        <input
          type="search"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Ej: aceite girasol, leche La Serenísima..."
          style={{
            flex: 1,
            border: 'none',
            outline: 'none',
            background: 'transparent',
            color: 'var(--foreground)',
            fontSize: 16,
            padding: '8px 0',
            minWidth: 0,
          }}
          disabled={loading}
          autoFocus
          autoComplete="off"
          enterKeyHint="search"
        />
        <button
          type="submit"
          disabled={loading || !query.trim()}
          style={{
            background: loading || !query.trim()
              ? '#bae6fd'
              : 'linear-gradient(135deg, #0284c7 0%, #0ea5e9 100%)',
            color: '#fff',
            border: 'none',
            borderRadius: 14,
            padding: '10px 20px',
            fontWeight: 700,
            fontSize: 14,
            cursor: loading || !query.trim() ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s',
            boxShadow: loading || !query.trim() ? 'none' : '0 4px 16px rgba(14,165,233,0.35)',
            whiteSpace: 'nowrap',
            flexShrink: 0,
            // touch-friendly
            minHeight: 40,
            minWidth: 72,
          }}
        >
          {loading ? '...' : 'Buscar'}
        </button>
      </form>

      {/* Sugerencias — scroll horizontal en mobile */}
      <div style={{
        display: 'flex',
        gap: 8,
        marginTop: 10,
        overflowX: 'auto',
        paddingBottom: 4,
        scrollbarWidth: 'none',
        msOverflowStyle: 'none',
      }}>
        {SUGGESTIONS.map(s => (
          <button
            key={s}
            onClick={() => { setQuery(s); onSearch(s) }}
            style={{
              background: '#f8fafc',
              border: '1px solid var(--border)',
              color: 'var(--muted)',
              borderRadius: 999,
              padding: '6px 14px',
              fontSize: 12,
              cursor: 'pointer',
              transition: 'all 0.15s',
              whiteSpace: 'nowrap',
              flexShrink: 0,
              // touch-friendly
              minHeight: 32,
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
            {s}
          </button>
        ))}
      </div>
    </div>
  )
}
