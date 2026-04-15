import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
import { createClient } from '@supabase/supabase-js'

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function main() {
  const { count } = await sb.from('products').select('*', { count: 'exact', head: true })
  console.log('Total productos:', count)

  const { data, error } = await sb.from('products').select('id,name').ilike('name', '%yogur%').limit(3)
  console.log('Búsqueda yogur - error:', error?.message ?? 'ninguno')
  console.log('Búsqueda yogur - resultados:', JSON.stringify(data))

  const { data: first } = await sb.from('products').select('id,name,ean').limit(1)
  console.log('Primer producto:', JSON.stringify(first))
}

main()
