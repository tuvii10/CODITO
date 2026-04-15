import { NextResponse } from 'next/server'
import { searchVtex } from '@/lib/vtex'
import { searchMercadoLibre } from '@/lib/mercadolibre'
import { applyCrossSellerDiscounts } from '@/lib/compare'
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
      { key: 'gaseosa',    label: 'Gaseosas',   emoji: '🥤', query: 'gaseosa cola',
        exclude: ['chupetin', 'caramelo', 'gomita', 'jugo en polvo'] },
      { key: 'agua',       label: 'Agua',       emoji: '💧', query: 'agua mineral 1.5',
        exclude: ['lavandina', 'colonia'] },
      { key: 'leche',      label: 'Lácteos',    emoji: '🥛', query: 'leche entera',
        require: ['leche'], exclude: ['alfajor', 'chocolate', 'cereal'] },
      { key: 'yerba',      label: 'Yerba',      emoji: '🧉', query: 'yerba mate',
        require: ['yerba'] },
      { key: 'aceite',     label: 'Aceites',    emoji: '🫒', query: 'aceite girasol',
        require: ['aceite'], exclude: ['corporal', 'capilar', 'esencial', 'bebe'] },
      { key: 'fideos',     label: 'Pastas',     emoji: '🍝', query: 'fideos',
        require: ['fideo', 'spaghetti', 'tallarin', 'mostachol', 'tirabuzon'],
        exclude: ['sopa'] },
      { key: 'arroz',      label: 'Arroz',      emoji: '🍚', query: 'arroz blanco 1kg',
        require: ['arroz'],
        exclude: ['alfajor', 'galletita', 'torta', 'crema', 'harina', 'leche', 'tronquito', 'bebe'] },
      { key: 'cafe',       label: 'Café',       emoji: '☕', query: 'cafe molido',
        require: ['cafe', 'café'], exclude: ['cafetera', 'taza', 'filtro'] },
      { key: 'limpieza',   label: 'Limpieza',   emoji: '🧼', query: 'detergente ropa',
        exclude: ['facial', 'corporal', 'bebe'] },
      { key: 'higiene',    label: 'Higiene',    emoji: '🧴', query: 'papel higienico',
        require: ['papel', 'higien'] },
    ],
  },
  {
    key: 'golosinas',
    label: 'Golosinas',
    emoji: '🍫',
    categories: [
      { key: 'chocolate',  label: 'Chocolates', emoji: '🍫', query: 'chocolate tableta' },
      { key: 'alfajor',    label: 'Alfajores',  emoji: '🥮', query: 'alfajor',
        require: ['alfajor'] },
      { key: 'caramelo',   label: 'Caramelos',  emoji: '🍬', query: 'caramelos surtidos' },
      { key: 'galletitas', label: 'Galletitas', emoji: '🍪', query: 'galletitas dulces' },
      { key: 'chicle',     label: 'Chicles',    emoji: '🫧', query: 'chicle',
        require: ['chicle'] },
      { key: 'helado',     label: 'Helados',    emoji: '🍦', query: 'helado pote 1 kg' },
    ],
  },
  {
    key: 'electro',
    label: 'Electrodomésticos',
    emoji: '📱',
    categories: [
      { key: 'tv',        label: 'Televisores',  emoji: '📺', query: 'televisor smart 50',
        require: ['tv', 'smart', 'led', 'television'] },
      { key: 'celular',   label: 'Celulares',    emoji: '📱', query: 'celular samsung',
        require: ['celular', 'smartphone', 'galaxy', 'motorola', 'xiaomi', 'iphone'] },
      { key: 'notebook',  label: 'Notebooks',    emoji: '💻', query: 'notebook',
        require: ['notebook', 'laptop'] },
      { key: 'heladera',  label: 'Heladeras',    emoji: '🧊', query: 'heladera no frost',
        require: ['heladera', 'refrigerador'] },
      { key: 'lavarropa', label: 'Lavarropas',   emoji: '🧺', query: 'lavarropas automatico',
        require: ['lavarropa'] },
      { key: 'aire',      label: 'Aires',        emoji: '❄️', query: 'aire acondicionado split',
        require: ['aire', 'split'] },
      { key: 'auricular', label: 'Auriculares',  emoji: '🎧', query: 'auriculares bluetooth',
        require: ['auricular'] },
      { key: 'microondas', label: 'Microondas',  emoji: '🍲', query: 'microondas',
        require: ['microondas'] },
      { key: 'smartwatch', label: 'Smartwatch',  emoji: '⌚', query: 'smartwatch' },
    ],
  },
  {
    key: 'moda',
    label: 'Moda',
    emoji: '👕',
    categories: [
      { key: 'zapatillas', label: 'Zapatillas', emoji: '👟', query: 'zapatillas deportivas',
        require: ['zapatilla'] },
      { key: 'remera',     label: 'Remeras',    emoji: '👕', query: 'remera algodon',
        require: ['remera'] },
      { key: 'pantalon',   label: 'Pantalones', emoji: '👖', query: 'pantalon jean',
        require: ['pantalon', 'jean'] },
      { key: 'campera',    label: 'Camperas',   emoji: '🧥', query: 'campera',
        require: ['campera'] },
      { key: 'buzo',       label: 'Buzos',      emoji: '🧶', query: 'buzo capucha',
        require: ['buzo'] },
    ],
  },
  {
    key: 'hogar',
    label: 'Hogar',
    emoji: '🏠',
    categories: [
      { key: 'colchon',     label: 'Colchones',    emoji: '🛏️', query: 'colchon queen',
        require: ['colchon'] },
      { key: 'sommier',     label: 'Sommiers',     emoji: '🛌', query: 'sommier',
        require: ['sommier'] },
      { key: 'sillon',      label: 'Sillones',     emoji: '🛋️', query: 'sillon',
        require: ['sillon', 'sofa'] },
      { key: 'herramienta', label: 'Herramientas', emoji: '🔧', query: 'taladro inalambrico',
        require: ['taladro', 'amoladora', 'sierra'] },
    ],
  },
]

function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

function passesFilter(name: string, category: Category): boolean {
  const n = normalize(name)

  // Si hay lista de exclusión, el nombre no puede contener ninguna
  if (category.exclude && category.exclude.some(term => n.includes(normalize(term)))) {
    return false
  }

  // Si hay lista de requeridos, el nombre debe contener al menos una
  if (category.require && category.require.length > 0) {
    const hasRequired = category.require.some(term => n.includes(normalize(term)))
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

  // Orden inteligente: primero los que tienen descuento real, ordenados por
  // ahorro absoluto; después el resto por precio de menor a mayor
  const withDiscount = withRealDiscounts
    .filter(r => r.original_price && r.original_price > r.price)
    .sort((a, b) => (b.original_price! - b.price) - (a.original_price! - a.price))

  const withoutDiscount = withRealDiscounts
    .filter(r => !r.original_price || r.original_price <= r.price)
    .sort((a, b) => a.price - b.price)

  return [...withDiscount, ...withoutDiscount].slice(0, 24)
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
