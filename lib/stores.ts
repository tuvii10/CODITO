/**
 * Config centralizada de tiendas: color de marca, display name, URL de búsqueda.
 * Las tiendas con color definido usan el color oficial de la marca.
 * Las que no están, reciben un color generado consistente (hash del nombre).
 */
export type StoreConfig = {
  displayName: string
  color: string
  textColor: string
  logo: string
  searchUrl: (query: string) => string
}

// Paleta de colores de marca (oficiales donde es posible)
const STORE_COLORS: Record<string, { color: string; textColor: string; displayName?: string }> = {
  // ── Supermercados ─────────────────────────────
  'Carrefour':        { color: '#004e9f', textColor: '#fff' },
  'Disco':            { color: '#e60000', textColor: '#fff' },
  'Vea':              { color: '#00a650', textColor: '#fff' },
  'Jumbo':            { color: '#00a859', textColor: '#fff' },
  'Chango Más':       { color: '#ff6b00', textColor: '#fff' },
  'DIA':              { color: '#d3151d', textColor: '#fff' },
  'Coto':             { color: '#e2001a', textColor: '#fff' },
  'Libertad':         { color: '#009dd9', textColor: '#fff' },
  'Cordiez':          { color: '#0055a5', textColor: '#fff' },
  'Coca Cola':        { color: '#f40009', textColor: '#fff' },
  'Más Cerca':        { color: '#e94e1b', textColor: '#fff' },
  'The Food Market':  { color: '#2d3748', textColor: '#fff' },

  // ── Electro ────────────────────────────────────
  'Frávega':          { color: '#0051a0', textColor: '#fff' },
  'Naldo':            { color: '#d60021', textColor: '#fff' },
  'Motorola':         { color: '#0b7acc', textColor: '#fff' },
  'BGH':              { color: '#002c5f', textColor: '#fff' },
  'Samsung':          { color: '#1428a0', textColor: '#fff' },
  'Whirlpool':        { color: '#0c5db3', textColor: '#fff' },
  'KitchenAid':       { color: '#b41f1f', textColor: '#fff' },
  'Liliana':          { color: '#e31e24', textColor: '#fff' },

  // ── Hogar ──────────────────────────────────────
  'Easy':             { color: '#009fe3', textColor: '#fff' },
  'Pardo Hogar':      { color: '#1a4789', textColor: '#fff' },
  'Tramontina':       { color: '#c8102e', textColor: '#fff' },
  'Arredo':           { color: '#2d2d2d', textColor: '#fff' },
  'Blaisten':         { color: '#00723e', textColor: '#fff' },
  'Castillo':         { color: '#6a1b9a', textColor: '#fff' },
  'El Balcón':        { color: '#8b4513', textColor: '#fff' },

  // ── Farmacia / Belleza / Mascotas ──────────────
  'Farmacity':        { color: '#00a859', textColor: '#fff' },
  'Farmaonline':      { color: '#1e88e5', textColor: '#fff' },
  'Farmalife':        { color: '#009688', textColor: '#fff' },
  'Farmaplus':        { color: '#0077c8', textColor: '#fff' },
  'Farmacia del Pueblo': { color: '#d32f2f', textColor: '#fff', displayName: 'Farm. del Pueblo' },
  'Get The Look':     { color: '#d81b60', textColor: '#fff' },
  'Puppis':           { color: '#ff9800', textColor: '#fff' },

  // ── Moda ───────────────────────────────────────
  'Topper':           { color: '#e30613', textColor: '#fff' },
  'Mimo':             { color: '#e91e63', textColor: '#fff' },
  'Taverniti':        { color: '#000000', textColor: '#fff' },
  '47 Street':        { color: '#f06292', textColor: '#fff' },
  'Portsaid':         { color: '#212121', textColor: '#fff' },
  'Ricky Sarkany':    { color: '#000000', textColor: '#fff', displayName: 'Sarkany' },
  'Viamo':            { color: '#5d4037', textColor: '#fff' },
  'Tienda River':     { color: '#e30613', textColor: '#fff', displayName: 'River' },
  'Equus':            { color: '#3e2723', textColor: '#fff' },
  'GRID':             { color: '#37474f', textColor: '#fff' },
  'Style Store':      { color: '#6d4c41', textColor: '#fff' },
  'Desiderata':       { color: '#ad1457', textColor: '#fff' },
  'Levis':            { color: '#c8102e', textColor: '#fff' },
  'Tate Kilroy':      { color: '#5e35b1', textColor: '#fff' },
  'Vallejo':          { color: '#4e342e', textColor: '#fff' },

  // ── Deportes ───────────────────────────────────
  'Sporting':         { color: '#0288d1', textColor: '#fff' },
  'Sportotal':        { color: '#ff5722', textColor: '#fff' },
  'XL Shop':          { color: '#1976d2', textColor: '#fff' },
  'Rossetti':         { color: '#c62828', textColor: '#fff' },
  'Marathon':         { color: '#ff9800', textColor: '#fff' },
  'Batistella':       { color: '#0d47a1', textColor: '#fff' },
  'Woker':            { color: '#00695c', textColor: '#fff' },
  'Las Margaritas':   { color: '#ad1457', textColor: '#fff' },
  'Factory':          { color: '#1565c0', textColor: '#fff' },
  'Punto Deportivo':  { color: '#2e7d32', textColor: '#fff' },

  // ── Libros / Multimarca ────────────────────────
  'SBS':              { color: '#1e3a8a', textColor: '#fff' },
  'Coppel':           { color: '#fdd835', textColor: '#1a1a1a' },

  // ── Mercado Libre ──────────────────────────────
  'Mercado Libre':    { color: '#ffe600', textColor: '#2d3277', displayName: 'MELI' },
}

/**
 * Paleta de fallback para tiendas sin color definido.
 * El color se elige por hash del nombre, así siempre es consistente.
 */
const FALLBACK_PALETTE = [
  { color: '#475569', textColor: '#fff' }, // slate
  { color: '#57534e', textColor: '#fff' }, // stone
  { color: '#0f766e', textColor: '#fff' }, // teal
  { color: '#1e40af', textColor: '#fff' }, // blue
  { color: '#6d28d9', textColor: '#fff' }, // violet
  { color: '#be185d', textColor: '#fff' }, // pink
  { color: '#b45309', textColor: '#fff' }, // amber
  { color: '#15803d', textColor: '#fff' }, // green
]

function hashString(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) - h) + s.charCodeAt(i)
    h |= 0
  }
  return Math.abs(h)
}

export function getStoreConfig(name: string): StoreConfig {
  const known = STORE_COLORS[name]
  if (known) {
    return {
      displayName: known.displayName ?? name,
      color: known.color,
      textColor: known.textColor,
      logo: '',
      searchUrl: (q) => `https://www.google.com/search?q=${encodeURIComponent(name + ' ' + q)}`,
    }
  }

  // Fallback: color consistente por hash del nombre
  const idx = hashString(name) % FALLBACK_PALETTE.length
  const pal = FALLBACK_PALETTE[idx]
  return {
    displayName: name,
    color: pal.color,
    textColor: pal.textColor,
    logo: '',
    searchUrl: (q) => `https://www.google.com/search?q=${encodeURIComponent(name + ' ' + q)}`,
  }
}
