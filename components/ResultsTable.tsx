'use client'

import { useState, useEffect } from 'react'
import { SearchResult } from '@/lib/types'
import { getStoreConfig } from '@/lib/stores'
import PriceSparkline from './PriceSparkline'

type Props = {
  results: SearchResult[]
  query: string
  onClear?: () => void
}

type DollarRates = { blue: number | null; oficial: number | null; mep: number | null }

export default function ResultsTable({ results, query, onClear }: Props) {
  const [sortBy, setSortBy] = useState<'price' | 'store'>('price')
  const [shared, setShared] = useState(false)
  const [showUsd, setShowUsd] = useState(false)
  const [dolarType, setDolarType] = useState<'blue' | 'oficial' | 'mep'>('blue')
  const [rates, setRates] = useState<DollarRates>({ blue: null, oficial: null, mep: null })
  const [ratesLoaded, setRatesLoaded] = useState(false)

  useEffect(() => {
    if (!showUsd || ratesLoaded) return
    fetch('/api/dolares')
      .then(r => r.json())
      .then((data: DollarRates) => {
        setRates(data)
        setRatesLoaded(true)
      })
      .catch(() => setRatesLoaded(true))
  }, [showUsd, ratesLoaded])

  const rate = rates[dolarType]

  const filtered = results
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
            background: '#09090b', border: 'none', cursor: 'pointer',
            color: '#fff', fontSize: 12, fontWeight: 700,
            padding: '7px 14px', borderRadius: 10,
            display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0,
            letterSpacing: '-0.01em',
          }}>
            ← Inicio
          </button>
        )}
        <p style={{ fontSize: 11, color: '#a1a1aa', flex: 1 }}>
          <strong style={{ color: '#71717a' }}>{results.length}</strong> resultados para{' '}
          <strong style={{ color: '#09090b' }}>&quot;{query}&quot;</strong>
        </p>
        <button onClick={handleShare} style={{
          background: shared ? '#f0fdf4' : '#f8fafc',
          border: `1px solid ${shared ? '#bbf7d0' : '#e4e4e7'}`,
          borderRadius: 999,
          padding: '5px 12px',
          fontSize: 12,
          fontWeight: 600,
          cursor: 'pointer',
          color: shared ? '#16a34a' : '#71717a',
          flexShrink: 0,
          transition: 'all 0.2s',
          minHeight: 32,
        }}>
          {shared ? '✓ Copiado' : '🔗 Compartir'}
        </button>
      </div>

      {/* Filtros */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 16, alignItems: 'center', justifyContent: 'flex-end' }}>
        <select value={sortBy} onChange={e => setSortBy(e.target.value as 'price' | 'store')}
          style={{
            background: '#f0f7ff',
            color: '#4d7fa8',
            border: '1px solid #bfdbfe',
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

        {/* Toggle USD */}
        <button
          onClick={() => setShowUsd(v => !v)}
          style={{
            background: showUsd ? 'linear-gradient(135deg, #16a34a, #22c55e)' : 'rgba(255,255,255,0.8)',
            color: showUsd ? '#fff' : '#16a34a',
            border: '1px solid #bbf7d0',
            borderRadius: 999,
            padding: '5px 14px',
            fontSize: 12,
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'all 0.2s',
            minHeight: 32,
            display: 'flex',
            alignItems: 'center',
            gap: 4,
          }}>
          💵 {showUsd ? 'Ocultar USD' : 'Ver en USD'}
        </button>
      </div>

      {/* Selector dólar (solo cuando showUsd) */}
      {showUsd && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          marginBottom: 14,
          padding: '10px 14px',
          background: '#f0fdf4',
          border: '1px solid #bbf7d0',
          borderRadius: 12,
          flexWrap: 'wrap',
        }}>
          <span style={{ fontSize: 12, color: '#15803d', fontWeight: 700 }}>Cotización:</span>
          {(['blue', 'oficial', 'mep'] as const).map(t => (
            <button key={t} onClick={() => setDolarType(t)} style={{
              background: dolarType === t ? '#16a34a' : 'transparent',
              color: dolarType === t ? '#fff' : '#15803d',
              border: `1px solid ${dolarType === t ? '#16a34a' : '#86efac'}`,
              borderRadius: 999,
              padding: '3px 12px',
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer',
            }}>
              {t === 'blue' ? 'Blue' : t === 'oficial' ? 'Oficial' : 'MEP'}
              {rates[t] ? ` $${rates[t]}` : ''}
            </button>
          ))}
          <span style={{ fontSize: 11, color: '#86efac', marginLeft: 'auto' }}>
            Precios convertidos al tipo de cambio seleccionado
          </span>
        </div>
      )}

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
            {showUsd && rate && (
              <p style={{ fontSize: 13, color: '#16a34a', fontWeight: 800, marginTop: 2 }}>
                ≈ {fmtUsd(cheapest.price, rate)}
              </p>
            )}
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

      {/* Sparkline de historial de precios */}
      <PriceSparkline query={query} />

      {/* Cards */}
      <div style={{ display: 'grid', gap: 10, marginTop: 14 }}>
        {filtered.map((result, i) => (
          <ProductCard key={result.id} result={result} rank={i + 1} isCheapest={i === 0} showUsd={showUsd} rate={rate} />
        ))}
      </div>
    </div>
  )
}

function ProductCard({ result, rank, isCheapest, showUsd, rate }: {
  result: SearchResult
  rank: number
  isCheapest: boolean
  showUsd: boolean
  rate: number | null
}) {
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
        {showUsd && rate && (
          <p style={{ fontSize: 11, color: '#16a34a', fontWeight: 700, whiteSpace: 'nowrap', marginTop: 1 }}>
            💵 {fmtUsd(result.price, rate)}
          </p>
        )}
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

function fmtUsd(ars: number, rate: number) {
  const usd = ars / rate
  return new Intl.NumberFormat('en-US', {
    style: 'currency', currency: 'USD', maximumFractionDigits: 2,
  }).format(usd)
}
