import { NextResponse } from 'next/server'
import { searchVtex } from '@/lib/vtex'
import { searchMercadoLibre } from '@/lib/mercadolibre'
import { applyCrossSellerDiscounts, deduplicateToCheapest } from '@/lib/compare'
import { SearchResult } from '@/lib/types'

// 1 hora de cache
export const revalidate = 3600

type Category = {
  key: string
  label: string
  emoji: string
  query: string
  /** Palabras que NO pueden aparecer en el nombre del producto */
  exclude?: string[]
  /** Palabras que DEBEN aparecer (al menos una) — si se omite no aplica */
  require?: string[]
}

type Section = {
  key: string
  label: string
  emoji: string
  categories: Category[]
}

const SECTIONS: Section[] = [
  {
    key: 'supermercado',
    label: 'Supermercado',
    emoji: '🛒',
    categories: [
      { key: 'gaseosa',    label: 'Gaseosas',   emoji: '🥤', query: 'gaseosa cola 2.25',
        require: ['gaseosa', 'cola', 'pepsi', 'sprite', 'fanta', 'schweppes', 'seven', '7up', 'mirinda', 'paso de los toros'],
        exclude: ['chupetin', 'caramelo', 'gomita', 'jugo', 'copita', 'vaso', 'botella vacia'] },
      { key: 'agua',       label: 'Agua',       emoji: '💧', query: 'agua mineral',
        require: ['agua mineral', 'agua saborizada', 'agua manantial', 'agua de mesa', 'agua tonica', 'agua sin gas', 'agua con gas'],
        exclude: ['micelar', 'micellar', 'aguarras', 'oxigenada', 'destilada', 'lavandina',
                  'colonia', 'hidratante', 'rociador', 'desodorante', 'capilar', 'facial',
                  'corporal', 'perfume', 'esencia', 'manguera', 'filtro', 'bebe', 'aromatizador'] },
      { key: 'leche',      label: 'Lácteos',    emoji: '🥛', query: 'leche entera 1 litro',
        require: ['leche'],
        exclude: ['alfajor', 'chocolate', 'cereal', 'hidratante', 'corporal', 'demaquillante',
                  'limpiadora', 'nutritiva', 'facial', 'capilar', 'bronceadora', 'arroz'] },
      { key: 'yerba',      label: 'Yerba',      emoji: '🧉', query: 'yerba mate 1 kg',
        require: ['yerba'],
        exclude: ['bombilla', 'mate cocido', 'termo', 'set'] },
      { key: 'aceite',     label: 'Aceites',    emoji: '🫒', query: 'aceite girasol 1.5',
        require: ['aceite'],
        exclude: ['corporal', 'capilar', 'esencial', 'bebe', 'masaje', 'bronceador',
                  'perfume', 'facial', 'argan', 'coco', 'rosa mosqueta', 'auto', 'motor',
                  'lubricante', 'cocina freidora'] },
      { key: 'fideos',     label: 'Pastas',     emoji: '🍝', query: 'fideos spaghetti',
        require: ['fideo', 'spaghetti', 'tallarin', 'mostachol', 'tirabuzon', 'moño', 'pasta seca'],
        exclude: ['sopa', 'instantaneo', 'chinos', 'alfajor'] },
      { key: 'arroz',      label: 'Arroz',      emoji: '🍚', query: 'arroz blanco largo fino 1kg',
        require: ['arroz'],
        exclude: ['alfajor', 'galletita', 'torta', 'crema', 'harina', 'leche', 'tronquito',
                  'bebe', 'barrita', 'cereal', 'bebida', 'hamburguesa', 'chocolate'] },
      { key: 'cafe',       label: 'Café',       emoji: '☕', query: 'cafe molido 250',
        require: ['cafe', 'café'],
        exclude: ['cafetera', 'taza', 'filtro', 'capsula descartable', 'crema'] },
      { key: 'limpieza',   label: 'Limpieza',   emoji: '🧼', query: 'detergente ropa liquido',
        require: ['detergente', 'lavandina', 'limpiador', 'jabón en polvo', 'desengrasante'],
        exclude: ['facial', 'corporal', 'bebe', 'intimo', 'dental', 'shampoo'] },
      { key: 'higiene',    label: 'Higiene',    emoji: '🧴', query: 'papel higienico doble hoja',
        require: ['papel higien', 'papel higiénico', 'rollo'],
        exclude: ['cocina', 'tissue', 'servilleta'] },
    ],
  },
  {
    key: 'golosinas',
    label: 'Golosinas',
    emoji: '🍫',
    categories: [
      { key: 'chocolate',  label: 'Chocolates', emoji: '🍫', query: 'chocolate tableta',
        require: ['chocolate', 'cadbury', 'milka', 'águila', 'felfort', 'aero', 'cofler', 'shot'],
        exclude: ['leche chocolatada', 'batido', 'bebida', 'flan', 'polvo', 'crema'] },
      { key: 'alfajor',    label: 'Alfajores',  emoji: '🥮', query: 'alfajor',
        require: ['alfajor'],
        exclude: ['molde', 'receta'] },
      { key: 'caramelo',   label: 'Caramelos',  emoji: '🍬', query: 'caramelos surtidos',
        require: ['caramelo', 'pastilla', 'golosina'],
        exclude: ['colonia', 'jabón', 'vela', 'decoracion'] },
      { key: 'galletitas', label: 'Galletitas', emoji: '🍪', query: 'galletitas dulces',
        require: ['galletita', 'galleta', 'oreo', 'pepitos', 'sonrisas'],
        exclude: ['perro', 'gato', 'mascota'] },
      { key: 'chicle',     label: 'Chicles',    emoji: '🫧', query: 'chicle',
        require: ['chicle', 'beldent', 'topline', 'bazooka'] },
      { key: 'helado',     label: 'Helados',    emoji: '🍦', query: 'helado pote',
        require: ['helado', 'frigor', 'laponia', 'lucciano', 'pote helado'],
        exclude: ['maquina', 'heladera', 'vaso', 'copa', 'cubetera', 'molde'] },
    ],
  },
  {
    key: 'electro',
    label: 'Electrodomésticos',
    emoji: '📱',
    categories: [
      { key: 'tv',        label: 'Televisores',  emoji: '📺', query: 'smart tv 50 pulgadas',
        require: ['televisor', 'televisión', 'smart tv', 'smart-tv', 'tv led', 'tv oled', 'tv qled', 'tv uhd', 'tv 4k', 'tv samsung', 'tv lg', 'tv noblex', 'tv philco', 'tv ken brown', 'tv rca'],
        exclude: ['soporte', 'cable hdmi', 'antena', 'control remoto', 'rack', 'mueble', 'funda tv', 'mesa', 'decodificador'] },
      { key: 'celular',   label: 'Celulares',    emoji: '📱', query: 'celular samsung galaxy',
        require: ['celular', 'smartphone', 'galaxy', 'motorola', 'xiaomi', 'iphone', 'samsung a', 'moto g', 'moto e', 'redmi', 'huawei'],
        exclude: ['funda', 'vidrio', 'cargador', 'cable', 'protector', 'soporte', 'case', 'carcasa', 'holder', 'silicona', 'templado', 'adaptador'] },
      { key: 'notebook',  label: 'Notebooks',    emoji: '💻', query: 'notebook 14 pulgadas',
        require: ['notebook', 'laptop'],
        exclude: ['mochila', 'funda', 'soporte', 'base', 'cooler', 'mesa', 'bolso'] },
      { key: 'heladera',  label: 'Heladeras',    emoji: '🧊', query: 'heladera no frost',
        require: ['heladera', 'refrigerador'],
        exclude: ['mini', 'portatil', 'playera', 'conservadora', 'iman', 'minibar'] },
      { key: 'lavarropa', label: 'Lavarropas',   emoji: '🧺', query: 'lavarropas automatico carga frontal',
        require: ['lavarropa'],
        exclude: ['tapa', 'manguera', 'filtro', 'accesorio', 'funda'] },
      { key: 'aire',      label: 'Aires',        emoji: '❄️', query: 'aire acondicionado split frio calor',
        require: ['aire acondicionado', 'split', 'portatil'],
        exclude: ['ventilador', 'filtro', 'soporte', 'control', 'manguera'] },
      { key: 'auricular', label: 'Auriculares',  emoji: '🎧', query: 'auriculares bluetooth inalambricos',
        require: ['auricular', 'headphone', 'earbud', 'airpod'],
        exclude: ['cable auriculares', 'adaptador'] },
      { key: 'microondas', label: 'Microondas',  emoji: '🍲', query: 'microondas 20 litros',
        require: ['microondas'],
        exclude: ['tapa', 'recipiente', 'bolsa', 'fuente', 'olla para microondas'] },
      { key: 'smartwatch', label: 'Smartwatch',  emoji: '⌚', query: 'smartwatch reloj inteligente',
        require: ['smartwatch', 'reloj inteligente', 'watch', 'smartband'],
        exclude: ['malla', 'pulsera', 'correa', 'cargador', 'protector', 'funda'] },
    ],
  },
  {
    key: 'moda',
    label: 'Moda',
    emoji: '👕',
    categories: [
      { key: 'zapatillas', label: 'Zapatillas', emoji: '👟', query: 'zapatillas deportivas hombre',
        require: ['zapatilla'],
        exclude: ['pantuflas', 'ojotas', 'limpiadora', 'cordon', 'plantilla', 'spray'] },
      { key: 'remera',     label: 'Remeras',    emoji: '👕', query: 'remera algodon hombre',
        require: ['remera', 't-shirt'],
        exclude: ['estampa', 'transfer', 'cartel'] },
      { key: 'pantalon',   label: 'Pantalones', emoji: '👖', query: 'pantalon jean hombre',
        require: ['pantalon', 'jean', 'jogger'],
        exclude: ['cinturon', 'hebilla'] },
      { key: 'campera',    label: 'Camperas',   emoji: '🧥', query: 'campera inflable hombre',
        require: ['campera'],
        exclude: ['perchero', 'cubre'] },
      { key: 'buzo',       label: 'Buzos',      emoji: '🧶', query: 'buzo capucha hombre',
        require: ['buzo', 'hoodie'],
        exclude: ['buzon', 'tinturado'] },
    ],
  },
  {
    key: 'hogar',
    label: 'Hogar',
    emoji: '🏠',
    categories: [
      { key: 'colchon',     label: 'Colchones',    emoji: '🛏️', query: 'colchon queen 160',
        require: ['colchon'],
        exclude: ['protector', 'funda', 'cubre', 'inflable bebe', 'yoga'] },
      { key: 'sommier',     label: 'Sommiers',     emoji: '🛌', query: 'sommier 2 plazas',
        require: ['sommier'] },
      { key: 'sillon',      label: 'Sillones',     emoji: '🛋️', query: 'sillon 2 cuerpos',
        require: ['sillon', 'sofa'],
        exclude: ['funda', 'cubre', 'protector', 'infantil'] },
      { key: 'herramienta', label: 'Herramientas', emoji: '🔧', query: 'taladro inalambrico',
        require: ['taladro', 'amoladora', 'sierra electrica', 'atornillador'],
        exclude: ['mecha', 'disco', 'repuesto', 'manual'] },
    ],
  },
]

