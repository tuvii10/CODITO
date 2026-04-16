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
      <body style={{ minHeight: '100vh', background: '#fafafa' }}>
        {/* Header minimal */}
        <header style={{
          background: 'rgba(255, 255, 255, 0.85)',
          backdropFilter: 'blur(14px) saturate(150%)',
          WebkitBackdropFilter: 'blur(14px) saturate(150%)',
          borderBottom: '1px solid #e4e4e7',
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
                src="/CODITOLOGO300.png"
                alt="Codito"
                style={{
                  height: 'clamp(44px, 11vw, 58px)',
                  width: 'auto',
                  objectFit: 'contain',
                }}
              />
            </Link>

            {/* Navegación */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
              <Link href="/suscripciones" style={{
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                background: '#f4f4f5',
                color: '#09090b',
                fontWeight: 700,
                fontSize: 13,
                padding: '9px 14px',
                borderRadius: 12,
                whiteSpace: 'nowrap',
                letterSpacing: '-0.01em',
                border: '1px solid #e4e4e7',
                transition: 'background 0.15s',
              }}>
                💸 <span className="ofertas-header-text-long">Suscripciones</span>
              </Link>

<Link href="/cuotas" style={{
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                background: '#f4f4f5',
                color: '#09090b',
                fontWeight: 700,
                fontSize: 13,
                padding: '9px 14px',
                borderRadius: 12,
                whiteSpace: 'nowrap',
                letterSpacing: '-0.01em',
                border: '1px solid #e4e4e7',
                transition: 'background 0.15s',
              }}>
                🧮 <span className="ofertas-header-text-long">¿Cuotas?</span>
              </Link>

              <Link href="/ofertas" className="ofertas-header-btn" style={{
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                background: 'linear-gradient(135deg, #f97316 0%, #ef4444 100%)',
                color: '#fff',
                fontWeight: 800,
                fontSize: 14,
                padding: '10px 18px',
                borderRadius: 12,
                whiteSpace: 'nowrap',
                letterSpacing: '-0.01em',
                boxShadow: '0 4px 14px rgba(249,115,22,0.45)',
                transition: 'transform 0.15s, box-shadow 0.15s',
              }}>
                🔥 <span className="ofertas-header-text-long">Ofertas</span><span className="ofertas-header-text-short">Ofertas</span>
              </Link>
            </div>
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

        {/* Footer minimal */}
        <footer style={{
          background: '#ffffff',
          borderTop: '1px solid #e4e4e7',
          padding: '16px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
        }}>
          <span style={{ fontSize: 11, color: '#71717a', fontWeight: 500 }}>
            Precios orientativos · Verificá siempre en la tienda
          </span>
        </footer>
      </body>
    </html>
  )
}
