'use client'

import { useState } from 'react'

type Props = {
  query: string
  cheapestPrice?: number
}

type State = 'idle' | 'open' | 'loading' | 'success' | 'error'

export default function PriceAlertBanner({ query, cheapestPrice }: Props) {
  const [state, setState] = useState<State>('idle')
  const [email, setEmail] = useState('')
  const [maxPrice, setMaxPrice] = useState(cheapestPrice ? String(Math.round(cheapestPrice * 0.9)) : '')
  const [errorMsg, setErrorMsg] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setState('loading')
    setErrorMsg('')
    try {
      const res = await fetch('/api/alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, query, max_price: maxPrice }),
      })
      const data = await res.json()
      if (!res.ok) {
        setErrorMsg(data.error || 'Error al guardar')
        setState('error')
      } else {
        setState('success')
      }
    } catch {
      setErrorMsg('Error de conexión')
      setState('error')
    }
  }

  if (state === 'success') {
    return (
      <div style={{
        marginTop: 32,
        background: '#f0fdf4',
        border: '1.5px solid #bbf7d0',
        borderRadius: 16,
        padding: '16px 20px',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
      }}>
        <span style={{ fontSize: 24 }}>✅</span>
        <div>
          <p style={{ fontWeight: 700, color: '#15803d', fontSize: 14 }}>¡Alerta creada!</p>
          <p style={{ fontSize: 12, color: '#16a34a', marginTop: 2 }}>
            Te avisamos a <strong>{email}</strong> cuando &quot;{query}&quot; baje de {fmt(parseFloat(maxPrice))}.
          </p>
        </div>
      </div>
    )
  }

  if (state === 'idle') {
    return (
      <div style={{ marginTop: 32, textAlign: 'center' }}>
        <button
          onClick={() => setState('open')}
          style={{
            background: 'none',
            border: '1.5px dashed var(--border)',
            borderRadius: 14,
            padding: '12px 20px',
            cursor: 'pointer',
            color: 'var(--muted)',
            fontSize: 13,
            width: '100%',
            transition: 'all 0.2s',
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--accent)'
            ;(e.currentTarget as HTMLButtonElement).style.color = 'var(--accent)'
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border)'
            ;(e.currentTarget as HTMLButtonElement).style.color = 'var(--muted)'
          }}
        >
          🔔 Avisarme cuando baje el precio de &quot;{query}&quot;
        </button>
      </div>
    )
  }

  return (
    <div style={{
      marginTop: 32,
      background: '#f8fafc',
      border: '1.5px solid var(--border)',
      borderRadius: 16,
      padding: '16px 20px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
        <span style={{ fontSize: 20 }}>🔔</span>
        <div>
          <p style={{ fontWeight: 700, fontSize: 14, color: 'var(--foreground)' }}>Alerta de precio</p>
          <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 1 }}>
            Te avisamos por email cuando &quot;{query}&quot; baje del precio que elijas.
          </p>
        </div>
        <button
          onClick={() => setState('idle')}
          style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', fontSize: 18, lineHeight: 1 }}
        >
          ×
        </button>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <input
            type="email"
            placeholder="tu@email.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            style={{
              flex: 2,
              minWidth: 160,
              border: '1px solid var(--border)',
              borderRadius: 10,
              padding: '9px 12px',
              fontSize: 13,
              outline: 'none',
              background: '#fff',
            }}
          />
          <div style={{ display: 'flex', alignItems: 'center', flex: 1, minWidth: 120, border: '1px solid var(--border)', borderRadius: 10, background: '#fff', overflow: 'hidden' }}>
            <span style={{ padding: '0 8px', color: 'var(--muted)', fontSize: 13, borderRight: '1px solid var(--border)', whiteSpace: 'nowrap' }}>$ máx</span>
            <input
              type="number"
              placeholder="0"
              value={maxPrice}
              onChange={e => setMaxPrice(e.target.value)}
              required
              min={1}
              style={{
                flex: 1,
                border: 'none',
                padding: '9px 10px',
                fontSize: 13,
                outline: 'none',
                background: 'transparent',
                width: '100%',
              }}
            />
          </div>
        </div>

        {cheapestPrice && (
          <p style={{ fontSize: 11, color: 'var(--muted)' }}>
            Precio actual más bajo: <strong>{fmt(cheapestPrice)}</strong>
            {' · '}
            <button type="button" onClick={() => setMaxPrice(String(Math.round(cheapestPrice * 0.9)))}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--accent)', fontSize: 11, textDecoration: 'underline' }}>
              Avisar si baja 10%
            </button>
          </p>
        )}

        {state === 'error' && (
          <p style={{ fontSize: 12, color: '#dc2626' }}>{errorMsg}</p>
        )}

        <button
          type="submit"
          disabled={state === 'loading'}
          style={{
            background: 'linear-gradient(135deg, #0284c7, #0ea5e9)',
            color: '#fff',
            border: 'none',
            borderRadius: 10,
            padding: '10px 20px',
            fontWeight: 700,
            fontSize: 14,
            cursor: state === 'loading' ? 'not-allowed' : 'pointer',
            opacity: state === 'loading' ? 0.7 : 1,
          }}
        >
          {state === 'loading' ? 'Guardando...' : 'Crear alerta'}
        </button>
      </form>
    </div>
  )
}

function fmt(n: number) {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency', currency: 'ARS', maximumFractionDigits: 0,
  }).format(n)
}
