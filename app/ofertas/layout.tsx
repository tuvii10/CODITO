import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Ofertas del Día Argentina — Los precios más bajos en 60+ tiendas',
  description: 'Las mejores ofertas de hoy en supermercados y tiendas argentinas. Precios verificados y comparados en Carrefour, Coto, Jumbo, Disco, Vea y más.',
  keywords: ['ofertas hoy argentina', 'ofertas supermercado', 'descuentos supermercado hoy', 'ofertas carrefour', 'ofertas coto', 'ofertas jumbo', 'precios mas bajos'],
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
