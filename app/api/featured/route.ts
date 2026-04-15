import { NextResponse } from 'next/server'
import { searchVtex } from '@/lib/vtex'
import { searchMercadoLibre } from '@/lib/mercadolibre'
import { SearchResult } from '@/lib/types'

// 1 hora de cache
export const revalidate = 3600

type Category = {
  key: string
  label: string
  emoji: string
  query: string
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
      { key: 'gaseosa',  label: 'Gaseosas',  emoji: '🥤', query: 'gaseosa' },
      { key: 'leche',    label: 'Lácteos',   emoji: '🥛', query: 'leche entera' },
      { key: 'yerba',    label: 'Yerba',     emoji: '🧉', query: 'yerba mate' },
      { key: 'aceite',   label: 'Aceites',   emoji: '🫒', query: 'aceite girasol' },
      { key: 'fideos',   label: 'Pastas',    emoji: '🍝', query: 'fideos' },
      { key: 'arroz',    label: 'Arroz',     emoji: '🍚', query: 'arroz' },
      { key: 'cafe',     label: 'Café',      emoji: '☕', query: 'cafe molido' },
      { key: 'galletitas', label: 'Galletitas', emoji: '🍪', query: 'galletitas' },
      { key: 'limpieza', label: 'Limpieza',  emoji: '🧼', query: 'detergente' },
      { key: 'higiene',  label: 'Higiene',   emoji: '🧴', query: 'papel higienico' },
    ],
  },
  {
    key: 'electro',
    label: 'Electrodomésticos',
    emoji: '📱',
    categories: [
      { key: 'tv',        label: 'Televisores',  emoji: '📺', query: 'televisor smart' },
      { key: 'celular',   label: 'Celulares',    emoji: '📱', query: 'celular' },
      { key: 'notebook',  label: 'Notebooks',    emoji: '💻', query: 'notebook' },
      { key: 'heladera',  label: 'Heladeras',    emoji: '🧊', query: 'heladera' },
      { key: 'lavarropa', label: 'Lavarropas',   emoji: '🧺', query: 'lavarropas' },
      { key: 'aire',      label: 'Aires',        emoji: '❄️', query: 'aire acondicionado' },
      { key: 'auricular', label: 'Auriculares',  emoji: '🎧', query: 'auriculares bluetooth' },
    ],
  },
  {
    key: 'moda',
    label: 'Moda',
    emoji: '👕',
    categories: [
      { key: 'zapatillas', label: 'Zapatillas', emoji: '👟', query: 'zapatillas' },
      { key: 'remera',     label: 'Remeras',    emoji: '👕', query: 'remera' },
      { key: 'pantalon',   label: 'Pantalones', emoji: '👖', query: 'pantalon jean' },
      { key: 'campera',    label: 'Camperas',   emoji: '🧥', query: 'campera' },
      { key: 'buzo',       label: 'Buzos',      emoji: '🧶', query: 'buzo' },
    ],
  },
  {
    key: 'hogar',
    label: 'Hogar',
    emoji: '🏠',
    categories: [
      { key: 'colchon',   label: 'Colchones',    emoji: '🛏️', query: 'colchon' },
      { key: 'sommier',   label: 'Sommiers',     emoji: '🛌', query: 'sommier' },
      { key: 'sillon',    label: 'Sillones',     emoji: '🛋️', query: 'sillon' },
      { key: 'herramienta', label: 'Herramientas', emoji: '🔧', query: 'taladro' },
    ],
  },
]

async function searchCategory(query: string): Promise<SearchResult[]> {
  const [vtexRes, mlRes] = await Promise.allSettled([
    searchVtex(query),
    searchMercadoLibre(query, 8),
  ])

  const vtex = vtexRes.status === 'fulfilled' ? vtexRes.value : []
  const ml   = mlRes.status   === 'fulfilled' ? mlRes.value   : []

  const seen = new Set<string>()
  const combined: SearchResult[] = []
  for (const r of [...vtex, ...ml]) {
    if (!r.url || seen.has(r.url)) continue
    seen.add(r.url)
    combined.push(r)
  }

  return combined
    .filter(r => r.price > 0)
    .sort((a, b) => a.price - b.price)
    .slice(0, 12)
}

export async function GET() {
  try {
    // Ejecutar todas las queries en paralelo
    const allQueries = SECTIONS.flatMap(s =>
      s.categories.map(c => ({ section: s.key, category: c.key, query: c.query }))
    )

    const results = await Promise.allSettled(
      allQueries.map(q => searchCategory(q.query))
    )

    const productsByKey = new Map<string, SearchResult[]>()
    allQueries.forEach((q, i) => {
      const key = `${q.section}/${q.category}`
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
