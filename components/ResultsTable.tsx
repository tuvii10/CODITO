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
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
        <p style={{ fontSize: 13, color: '#4d7fa8' }}>
          {results.length} resultado{results.length !== 1 ? 's' : ''} para{' '}
          <strong style={{ color: '#0284c7' }}>&quot;{query}&quot;</strong>
        </p>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
          {(['all', 'vtex', 'mercadolibre', 'searxng'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              style={{
                background: filter === f
                  ? 'linear-gradient(135deg, #0284c7, #0ea5e9)'
                  : 'rgba(255,255,255,0.8)',
                color: filter === f ? '#fff' : 'var(--muted)',
                border: '1px solid #bfdbfe',
                borderRadius: 999,
                padding: '4px 14px',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
                boxShadow: filter === f ? '0 2px 12px rgba(14,165,233,0.3)' : 'none',
                transition: 'all 0.2s',
              }}>
              {f === 'all' ? 'Todos' : f === 'vtex' ? 'Tiendas oficiales' : f === 'mercadolibre' ? 'Marketplace' : '🌐 Web'}
            </button>
          ))}
          <select value={sortBy} onChange={e => setSortBy(e.target.value as 'price' | 'store')}
            style={{
              background: '#f0f7ff',
              color: '#4d7fa8',
              border: '1px solid #bfdbfe',
              borderRadius: 999,
              padding: '4px 14px',
              fontSize: 12,
              outline: 'none',
              cursor: 'pointer',
            }}>
            <option value="price">Menor precio</option>
            <option value="store">Por tienda</option>
          </select>
        </div>
      </div>

      {/* Banner más barato — protagonista, dorado y llamativo */}
      {cheapest && (
        <a href={cheapest.url ?? '#'} target="_blank" rel="noopener noreferrer"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)',
            border: '2.5px solid #f59e0b',
            borderRadius: 20,
            padding: '14px 18px',
            marginBottom: 22,
            textDecoration: 'none',
            boxShadow: '0 8px 32px rgba(245,158,11,0.22)',
            transition: 'transform 0.15s, box-shadow 0.15s',
            flexWrap: 'wrap',
            position: 'relative',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.transform = 'translateY(-2px)'
            e.currentTarget.style.boxShadow = '0 12px 40px rgba(245,158,11,0.32)'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.transform = 'translateY(0)'
            e.currentTarget.style.boxShadow = '0 8px 32px rgba(245,158,11,0.22)'
          }}
        >
          {/* Badge corona */}
          <div style={{
            position: 'absolute',
            top: -12, left: 16,
            background: 'linear-gradient(135deg, #f59e0b, #d97706)',
            color: '#fff',
            fontSize: 11,
            fontWeight: 800,
            padding: '4px 12px',
            borderRadius: 999,
            boxShadow: '0 3px 10px rgba(245,158,11,0.40)',
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
          }}>
            🏆 El más barato
          </div>

          <ProductImage result={cheapest} size={64} />
          <div style={{ flex: 1, minWidth: 120 }}>
            <p style={{ fontWeight: 700, fontSize: 14, lineHeight: 1.3, color: '#0c1a2e', marginTop: 6, marginBottom: 6 }}>
              {cheapest.name}
            </p>
            <StoreBadge name={cheapest.store_name} logo={cheapest.store_logo} />
          </div>
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <p style={{
              fontSize: 'clamp(22px, 5.5vw, 30px)',
              fontWeight: 900,
              color: '#0284c7',
              lineHeight: 1,
            }}>{fmt(cheapest.price)}</p>
            {cheapest.original_price && cheapest.original_price > cheapest.price && (
              <>
                <p style={{ fontSize: 11, color: '#94a3b8', textDecoration: 'line-through', marginTop: 2 }}>
                  {fmt(cheapest.original_price)}
                </p>
                <p style={{ fontSize: 12, color: '#16a34a', fontWeight: 800, marginTop: 1 }}>
                  💰 Ahorrás {fmt(cheapest.original_price - cheapest.price)}
                </p>
              </>
            )}
            {cheapest.price_per_unit && cheapest.unit && (
              <p style={{ fontSize: 10, color: '#4d7fa8', marginTop: 2 }}>{fmt(cheapest.price_per_unit)} / {cheapest.unit}</p>
            )}
            <p style={{ fontSize: 12, color: '#d97706', marginTop: 4, fontWeight: 700 }}>Ver producto →</p>
          </div>
        </a>
      )}

      {/* Cards */}
      <div style={{ display: 'grid', gap: 10 }}>
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
      style={{
        display: 'flex',
        alignItems: 'center',
        overflow: 'hidden',
        background: '#ffffff',
        border: `1.5px solid ${isCheapest ? '#0284c7' : '#bfdbfe'}`,
        borderRadius: 16,
        textDecoration: 'none',
        color: 'inherit',
        boxShadow: isCheapest
          ? '0 2px 12px rgba(14,165,233,0.12)'
          : '0 1px 4px rgba(0,0,0,0.05)',
        transition: 'transform 0.15s, box-shadow 0.15s',
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLAnchorElement).style.transform = 'translateY(-2px)'
        ;(e.currentTarget as HTMLAnchorElement).style.boxShadow = '0 6px 20px rgba(0,0,0,0.10)'
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLAnchorElement).style.transform = 'translateY(0)'
        ;(e.currentTarget as HTMLAnchorElement).style.boxShadow = isCheapest
          ? '0 2px 12px rgba(14,165,233,0.12)'
          : '0 1px 4px rgba(0,0,0,0.05)'
      }}
    >
      {/* Imagen */}
      <div style={{
        width: 72,
        height: 72,
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#ffffff',
        borderRight: '1px solid #bfdbfe',
        alignSelf: 'stretch',
      }}>
        <ProductImage result={result} size={56} />
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0, padding: '8px 10px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6, marginBottom: 4 }}>
          <span style={{
            fontSize: 11,
            fontWeight: 800,
            color: isCheapest ? 'var(--accent)' : 'var(--muted)',
            flexShrink: 0,
            marginTop: 1,
          }}>#{rank}</span>
          <p style={{ fontWeight: 600, fontSize: 13, lineHeight: 1.3 }} className="line-clamp-2">{result.name}</p>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 4 }}>
          <StoreBadge name={result.store_name} logo={result.store_logo} />
        </div>
      </div>

      {/* Precio */}
      <div style={{ textAlign: 'right', padding: '8px 14px 8px 4px', flexShrink: 0 }}>
        {result.promo_label && (
          <span style={{
            display: 'inline-block',
            fontSize: 11,
            fontWeight: 700,
            padding: '2px 8px',
            borderRadius: 999,
            marginBottom: 4,
            background: 'linear-gradient(135deg, #16a34a, #22c55e)',
            color: '#fff',
            whiteSpace: 'nowrap',
          }}>
            {result.promo_label}
          </span>
        )}
        <p style={{
          fontSize: 'clamp(16px, 4vw, 20px)',
          fontWeight: 800,
          background: isCheapest
            ? 'linear-gradient(135deg, #0284c7, #0ea5e9)'
            : 'none',
          WebkitBackgroundClip: isCheapest ? 'text' : undefined,
          WebkitTextFillColor: isCheapest ? 'transparent' : '#0c1a2e',
          backgroundClip: isCheapest ? 'text' : undefined,
          whiteSpace: 'nowrap',
        }}>{fmt(result.price)}</p>
        {result.original_price && result.original_price > result.price && (
          <>
            <p style={{ fontSize: 10, color: '#94a3b8', textDecoration: 'line-through', whiteSpace: 'nowrap' }}>
              {fmt(result.original_price)}
            </p>
            <p style={{ fontSize: 11, color: '#16a34a', fontWeight: 800, whiteSpace: 'nowrap', marginTop: 1 }}>
              💰 Ahorrás {fmt(result.original_price - result.price)}
            </p>
          </>
        )}
        {result.price_per_unit && result.unit && (
          <p style={{ fontSize: 10, color: '#4d7fa8', whiteSpace: 'nowrap' }}>
            {fmt(result.price_per_unit)} / {result.unit}
          </p>
        )}
        <p style={{ fontSize: 11, marginTop: 3, fontWeight: 700, color: '#0284c7' }}>Ver →</p>
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
  return <span style={{ fontSize: 28, opacity: 0.2 }}>🛒</span>
}

function StoreBadge({ name }: { name: string; logo?: string | null }) {
  const cfg = getStoreConfig(name)
  return (
    <span style={{
      display: 'inline-block',
      fontSize: 11,
      fontWeight: 700,
      padding: '3px 10px',
      borderRadius: 999,
      background: cfg.color,
      color: cfg.textColor,
      letterSpacing: '-0.01em',
    }}>
      {cfg.displayName}
    </span>
  )
}

function fmt(n: number) {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency', currency: 'ARS', maximumFractionDigits: 0,
  }).format(n)
}
