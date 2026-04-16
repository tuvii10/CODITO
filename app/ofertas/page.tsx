import Link from 'next/link'
import { fetchAllDeals, Deal } from '@/lib/deals'
import { getStoreConfig } from '@/lib/stores'

// Cache 12 horas — ofertas se regeneran 2 veces al día, suficiente para
// que no estemos golpeando las APIs de las tiendas constantemente.
export const revalidate = 43200
export const maxDuration = 60

function fmt(n: number) {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency', currency: 'ARS', maximumFractionDigits: 0,
  }).format(n)
}

function DealCard({ deal, rank }: { deal: Deal; rank: number }) {
  const cfg = getStoreConfig(deal.store_name)
  const saving = deal.original_price - deal.price

  return (
    <a
      href={deal.url ?? '#'}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        background: '#ffffff',
        border: '1px solid #e4e4e7',
        borderRadius: 16,
        padding: '12px 14px',
        textDecoration: 'none',
        color: 'inherit',
        boxShadow: '0 1px 2px rgba(0, 0, 0, 0.03)',
        transition: 'border-color 0.15s',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Ranking */}
      <div style={{
        flexShrink: 0,
        width: 28,
        height: 28,
        borderRadius: 8,
        background: rank <= 3 ? '#09090b' : '#fafafa',
        color: rank <= 3 ? '#fff' : '#71717a',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontWeight: 800,
        fontSize: 12,
      }}>
        {rank}
      </div>

      {/* Imagen */}
      <div style={{
        flexShrink: 0, width: 64, height: 64,
        borderRadius: 12,
        background: '#ffffff',
        border: '1px solid #f4f4f5',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        overflow: 'hidden',
      }}>
        {deal.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={deal.image} alt={deal.name}
            style={{ width: 56, height: 56, objectFit: 'contain' }}
          />
        ) : (
          <span style={{ fontSize: 24, opacity: 0.15 }}>🛒</span>
        )}
      </div>

      {/* Info central */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{
          fontSize: 13, fontWeight: 600, lineHeight: 1.3,
          color: '#09090b', marginBottom: 6,
          overflow: 'hidden', textOverflow: 'ellipsis',
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
          letterSpacing: '-0.01em',
        }}>{deal.name}</p>

        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 5 }}>
          <span style={{
            display: 'inline-block',
            fontSize: 10, fontWeight: 700,
            padding: '3px 9px', borderRadius: 999,
            background: cfg.color, color: cfg.textColor,
            letterSpacing: '-0.01em',
          }}>{cfg.displayName}</span>
        </div>
      </div>

      {/* Precios */}
      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <div style={{
          display: 'inline-block',
          background: '#09090b',
          color: '#fff', fontSize: 11, fontWeight: 800,
          padding: '3px 9px', borderRadius: 999, marginBottom: 6,
          letterSpacing: '-0.01em',
        }}>
          -{deal.discount_pct}%
        </div>
        <p className="mono-price" style={{
          fontSize: 20, fontWeight: 800,
          color: '#09090b',
          whiteSpace: 'nowrap', lineHeight: 1,
          letterSpacing: '-0.02em',
        }}>{fmt(deal.price)}</p>
        <p className="mono-price" style={{
          fontSize: 11, color: '#a1a1aa', textDecoration: 'line-through',
          whiteSpace: 'nowrap', marginTop: 2,
        }}>
          {fmt(deal.original_price)}
        </p>
        <p className="mono-price" style={{
          fontSize: 10, fontWeight: 800, marginTop: 4,
          color: '#16a34a',
          whiteSpace: 'nowrap',
        }}>
          −{fmt(saving)} vs mercado
        </p>
      </div>
    </a>
  )
}

export default async function OfertasPage() {
  let deals: Deal[] = []
  try {
    deals = await fetchAllDeals()
  } catch {
    deals = []
  }

  return (
    <div style={{ maxWidth: 680, margin: '0 auto' }}>
      {/* Volver */}
      <div style={{ marginBottom: 20 }}>
        <Link href="/" style={{ fontSize: 13, fontWeight: 700, color: '#09090b', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6, background: '#f4f4f5', border: '1px solid #e4e4e7', borderRadius: 10, padding: '7px 14px' }}>
          ← Inicio
        </Link>
      </div>

      {/* Encabezado minimal */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{
          fontSize: 'clamp(28px, 6vw, 40px)',
          fontWeight: 900,
          color: '#09090b',
          lineHeight: 1.1,
          letterSpacing: '-0.03em',
          marginBottom: 6,
        }}>
          Ofertas del día
        </h1>
        <p style={{ fontSize: 13, color: '#71717a', fontWeight: 500, lineHeight: 1.5 }}>
          {deals.length} productos con el precio más bajo comparado entre todas las tiendas.
        </p>
      </div>

      {/* Lista */}
      {deals.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: '80px 0',
          background: '#ffffff',
          borderRadius: 16,
          border: '1px solid #e4e4e7',
        }}>
          <p style={{ fontWeight: 700, color: '#09090b' }}>Sin ofertas ahora</p>
          <p style={{ fontSize: 13, marginTop: 6, color: '#71717a' }}>Volvé en un rato.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {deals.map((deal, i) => <DealCard key={deal.id} deal={deal} rank={i + 1} />)}
        </div>
      )}
    </div>
  )
}
