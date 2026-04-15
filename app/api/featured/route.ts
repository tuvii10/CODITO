import { NextResponse } from 'next/server'
import { searchVtex } from '@/lib/vtex'
import { searchSuperPrecio } from '@/lib/superprecio'
import { fetchMLHighlightsByCategory } from '@/lib/mercadolibre'
import { applyCrossSellerDiscounts, deduplicateToCheapest } from '@/lib/compare'
import { SearchResult } from '@/lib/types'

// 12 horas de cache. El pipeline hace muchas requests a tiendas VTEX
// y la regeneración es costosa, así que cacheamos agresivamente.
// Next.js usa stale-while-revalidate, así que los usuarios siempre
// ven algo (incluso cuando la regeneración está corriendo en background).
export const revalidate = 43200

// Hasta 60 segundos para regenerar (requiere plan Pro de Vercel,
// en Hobby el máximo es 10s, ver vercel.json si corresponde)
export const maxDuration = 60

type Category = {
  key: string
  label: string
  emoji: string
  /** Query principal que se muestra al cliente */
  query: string
  /** Queries adicionales opcionales para engordar el pool */
  extraQueries?: string[]
  /** Categoría ML equivalente para traer best sellers vía highlights */
  ml_category_id?: string
  /** Si es true, además de VTEX también busca en SuperPrecio */
  useSuperPrecio?: boolean
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
      { key: 'gaseosa',    label: 'Gaseosas',   emoji: '🥤', query: 'coca cola',
        extraQueries: ['pepsi', 'sprite', 'fanta 2.25', 'schweppes'],
        ml_category_id: ML_BEBIDAS, useSuperPrecio: true,
        require: ['coca', 'cola', 'pepsi', 'sprite', 'fanta', 'schweppes', 'seven', '7up', 'mirinda', 'gaseosa', 'paso'],
        exclude: ['chupetin', 'caramelo', 'gomita', 'copita', 'vaso', 'helado'] },
      { key: 'agua',       label: 'Agua',       emoji: '💧', query: 'agua mineral',
        extraQueries: ['agua villavicencio', 'agua saborizada', 'agua eco de los andes'],
        ml_category_id: ML_BEBIDAS, useSuperPrecio: true,
        require: ['agua mineral', 'agua saborizada', 'agua manantial', 'agua de mesa', 'agua tonica', 'agua sin gas', 'agua con gas', 'eco de los', 'villavicencio', 'bonaqua', 'ser'],
        exclude: ['micelar', 'micellar', 'aguarras', 'oxigenada', 'destilada', 'lavandina',
                  'colonia', 'hidratante', 'rociador', 'desodorante', 'capilar', 'facial',
                  'corporal', 'perfume', 'esencia', 'manguera', 'filtro', 'bebe', 'aromatizador'] },
      { key: 'leche',      label: 'Lácteos',    emoji: '🥛', query: 'leche entera',
        extraQueries: ['leche la serenisima', 'yogur', 'manteca', 'queso cremoso'],
        ml_category_id: ML_ALIMENTOS, useSuperPrecio: true,
        require: ['leche', 'yogur', 'manteca', 'queso', 'serenisima'],
        exclude: ['alfajor', 'chocolate', 'cereal', 'hidratante', 'corporal', 'demaquillante',
                  'limpiadora', 'bronceadora', 'arroz con leche', 'tableta'] },
      { key: 'yerba',      label: 'Yerba',      emoji: '🧉', query: 'yerba mate',
        extraQueries: ['yerba taragui', 'yerba rosamonte', 'yerba playadito', 'yerba la merced'],
        ml_category_id: ML_BEBIDAS, useSuperPrecio: true,
        require: ['yerba', 'taragui', 'rosamonte', 'playadito', 'cruz de malta', 'merced', 'cbse'],
        exclude: ['bombilla', 'mate cocido', 'termo', 'set', 'mate de calabaza'] },
      { key: 'aceite',     label: 'Aceites',    emoji: '🫒', query: 'aceite girasol',
        extraQueries: ['aceite natura', 'aceite cocinero', 'aceite oliva', 'aceite mezcla'],
        ml_category_id: ML_ALIMENTOS, useSuperPrecio: true,
        require: ['aceite', 'natura', 'cocinero', 'lira', 'legitimo', 'nucete'],
        exclude: ['corporal', 'capilar', 'esencial', 'bebe', 'masaje', 'bronceador',
                  'perfume', 'facial', 'argan', 'coco', 'rosa mosqueta', 'auto', 'motor',
                  'lubricante', 'freidora'] },
      { key: 'fideos',     label: 'Pastas',     emoji: '🍝', query: 'fideos',
        extraQueries: ['spaghetti', 'mostachol', 'tallarines', 'fideos matarazzo', 'fideos lucchetti'],
        ml_category_id: ML_ALIMENTOS, useSuperPrecio: true,
        require: ['fideo', 'spaghetti', 'tallarin', 'mostachol', 'tirabuzon', 'moño', 'pasta', 'matarazzo', 'lucchetti', 'don vicente', 'marolio'],
        exclude: ['sopa', 'alfajor'] },
      { key: 'arroz',      label: 'Arroz',      emoji: '🍚', query: 'arroz largo fino',
        extraQueries: ['arroz blanco', 'arroz gallo', 'arroz molinos ala', 'arroz 1kg'],
        ml_category_id: ML_ALIMENTOS, useSuperPrecio: true,
        require: ['arroz', 'gallo', 'molinos'],
        exclude: ['alfajor', 'galletita', 'torta', 'crema', 'harina', 'leche', 'tronquito',
                  'bebe', 'barrita', 'cereal', 'bebida', 'hamburguesa', 'chocolate'] },
      { key: 'cafe',       label: 'Café',       emoji: '☕', query: 'cafe molido',
        extraQueries: ['cafe nescafe', 'cafe la virginia', 'cafe en grano', 'cafe instantaneo'],
        ml_category_id: ML_BEBIDAS, useSuperPrecio: true,
        require: ['cafe', 'café', 'nescafe', 'virginia', 'bonafide', 'arabia', 'lavazza'],
        exclude: ['cafetera', 'taza', 'filtro', 'capsula descartable', 'molinillo'] },
      { key: 'limpieza',   label: 'Limpieza',   emoji: '🧼', query: 'detergente',
        extraQueries: ['lavandina', 'jabon en polvo', 'limpiador', 'suavizante ropa'],
        useSuperPrecio: true,
        require: ['detergente', 'lavandina', 'limpiador', 'jabón en polvo', 'jabon en polvo', 'desengrasante', 'ala', 'skip', 'magistral', 'cif'],
        exclude: ['facial', 'corporal', 'bebe', 'intimo', 'dental', 'shampoo'] },
      { key: 'higiene',    label: 'Higiene',    emoji: '🧴', query: 'papel higienico',
        extraQueries: ['papel higienico elite', 'papel higienico scott', 'papel higienico higienol'],
        ml_category_id: ML_BELLEZA, useSuperPrecio: true,
        require: ['papel higien', 'papel higiénico', 'rollo', 'elite', 'scott', 'higienol', 'sussex', 'sure'],
        exclude: ['cocina', 'tissue', 'servilleta'] },
    ],
  },
  {
    key: 'golosinas',
    label: 'Golosinas',
    emoji: '🍫',
    categories: [
      { key: 'chocolate',  label: 'Chocolates', emoji: '🍫', query: 'chocolate',
        extraQueries: ['milka', 'cadbury', 'cofler', 'aero', 'shot'],
        ml_category_id: ML_ALIMENTOS, useSuperPrecio: true,
        require: ['chocolate', 'cadbury', 'milka', 'águila', 'aguila', 'felfort', 'aero', 'cofler', 'shot', 'arcor', 'arroz'],
        exclude: ['leche chocolatada', 'batido', 'bebida', 'flan', 'polvo', 'arroz con'] },
      { key: 'alfajor',    label: 'Alfajores',  emoji: '🥮', query: 'alfajor',
        extraQueries: ['alfajor jorgito', 'alfajor guaymallen', 'alfajor havanna', 'alfajor cachafaz'],
        ml_category_id: ML_ALIMENTOS, useSuperPrecio: true,
        require: ['alfajor'],
        exclude: ['molde', 'receta'] },
      { key: 'caramelo',   label: 'Caramelos',  emoji: '🍬', query: 'caramelos',
        extraQueries: ['pastillas', 'golosinas', 'gomitas mogul'],
        ml_category_id: ML_ALIMENTOS, useSuperPrecio: true,
        require: ['caramelo', 'pastilla', 'golosina', 'gomita', 'mogul'],
        exclude: ['colonia', 'jabón', 'vela', 'decoracion'] },
      { key: 'galletitas', label: 'Galletitas', emoji: '🍪', query: 'galletitas',
        extraQueries: ['oreo', 'pepitos', 'bagley', 'criollitas', 'sonrisas'],
        ml_category_id: ML_ALIMENTOS, useSuperPrecio: true,
        require: ['galletita', 'galleta', 'oreo', 'pepito', 'sonrisa', 'bagley', 'criolla', 'variedad'],
        exclude: ['perro', 'gato', 'mascota'] },
      { key: 'chicle',     label: 'Chicles',    emoji: '🫧', query: 'chicle',
        extraQueries: ['beldent', 'topline', 'bazooka', 'bubbaloo'],
        ml_category_id: ML_ALIMENTOS, useSuperPrecio: true,
        require: ['chicle', 'beldent', 'topline', 'bazooka', 'bubbaloo'] },
      { key: 'helado',     label: 'Helados',    emoji: '🍦', query: 'helado pote',
        extraQueries: ['helado frigor', 'helado laponia', 'helado oreo'],
        ml_category_id: ML_ALIMENTOS, useSuperPrecio: true,
        require: ['helado', 'frigor', 'laponia', 'lucciano', 'oreo', 'palito'],
        exclude: ['maquina', 'heladera', 'vaso', 'copa', 'cubetera', 'molde'] },
    ],
  },
  {
    key: 'electro',
    label: 'Electrodomésticos',
    emoji: '📱',
    categories: [
      { key: 'tv',        label: 'Televisores',  emoji: '📺', query: 'smart tv',
        extraQueries: ['tv samsung 50', 'tv lg', 'tv noblex', 'tv philco'],
        ml_category_id: ML_ELECTRONICA,
        require: ['televisor', 'televisión', 'smart tv', 'smart-tv', 'tv led', 'tv oled', 'tv qled', 'tv uhd', 'tv 4k', 'samsung', 'tv lg', 'noblex', 'philco', 'tv ken brown', 'tv rca'],
        exclude: ['soporte', 'cable hdmi', 'antena', 'control remoto', 'rack', 'mueble', 'funda tv', 'decodificador'] },
      { key: 'celular',   label: 'Celulares',    emoji: '📱', query: 'celular',
        extraQueries: ['samsung galaxy', 'motorola moto', 'xiaomi redmi', 'iphone'],
        ml_category_id: ML_CELULARES,
        require: ['celular', 'smartphone', 'galaxy', 'motorola', 'xiaomi', 'iphone', 'moto g', 'moto e', 'redmi', 'huawei'],
        exclude: ['funda', 'vidrio', 'cargador', 'cable', 'protector', 'soporte', 'case', 'carcasa', 'holder', 'silicona', 'templado', 'adaptador'] },
      { key: 'notebook',  label: 'Notebooks',    emoji: '💻', query: 'notebook',
        extraQueries: ['notebook hp', 'notebook lenovo', 'notebook acer', 'laptop'],
        ml_category_id: ML_COMPUTACION,
        require: ['notebook', 'laptop'],
        exclude: ['mochila', 'funda', 'soporte', 'base', 'cooler', 'mesa', 'bolso'] },
      { key: 'heladera',  label: 'Heladeras',    emoji: '🧊', query: 'heladera',
        extraQueries: ['heladera no frost', 'heladera samsung', 'heladera whirlpool'],
        ml_category_id: ML_ELECTRO,
        require: ['heladera', 'refrigerador', 'frost'],
        exclude: ['mini', 'portatil', 'playera', 'conservadora', 'iman', 'minibar'] },
      { key: 'lavarropa', label: 'Lavarropas',   emoji: '🧺', query: 'lavarropas',
        extraQueries: ['lavarropas drean', 'lavarropas samsung', 'lavarropas whirlpool'],
        ml_category_id: ML_ELECTRO,
        require: ['lavarropa'],
        exclude: ['tapa', 'manguera', 'filtro', 'accesorio', 'funda'] },
      { key: 'aire',      label: 'Aires',        emoji: '❄️', query: 'aire acondicionado',
        extraQueries: ['split frio calor', 'aire bgh', 'aire philco'],
        ml_category_id: ML_ELECTRO,
        require: ['aire acondicionado', 'split', 'portatil', 'climatizador'],
        exclude: ['ventilador', 'filtro', 'soporte', 'control', 'manguera'] },
      { key: 'auricular', label: 'Auriculares',  emoji: '🎧', query: 'auriculares bluetooth',
        extraQueries: ['auriculares inalambricos', 'airpods', 'auriculares jbl'],
        ml_category_id: ML_ELECTRONICA,
        require: ['auricular', 'headphone', 'earbud', 'airpod', 'jbl', 'philips'],
        exclude: ['cable auriculares', 'adaptador'] },
      { key: 'microondas', label: 'Microondas',  emoji: '🍲', query: 'microondas',
        extraQueries: ['microondas bgh', 'microondas atma', 'microondas whirlpool'],
        ml_category_id: ML_ELECTRO,
        require: ['microondas'],
        exclude: ['tapa', 'recipiente', 'bolsa', 'fuente', 'olla para microondas'] },
      { key: 'smartwatch', label: 'Smartwatch',  emoji: '⌚', query: 'smartwatch',
        extraQueries: ['reloj inteligente', 'smartband', 'apple watch', 'galaxy watch'],
        ml_category_id: ML_ELECTRONICA,
        require: ['smartwatch', 'reloj inteligente', 'watch', 'smartband', 'mi band'],
        exclude: ['malla', 'pulsera', 'correa', 'cargador', 'protector', 'funda'] },
    ],
  },
  {
    key: 'moda',
    label: 'Moda',
    emoji: '👕',
    categories: [
      { key: 'zapatillas', label: 'Zapatillas', emoji: '👟', query: 'zapatillas',
        extraQueries: ['zapatillas nike', 'zapatillas adidas', 'zapatillas topper', 'zapatillas puma'],
        ml_category_id: ML_DEPORTES,
        require: ['zapatilla'],
        exclude: ['pantuflas', 'ojotas', 'limpiadora', 'plantilla', 'spray'] },
      { key: 'remera',     label: 'Remeras',    emoji: '👕', query: 'remera',
        extraQueries: ['remera algodon', 'remera nike', 'remera hombre'],
        ml_category_id: ML_ROPA,
        require: ['remera', 't-shirt', 'camiseta'],
        exclude: ['estampa sola', 'transfer'] },
      { key: 'pantalon',   label: 'Pantalones', emoji: '👖', query: 'pantalon',
        extraQueries: ['jean', 'pantalon jogger', 'pantalon levis'],
        ml_category_id: ML_ROPA,
        require: ['pantalon', 'jean', 'jogger', 'chupin'],
        exclude: ['cinturon solo', 'hebilla sola'] },
      { key: 'campera',    label: 'Camperas',   emoji: '🧥', query: 'campera',
        extraQueries: ['campera inflable', 'campera deportiva', 'campera hombre'],
        ml_category_id: ML_ROPA,
        require: ['campera', 'chaqueta'],
        exclude: ['perchero'] },
      { key: 'buzo',       label: 'Buzos',      emoji: '🧶', query: 'buzo',
        extraQueries: ['buzo hoodie', 'buzo canguro', 'buzo capucha'],
        ml_category_id: ML_ROPA,
        require: ['buzo', 'hoodie', 'sudadera'],
        exclude: ['buzon'] },
    ],
  },
  {
    key: 'hogar',
    label: 'Hogar',
    emoji: '🏠',
    categories: [
      { key: 'colchon',     label: 'Colchones',    emoji: '🛏️', query: 'colchon',
        extraQueries: ['colchon queen', 'colchon 2 plazas', 'colchon 1 plaza'],
        ml_category_id: ML_HOGAR,
        require: ['colchon'],
        exclude: ['protector', 'funda solo', 'cubrecolchon', 'inflable bebe', 'yoga'] },
      { key: 'sommier',     label: 'Sommiers',     emoji: '🛌', query: 'sommier',
        extraQueries: ['sommier 2 plazas', 'sommier queen', 'sommier piero'],
        ml_category_id: ML_HOGAR,
        require: ['sommier'] },
      { key: 'sillon',      label: 'Sillones',     emoji: '🛋️', query: 'sillon',
        extraQueries: ['sofa', 'sillon 2 cuerpos', 'sillon rinconero'],
        ml_category_id: ML_HOGAR,
        require: ['sillon', 'sofa'],
        exclude: ['funda solo', 'cubre sillon', 'protector sillon', 'infantil'] },
      { key: 'herramienta', label: 'Herramientas', emoji: '🔧', query: 'taladro',
        extraQueries: ['amoladora', 'sierra electrica', 'atornillador', 'taladro inalambrico'],
        ml_category_id: ML_HERRAMIENTAS,
        require: ['taladro', 'amoladora', 'sierra', 'atornillador', 'pistola de calor'],
        exclude: ['mecha', 'disco solo', 'repuesto'] },
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
  // 1. Juntar pool de queries: la principal + las extra (hasta 4)
  const queries = [category.query, ...(category.extraQueries ?? [])].slice(0, 4)

  // 2. Para cada query, hacer búsqueda en VTEX + opcionalmente SuperPrecio en paralelo
  const queryResults = await Promise.allSettled(
    queries.map(async q => {
      const [vtex, sp] = await Promise.allSettled([
        searchVtex(q),
        category.useSuperPrecio ? searchSuperPrecio(q, 15) : Promise.resolve([]),
      ])
      const vtexRes = vtex.status === 'fulfilled' ? vtex.value : []
      const spRes = sp.status === 'fulfilled' ? sp.value : []
      return [...vtexRes, ...spRes]
    })
  )

  // 3. ML highlights por categoría (independiente de las queries)
  const mlRes = await (category.ml_category_id
    ? fetchMLHighlightsByCategory(category.ml_category_id, 15).catch(() => [] as SearchResult[])
    : Promise.resolve([] as SearchResult[]))

  // 4. Juntar todos los resultados
  const allRaw: SearchResult[] = []
  for (const r of queryResults) {
    if (r.status === 'fulfilled') allRaw.push(...r.value)
  }
  allRaw.push(...mlRes)

  // 5. Dedupe por URL
  const seen = new Set<string>()
  const deduped: SearchResult[] = []
  for (const r of allRaw) {
    if (r.price <= 0) continue
    const key = r.url ?? r.id
    if (seen.has(key)) continue
    seen.add(key)
    deduped.push(r)
  }

  // 6. Filtro estricto con require/exclude
  let filtered = deduped.filter(r => passesFilter(r.name, category))

  // 7. Fallback: si quedamos con menos de 8 productos, relajar el filtro
  //    aplicando SOLO los excludes (no los requires)
  if (filtered.length < 8 && category.exclude) {
    const relaxedCategory: Category = { ...category, require: undefined }
    const extra = deduped.filter(r => passesFilter(r.name, relaxedCategory))
      .filter(r => !filtered.some(f => (f.url ?? f.id) === (r.url ?? r.id)))
    filtered = [...filtered, ...extra]
  }

  // 8. Último recurso: si sigue vacío, tomar los primeros 15 del pool
  //    (con tal de no mostrar categoría vacía)
  if (filtered.length === 0) {
    filtered = deduped.slice(0, 15)
  }

  // 9. Cross-seller discounts
  const withDiscounts = applyCrossSellerDiscounts(filtered)

  // 10. Dedupe cheapest
  const unique = deduplicateToCheapest(withDiscounts)

  // 11. Ordenar por precio ascendente
  const sortByPrice = (a: SearchResult, b: SearchResult) => a.price - b.price
  unique.sort(sortByPrice)

  // 12. Top 20 productos de la categoría
  return unique.slice(0, 20)
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
