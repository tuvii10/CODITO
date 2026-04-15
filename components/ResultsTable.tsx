'use client'

import { useState } from 'react'
import { SearchResult } from '@/lib/types'
import { getStoreConfig } from '@/lib/stores'

type Props = {
  results: SearchResult[]
  query: string
  onClear?: () => void
}

export default function ResultsTable({ results, query, onClear }: Props) {
  const [filter, setFilter] = useState<'all' | 'vtex' | 'mercadolibre' | 'searxng'>('all')
  const [sortBy, setSortBy] = useState<'price' | 'store'>('price')
  const [shared, setShared] = useState(false)

  const filtered = results
    .filter(r => filter === 'all' || r.source === filter)
    .sort((a, b) => sortBy === 'price' ? a.price - b.price : a.store_name.localeCompare(b.store_name))

  const cheapest = filtered[0]

  function handleShare() {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setShared(true)
      setTimeout(() => setShared(false), 2000)
    })
  }

  return (
    <div>
      {/* Header: volver + resultados + compartir */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        {onClear && (
          <button onClick={onClear} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--muted)', fontSize: 13, padding: '4px 0',
            display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0,
          }}>
            ← Inicio
          </button>
        )}
        <p style={{ fontSize: 13, color: 'var(--muted)', flex: 1 }}>
          <strong style={{ color: 'var(--foreground)' }}>{results.length}</strong> resultado{results.length !== 1 ? 's' : ''} para{' '}
          <strong style={{ color: 'var(--accent)' }}>&quot;{query}&quot;</strong>
        </p>
        <button onClick={handleShare} style={{
          background: shared ? '#dcfce7' : '#f8fafc',
          border: '1px solid var(--border)',
          borderRadius: 999,
          padding: '5px 12px',
          fontSize: 12,
          fontWeight: 600,
          cursor: 'pointer',
          color: shared ? '#16a34a' : 'var(--muted)',
          flexShrink: 0,
          transition: 'all 0.2s',
          minHeight: 32,
        }}>
          {shared ? '✓ Copiado' : '🔗 Compartir'}
        </button>
      </div>

      {/* Filtros por fuente */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16, alignItems: 'center' }}>
        {(['all', 'vtex', 'mercadolibre', 'searxng'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            style={{
              background: filter === f
                ? 'linear-gradient(135deg, #0284c7, #0ea5e9)'
                : 'rgba(255,255,255,0.8)',
              color: filter === f ? '#fff' : 'var(--muted)',
              border: '1px solid var(--border)',
              borderRadius: 999,
              padding: '5px 14px',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: filter === f ? '0 2px 12px rgba(14,165,233,0.3)' : 'none',
              transition: 'all 0.2s',
              minHeight: 32,
            }}>
            {f === 'all' ? 'Todos' : f === 'vtex' ? 'Tiendas' : f === 'mercadolibre' ? 'Mercado Libre' : '🌐 Web'}
          </button>
        ))}
        <select value={sortBy} onChange={e => setSortBy(e.target.value as 'price' | 'store')}
          style={{
            background: 'rgba(255,255,255,0.8)',
            color: 'var(--muted)',
            border: '1px solid var(--border)',
            borderRadius: 999,
            padding: '5px 14px',
            fontSize: 12,
            outline: 'none',
            cursor: 'pointer',
            minHeight: 32,
          }}>
          <option value="price">Menor precio</option>
          <option value="store">Por tienda</option>
        </select>
      </div>

      {/* Banner más barato */}
      {cheapest && (
        <a href={cheapest.url ?? '#'} target="_blank" rel="noopener noreferrer"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            background: '#f0f9ff',
            border: '2px solid var(--accent)',
            borderRadius: 20,
            padding: '12px 16px',
            marginBottom: 20,
            textDecoration: 'none',
            boxShadow: '0 4px 32px rgba(14,165,233,0.18)',
            transition: 'transform 0.15s',
            flexWrap: 'wrap',
          }}
          onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-2px)')}
          onMouseLeave={e => (e.currentTarget.style.transform = 'translateY(0)')}
        >
          <ProductImage result={cheapest} size={56} />
          <div style={{ flex: 1, minWidth: 120 }}>
            <p style={{ color: 'var(--accent)', fontSize: 11, fontWeight: 800, textTransform: 'uppercase', marginBottom: 4 }}>
              🏆 Más barato
            </p>
            <p style={{ fontWeight: 600, fontSize: 13, lineHeight: 1.3, color: 'var(--foreground)' }}>{cheapest.name}</p>
            <StoreBadge name={cheapest.store_name} logo={cheapest.store_logo} />
          </div>
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <p style={{
              fontSize: 'clamp(20px, 5vw, 26px)',
              fontWeight: 800,
              background: 'linear-gradient(135deg, #0284c7, #0ea5e9)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>{fmt(cheapest.price)}</p>
            {cheapest.price_per_unit && cheapest.unit && (
              <p style={{ fontSize: 11, color: 'var(--muted)' }}>{fmt(cheapest.price_per_unit)} / {cheapest.unit}</p>
            )}
            <p style={{ fontSize: 12, color: 'var(--accent)', marginTop: 4, fontWeight: 600 }}>Ver producto →</p>
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
        border: `1.5px solid ${isCheapest ? 'var(--accent)' : 'var(--border)'}`,
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
        background: result.source === 'mercadolibre' ? '#fff' : '#f0f9ff',
        borderRight: '1px solid var(--border)',
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
          {result.brand && result.brand !== result.store_name && (
            <span style={{
              fontSize: 11,
              padding: '2px 6px',
              borderRadius: 999,
              background: '#e0f2fe',
              color: 'var(--muted)',
            }}>{result.brand}</span>
          )}
          {result.seller && (
            <span style={{ fontSize: 11, color: 'var(--muted)' }}>por {result.seller}</span>
          )}
          <span style={{
            fontSize: 11,
            padding: '2px 6px',
            borderRadius: 999,
            background: '#e0f2fe',
            color: 'var(--muted)',
          }}>
            {result.source === 'mercadolibre' ? 'ML' : result.source === 'searxng' ? '🌐 Web' : 'Oficial'}
          </span>
        </div>
      </div>

      {/* Precio */}
      <div style={{ textAlign: 'right', padding: '8px 14px 8px 4px', flexShrink: 0 }}>
        <p style={{
          fontSize: 'clamp(14px, 4vw, 20px)',
          fontWeight: 800,
          background: isCheapest
            ? 'linear-gradient(135deg, #0284c7, #0ea5e9)'
            : 'none',
          WebkitBackgroundClip: isCheapest ? 'text' : undefined,
          WebkitTextFillColor: isCheapest ? 'transparent' : 'var(--foreground)',
          backgroundClip: isCheapest ? 'text' : undefined,
          whiteSpace: 'nowrap',
        }}>{fmt(result.price)}</p>
        {result.price_per_unit && result.unit && (
          <p style={{ fontSize: 10, color: 'var(--muted)', whiteSpace: 'nowrap' }}>
            {fmt(result.price_per_unit)} / {result.unit}
          </p>
        )}
        <p style={{ fontSize: 11, marginTop: 2, fontWeight: 600, color: 'var(--accent)' }}>Ver →</p>
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

function StoreBadge({ name, logo }: { name: string; logo: string | null }) {
  const cfg = getStoreConfig(name)
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 4,
      fontSize: 11,
      fontWeight: 700,
      padding: '2px 8px',
      borderRadius: 999,
      background: cfg.color,
      color: cfg.textColor,
    }}>
      {(logo || cfg.logo) && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={logo || cfg.logo}
          alt=""
          width={12}
          height={12}
          style={{ width: 12, height: 12, objectFit: 'contain', borderRadius: 2 }}
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
