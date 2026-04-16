import type { Metadata } from 'next'
import Link from 'next/link'
import Script from 'next/script'
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
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-G1T4Y4E5FP"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-G1T4Y4E5FP');
          `}
        </Script>
      </head>
      <body style={{ minHeight: '100vh', background: '#fafafa' }}>
        {/* Splash screen */}
        <div id="splash" style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          background: '#ffffff',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          transition: 'opacity 0.4s ease, visibility 0.4s ease',
        }}>
          <div style={{ position: 'relative', width: 90, height: 90, marginBottom: 20 }}>
            {/* Anillo giratorio */}
            <svg style={{
              position: 'absolute', inset: -10,
              width: 110, height: 110,
              animation: 'splashSpin 1.2s linear infinite',
            }} viewBox="0 0 110 110">
              <circle cx="55" cy="55" r="50" fill="none" stroke="#f4f4f5" strokeWidth="4" />
              <circle cx="55" cy="55" r="50" fill="none" stroke="#f59e0b" strokeWidth="4"
                strokeDasharray="80 240" strokeLinecap="round" />
            </svg>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/CODITOLOGO300.png"
              alt="Codito"
              style={{ width: 90, height: 90, objectFit: 'contain', position: 'relative', zIndex: 1 }}
            />
          </div>
          <p style={{
            fontSize: 13, fontWeight: 700, color: '#a1a1aa',
            letterSpacing: '0.1em', textTransform: 'uppercase',
          }}>Cargando</p>
          <div style={{
            display: 'flex', gap: 4, marginTop: 8,
          }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#f59e0b', animation: 'splashDot 1s ease-in-out infinite' }} />
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#f59e0b', animation: 'splashDot 1s ease-in-out 0.2s infinite' }} />
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#f59e0b', animation: 'splashDot 1s ease-in-out 0.4s infinite' }} />
          </div>
          <style>{`
            @keyframes splashSpin { to { transform: rotate(360deg) } }
            @keyframes splashDot { 0%,100% { opacity: 0.3; transform: scale(0.8) } 50% { opacity: 1; transform: scale(1.2) } }
          `}</style>
        </div>
        <script dangerouslySetInnerHTML={{ __html: `
          window.addEventListener('load', function() {
            var s = document.getElementById('splash');
            if (s) { s.style.opacity = '0'; s.style.visibility = 'hidden'; setTimeout(function() { s.remove() }, 500); }
          });
        `}} />

        {/* Header minimal */}
        <header style={{
          background: '#ffffff',
          borderBottom: 'none',
          position: 'sticky',
          top: 0,
          zIndex: 50,
          boxShadow: '0 1px 8px rgba(0,0,0,0.04)',
        }}>
          {/* Onda decorativa */}
          <svg style={{ position: 'absolute', bottom: -20, left: 0, width: '100%', height: 20, pointerEvents: 'none' }} viewBox="0 0 1440 20" preserveAspectRatio="none">
            <path d="M0,0 C360,20 1080,20 1440,0 L1440,0 L0,0 Z" fill="#ffffff" />
          </svg>
          <div style={{
            maxWidth: 960,
            margin: '0 auto',
            padding: '8px 14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            gap: 10,
          }}>
            {/* Logo */}
            <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', flexShrink: 0 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/CODITOLOGO300.png"
                alt="Codito"
                style={{
                  height: 'clamp(52px, 13vw, 72px)',
                  width: 'auto',
                  objectFit: 'contain',
                }}
              />
            </Link>

            {/* Navegación */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, position: 'absolute', right: 14 }}>
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
          padding: 'clamp(10px, 3vw, 16px) clamp(12px, 4vw, 24px) 60px',
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
