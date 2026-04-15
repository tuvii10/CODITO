import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Comparador de Precios Argentina',
  description: 'Compará precios de supermercados y Mercado Libre en un solo lugar',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="min-h-screen" style={{ background: 'var(--background)', color: 'var(--foreground)' }}>
        <header style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }} className="px-4 py-3">
          <div className="max-w-5xl mx-auto flex items-center gap-3">
            <span className="text-2xl">🛒</span>
            <div>
              <h1 className="font-bold text-lg leading-tight">Comparador de Precios</h1>
              <p className="text-xs" style={{ color: 'var(--muted)' }}>Argentina · Supermercados + Mercado Libre</p>
            </div>
          </div>
        </header>
        <main className="max-w-5xl mx-auto px-4 py-8">
          {children}
        </main>
        <footer className="text-center py-6 text-xs" style={{ color: 'var(--muted)' }}>
          Precios orientativos. Verificá siempre en el sitio oficial de cada tienda.
        </footer>
      </body>
    </html>
  )
}
