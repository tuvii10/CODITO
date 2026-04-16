import { createClient } from '@supabase/supabase-js'
import DescuentosClient, { BankPromo } from './DescuentosClient'

export const revalidate = 86400 // revalidar cada 24hs

// Fallback hardcodeado con datos verificados (abril 2026)
// Se usa si Supabase no está disponible o la tabla está vacía
const FALLBACK_PROMOS: BankPromo[] = [
  { banco: 'Banco Nación',    icon: '🇦🇷', color: '#009cde', tarjeta: 'Visa',                   descuento: 30, dias: ['Miércoles'],        supers: ['Changomás','Carrefour','Vea','Coto','Disco'], tope: '$12.000 por semana',  nota: 'Programa BNA+' },
  { banco: 'Santander',       icon: '🔴', color: '#ec0000', tarjeta: 'Visa / Mastercard',        descuento: 25, dias: ['Miércoles'],        supers: ['Carrefour','Disco','Vea','Jumbo'],            tope: '$20.000 por mes',    nota: null },
  { banco: 'Galicia',         icon: '🟠', color: '#e95b0c', tarjeta: 'Visa / Mastercard',        descuento: 25, dias: ['Martes','Jueves'],  supers: ['Jumbo'],                                     tope: null,                 nota: '30% con tarjeta Eminent' },
  { banco: 'BBVA',            icon: '🔵', color: '#004481', tarjeta: 'Visa / Mastercard',        descuento: 25, dias: ['Lunes'],            supers: ['Carrefour'],                                 tope: '$8.000 por semana',  nota: null },
  { banco: 'HSBC',            icon: '⬜', color: '#db0011', tarjeta: 'Visa / Mastercard',        descuento: 25, dias: ['Jueves'],           supers: ['Jumbo','Disco','Vea'],                       tope: '$15.000 por mes',    nota: 'Reintegro en cuenta' },
  { banco: 'MODO',            icon: '💳', color: '#6c11e8', tarjeta: 'Múltiples bancos',         descuento: 30, dias: ['Miércoles'],        supers: ['Disco','Vea','La Anónima','Día'],            tope: null,                 nota: '20% Viernes a Domingo' },
  { banco: 'Banco Macro',     icon: '🟡', color: '#f5b400', tarjeta: 'Visa / Mastercard',        descuento: 20, dias: ['Jueves'],           supers: ['Disco','Vea','Makro'],                       tope: null,                 nota: null },
  { banco: 'Banco Provincia', icon: '🏦', color: '#0057a8', tarjeta: 'Cuenta DNI / Mastercard',  descuento: 15, dias: ['Martes'],           supers: ['Carrefour','Changomás'],                     tope: null,                 nota: 'Solo provincia de Buenos Aires' },
  { banco: 'Naranja X',       icon: '🍊', color: '#ff6a00', tarjeta: 'Naranja Visa',             descuento: 20, dias: ['Viernes'],          supers: ['Carrefour','Día'],                           tope: null,                 nota: null },
  { banco: 'Uala',            icon: '💜', color: '#7b2d8b', tarjeta: 'Mastercard Prepaga',       descuento: 25, dias: ['Lunes'],            supers: ['Coto','Día'],                                                                    tope: null,                nota: null },
  { banco: 'Mercado Pago',    icon: '💙', color: '#009ee3', tarjeta: 'Tarjeta MP / QR',          descuento: 25, dias: ['Siempre'],          supers: ['Coto','Carrefour','Carrefour Maxi','Jumbo','Disco','Vea','Día','Changomás'],    tope: null,                nota: 'Verificar descuento activo en la app' },
  { banco: 'Personal Pay',    icon: '🟢', color: '#00a550', tarjeta: 'Visa Prepaga',             descuento: 25, dias: ['Jueves','Viernes'], supers: ['Diarco','Día','Changomás','Makro','Maxiconsumo'],                                tope: null,                nota: 'Requiere nivel 2 en la app' },
  { banco: 'Brubank',         icon: '🟣', color: '#6a0dad', tarjeta: 'Visa Débito',              descuento: 30, dias: ['Jueves'],           supers: ['Coto'],                                                                          tope: null,                nota: 'Pago con NFC contactless' },
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
