import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Dólar Hoy Argentina — Cotización Blue, Oficial, MEP, Tarjeta | Dolarito',
  description: 'Cotización del dólar hoy en Argentina en tiempo real. Dólar Blue, Oficial, MEP, CCL, Tarjeta, Cripto y Mayorista. Conversor de pesos a dólares.',
  keywords: ['dolar hoy', 'dolar blue hoy', 'cotizacion dolar', 'dolar oficial', 'dolar mep', 'dolar tarjeta', 'dolar cripto', 'dolar argentina'],
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
