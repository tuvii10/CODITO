/**
 * IMPORTADOR DE DATOS SEPA
 * ========================
 * Lee las carpetas SEPA/ y carga los precios en Supabase.
 * Deduplica por EAN+bandera (usa precio mínimo entre sucursales).
 *
 * Uso:
 *   npm run import-sepa
 */

import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'
import * as readline from 'readline'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

// ── Supabase ─────────────────────────────────────────────────────────────────
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// ── Nombres normalizados de banderas ─────────────────────────────────────────
const BANDERA_MAP: Record<string, string> = {
  'COTO CICSA':           'Coto',
  'SuperChangomas':       'Chango Más',
  'Supermercados DIA':    'Día',
  'Vea':                  'Vea',
  'La Anonima':           'La Anónima',
  'Market':               'Market',
  'Cooperativa Obrera Limitada de Consumo y Vivienda': 'Cooperativa Obrera',
}

const SEPA_DIR = path.join(process.cwd(), 'SEPA')
const TODAY    = new Date().toISOString().split('T')[0]
const BATCH_SIZE = 200

// ── Leer CSV con pipe como delimitador ───────────────────────────────────────
async function readPipeCsv(filePath: string): Promise<Record<string, string>[]> {
  const rows: Record<string, string>[] = []
  const rl = readline.createInterface({
    input: fs.createReadStream(filePath, { encoding: 'latin1' }),
    crlfDelay: Infinity,
  })

  let headers: string[] = []
  let isFirst = true

  for await (const line of rl) {
    if (!line.trim()) continue
    const cols = line.split('|')
    if (isFirst) {
      headers = cols
      isFirst = false
      continue
    }
    const row: Record<string, string> = {}
    headers.forEach((h, i) => { row[h.trim()] = (cols[i] || '').trim() })
    rows.push(row)
  }

  return rows
}

// ── Obtener o crear store ────────────────────────────────────────────────────
const storeCache = new Map<string, string>()

async function getStoreId(name: string): Promise<string> {
  if (storeCache.has(name)) return storeCache.get(name)!

  const { data } = await supabase.from('stores').select('id').eq('name', name).single()
  if (data?.id) { storeCache.set(name, data.id); return data.id }

  const { data: created } = await supabase
    .from('stores').insert({ name }).select('id').single()
  storeCache.set(name, created!.id)
  return created!.id
}

// ── Insertar productos en batch ──────────────────────────────────────────────
async function upsertProducts(entries: ProductEntry[]) {
  const products = entries.map(e => ({
    ean:   e.ean || null,
    name:  e.name,
    brand: e.brand || null,
  }))

  // 1. Insertar productos (ignorar si ya existen)
  await supabase
    .from('products')
    .upsert(products, { onConflict: 'ean,name', ignoreDuplicates: true })

  // 2. Recuperar IDs de los productos que acabamos de insertar/que ya existían
  const names = entries.map(e => e.name)
  const { data: fetched } = await supabase
    .from('products')
    .select('id, ean, name')
    .in('name', names)

  if (!fetched || fetched.length === 0) return 0

  // Construir mapa name → id (y ean → id para los que tienen EAN)
  const productMap = new Map<string, string>()
  for (const p of fetched) {
    productMap.set(p.name, p.id)
    if (p.ean) productMap.set(`ean:${p.ean}`, p.id)
  }

  // 3. Upsert prices
  const prices = []
  for (const e of entries) {
    const productId = e.ean
      ? (productMap.get(`ean:${e.ean}`) ?? productMap.get(e.name))
      : productMap.get(e.name)
    if (!productId) continue

    prices.push({
      product_id:     productId,
      store_id:       e.storeId,
      price:          e.price,
      price_per_unit: e.pricePerUnit,
      unit:           e.unit || null,
      in_stock:       true,
      date:           TODAY,
    })
  }

  if (prices.length === 0) return 0

  const { error: priceError } = await supabase
    .from('prices')
    .upsert(prices, { onConflict: 'product_id,store_id,date' })

  return priceError ? 0 : prices.length
}

