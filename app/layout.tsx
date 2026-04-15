import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Codito — Comparador de Precios Argentina',
  description: 'Compará precios de supermercados y Mercado Libre en un solo lugar',
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
