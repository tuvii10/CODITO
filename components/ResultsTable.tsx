'use client'

import { useState } from 'react'
import { SearchResult } from '@/lib/types'
import { getStoreConfig } from '@/lib/stores'

type Props = {
  results: SearchResult[]
  query: string
}

export default function ResultsTable({ results, query }: Props) {
  const [filter, setFilter] = useState<'all' | 'vtex' | 'mercadolibre' | 'searxng'>('all')
  const [sortBy, setSortBy] = useState<'price' | 'store'>('price')

  const filtered = results
    .filter(r => filter === 'all' || r.source === filter)
    .sort((a, b) => sortBy === 'price' ? a.price - b.price : a.store_name.localeCompare(b.store_name))

  const cheapest = filtered[0]

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <p className="text-sm" style={{ color: 'var(--muted)' }}>
          {results.length} resultado{results.length !== 1 ? 's' : ''} para{' '}
          <strong style={{ color: 'var(--foreground)' }}>&quot;{query}&quot;</strong>
        </p>
        <div className="flex gap-2 flex-wrap">
          {(['all', 'vtex', 'mercadolibre', 'searxng'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f as typeof filter)}
              className="px-3 py-1 rounded-full text-xs font-medium transition-colors"
              style={{
                background: filter === f ? 'var(--accent)' : 'var(--surface)',
                color: filter === f ? '#fff' : 'var(--muted)',
                border: '1px solid var(--border)',
              }}>
              {f === 'all' ? 'Todos' : f === 'vtex' ? 'Tiendas' : f === 'mercadolibre' ? 'Mercado Libre' : '🌐 Web'}
            </button>
          ))}
          <select value={sortBy} onChange={e => setSortBy(e.target.value as 'price' | 'store')}
            className="px-3 py-1 rounded-full text-xs"
            style={{ background: 'var(--surface)', color: 'var(--muted)', border: '1px solid var(--border)' }}>
            <option value="price">Menor precio</option>
            <option value="store">Por tienda</option>
          </select>
        </div>
      </div>

      {/* Banner más barato */}
      {cheapest && (
        <a href={cheapest.url ?? '#'} target="_blank" rel="noopener noreferrer"
          className="rounded-2xl p-4 mb-5 flex items-center gap-4 hover:opacity-90 transition-opacity cursor-pointer"
          style={{ background: '#052e16', border: '2px solid var(--accent)', display: 'flex', textDecoration: 'none' }}>
          <ProductImage result={cheapest} size={64} />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold uppercase mb-1" style={{ color: 'var(--accent)' }}>🏆 Más barato</p>
            <p className="font-semibold text-sm leading-tight" style={{ color: '#fff' }}>{cheapest.name}</p>
            <StoreBadge name={cheapest.store_name} logo={cheapest.store_logo} />
          </div>
          <div className="text-right shrink-0">
            <p className="text-2xl font-bold" style={{ color: 'var(--accent)' }}>{fmt(cheapest.price)}</p>
            {cheapest.price_per_unit && cheapest.unit && (
              <p className="text-xs" style={{ color: 'var(--muted)' }}>{fmt(cheapest.price_per_unit)} / {cheapest.unit}</p>
            )}
            <p className="text-xs mt-1" style={{ color: 'var(--accent)' }}>Ver producto →</p>
          </div>
        </a>
      )}

      {/* Cards */}
      <div className="grid gap-3">
        {filtered.map((result, i) => (
          <ProductCard key={result.id} result={result} rank={i + 1} isCheapest={i === 0} />
        ))}
      </div>
    </div>
  )
}

function ProductCard({ result, rank, isCheapest }: { result: SearchResult; rank: number; isCheapest: boolean }) {
  return (
    <a
      href={result.url ?? '#'}
      target="_blank"
      rel="noopener noreferrer"
      className="rounded-2xl flex items-center overflow-hidden transition-all hover:opacity-90"
      style={{
        background: 'var(--surface)',
        border: `1px solid ${isCheapest ? 'var(--accent)' : 'var(--border)'}`,
        textDecoration: 'none',
        color: 'inherit',
      }}
    >
      {/* Imagen cuadrada */}
      <div className="w-24 h-24 shrink-0 flex items-center justify-center"
        style={{ background: result.source === 'mercadolibre' ? '#fff' : '#1a1a1a' }}>
        <ProductImage result={result} size={80} />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0 px-4 py-3">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-bold" style={{ color: isCheapest ? 'var(--accent)' : 'var(--muted)' }}>
            #{rank}
          </span>
          <p className="font-semibold text-sm leading-snug line-clamp-2">{result.name}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <StoreBadge name={result.store_name} logo={result.store_logo} />
          {result.brand && result.brand !== result.store_name && (
            <span className="text-xs px-2 py-0.5 rounded-full"
              style={{ background: 'var(--border)', color: 'var(--muted)' }}>
              {result.brand}
            </span>
          )}
          {result.seller && (
            <span className="text-xs" style={{ color: 'var(--muted)' }}>por {result.seller}</span>
          )}
          <span className="text-xs px-2 py-0.5 rounded-full"
            style={{ background: 'var(--border)', color: 'var(--muted)' }}>
            {result.source === 'mercadolibre' ? 'ML' : result.source === 'searxng' ? '🌐 Web' : 'Tienda oficial'}
          </span>
        </div>
      </div>

      {/* Precio */}
      <div className="text-right pr-5 shrink-0">
        <p className="text-xl font-bold">{fmt(result.price)}</p>
        {result.price_per_unit && result.unit && (
          <p className="text-xs" style={{ color: 'var(--muted)' }}>
            {fmt(result.price_per_unit)} / {result.unit}
          </p>
        )}
        <p className="text-xs mt-1 font-medium" style={{ color: 'var(--accent)' }}>Ver →</p>
      </div>
    </a>
  )
}

function ProductImage({ result, size }: { result: SearchResult; size: number }) {
  if (result.image) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={result.image}
        alt={result.name}
        width={size}
        height={size}
        className="object-contain p-1"
        style={{ width: size, height: size }}
        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
      />
    )
  }
  // Sin imagen: mostrar logo de tienda grande
  const cfg = getStoreConfig(result.store_name)
  if (cfg.logo) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={cfg.logo}
        alt={result.store_name}
        width={40}
        height={40}
        className="object-contain opacity-60"
        style={{ width: 40, height: 40 }}
        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
      />
    )
  }
  return <span className="text-3xl opacity-20">🛒</span>
}

function StoreBadge({ name, logo }: { name: string; logo: string | null }) {
  const cfg = getStoreConfig(name)
  return (
    <span className="inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full"
      style={{ background: cfg.color, color: cfg.textColor }}>
      {(logo || cfg.logo) && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={logo || cfg.logo}
          alt=""
          width={12}
          height={12}
          className="object-contain rounded-sm"
          style={{ width: 12, height: 12 }}
          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
        />
      )}
      {cfg.displayName}
    </span>
  )
}

function fmt(n: number) {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency', currency: 'ARS', maximumFractionDigits: 0,
  }).format(n)
}
