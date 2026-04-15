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
      <body style={{ minHeight: '100vh' }}>
        {/* Header con glass effect */}
        <header style={{
          background: 'rgba(255, 255, 255, 0.75)',
          backdropFilter: 'blur(18px) saturate(180%)',
          WebkitBackdropFilter: 'blur(18px) saturate(180%)',
          borderBottom: '1px solid rgba(199, 210, 254, 0.6)',
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

            {/* Botón Ofertas — futurista */}
            <Link href="/ofertas" className="ofertas-header-btn" style={{
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 7,
              background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #ec4899 100%)',
              color: '#fff',
              fontWeight: 700,
              fontSize: 13,
              padding: '9px 16px',
              borderRadius: 10,
              boxShadow: '0 4px 16px rgba(99, 102, 241, 0.35)',
              whiteSpace: 'nowrap',
              flexShrink: 0,
              letterSpacing: '-0.01em',
            }}>
              <span className="ofertas-header-text-long">Ofertas</span>
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

        {/* Footer minimal */}
        <footer style={{
          background: 'rgba(255, 255, 255, 0.6)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          borderTop: '1px solid rgba(199, 210, 254, 0.5)',
          padding: '14px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
        }}>
          <span style={{ fontSize: 11, color: '#64748b', fontWeight: 500 }}>
            Precios orientativos · Verificá siempre en la tienda
          </span>
        </footer>
      </body>
    </html>
  )
}
