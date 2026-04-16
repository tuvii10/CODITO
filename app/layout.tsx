import type { Metadata } from 'next'
import Link from 'next/link'
import Script from 'next/script'
import './globals.css'

export const metadata: Metadata = {
  metadataBase: new URL('https://www.codito.com.ar'),
  title: {
    default: 'Codito — Comparador de Precios Argentina | El precio más bajo',
    template: '%s · Codito',
  },
  description: 'Compará precios en Argentina entre supermercados, electro y moda. Encontrá el producto más barato en Carrefour, Coto, Jumbo, Disco, Vea, MercadoLibre y 60+ tiendas.',
  keywords: [
    'comparador de precios', 'comparar precios argentina', 'precio mas barato',
    'ofertas supermercado', 'ofertas argentina', 'descuentos supermercado',
    'carrefour precios', 'coto precios', 'jumbo precios', 'disco precios',
    'dolar hoy', 'dolar blue hoy', 'cotizacion dolar',
    'inflacion argentina', 'calculadora inflacion',
    'plazo fijo argentina', 'plazo fijo vs dolar',
    'canasta basica argentina', 'precios supermercado argentina',
    'cuotas sin interes', 'dividir gastos amigos',
    'suscripciones argentina precio', 'netflix argentina precio',
    'comparador precios supermercados', 'donde es mas barato',
  ],
  authors: [{ name: 'Codito' }],
  icons: {
    icon: '/favicon.png',
    shortcut: '/favicon.png',
    apple: '/favicon.png',
  },
  openGraph: {
    type: 'website',
    locale: 'es_AR',
    url: 'https://www.codito.com.ar',
    siteName: 'Codito',
    title: 'Codito — Comparador de Precios Argentina',
    description: 'Compará precios entre supermercados, electro y moda. Encontrá el producto más barato en 60+ tiendas argentinas.',
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
        {/* Header minimal */}
        <header style={{
          background: '#fafafa',
          borderBottom: 'none',
          position: 'sticky',
          top: 0,
          zIndex: 50,
        }}>
          <div style={{
            maxWidth: 960,
            margin: '0 auto',
            padding: '8px clamp(12px, 4vw, 24px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            gap: 10,
            background: '#ffffff',
            boxShadow: '0 1px 8px rgba(0,0,0,0.06)',
            borderRadius: '0 0 16px 16px',
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
