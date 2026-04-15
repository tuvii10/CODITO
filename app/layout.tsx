import type { Metadata } from 'next'
import Link from 'next/link'
import './globals.css'

export const metadata: Metadata = {
  metadataBase: new URL('https://codito-rho.vercel.app'),
  title: {
    default: 'Codito — El precio más bajo de Argentina',
    template: '%s · Codito',
  },
  description: 'Buscá cualquier producto y te mostramos dónde está más barato. Comparamos supermercados, electro y moda al instante.',
  keywords: ['comparador de precios', 'Argentina', 'supermercados', 'ofertas', 'precio más bajo'],
  authors: [{ name: 'Codito' }],
  icons: {
    icon: '/favicon.png',
    shortcut: '/favicon.png',
    apple: '/favicon.png',
  },
  openGraph: {
    type: 'website',
    locale: 'es_AR',
    url: 'https://codito-rho.vercel.app',
    siteName: 'Codito',
    title: 'Codito — El precio más bajo de Argentina',
    description: 'Buscá cualquier producto y te mostramos dónde está más barato. Sin vueltas, sin perder guita.',
    images: [
      {
        url: '/logo.png',
        width: 500,
        height: 500,
        alt: 'Codito',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Codito — El precio más bajo de Argentina',
    description: 'Buscá cualquier producto y te mostramos dónde está más barato.',
    images: ['/logo.png'],
  },
  robots: {
    index: true,
    follow: true,
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
            padding: '8px 14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 10,
          }}>
            {/* Logo */}
            <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', flexShrink: 0 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/logo.png"
                alt="Codito"
                style={{
                  height: 'clamp(44px, 11vw, 58px)',
                  width: 'auto',
                  objectFit: 'contain',
                }}
              />
            </Link>

            {/* Botón Ofertas en header */}
            <Link href="/ofertas" className="ofertas-header-btn" style={{
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              background: 'linear-gradient(135deg, #f97316, #ef4444)',
              color: '#fff',
              fontWeight: 800,
              fontSize: 13,
              padding: '9px 15px',
              borderRadius: 12,
              boxShadow: '0 4px 14px rgba(239,68,68,0.30)',
              whiteSpace: 'nowrap',
              flexShrink: 0,
            }}>
              <span style={{ fontSize: 15 }}>🏷️</span>
              <span className="ofertas-header-text-long">Ofertas del día</span>
              <span className="ofertas-header-text-short">Ofertas</span>
            </Link>
          </div>
        </header>

        {/* Contenido */}
        <main style={{
          maxWidth: 960,
          margin: '0 auto',
          padding: 'clamp(18px, 5vw, 32px) clamp(12px, 4vw, 24px) 60px',
        }}>
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
