import Link from 'next/link'
import { fetchAllDeals, Deal } from '@/lib/deals'
import { getStoreConfig } from '@/lib/stores'

// Cache 6 horas — ofertas no cambian tan seguido pero queremos datos frescos
export const revalidate = 21600

function fmt(n: number) {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency', currency: 'ARS', maximumFractionDigits: 0,
  }).format(n)
}

function DealCard({ deal, rank }: { deal: Deal; rank: number }) {
  const cfg = getStoreConfig(deal.store_name)
  const saving = deal.original_price - deal.price
  const isTop = rank <= 3

  return (
    <a
      href={deal.url ?? '#'}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        background: 'rgba(255, 255, 255, 0.8)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        border: '1px solid #e0e7ff',
        borderRadius: 16,
        padding: '12px 14px',
        textDecoration: 'none',
        color: 'inherit',
        boxShadow: '0 1px 3px rgba(99, 102, 241, 0.06)',
        transition: 'transform 0.15s, box-shadow 0.15s, border-color 0.15s',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Ranking */}
      <div style={{
        flexShrink: 0,
        width: 30,
        height: 30,
        borderRadius: 8,
        background: isTop
          ? 'linear-gradient(135deg, #6366f1, #8b5cf6, #ec4899)'
          : '#f5f3ff',
        color: isTop ? '#fff' : '#64748b',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontWeight: 800,
        fontSize: 12,
        boxShadow: isTop ? '0 4px 12px -2px rgba(139, 92, 246, 0.40)' : 'none',
      }}>
        {rank}
      </div>

      {/* Imagen */}
      <div style={{
        flexShrink: 0, width: 64, height: 64,
        borderRadius: 12,
        background: '#ffffff',
        border: '1px solid #f5f3ff',
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
          color: '#0f172a', marginBottom: 6,
          overflow: 'hidden', textOverflow: 'ellipsis',
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
          letterSpacing: '-0.01em',
        }}>{deal.name}</p>

        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 5 }}>
          <span style={{
            fontSize: 10, fontWeight: 700,
            padding: '2px 7px', borderRadius: 999,
            background: cfg.color, color: cfg.textColor,
          }}>{cfg.displayName}</span>

          {deal.promo_label && !deal.promo_label.startsWith('-') && (
            <span style={{
              fontSize: 10, fontWeight: 700,
              padding: '2px 7px', borderRadius: 999,
              background: '#f5f3ff', color: '#6366f1',
              border: '1px solid #e0e7ff',
            }}>🏷 {deal.promo_label}</span>
          )}
        </div>
      </div>

      {/* Precios */}
      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <div style={{
          display: 'inline-block',
          background: 'linear-gradient(135deg, #ec4899, #8b5cf6)',
          color: '#fff', fontSize: 11, fontWeight: 800,
          padding: '3px 9px', borderRadius: 999, marginBottom: 6,
          letterSpacing: '-0.01em',
          boxShadow: '0 3px 10px -2px rgba(236, 72, 153, 0.40)',
        }}>
          -{deal.discount_pct}%
        </div>
        <p className="mono-price" style={{
          fontSize: 20, fontWeight: 800,
          color: '#0f172a',
          whiteSpace: 'nowrap', lineHeight: 1,
          letterSpacing: '-0.02em',
        }}>{fmt(deal.price)}</p>
        <p className="mono-price" style={{
          fontSize: 11, color: '#94a3b8', textDecoration: 'line-through',
          whiteSpace: 'nowrap', marginTop: 2,
        }}>
          {fmt(deal.original_price)}
        </p>
        <p className="mono-price" style={{
          fontSize: 11, fontWeight: 800, marginTop: 4,
          color: '#10b981',
          whiteSpace: 'nowrap',
        }}>
          Ahorrás {fmt(saving)}
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
      <Link href="/" style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        fontSize: 13, color: '#64748b', textDecoration: 'none',
        marginBottom: 20, fontWeight: 600,
      }}>
        ← Volver
      </Link>

      {/* Encabezado minimal */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{
          fontSize: 'clamp(28px, 6vw, 40px)',
          fontWeight: 900,
          color: '#0f172a',
          lineHeight: 1.1,
          letterSpacing: '-0.03em',
          marginBottom: 6,
        }}>
          Ofertas{' '}
          <span style={{
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6, #ec4899)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>
            del día
          </span>
        </h1>
        <p style={{ fontSize: 13, color: '#64748b', fontWeight: 500 }}>
          {deals.length} ofertas verificadas · Se renuevan cada día
        </p>
      </div>

      {/* Lista */}
      {deals.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: '80px 0',
          background: 'rgba(255, 255, 255, 0.7)',
          borderRadius: 16,
          border: '1px solid #e0e7ff',
        }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>⚡</div>
          <p style={{ fontWeight: 700, color: '#0f172a' }}>Sin ofertas ahora</p>
          <p style={{ fontSize: 13, marginTop: 6, color: '#64748b' }}>Volvé en un rato.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {deals.map((deal, i) => <DealCard key={deal.id} deal={deal} rank={i + 1} />)}
        </div>
      )}
    </div>
  )
}
