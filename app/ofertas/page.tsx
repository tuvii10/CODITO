import Link from 'next/link'
import { fetchAllDeals, Deal } from '@/lib/deals'
import { getStoreConfig } from '@/lib/stores'

// Se regenera cada 24 horas — las ofertas no se repiten dentro del día
export const revalidate = 86400

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
        gap: 14,
        background: '#ffffff',
        border: '1.5px solid var(--border)',
        borderRadius: 16,
        padding: '12px 16px',
        textDecoration: 'none',
        color: 'inherit',
        boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
        transition: 'transform 0.12s, box-shadow 0.12s',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Número de ranking */}
      <div style={{
        flexShrink: 0,
        width: 28,
        height: 28,
        borderRadius: 8,
        background: rank <= 3
          ? 'linear-gradient(135deg, #f97316, #ef4444)'
          : 'var(--border)',
        color: rank <= 3 ? '#fff' : 'var(--muted)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontWeight: 800, fontSize: 12,
      }}>
        {rank}
      </div>

      {/* Imagen */}
      <div style={{
        flexShrink: 0, width: 64, height: 64,
        borderRadius: 10,
        background: '#ffffff',
        border: '1px solid #bfdbfe',
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
          color: 'var(--foreground)', marginBottom: 5,
          overflow: 'hidden', textOverflow: 'ellipsis',
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
        }}>{deal.name}</p>

        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 5 }}>
          {/* Tienda */}
          <span style={{
            fontSize: 10, fontWeight: 700,
            padding: '2px 7px', borderRadius: 999,
            background: cfg.color, color: cfg.textColor,
          }}>{cfg.displayName}</span>

          {/* Promo label */}
          {deal.promo_label && (
            <span style={{
              fontSize: 10, fontWeight: 700,
              padding: '2px 7px', borderRadius: 999,
              background: '#fff7ed', color: '#c2410c',
              border: '1px solid #fed7aa',
            }}>🏷 {deal.promo_label}</span>
          )}

          {/* Verificado */}
          {deal.verified && (
            <span style={{
              fontSize: 10, fontWeight: 700,
              padding: '2px 7px', borderRadius: 999,
              background: '#dcfce7', color: '#16a34a',
            }}>✓ el más barato</span>
          )}
        </div>
      </div>

      {/* Precios */}
      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        {/* Badge % descuento */}
        <div style={{
          display: 'inline-block',
          background: 'linear-gradient(135deg, #f97316, #ef4444)',
          color: '#fff', fontSize: 11, fontWeight: 800,
          padding: '2px 9px', borderRadius: 999, marginBottom: 5,
        }}>
          -{deal.discount_pct}%
        </div>
        <p style={{
          fontSize: 22, fontWeight: 900,
          color: '#0284c7',
          whiteSpace: 'nowrap', lineHeight: 1,
        }}>{fmt(deal.price)}</p>
        <p style={{ fontSize: 11, color: '#94a3b8', textDecoration: 'line-through', whiteSpace: 'nowrap', marginTop: 2 }}>
          {fmt(deal.original_price)}
        </p>
        <p style={{
          fontSize: 13, fontWeight: 900, marginTop: 3,
          background: 'linear-gradient(135deg, #16a34a, #22c55e)',
          color: '#fff',
          padding: '3px 9px',
          borderRadius: 8,
          display: 'inline-block',
          whiteSpace: 'nowrap',
          boxShadow: '0 2px 8px rgba(22,163,74,0.30)',
        }}>
          💰 Ahorrás {fmt(saving)}
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

  const verifiedCount = deals.filter(d => d.verified).length
  const now = new Date().toLocaleDateString('es-AR', {
    day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit',
  })

  return (
    <div style={{ maxWidth: 680, margin: '0 auto', padding: '0 16px 48px' }}>
      {/* Volver */}
      <Link href="/" style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        fontSize: 13, color: 'var(--muted)', textDecoration: 'none',
        marginBottom: 24, fontWeight: 600,
      }}>
        ← Volver al buscador
      </Link>

      {/* Encabezado */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/favicon.png" alt="Codito" style={{ height: 48, width: 'auto', flexShrink: 0 }} />
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 800, color: 'var(--foreground)', lineHeight: 1.2 }}>
              Ofertas del día
            </h1>
            <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 3 }}>
              {deals.length} ofertas · {verifiedCount} verificadas como las más baratas · actualizadas el {now}
            </p>
          </div>
        </div>
        <p style={{ fontSize: 13, color: '#4d7fa8', lineHeight: 1.5 }}>
          Ordenadas por <strong style={{ color: '#16a34a' }}>cuánto ahorrás en pesos</strong>.
          Cada oferta fue verificada contra la competencia: solo aparecen descuentos reales.
          Se renuevan cada 24 hs.
        </p>
      </div>

      {/* Lista */}
      {deals.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--muted)' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>😕</div>
          <p style={{ fontWeight: 600 }}>No hay ofertas disponibles en este momento</p>
          <p style={{ fontSize: 13, marginTop: 6 }}>Volvé más tarde, se actualizan cada 24 hs.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {deals.map((deal, i) => (
            <DealCard key={deal.id} deal={deal} rank={i + 1} />
          ))}
        </div>
      )}
    </div>
  )
}
