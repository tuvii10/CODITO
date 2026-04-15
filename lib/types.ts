export type Store = {
  id: string
  name: string
  logo_url: string | null
  url: string | null
}

export type Product = {
  id: string
  ean: string | null
  name: string
  brand: string | null
  category: string | null
}

export type Price = {
  id: string
  product_id: string
  store_id: string
  price: number
  price_per_unit: number | null
  unit: string | null
  date: string
  url: string | null
  in_stock: boolean
  store?: Store
  product?: Product
}

export type SearchResult = {
  id: string
  name: string
  brand: string | null
  ean: string | null
  store_name: string
  store_logo: string | null
  price: number
  price_per_unit: number | null
  unit: string | null
  url: string | null
  in_stock: boolean
  source: 'sepa' | 'mercadolibre' | 'vtex' | 'coto' | 'searxng'
  image?: string | null
  seller?: string
  promo_label?: string | null
  original_price?: number | null
  /** true si el descuento/promo viene de una fuente confiable (teaser VTEX 2x1, 4x3, % OFF real, etc.) */
  is_real_promo?: boolean
}
