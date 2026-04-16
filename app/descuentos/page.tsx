import { createClient } from '@supabase/supabase-js'
import DescuentosClient, { BankPromo } from './DescuentosClient'

export const revalidate = 86400 // revalidar cada 24hs

// Fallback hardcodeado con datos verificados (abril 2026)
// Se usa si Supabase no está disponible o la tabla está vacía
// Datos verificados abril 2026
// Fuentes: iProfesional, El Observador, Radio Fueguina, El Destape, Sitios Argentina, Infozona
const FALLBACK_PROMOS: BankPromo[] = [
  { banco: 'Banco Nación',    icon: '🇦🇷', color: '#009cde', tarjeta: 'Visa / Mastercard',           descuento: 30, dias: ['Miércoles'],                    supers: ['ChangoMás','Carrefour','Vea','Coto','Disco'],  tope: '$12.000 por semana', nota: 'Requiere pagar con MODO + QR. Programa BNA+.' },
  { banco: 'MODO',            icon: '💳',  color: '#6c11e8', tarjeta: 'Múltiples bancos',             descuento: 20, dias: ['Siempre'],                      supers: ['Disco','Vea','La Anónima','DIA'],              tope: null,                 nota: 'Reintegro en cuenta. El tope varía según el banco emisor.' },
  { banco: 'Banco Patagonia', icon: '🏔️', color: '#2563eb', tarjeta: 'Cuentasueldo',                 descuento: 35, dias: ['Miércoles'],                    supers: ['Carrefour'],                                  tope: null,                 nota: 'Solo para clientes con plan sueldo singular.' },
  { banco: 'Banco Macro',     icon: '🟡',  color: '#f5b400', tarjeta: 'Visa / Mastercard',            descuento: 20, dias: ['Martes','Jueves'],              supers: ['Coto'],                                       tope: '$25.000 por mes',    nota: 'Pago con MODO. Mínimo de compra $60.000.' },
  { banco: 'Naranja X',       icon: '🍊',  color: '#ff6a00', tarjeta: 'Naranja Visa',                 descuento: 25, dias: ['Martes'],                       supers: ['ChangoMás'],                                  tope: '$15.000 por semana', nota: 'Plan Turbo. Plan Épico: 30%. La intensidad varía según el plan.' },
  { banco: 'BBVA',            icon: '🔵',  color: '#004481', tarjeta: 'Visa / Mastercard',            descuento: 30, dias: ['Viernes'],                      supers: ['Carrefour'],                                  tope: '$15.000 por mes',    nota: null },
  { banco: 'Cuenta DNI',      icon: '🏦',  color: '#0057a8', tarjeta: 'Cuenta DNI (Banco Provincia)', descuento: 30, dias: ['Lunes','Miércoles','Jueves'],    supers: ['Día','Carrefour','La Anónima','ChangoMás','Coto'], tope: '$15.000 por mes', nota: 'Lun 10% Día · Mié 10% Carrefour/La Anónima · Jue 20% ChangoMás · Jue 30% Coto (NFC).' },
  { banco: 'Mercado Pago',    icon: '💙',  color: '#009ee3', tarjeta: 'Tarjeta MP / QR',              descuento: 25, dias: ['Siempre'],                      supers: ['Carrefour','Coto','Día','Vea','ChangoMás'],    tope: null,                 nota: 'Sin tope en la mayoría de casos. Verificar descuento activo en la app.' },
]

async function getPromos(): Promise<{ promos: BankPromo[]; updatedAt: string | null }> {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!url || !key) throw new Error('Sin credenciales Supabase')

    const supabase = createClient(url, key)
    const { data, error } = await supabase
      .from('bank_promos')
      .select('*')
      .eq('activo', true)
      .order('descuento', { ascending: false })

    if (error || !data || data.length === 0) throw new Error('Sin datos en Supabase')

    return {
      promos: data as BankPromo[],
      updatedAt: data[0].updated_at ?? null,
    }
  } catch {
    // Fallback a datos hardcodeados
    return { promos: FALLBACK_PROMOS, updatedAt: null }
  }
}

export default async function DescuentosPage() {
  const { promos, updatedAt } = await getPromos()
  return <DescuentosClient promos={promos} updatedAt={updatedAt} />
}
