import { NextResponse } from 'next/server'
import { searchVtex } from '@/lib/vtex'
import { fetchMLHighlightsByCategory } from '@/lib/mercadolibre'
import { applyCrossSellerDiscounts, deduplicateToCheapest } from '@/lib/compare'
import { SearchResult } from '@/lib/types'

// 15 minutos de cache — suficiente para performance pero no tanto como
// para quedarse atascado con productos faltantes cuando una tienda falla
export const revalidate = 900

type Category = {
  key: string
  label: string
  emoji: string
  query: string
  /** Categoría ML equivalente para traer best sellers vía highlights */
  ml_category_id?: string
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

// IDs de categoría de Mercado Libre (top-level)
// Referencia: https://api.mercadolibre.com/sites/MLA/categories
const ML_ALIMENTOS = 'MLA1403'
const ML_BEBIDAS = 'MLA178700'
const ML_BELLEZA = 'MLA1246'
const ML_ELECTRO = 'MLA5726'
const ML_ELECTRONICA = 'MLA1000'
const ML_CELULARES = 'MLA1051'
const ML_COMPUTACION = 'MLA1648'
const ML_ROPA = 'MLA1430'
const ML_DEPORTES = 'MLA1276'
const ML_HOGAR = 'MLA1574'
const ML_HERRAMIENTAS = 'MLA407134'

const SECTIONS: Section[] = [
  {
    key: 'supermercado',
    label: 'Supermercado',
    emoji: '🛒',
    categories: [
      { key: 'gaseosa',    label: 'Gaseosas',   emoji: '🥤', query: 'gaseosa cola 2.25',
        ml_category_id: ML_BEBIDAS,
        require: ['gaseosa', 'cola', 'pepsi', 'sprite', 'fanta', 'schweppes', 'seven', '7up', 'mirinda', 'paso de los toros'],
        exclude: ['chupetin', 'caramelo', 'gomita', 'jugo', 'copita', 'vaso', 'botella vacia'] },
      { key: 'agua',       label: 'Agua',       emoji: '💧', query: 'agua mineral',
        ml_category_id: ML_BEBIDAS,
        require: ['agua mineral', 'agua saborizada', 'agua manantial', 'agua de mesa', 'agua tonica', 'agua sin gas', 'agua con gas'],
        exclude: ['micelar', 'micellar', 'aguarras', 'oxigenada', 'destilada', 'lavandina',
                  'colonia', 'hidratante', 'rociador', 'desodorante', 'capilar', 'facial',
                  'corporal', 'perfume', 'esencia', 'manguera', 'filtro', 'bebe', 'aromatizador'] },
      { key: 'leche',      label: 'Lácteos',    emoji: '🥛', query: 'leche entera 1 litro',
        ml_category_id: ML_ALIMENTOS,
        require: ['leche'],
        exclude: ['alfajor', 'chocolate', 'cereal', 'hidratante', 'corporal', 'demaquillante',
                  'limpiadora', 'nutritiva', 'facial', 'capilar', 'bronceadora', 'arroz'] },
      { key: 'yerba',      label: 'Yerba',      emoji: '🧉', query: 'yerba mate 1 kg',
        ml_category_id: ML_BEBIDAS,
        require: ['yerba'],
        exclude: ['bombilla', 'mate cocido', 'termo', 'set'] },
      { key: 'aceite',     label: 'Aceites',    emoji: '🫒', query: 'aceite girasol 1.5',
        ml_category_id: ML_ALIMENTOS,
        require: ['aceite'],
        exclude: ['corporal', 'capilar', 'esencial', 'bebe', 'masaje', 'bronceador',
                  'perfume', 'facial', 'argan', 'coco', 'rosa mosqueta', 'auto', 'motor',
                  'lubricante', 'cocina freidora'] },
      { key: 'fideos',     label: 'Pastas',     emoji: '🍝', query: 'fideos spaghetti',
        ml_category_id: ML_ALIMENTOS,
        require: ['fideo', 'spaghetti', 'tallarin', 'mostachol', 'tirabuzon', 'moño', 'pasta seca'],
        exclude: ['sopa', 'instantaneo', 'chinos', 'alfajor'] },
      { key: 'arroz',      label: 'Arroz',      emoji: '🍚', query: 'arroz blanco largo fino 1kg',
        ml_category_id: ML_ALIMENTOS,
        require: ['arroz'],
        exclude: ['alfajor', 'galletita', 'torta', 'crema', 'harina', 'leche', 'tronquito',
                  'bebe', 'barrita', 'cereal', 'bebida', 'hamburguesa', 'chocolate'] },
      { key: 'cafe',       label: 'Café',       emoji: '☕', query: 'cafe molido 250',
        ml_category_id: ML_BEBIDAS,
        require: ['cafe', 'café'],
        exclude: ['cafetera', 'taza', 'filtro', 'capsula descartable', 'crema'] },
      { key: 'limpieza',   label: 'Limpieza',   emoji: '🧼', query: 'detergente ropa liquido',
        require: ['detergente', 'lavandina', 'limpiador', 'jabón en polvo', 'desengrasante'],
        exclude: ['facial', 'corporal', 'bebe', 'intimo', 'dental', 'shampoo'] },
      { key: 'higiene',    label: 'Higiene',    emoji: '🧴', query: 'papel higienico doble hoja',
        ml_category_id: ML_BELLEZA,
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
        ml_category_id: ML_ALIMENTOS,
        require: ['chocolate', 'cadbury', 'milka', 'águila', 'felfort', 'aero', 'cofler', 'shot'],
        exclude: ['leche chocolatada', 'batido', 'bebida', 'flan', 'polvo', 'crema'] },
      { key: 'alfajor',    label: 'Alfajores',  emoji: '🥮', query: 'alfajor',
        ml_category_id: ML_ALIMENTOS,
        require: ['alfajor'],
        exclude: ['molde', 'receta'] },
      { key: 'caramelo',   label: 'Caramelos',  emoji: '🍬', query: 'caramelos surtidos',
        ml_category_id: ML_ALIMENTOS,
        require: ['caramelo', 'pastilla', 'golosina'],
        exclude: ['colonia', 'jabón', 'vela', 'decoracion'] },
      { key: 'galletitas', label: 'Galletitas', emoji: '🍪', query: 'galletitas dulces',
        ml_category_id: ML_ALIMENTOS,
        require: ['galletita', 'galleta', 'oreo', 'pepitos', 'sonrisas'],
        exclude: ['perro', 'gato', 'mascota'] },
      { key: 'chicle',     label: 'Chicles',    emoji: '🫧', query: 'chicle',
        ml_category_id: ML_ALIMENTOS,
        require: ['chicle', 'beldent', 'topline', 'bazooka'] },
      { key: 'helado',     label: 'Helados',    emoji: '🍦', query: 'helado pote',
        ml_category_id: ML_ALIMENTOS,
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
        ml_category_id: ML_ELECTRONICA,
        require: ['televisor', 'televisión', 'smart tv', 'smart-tv', 'tv led', 'tv oled', 'tv qled', 'tv uhd', 'tv 4k', 'tv samsung', 'tv lg', 'tv noblex', 'tv philco', 'tv ken brown', 'tv rca'],
        exclude: ['soporte', 'cable hdmi', 'antena', 'control remoto', 'rack', 'mueble', 'funda tv', 'mesa', 'decodificador'] },
      { key: 'celular',   label: 'Celulares',    emoji: '📱', query: 'celular samsung galaxy',
        ml_category_id: ML_CELULARES,
        require: ['celular', 'smartphone', 'galaxy', 'motorola', 'xiaomi', 'iphone', 'samsung a', 'moto g', 'moto e', 'redmi', 'huawei'],
        exclude: ['funda', 'vidrio', 'cargador', 'cable', 'protector', 'soporte', 'case', 'carcasa', 'holder', 'silicona', 'templado', 'adaptador'] },
      { key: 'notebook',  label: 'Notebooks',    emoji: '💻', query: 'notebook 14 pulgadas',
        ml_category_id: ML_COMPUTACION,
        require: ['notebook', 'laptop'],
        exclude: ['mochila', 'funda', 'soporte', 'base', 'cooler', 'mesa', 'bolso'] },
      { key: 'heladera',  label: 'Heladeras',    emoji: '🧊', query: 'heladera no frost',
        ml_category_id: ML_ELECTRO,
        require: ['heladera', 'refrigerador'],
        exclude: ['mini', 'portatil', 'playera', 'conservadora', 'iman', 'minibar'] },
      { key: 'lavarropa', label: 'Lavarropas',   emoji: '🧺', query: 'lavarropas automatico carga frontal',
        ml_category_id: ML_ELECTRO,
        require: ['lavarropa'],
        exclude: ['tapa', 'manguera', 'filtro', 'accesorio', 'funda'] },
      { key: 'aire',      label: 'Aires',        emoji: '❄️', query: 'aire acondicionado split frio calor',
        ml_category_id: ML_ELECTRO,
        require: ['aire acondicionado', 'split', 'portatil'],
        exclude: ['ventilador', 'filtro', 'soporte', 'control', 'manguera'] },
      { key: 'auricular', label: 'Auriculares',  emoji: '🎧', query: 'auriculares bluetooth inalambricos',
        ml_category_id: ML_ELECTRONICA,
        require: ['auricular', 'headphone', 'earbud', 'airpod'],
        exclude: ['cable auriculares', 'adaptador'] },
      { key: 'microondas', label: 'Microondas',  emoji: '🍲', query: 'microondas 20 litros',
        ml_category_id: ML_ELECTRO,
        require: ['microondas'],
        exclude: ['tapa', 'recipiente', 'bolsa', 'fuente', 'olla para microondas'] },
      { key: 'smartwatch', label: 'Smartwatch',  emoji: '⌚', query: 'smartwatch reloj inteligente',
        ml_category_id: ML_ELECTRONICA,
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
        ml_category_id: ML_DEPORTES,
        require: ['zapatilla'],
        exclude: ['pantuflas', 'ojotas', 'limpiadora', 'cordon', 'plantilla', 'spray'] },
      { key: 'remera',     label: 'Remeras',    emoji: '👕', query: 'remera algodon hombre',
        ml_category_id: ML_ROPA,
        require: ['remera', 't-shirt'],
        exclude: ['estampa', 'transfer', 'cartel'] },
      { key: 'pantalon',   label: 'Pantalones', emoji: '👖', query: 'pantalon jean hombre',
        ml_category_id: ML_ROPA,
        require: ['pantalon', 'jean', 'jogger'],
        exclude: ['cinturon', 'hebilla'] },
      { key: 'campera',    label: 'Camperas',   emoji: '🧥', query: 'campera inflable hombre',
        ml_category_id: ML_ROPA,
        require: ['campera'],
        exclude: ['perchero', 'cubre'] },
      { key: 'buzo',       label: 'Buzos',      emoji: '🧶', query: 'buzo capucha hombre',
        ml_category_id: ML_ROPA,
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
        ml_category_id: ML_HOGAR,
        require: ['colchon'],
        exclude: ['protector', 'funda', 'cubre', 'inflable bebe', 'yoga'] },
      { key: 'sommier',     label: 'Sommiers',     emoji: '🛌', query: 'sommier 2 plazas',
        ml_category_id: ML_HOGAR,
        require: ['sommier'] },
      { key: 'sillon',      label: 'Sillones',     emoji: '🛋️', query: 'sillon 2 cuerpos',
        ml_category_id: ML_HOGAR,
        require: ['sillon', 'sofa'],
        exclude: ['funda', 'cubre', 'protector', 'infantil'] },
      { key: 'herramienta', label: 'Herramientas', emoji: '🔧', query: 'taladro inalambrico',
        ml_category_id: ML_HERRAMIENTAS,
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
 * - Una sola palabra (ej: "zapatilla"): prefix match de cualquier palabra
 *   del nombre. Así "zapatilla" matchea "zapatillas" (plural),
 *   "zapatillados", etc. pero no "zapatos" ni "escolar".
 */
function matchesTerm(haystack: string, rawTerm: string): boolean {
  const term = normalize(rawTerm).trim()
  if (!term) return false

  // Multi-palabra: substring directo
  if (term.includes(' ') || term.includes('-')) {
    return haystack.includes(term)
  }

  // Una palabra: prefix match sobre cada palabra del haystack
  // (así 'cola' matchea 'Coca Cola' pero no 'escolar' ni 'chocolate')
  const words = haystack.split(/\s+/).filter(Boolean)
  return words.some(w => w.startsWith(term))
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
    category.ml_category_id
      ? fetchMLHighlightsByCategory(category.ml_category_id, 12)
      : Promise.resolve([]),
  ])

  const vtex = vtexRes.status === 'fulfilled' ? vtexRes.value : []
  const ml   = mlRes.status   === 'fulfilled' ? mlRes.value   : []

  // Filtrar VTEX Y ML con require/exclude por nombre. ML highlights
  // vienen de una categoría TOP-LEVEL (ej: Alimentos), así que trae
  // de todo — hay que filtrar para quedarnos con lo que corresponde
  // a cada subcategoría.
  const vtexFiltered = vtex.filter(r => r.price > 0 && passesFilter(r.name, category))
  const mlFiltered = ml.filter(r => r.price > 0 && passesFilter(r.name, category))

  // Deduplicar por URL
  const seen = new Set<string>()
  const filtered: SearchResult[] = []
  for (const r of [...vtexFiltered, ...mlFiltered]) {
    if (!r.url || seen.has(r.url)) continue
    seen.add(r.url)
    filtered.push(r)
  }

  // Calcular descuentos reales comparando entre sellers del mismo producto
  const withRealDiscounts = applyCrossSellerDiscounts(filtered)

  // Deduplicar: si el mismo producto aparece en varias tiendas, dejar solo
  // el más barato (para que la vista no se llene de repetidos)
  const deduplicated = deduplicateToCheapest(withRealDiscounts)

  // Ordenar por precio de menor a mayor
  const sortByPrice = (a: SearchResult, b: SearchResult) => a.price - b.price

  // Garantizar representación de ambas fuentes: tomar los 12 más baratos
  // de cada una (VTEX y ML), juntar y ordenar el resultado final por precio.
  const vtexTop = deduplicated.filter(r => r.source === 'vtex').sort(sortByPrice).slice(0, 12)
  const mlTop = deduplicated.filter(r => r.source === 'mercadolibre').sort(sortByPrice).slice(0, 12)

  return [...vtexTop, ...mlTop].sort(sortByPrice).slice(0, 24)
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
