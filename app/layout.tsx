import type { Metadata } from 'next'
import './globals.css'

const BASE_URL = 'https://codito.com.ar'

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: 'Codito — Comparador de Precios Argentina',
    template: '%s | Codito',
  },
  description: 'Compará precios de supermercados y Mercado Libre en tiempo real. Encontrá el precio más barato en Carrefour, Disco, Jumbo, Coto, Vea y más tiendas de Argentina.',
  keywords: ['comparador de precios argentina', 'precios supermercados', 'mercado libre precios', 'ofertas argentina', 'precio más barato', 'codito'],
  openGraph: {
    type: 'website',
    url: BASE_URL,
    title: 'Codito — Comparador de Precios Argentina',
    description: 'Compará precios de supermercados y Mercado Libre en tiempo real. Encontrá el precio más barato al instante.',
    siteName: 'Codito',
    locale: 'es_AR',
    images: [{
      url: '/og-image.png',
      width: 1200,
      height: 630,
      alt: 'Codito — Comparador de precios Argentina',
    }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Codito — Comparador de Precios Argentina',
    description: 'Compará precios de supermercados y Mercado Libre en tiempo real.',
    images: ['/og-image.png'],
  },
  alternates: {
    canonical: BASE_URL,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-snippet': -1 },
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
            padding: '10px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}>
            <LogoMark />
            <div>
              <div style={{ fontWeight: 800, fontSize: 20, color: '#0284c7', letterSpacing: '-0.5px' }}>
                codito
              </div>
              <div style={{ fontSize: 11, color: 'var(--muted)' }}>
                Comparador de precios · Argentina
              </div>
            </div>
          </div>
        </header>

        <main style={{ maxWidth: 960, margin: '0 auto', padding: '24px 16px' }}>
          {children}
        </main>

        <footer style={{ textAlign: 'center', padding: '24px 16px', fontSize: 12, color: 'var(--muted)' }}>
          Precios orientativos. Verificá siempre en el sitio oficial de cada tienda.
        </footer>
      </body>
    </html>
  )
}

function LogoMark() {
  return (
    <div style={{
      width: 44,
      height: 44,
      borderRadius: 12,
      background: 'linear-gradient(135deg, #0284c7 0%, #38bdf8 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
      boxShadow: '0 4px 12px rgba(14,165,233,0.35)',
      fontSize: 22,
    }}>
      🐭
    </div>
  )
}
