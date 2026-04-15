'use client'

import { useState, FormEvent } from 'react'

type Props = {
  onSearch: (query: string) => void
  loading: boolean
}

const SUGGESTIONS = [
  'aceite girasol',
  'leche entera',
  'fideos spaghetti',
  'detergente',
  'papel higiénico',
  'arroz largo fino',
  'yerba mate',
]

export default function SearchBar({ onSearch, loading }: Props) {
  const [query, setQuery] = useState('')

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    onSearch(query)
  }

  return (
    <div>
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Ej: aceite girasol 1.5 litros, leche La Serenísima..."
          className="flex-1 px-4 py-3 rounded-xl text-base outline-none"
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            color: 'var(--foreground)',
          }}
          disabled={loading}
          autoFocus
        />
        <button
          type="submit"
          disabled={loading || !query.trim()}
          className="px-6 py-3 rounded-xl font-semibold text-base transition-colors disabled:opacity-50"
          style={{
            background: 'var(--accent)',
            color: '#fff',
          }}
        >
          {loading ? '...' : 'Buscar'}
        </button>
      </form>

      {/* Sugerencias rápidas */}
      <div className="flex flex-wrap gap-2 mt-3">
        {SUGGESTIONS.map(s => (
          <button
            key={s}
            onClick={() => { setQuery(s); onSearch(s) }}
            className="px-3 py-1 rounded-full text-xs transition-colors"
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              color: 'var(--muted)',
            }}
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  )
}