// ── Procesar una carpeta SEPA ─────────────────────────────────────────────────
type ProductEntry = {
  ean: string | null
  name: string
  brand: string | null
  price: number
  pricePerUnit: number | null
  unit: string | null
  storeId: string
}

async function processFolder(folderPath: string): Promise<number> {
  const comercioFile = path.join(folderPath, 'comercio.csv')
  const productosFile = path.join(folderPath, 'productos.csv')

  if (!fs.existsSync(comercioFile) || !fs.existsSync(productosFile)) return 0

  // Obtener nombre de la bandera
  const comercio = await readPipeCsv(comercioFile)
  const bandName  = comercio[0]?.comercio_bandera_nombre?.trim() || 'Desconocida'
  const storeName = BANDERA_MAP[bandName] || bandName
  const storeId   = await getStoreId(storeName)

  // Leer productos y deduplicar por EAN (precio mínimo por producto)
  const minPrices = new Map<string, { row: Record<string,string>, price: number }>()

  const rl = readline.createInterface({
    input: fs.createReadStream(productosFile, { encoding: 'latin1' }),
    crlfDelay: Infinity,
  })

  let headers: string[] = []
  let isFirst = true

  for await (const line of rl) {
    if (!line.trim()) continue
    const cols = line.split('|')

    if (isFirst) {
      headers = cols.map(h => h.trim())
      isFirst = false
      continue
    }

    const row: Record<string, string> = {}
    headers.forEach((h, i) => { row[h] = (cols[i] || '').trim() })

    const priceStr = row.productos_precio_lista || row.productos_precio_referencia || ''
    const price    = parseFloat(priceStr.replace(',', '.'))
    if (isNaN(price) || price <= 0) continue

    const desc = row.productos_descripcion?.trim()
    if (!desc) continue

    // id_producto contiene el EAN-13; productos_ean es un flag booleano (0/1)
    const ean = row.id_producto?.trim() || null
    const key = ean ? `ean:${ean}` : `desc:${desc}`

    const existing = minPrices.get(key)
    if (!existing || price < existing.price) {
      minPrices.set(key, { row, price })
    }
  }

  // Convertir a entries
  const entries: ProductEntry[] = []
  for (const { row, price } of minPrices.values()) {
    const qty  = parseFloat(row.productos_cantidad_presentacion || '0')
    const unit = row.productos_unidad_medida_presentacion?.toLowerCase() || null
    const pricePerUnit = qty > 0 ? parseFloat((price / qty).toFixed(4)) : null

    entries.push({
      ean:   row.id_producto?.trim() || null,
      name:  row.productos_descripcion.trim(),
      brand: row.productos_marca?.trim() || null,
      price,
      pricePerUnit,
      unit,
      storeId,
    })
  }

  // Importar en batches
  let imported = 0
  for (let i = 0; i < entries.length; i += BATCH_SIZE) {
    const batch = entries.slice(i, i + BATCH_SIZE)
    imported += await upsertProducts(batch)
  }

  return imported
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('❌ Faltan variables de entorno en .env.local')
    process.exit(1)
  }

  if (!fs.existsSync(SEPA_DIR)) {
    console.error(`❌ No encontré la carpeta SEPA en ${SEPA_DIR}`)
    process.exit(1)
  }

  const folders = fs.readdirSync(SEPA_DIR)
    .map(f => path.join(SEPA_DIR, f))
    .filter(f => fs.statSync(f).isDirectory())

  console.log(`📂 ${folders.length} carpetas encontradas en SEPA/`)
  console.log(`📅 Fecha de importación: ${TODAY}\n`)

  let totalImported = 0

  for (let i = 0; i < folders.length; i++) {
    const folder = folders[i]
    const name   = path.basename(folder)
    process.stdout.write(`[${i + 1}/${folders.length}] ${name} ... `)

    try {
      const count = await processFolder(folder)
      totalImported += count
      console.log(`✓ ${count} productos`)
    } catch (err) {
      console.log(`✗ Error: ${(err as Error).message}`)
    }
  }

  console.log(`\n✅ Importación completa: ${totalImported.toLocaleString()} precios cargados`)
  console.log(`   Podés buscar productos en http://localhost:3001`)
}

main().catch(err => {
  console.error('❌', err.message)
  process.exit(1)
})
