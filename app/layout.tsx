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
      <head>
        <meta name="color-scheme" content="light" />
      </head>
      <body style={{
        minHeight: '100vh',
        backgroundImage: 'linear-gradient(180deg, #bfdbfe 0%, #93c5fd 100%)',
        backgroundAttachment: 'fixed',
      }}>
        {/* Header */}
        <header style={{
          background: '#ffffff',
          borderBottom: '2px solid transparent',
          borderImage: 'linear-gradient(90deg, #0284c7, #38bdf8, #fbbf24, #f59e0b) 1',
          boxShadow: '0 2px 14px rgba(2,132,199,0.10)',
          position: 'sticky',
          top: 0,
          zIndex: 50,
        }}>
          <div style={{
            maxWidth: 960,
            margin: '0 auto',
            padding: '10px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            {/* Logo */}
            <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.png" alt="Codito" style={{ height: 52, width: 'auto', objectFit: 'contain' }} />
            </Link>

            {/* Botón Ofertas en header */}
            <Link href="/ofertas" style={{
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              background: 'linear-gradient(135deg, #f97316, #ef4444)',
              color: '#fff',
              fontWeight: 700,
              fontSize: 14,
              padding: '8px 18px',
              borderRadius: 12,
              boxShadow: '0 4px 14px rgba(239,68,68,0.30)',
            }}>
              🏷️ Ofertas del día
            </Link>
          </div>
        </header>

        {/* Contenido */}
        <main style={{ maxWidth: 960, margin: '0 auto', padding: '28px 20px 60px' }}>
          {children}
        </main>

        {/* Footer */}
        <footer style={{
          background: '#ffffff',
          borderTop: '2px solid #bfdbfe',
          padding: '18px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 10,
        }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/favicon.png" alt="" style={{ height: 20, width: 'auto', opacity: 0.7 }} />
          <span style={{ fontSize: 12, color: '#4d7fa8' }}>
            Precios orientativos. Verificá siempre en el sitio oficial de cada tienda.
          </span>
        </footer>
      </body>
    </html>
  )
}
