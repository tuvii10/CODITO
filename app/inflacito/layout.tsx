import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Calculadora de Inflación Argentina — ¿Cuánto perdiste? | Inflacito',
  description: 'Calculá cuánto perdió tu plata por la inflación en Argentina. Ingresá un monto y una fecha, te mostramos cuánto necesitás hoy para comprar lo mismo.',
  keywords: ['inflacion argentina', 'calculadora inflacion', 'ipc indec', 'poder adquisitivo', 'inflacion hoy argentina', 'cuanto perdio mi plata'],
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
