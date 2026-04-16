import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Plazo Fijo vs Dólar vs Inflación — ¿Qué conviene? | Platita',
  description: 'Compará rendimientos: plazo fijo, comprar dólares o dejarlo en el colchón. Calculadora con tasas actualizadas y cotización del dólar blue en vivo.',
  keywords: ['plazo fijo argentina', 'plazo fijo vs dolar', 'plazo fijo vs inflacion', 'donde invertir argentina', 'tasa plazo fijo hoy', 'rendimiento plazo fijo'],
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
