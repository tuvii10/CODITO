import { createClient } from '@supabase/supabase-js'
import DescuentosClient, { BankPromo } from './DescuentosClient'

export const revalidate = 86400 // revalidar cada 24hs

// Fallback con datos verificados (abril 2026)
// Fuentes: El Observador, Radio Fueguina, iProfesional, Sitios Argentina, El Destape
const FALLBACK_PROMOS: BankPromo[] = [
  { banco: 'Banco Nación',    icon: '🇦🇷', color: '#009cde', tarjeta: 'Visa / Mastercard',              descuento: 30, dias: ['Miércoles'],                    supers: ['Carrefour','ChangoMás'],                              tope: '$12.000 por semana', nota: 'Requiere MODO BNA+ con QR. También 5% Lun-Vie en Día (tope $5.000/semana).' },
  { banco: 'Banco Patagonia', icon: '🏔️', color: '#2563eb', tarjeta: 'Visa / Mastercard',              descuento: 35, dias: ['Miércoles','Sábado'],            supers: ['Carrefour','Vea','Jumbo'],                            tope: '$25.000 por mes',    nota: 'Miércoles 35% en Carrefour (Platinum). Sábados 30% en Vea/Jumbo (tope $15.000/mes).' },
  { banco: 'Banco Macro',     icon: '🟡',  color: '#f5b400', tarjeta: 'Visa / Mastercard',              descuento: 20, dias: ['Martes','Jueves'],              supers: ['Coto','Vea','Jumbo','Disco','ChangoMás'],             tope: '$25.000 por mes',    nota: 'Martes: Coto, Vea, Jumbo, Disco. Jueves: Vea, Jumbo, Disco. Mínimo $60.000 en Coto.' },
  { banco: 'Naranja X',       icon: '🍊',  color: '#ff6a00', tarjeta: 'Naranja Visa',                   descuento: 25, dias: ['Martes'],                       supers: ['Coto','Carrefour','ChangoMás','Día'],                 tope: '$12.000 por semana', nota: 'Plan Turbo: 25% en Coto, Carrefour y Día. Plan Épico: 30% en ChangoMás (tope $15.000/semana).' },
  { banco: 'Santander',       icon: '🔴',  color: '#ec0000', tarjeta: 'Visa / Mastercard',              descuento: 20, dias: ['Martes'],                       supers: ['Coto'],                                              tope: '$25.000 por mes',    nota: 'Mínimo de compra $60.000. Pago con MODO QR o tarjeta.' },
  { banco: 'MODO',            icon: '💳',  color: '#6c11e8', tarjeta: 'Múltiples bancos',               descuento: 20, dias: ['Martes','Jueves'],              supers: ['Disco','Vea','La Anónima','Día'],                     tope: null,                 nota: 'El tope varía según banco emisor. Martes/Jueves mínimo $100.000 en Disco y Vea.' },
  { banco: 'Mercado Pago',    icon: '💙',  color: '#009ee3', tarjeta: 'Tarjeta MP / QR',                descuento: 15, dias: ['Viernes','Sábado','Domingo'],   supers: ['ChangoMás','Carrefour','Día'],                        tope: null,                 nota: 'Vie-Dom 15% en ChangoMás (QR). Lun/Vie 10% en Carrefour. Miércoles 10% en Día.' },
  { banco: 'Cuenta DNI',      icon: '🏦',  color: '#0057a8', tarjeta: 'Cuenta DNI (Banco Provincia)',   descuento: 20, dias: ['Lunes','Miércoles','Jueves'],    supers: ['Día','Carrefour','ChangoMás','La Anónima'],           tope: '$6.000 por semana',  nota: 'Lunes 10% en Día · Miércoles 10% en Carrefour · Jueves 20% en ChangoMás · La Anónima 10% semanal.' },
  { banco: 'Personal Pay',    icon: '🟢',  color: '#00a550', tarjeta: 'Visa Prepaga',                   descuento: 15, dias: ['Viernes','Sábado','Domingo'],   supers: ['ChangoMás'],                                         tope: null,                 nota: 'Viernes a domingo 15% en ChangoMás pagando con QR.' },
  { banco: 'ICBC',            icon: '🔷',  color: '#1a5fa8', tarjeta: 'Visa / Mastercard',              descuento: 30, dias: ['Jueves'],                       supers: ['ChangoMás','Coto'],                                  tope: '$15.000 por semana', nota: 'Cuenta sueldo. 30% en ChangoMás. 25% en Coto.' },
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
