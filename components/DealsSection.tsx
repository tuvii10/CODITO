'use client'

import { useEffect, useState } from 'react'
import { Deal } from '@/lib/deals'
import { getStoreConfig } from '@/lib/stores'

export default function DealsSection() {
  const [deals, setDeals] = useState<Deal[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('Todos')

  useEffect(() => {
    fetch('/api/deals')
      .then(r => r.json())
      .then(d => setDeals(d.deals || []))
      .catch(() => setDeals([]))
      .finally(() => setLoading(false))
  }, [])

  const verifiedCount = deals.filter(d => d.verified).length
  const categories = ['Todos', 'Solo verificados', ...Array.from(new Set(deals.map(d => d.category)))]
  const filtered = filter === 'Solo verificados'
    ? deals.filter(d => d.verified)
    : filter === 'Todos'
      ? deals
      : deals.filter(d => d.category === filter)

  if (loading) return <DealsSkeleton />
  if (deals.length === 0) return null

  return (
    <section style={{ marginTop: 56 }}>
      {/* Título */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <div style={{
          width: 40, height: 40, borderRadius: 12,
          background: 'linear-gradient(135deg, #f97316 0%, #ef4444 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 20, flexShrink: 0,
          boxShadow: '0 4px 12px rgba(249,115,22,0.35)',
        }}>🏷️</div>
        <div>
          <h2 style={{ fontWeight: 800, fontSize: 20, color: 'var(--foreground)', lineHeight: 1.2 }}>
            Ofertas del día
          </h2>
          <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>
            {verifiedCount} verificados como los más baratos · {deals.length} ofertas totales · se actualiza cada 24 hs
          </p>
        </div>
      </div>

      {/* Filtros por categoría */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 20 }}>
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            style={{
              padding: '5px 14px',
              borderRadius: 999,
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              border: '1px solid var(--border)',
              background: filter === cat
                ? 'linear-gradient(135deg, #f97316, #ef4444)'
                : 'rgba(255,255,255,0.8)',
              color: filter === cat ? '#fff' : 'var(--muted)',
              boxShadow: filter === cat ? '0 2px 10px rgba(249,115,22,0.3)' : 'none',
              transition: 'all 0.15s',
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Grid de cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 200px), 1fr))',
        gap: 12,
      }}>
        {filtered.map(deal => (
          <DealCard key={deal.id} deal={deal} />
        ))}
      </div>
    </section>
  )
}

