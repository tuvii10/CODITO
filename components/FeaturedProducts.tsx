'use client'

import { useEffect, useState } from 'react'
import { SearchResult } from '@/lib/types'
import { getStoreConfig } from '@/lib/stores'

type Category = {
  key: string
  label: string
  emoji: string
  query?: string
  products: SearchResult[]
}

type Section = {
  key: string
  label: string
  emoji: string
  categories: Category[]
}

function fmt(n: number) {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency', currency: 'ARS', maximumFractionDigits: 0,
  }).format(n)
}

export default function FeaturedProducts() {
  const [sections, setSections] = useState<Section[]>([])
  const [loading, setLoading] = useState(true)
  const [activeSection, setActiveSection] = useState<string>('supermercado')
  const [activeCategory, setActiveCategory] = useState<string>('gaseosa')

  useEffect(() => {
    fetch('/api/featured')
      .then(r => r.json())
      .then(d => {
        const secs: Section[] = d.sections || []
        setSections(secs)
        if (secs.length > 0) {
          const first = secs.find(s => s.categories.some(c => c.products.length > 0)) ?? secs[0]
          setActiveSection(first.key)
          const firstCat = first.categories.find(c => c.products.length > 0) ?? first.categories[0]
          if (firstCat) setActiveCategory(firstCat.key)
        }
      })
      .catch(() => setSections([]))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <section style={{ marginTop: 40 }}>
        <div style={{ textAlign: 'center', padding: '40px 0', color: '#4d7fa8' }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>⏳</div>
          <p style={{ fontSize: 13, fontWeight: 600 }}>Cargando...</p>
        </div>
      </section>
    )
  }

  const section = sections.find(s => s.key === activeSection) ?? sections[0]
  if (!section) return null

  // Cuando cambia la sección, resetear categoría si no existe en la nueva
  const catExists = section.categories.find(c => c.key === activeCategory)
  const category = catExists ?? section.categories.find(c => c.products.length > 0) ?? section.categories[0]

  const totalProducts = sections.reduce(
    (sum, s) => sum + s.categories.reduce((a, c) => a + c.products.length, 0),
    0
  )
  if (totalProducts === 0) return null

  return (
    <section style={{ marginTop: 40 }}>
      {/* Título futurista */}
      <div style={{ marginBottom: 18 }}>
        <h2 style={{
          fontSize: 22,
          fontWeight: 900,
          color: '#0f172a',
          lineHeight: 1.1,
          letterSpacing: '-0.02em',
        }}>
          Destacados
        </h2>
        <p style={{ fontSize: 12, color: '#64748b', marginTop: 4, fontWeight: 500 }}>
          Actualizados cada hora
        </p>
      </div>

      {/* Tabs de SECCIONES (nivel 1) */}
      <div style={{
        display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14,
      }}>
        {sections.map(s => {
          const isActive = s.key === activeSection
          const sectionCount = s.categories.reduce((a, c) => a + c.products.length, 0)
          return (
            <button
              key={s.key}
              onClick={() => {
                setActiveSection(s.key)
                const firstWithProducts = s.categories.find(c => c.products.length > 0) ?? s.categories[0]
                if (firstWithProducts) setActiveCategory(firstWithProducts.key)
              }}
              disabled={sectionCount === 0}
              style={{
                padding: '9px 16px',
                borderRadius: 11,
                fontSize: 13,
                fontWeight: 700,
                cursor: sectionCount === 0 ? 'not-allowed' : 'pointer',
                border: '1.5px solid',
                borderColor: isActive ? 'transparent' : '#e0e7ff',
                background: isActive
                  ? 'linear-gradient(135deg, #6366f1, #8b5cf6)'
                  : sectionCount === 0 ? '#f1f5f9' : 'rgba(255, 255, 255, 0.75)',
                backdropFilter: isActive ? undefined : 'blur(10px)',
                color: isActive ? '#fff' : sectionCount === 0 ? '#cbd5e1' : '#0f172a',
                boxShadow: isActive ? '0 6px 18px -4px rgba(99, 102, 241, 0.40)' : 'none',
                transition: 'all 0.2s',
                display: 'inline-flex', alignItems: 'center', gap: 7,
                letterSpacing: '-0.01em',
              }}
            >
              <span style={{ fontSize: 16 }}>{s.emoji}</span>
              {s.label}
            </button>
          )
        })}
      </div>

      {/* Subcategorías (nivel 2) */}
      <div style={{
        display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 18,
        paddingBottom: 14, borderBottom: '1px solid #e0e7ff',
      }}>
        {section.categories.map(c => {
          const isActive = c.key === category?.key
          return (
            <button
              key={c.key}
              onClick={() => setActiveCategory(c.key)}
              disabled={c.products.length === 0}
              style={{
                padding: '5px 12px',
                borderRadius: 999,
                fontSize: 11,
                fontWeight: 600,
                cursor: c.products.length === 0 ? 'not-allowed' : 'pointer',
                border: '1px solid',
                borderColor: isActive ? '#6366f1' : '#e0e7ff',
                background: isActive ? '#6366f1' : c.products.length === 0 ? '#f1f5f9' : 'transparent',
                color: isActive ? '#fff' : c.products.length === 0 ? '#cbd5e1' : '#64748b',
                transition: 'all 0.15s',
                display: 'inline-flex', alignItems: 'center', gap: 5,
              }}
            >
              <span>{c.emoji}</span>
              {c.label}
            </button>
          )
        })}
      </div>

      {/* Grid de productos */}
      {category && category.products.length > 0 ? (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 175px), 1fr))',
          gap: 12,
        }}>
          {category.products.map(p => <ProductCard key={p.id} result={p} />)}
        </div>
      ) : (
        <p style={{ textAlign: 'center', padding: 30, color: '#4d7fa8', fontSize: 13 }}>
          Sin productos en esta categoría.
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
        background: 'rgba(255, 255, 255, 0.8)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        border: '1px solid #e0e7ff',
        borderRadius: 16,
        overflow: 'hidden',
        textDecoration: 'none',
        color: 'inherit',
        boxShadow: '0 1px 3px rgba(99, 102, 241, 0.08)',
        transition: 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.2s, border-color 0.2s',
        position: 'relative',
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLAnchorElement).style.transform = 'translateY(-4px)'
        ;(e.currentTarget as HTMLAnchorElement).style.boxShadow = '0 14px 32px -10px rgba(99, 102, 241, 0.30)'
        ;(e.currentTarget as HTMLAnchorElement).style.borderColor = '#c7d2fe'
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLAnchorElement).style.transform = 'translateY(0)'
        ;(e.currentTarget as HTMLAnchorElement).style.boxShadow = '0 1px 3px rgba(99, 102, 241, 0.08)'
        ;(e.currentTarget as HTMLAnchorElement).style.borderColor = '#e0e7ff'
      }}
    >
      {/* Badge promo */}
      {result.promo_label && (
        <div style={{
          position: 'absolute', top: 8, left: 8, zIndex: 1,
          background: 'linear-gradient(135deg, #ec4899, #8b5cf6)',
          color: '#fff', fontSize: 10, fontWeight: 800,
          padding: '3px 9px', borderRadius: 999,
          boxShadow: '0 3px 10px -2px rgba(236, 72, 153, 0.40)',
          letterSpacing: '-0.01em',
        }}>
          {result.promo_label}
        </div>
      )}

      {/* Imagen */}
      <div style={{
        height: 130, background: '#ffffff',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 12, borderBottom: '1px solid #f5f3ff',
      }}>
        {result.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={result.image} alt={result.name}
            style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
          />
        ) : (
          <span style={{ fontSize: 32, opacity: 0.15 }}>🛒</span>
        )}
      </div>

      {/* Info */}
      <div style={{ padding: '12px 13px 14px', flex: 1, display: 'flex', flexDirection: 'column', gap: 7 }}>
        <p style={{
          fontSize: 12, fontWeight: 600, lineHeight: 1.3, color: '#0f172a',
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
          overflow: 'hidden', minHeight: 32,
          letterSpacing: '-0.01em',
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
            <p className="mono-price" style={{ fontSize: 10, color: '#94a3b8', textDecoration: 'line-through' }}>
              {fmt(result.original_price)}
            </p>
          )}
          <p className="mono-price" style={{
            fontSize: 19,
            fontWeight: 800,
            lineHeight: 1.1,
            color: '#0f172a',
            letterSpacing: '-0.02em',
          }}>{fmt(result.price)}</p>
        </div>
      </div>
    </a>
  )
}
