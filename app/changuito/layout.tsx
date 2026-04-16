import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Canasta Básica Argentina — Precios reales hoy | Changuito',
  description: 'Armá tu canasta básica con precios reales de supermercados argentinos. Compará y comprá al mejor precio leche, pan, yerba, carne y más.',
  keywords: ['canasta basica argentina', 'precios supermercado', 'canasta basica precio hoy', 'cuanto sale la canasta basica', 'precios alimentos argentina'],
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
