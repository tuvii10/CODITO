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
          <p style={{ fontSize: 13, fontWeight: 600 }}>Cargando productos destacados...</p>
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
      {/* Título */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
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
            Precios reales · actualizados cada hora
          </p>
        </div>
      </div>

      {/* Tabs de SECCIONES (nivel 1) */}
      <div style={{
        display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12,
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
                padding: '10px 18px',
                borderRadius: 14,
                fontSize: 13,
                fontWeight: 700,
                cursor: sectionCount === 0 ? 'not-allowed' : 'pointer',
                border: '2px solid',
                borderColor: isActive ? '#f59e0b' : '#bfdbfe',
                background: isActive
                  ? 'linear-gradient(135deg, #0284c7, #0369a1)'
                  : sectionCount === 0 ? '#f1f5f9' : '#ffffff',
                color: isActive ? '#fff' : sectionCount === 0 ? '#cbd5e1' : '#0c4a6e',
                boxShadow: isActive ? '0 4px 16px rgba(2,132,199,0.30)' : 'none',
                transition: 'all 0.2s',
                display: 'inline-flex', alignItems: 'center', gap: 8,
              }}
            >
              <span style={{ fontSize: 18 }}>{s.emoji}</span>
              {s.label}
            </button>
          )
        })}
      </div>

      {/* Subcategorías (nivel 2) */}
      <div style={{
        display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 18,
        paddingBottom: 14, borderBottom: '1.5px solid #bfdbfe',
      }}>
        {section.categories.map(c => {
          const isActive = c.key === category?.key
          return (
            <button
              key={c.key}
              onClick={() => setActiveCategory(c.key)}
              disabled={c.products.length === 0}
              style={{
                padding: '5px 13px',
                borderRadius: 999,
                fontSize: 11,
                fontWeight: 700,
                cursor: c.products.length === 0 ? 'not-allowed' : 'pointer',
                border: '1.5px solid #bfdbfe',
                background: isActive ? '#fef3c7' : c.products.length === 0 ? '#f1f5f9' : '#ffffff',
                color: isActive ? '#92400e' : c.products.length === 0 ? '#cbd5e1' : '#0369a1',
                borderColor: isActive ? '#f59e0b' : '#bfdbfe',
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
          No hay productos disponibles en esta categoría ahora mismo.
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
        height: 120, background: '#ffffff',
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