function DealCard({ deal }: { deal: Deal }) {
  const cfg = getStoreConfig(deal.store_name)
  const saving = deal.original_price - deal.price

  return (
    <a
      href={deal.url ?? '#'}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        display: 'flex',
        flexDirection: 'column',
        background: '#ffffff',
        border: '1.5px solid var(--border)',
        borderRadius: 18,
        overflow: 'hidden',
        textDecoration: 'none',
        color: 'inherit',
        boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
        transition: 'transform 0.15s, box-shadow 0.15s',
        position: 'relative',
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLAnchorElement).style.transform = 'translateY(-2px)'
        ;(e.currentTarget as HTMLAnchorElement).style.boxShadow = '0 6px 20px rgba(0,0,0,0.10)'
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLAnchorElement).style.transform = 'translateY(0)'
        ;(e.currentTarget as HTMLAnchorElement).style.boxShadow = '0 1px 4px rgba(0,0,0,0.06)'
      }}
    >
      {/* Badge descuento */}
      <div style={{
        position: 'absolute',
        top: 10, left: 10,
        background: deal.verified
          ? 'linear-gradient(135deg, #f97316, #ef4444)'
          : 'rgba(100,116,139,0.85)',
        color: '#fff',
        fontSize: 11,
        fontWeight: 800,
        padding: '3px 8px',
        borderRadius: 999,
        boxShadow: deal.verified ? '0 2px 8px rgba(239,68,68,0.4)' : 'none',
        zIndex: 1,
      }}>
        -{deal.discount_pct}%
      </div>

      {/* Badge verificado */}
      {deal.verified && (
        <div style={{
          position: 'absolute',
          top: 10, right: 10,
          background: 'rgba(22,163,74,0.92)',
          color: '#fff',
          fontSize: 10,
          fontWeight: 700,
          padding: '3px 7px',
          borderRadius: 999,
          zIndex: 1,
        }}>
          ✓ el más barato
        </div>
      )}

      {/* Imagen */}
      <div style={{
        width: '100%',
        height: 140,
        background: '#f8fafc',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        borderBottom: '1px solid var(--border)',
      }}>
        {deal.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={deal.image}
            alt={deal.name}
            style={{ width: '100%', height: '100%', objectFit: 'contain', padding: 8 }}
            onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
          />
        ) : (
          <span style={{ fontSize: 36, opacity: 0.15 }}>🛒</span>
        )}
      </div>

      {/* Info */}
      <div style={{ padding: '10px 12px 12px', flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
        {/* Nombre */}
        <p style={{
          fontSize: 12,
          fontWeight: 600,
          lineHeight: 1.35,
          color: 'var(--foreground)',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}>{deal.name}</p>

        {/* Tienda */}
        <span style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 4,
          fontSize: 10,
          fontWeight: 700,
          padding: '2px 7px',
          borderRadius: 999,
          background: cfg.color,
          color: cfg.textColor,
          alignSelf: 'flex-start',
        }}>
          {cfg.logo && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={cfg.logo} alt="" width={10} height={10}
              style={{ width: 10, height: 10, objectFit: 'contain', borderRadius: 2 }}
              onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
            />
          )}
          {cfg.displayName}
        </span>

        {/* Promo label */}
        {deal.promo_label && (
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            fontSize: 10,
            fontWeight: 700,
            padding: '3px 8px',
            borderRadius: 6,
            background: '#fff7ed',
            color: '#c2410c',
            border: '1px solid #fed7aa',
            alignSelf: 'flex-start',
          }}>
            🏷 {deal.promo_label}
            {deal.min_units > 1 && (
              <span style={{ fontWeight: 400, color: '#9a3412' }}>· comprando {deal.min_units}</span>
            )}
          </div>
        )}

        {/* Precios */}
        <div style={{ marginTop: 'auto' }}>
          <p style={{ fontSize: 10, color: 'var(--muted)', textDecoration: 'line-through' }}>
            {fmt(deal.original_price)}
          </p>
          <p style={{
            fontSize: 18,
            fontWeight: 800,
            background: 'linear-gradient(135deg, #f97316, #ef4444)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            lineHeight: 1.2,
          }}>
            {fmt(deal.price)}
            {deal.min_units > 1 && (
              <span style={{ fontSize: 10, fontWeight: 500, WebkitTextFillColor: '#9a3412', marginLeft: 3 }}>c/u</span>
            )}
          </p>
          <p style={{ fontSize: 10, color: '#16a34a', fontWeight: 700, marginTop: 2 }}>
            Ahorrás {fmt(saving)} {deal.min_units > 1 ? 'por unidad' : ''}
          </p>
        </div>
      </div>
    </a>
  )
}

function DealsSkeleton() {
  return (
    <section style={{ marginTop: 56 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <div style={{ width: 40, height: 40, borderRadius: 12, background: '#e0f2fe' }} />
        <div>
          <div style={{ width: 140, height: 16, borderRadius: 6, background: '#e0f2fe', marginBottom: 6 }} />
          <div style={{ width: 200, height: 11, borderRadius: 6, background: '#e0f2fe' }} />
        </div>
      </div>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 200px), 1fr))',
        gap: 12,
      }}>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} style={{
            height: 280,
            borderRadius: 18,
            background: 'rgba(255,255,255,0.7)',
            border: '1.5px solid var(--border)',
            overflow: 'hidden',
          }}>
            <div style={{ height: 140, background: 'linear-gradient(90deg, #e0f2fe 25%, #bae6fd 50%, #e0f2fe 75%)', backgroundSize: '200% 100%' }} />
            <div style={{ padding: 12 }}>
              <div style={{ height: 12, borderRadius: 4, background: '#e0f2fe', marginBottom: 8 }} />
              <div style={{ height: 12, borderRadius: 4, background: '#e0f2fe', width: '70%', marginBottom: 12 }} />
              <div style={{ height: 18, borderRadius: 4, background: '#bae6fd', width: '50%' }} />
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

function fmt(n: number) {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency', currency: 'ARS', maximumFractionDigits: 0,
  }).format(n)
}