function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

/**
 * Matchea un término contra un texto.
 * - Multi-palabra (ej: "coca cola"): substring directo
 * - Una sola palabra (ej: "cola"): match con word boundary para evitar
 *   falsos positivos como "cola" matcheando "escolar" o "chocolate"
 */
function matchesTerm(haystack: string, rawTerm: string): boolean {
  const term = normalize(rawTerm).trim()
  if (!term) return false

  // Multi-palabra: substring directo
  if (term.includes(' ') || term.includes('-')) {
    return haystack.includes(term)
  }

  // Una palabra: word boundary
  const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const re = new RegExp(`\\b${escaped}\\b`, 'i')
  return re.test(haystack)
}

function passesFilter(name: string, category: Category): boolean {
  const n = normalize(name)

  // Exclude: se mantiene agresivo (substring) para filtrar accesorios/variantes
  if (category.exclude && category.exclude.some(term => n.includes(normalize(term)))) {
    return false
  }

  // Require: usa word boundary para palabras sueltas, substring para frases
  if (category.require && category.require.length > 0) {
    const hasRequired = category.require.some(term => matchesTerm(n, term))
    if (!hasRequired) return false
  }

  return true
}

async function searchCategory(category: Category): Promise<SearchResult[]> {
  const [vtexRes, mlRes] = await Promise.allSettled([
    searchVtex(category.query),
    searchMercadoLibre(category.query, 18),
  ])

  const vtex = vtexRes.status === 'fulfilled' ? vtexRes.value : []
  const ml   = mlRes.status   === 'fulfilled' ? mlRes.value   : []

  // Deduplicar por URL
  const seen = new Set<string>()
  const combined: SearchResult[] = []
  for (const r of [...vtex, ...ml]) {
    if (!r.url || seen.has(r.url)) continue
    seen.add(r.url)
    combined.push(r)
  }

  // Filtrar con require/exclude y precio > 0
  const filtered = combined.filter(r => r.price > 0 && passesFilter(r.name, category))

  // Calcular descuentos reales comparando entre sellers del mismo producto
  const withRealDiscounts = applyCrossSellerDiscounts(filtered)

  // Deduplicar: si el mismo producto aparece en varias tiendas, dejar solo
  // el más barato (para que la vista no se llene de repetidos)
  const deduplicated = deduplicateToCheapest(withRealDiscounts)

  // Ordenar cada fuente por su mejor propuesta (descuento absoluto → precio)
  const sortFn = (a: SearchResult, b: SearchResult) => {
    const savingsA = a.original_price && a.original_price > a.price ? a.original_price - a.price : 0
    const savingsB = b.original_price && b.original_price > b.price ? b.original_price - b.price : 0
    if (savingsA !== savingsB) return savingsB - savingsA
    return a.price - b.price
  }

  const vtexSorted = deduplicated.filter(r => r.source === 'vtex').sort(sortFn)
  const mlSorted = deduplicated.filter(r => r.source === 'mercadolibre').sort(sortFn)

  // Interleave 1:1 para garantizar presencia de Mercado Libre
  const result: SearchResult[] = []
  const maxLen = Math.max(vtexSorted.length, mlSorted.length)
  for (let i = 0; i < maxLen && result.length < 24; i++) {
    if (i < vtexSorted.length && result.length < 24) result.push(vtexSorted[i])
    if (i < mlSorted.length && result.length < 24) result.push(mlSorted[i])
  }

  return result
}

export async function GET() {
  try {
    const allQueries = SECTIONS.flatMap(s =>
      s.categories.map(c => ({ section: s.key, category: c }))
    )

    const results = await Promise.allSettled(
      allQueries.map(q => searchCategory(q.category))
    )

    const productsByKey = new Map<string, SearchResult[]>()
    allQueries.forEach((q, i) => {
      const key = `${q.section}/${q.category.key}`
      const value = results[i].status === 'fulfilled'
        ? (results[i] as PromiseFulfilledResult<SearchResult[]>).value
        : []
      productsByKey.set(key, value)
    })

    const sections = SECTIONS.map(s => ({
      key: s.key,
      label: s.label,
      emoji: s.emoji,
      categories: s.categories.map(c => ({
        key: c.key,
        label: c.label,
        emoji: c.emoji,
        query: c.query,
        products: productsByKey.get(`${s.key}/${c.key}`) ?? [],
      })),
    }))

    return NextResponse.json({
      sections,
      updated_at: new Date().toISOString(),
    })
  } catch {
    return NextResponse.json({ sections: [], updated_at: null }, { status: 500 })
  }
}
