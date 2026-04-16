import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Dividir Gastos entre Amigos — Calculadora gratis | Dividito',
  description: 'Dividí los gastos entre amigos fácil. Agregá gastos, elegí quién pagó y te decimos quién le debe a quién. Compartí por WhatsApp.',
  keywords: ['dividir gastos', 'dividir cuenta amigos', 'splitwise argentina', 'calculadora gastos compartidos', 'dividir gastos whatsapp'],
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
