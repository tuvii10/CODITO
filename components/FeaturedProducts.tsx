'use client'

import { useEffect, useState } from 'react'
import { SearchResult } from '@/lib/types'
import { getStoreConfig } from '@/lib/stores'

type Category = {
  key: string
  label: string
  emoji: string
  products: SearchResult[]
}

function fmt(n: number) {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency', currency: 'ARS', maximumFractionDigits: 0,
  }).format(n)
}

export default function FeaturedProducts() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<string>('gaseosa')

  useEffect(() => {
    fetch('/api/featured')
      .then(r => r.json())
      .then(d => setCategories(d.categories || []))
      .catch(() => setCategories([]))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <section style={{ marginTop: 40 }}>
        <div style={{ textAlign: 'center', padding: '40px 0', color: '#4d7fa8' }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>⏳</div>
          <p style={{ fontSize: 13, fontWeight: 600 }}>Cargando productos destacados...</p>
        </div>
      </section>
    )
  }

  const active = categories.find(c => c.key === activeTab) ?? categories[0]
  const totalProducts = categories.reduce((sum, c) => sum + c.products.length, 0)
  if (totalProducts === 0) return null

  return (
    <section style={{ marginTop: 40 }}>
      {/* Título */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <div style={{
          width: 42, height: 42, borderRadius: 12,
          background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 22, flexShrink: 0,
          boxShadow: '0 4px 14px rgba(245,158,11,0.30)',
        }}>⭐</div>
        <div>
          <h2 style={{ fontSize: 19, fontWeight: 800, color: '#0c4a6e', lineHeight: 1.2 }}>
            Productos destacados
          </h2>
          <p style={{ fontSize: 12, color: '#4d7fa8', marginTop: 2 }}>
            Precios reales en tiempo real · se actualizan cada hora
          </p>
        </div>
      </div>

      {/* Tabs de categorías */}
      <div style={{
        display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16,
        paddingBottom: 12, borderBottom: '1.5px solid #bfdbfe',
      }}>
        {categories.map(c => (
          <button
            key={c.key}
            onClick={() => setActiveTab(c.key)}
            disabled={c.products.length === 0}
            style={{
              padding: '7px 14px',
              borderRadius: 999,
              fontSize: 12,
              fontWeight: 700,
              cursor: c.products.length === 0 ? 'not-allowed' : 'pointer',
              border: '1.5px solid #bfdbfe',
              background: activeTab === c.key
                ? 'linear-gradient(135deg, #0284c7, #0ea5e9)'
                : c.products.length === 0 ? '#f1f5f9' : '#ffffff',
              color: activeTab === c.key
                ? '#fff'
                : c.products.length === 0 ? '#cbd5e1' : '#0284c7',
              boxShadow: activeTab === c.key
                ? '0 3px 12px rgba(2,132,199,0.30)' : 'none',
              transition: 'all 0.15s',
              display: 'inline-flex', alignItems: 'center', gap: 5,
            }}
          >
            <span>{c.emoji}</span>
            {c.label}
            <span style={{
              fontSize: 10,
              opacity: 0.8,
              fontWeight: 500,
            }}>
              ({c.products.length})
            </span>
          </button>
        ))}
      </div>

      {/* Grid de productos */}
      {active && active.products.length > 0 ? (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 175px), 1fr))',
          gap: 12,
        }}>
          {active.products.map(p => <ProductCard key={p.id} result={p} />)}
        </div>
      ) : (
        <p style={{ textAlign: 'center', padding: 30, color: '#4d7fa8', fontSize: 13 }}>
          No hay productos en esta categoría.
        </p>
      )}
    </section>
  )
}

function ProductCard({ result }: { result: SearchResult }) {
  const cfg = getStoreConfig(result.store_name)
  return (
    <a
      href={result.url ?? '#'}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        display: 'flex',
        flexDirection: 'column',
        background: '#ffffff',
        border: '1.5px solid #bfdbfe',
        borderRadius: 14,
        overflow: 'hidden',
        textDecoration: 'none',
        color: 'inherit',
        boxShadow: '0 1px 4px rgba(2,132,199,0.06)',
        transition: 'transform 0.15s, box-shadow 0.15s',
        position: 'relative',
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLAnchorElement).style.transform = 'translateY(-3px)'
        ;(e.currentTarget as HTMLAnchorElement).style.boxShadow = '0 8px 22px rgba(2,132,199,0.14)'
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLAnchorElement).style.transform = 'translateY(0)'
        ;(e.currentTarget as HTMLAnchorElement).style.boxShadow = '0 1px 4px rgba(2,132,199,0.06)'
      }}
    >
      {/* Badge promo */}
      {result.promo_label && (
        <div style={{
          position: 'absolute', top: 8, left: 8, zIndex: 1,
          background: 'linear-gradient(135deg, #16a34a, #22c55e)',
          color: '#fff', fontSize: 10, fontWeight: 800,
          padding: '3px 8px', borderRadius: 999,
          boxShadow: '0 2px 6px rgba(22,163,74,0.35)',
        }}>
          {result.promo_label}
        </div>
      )}

      {/* Imagen */}
      <div style={{
        height: 120, background: '#f0f7ff',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 10, borderBottom: '1px solid #e0f2fe',
      }}>
        {result.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={result.image} alt={result.name}
            style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
          />
        ) : (
          <span style={{ fontSize: 32, opacity: 0.2 }}>🛒</span>
        )}
      </div>

      {/* Info */}
      <div style={{ padding: '10px 12px 12px', flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
        <p style={{
          fontSize: 12, fontWeight: 600, lineHeight: 1.3, color: '#0c1a2e',
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
          overflow: 'hidden', minHeight: 32,
        }}>{result.name}</p>

        <span style={{
          display: 'inline-flex', alignItems: 'center',
          fontSize: 9, fontWeight: 700,
          padding: '2px 7px', borderRadius: 999,
          background: cfg.color, color: cfg.textColor,
          alignSelf: 'flex-start',
        }}>{cfg.displayName}</span>

        <div style={{ marginTop: 'auto' }}>
          {result.original_price && (
            <p style={{ fontSize: 10, color: '#94a3b8', textDecoration: 'line-through' }}>
              {fmt(result.original_price)}
            </p>
          )}
          <p style={{
            fontSize: 18, fontWeight: 800, lineHeight: 1.1,
            color: '#0284c7',
          }}>{fmt(result.price)}</p>
        </div>
      </div>
    </a>
  )
}
