import type { Metadata } from 'next'
import Link from 'next/link'
import './globals.css'

export const metadata: Metadata = {
  title: 'Codito — Comparador de Precios Argentina',
  description: 'Compará precios de supermercados y Mercado Libre en un solo lugar',
  icons: {
    icon: '/favicon.png',
    shortcut: '/favicon.png',
    apple: '/favicon.png',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body style={{ minHeight: '100vh' }}>
        <header style={{
          background: '#ffffff',
          borderBottom: '1px solid var(--border)',
          boxShadow: '0 1px 0 #e2e8f0',
          position: 'sticky',
          top: 0,
          zIndex: 50,
        }}>
          <div style={{
            maxWidth: 960,
            margin: '0 auto',
            padding: '8px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            {/* Logo */}
            <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 0 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/logo.png"
                alt="Codito"
                style={{ height: 54, width: 'auto', objectFit: 'contain' }}
              />
            </Link>

            {/* Link a ofertas en el header */}
            <Link href="/ofertas" style={{
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              background: 'linear-gradient(135deg, #f97316, #ef4444)',
              color: '#fff',
              fontWeight: 700,
              fontSize: 13,
              padding: '7px 16px',
              borderRadius: 10,
              boxShadow: '0 3px 10px rgba(239,68,68,0.30)',
              transition: 'opacity 0.15s',
            }}>
              🏷️ Ofertas del día
            </Link>
          </div>
        </header>

        <main style={{ maxWidth: 960, margin: '0 auto', padding: '24px 16px' }}>
          {children}
        </main>

        <footer style={{
          borderTop: '1px solid var(--border)',
          marginTop: 48,
          padding: '20px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 10,
        }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/favicon.png" alt="" style={{ height: 22, width: 'auto', opacity: 0.6 }} />
          <span style={{ fontSize: 12, color: 'var(--muted)' }}>
            Precios orientativos. Verificá siempre en el sitio oficial de cada tienda.
          </span>
        </footer>
      </body>
    </html>
  )
}
