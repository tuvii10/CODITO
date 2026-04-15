// Config centralizada de tiendas: logo, color, URL de búsqueda
export type StoreConfig = {
  displayName: string
  color: string
  textColor: string
  logo: string          // URL del logo/favicon oficial
  searchUrl: (query: string) => string
}

export const STORES: Record<string, StoreConfig> = {
  'Carrefour': {
    displayName: 'Carrefour',
    color: '#003087',
    textColor: '#fff',
    logo: 'https://www.carrefour.com.ar/favicon.ico',
    searchUrl: (q) => `https://www.carrefour.com.ar/${encodeURIComponent(q)}?_q=${encodeURIComponent(q)}&map=ft`,
  },
  'Coto': {
    displayName: 'Coto',
    color: '#e2001a',
    textColor: '#fff',
    logo: 'https://www.coto.com.ar/favicon.ico',
    searchUrl: (q) => `https://www.coto.com.ar/busqueda?q=${encodeURIComponent(q)}`,
  },
  'Chango Más': {
    displayName: 'Chango Más',
    color: '#ff6600',
    textColor: '#fff',
    logo: 'https://www.changomas.com.ar/favicon.ico',
    searchUrl: (q) => `https://www.changomas.com.ar/${encodeURIComponent(q)}?_q=${encodeURIComponent(q)}&map=ft`,
  },
  'Disco': {
    displayName: 'Disco',
    color: '#e2001a',
    textColor: '#fff',
    logo: 'https://www.disco.com.ar/favicon.ico',
    searchUrl: (q) => `https://www.disco.com.ar/${encodeURIComponent(q)}?_q=${encodeURIComponent(q)}&map=ft`,
  },
  'Vea': {
    displayName: 'Vea',
    color: '#009944',
    textColor: '#fff',
    logo: 'https://www.vea.com.ar/favicon.ico',
    searchUrl: (q) => `https://www.vea.com.ar/${encodeURIComponent(q)}?_q=${encodeURIComponent(q)}&map=ft`,
  },
  'Día': {
    displayName: 'Día',
    color: '#e2001a',
    textColor: '#fff',
    logo: 'https://diaonline.supermercadosdia.com.ar/favicon.ico',
    searchUrl: (q) => `https://diaonline.supermercadosdia.com.ar/${encodeURIComponent(q)}?_q=${encodeURIComponent(q)}&map=ft`,
  },
  'La Anónima': {
    displayName: 'La Anónima',
    color: '#003087',
    textColor: '#fff',
    logo: 'https://www.laanonima.com.ar/favicon.ico',
    searchUrl: (q) => `https://www.laanonima.com.ar/buscar?q=${encodeURIComponent(q)}`,
  },
  'Cooperativa Obrera': {
    displayName: 'Coop. Obrera',
    color: '#1a56db',
    textColor: '#fff',
    logo: 'https://www.cooperativaobrera.coop/favicon.ico',
    searchUrl: (q) => `https://www.cooperativaobrera.coop/busca/?fq=ft:${encodeURIComponent(q)}`,
  },
  'Market': {
    displayName: 'Market',
    color: '#0891b2',
    textColor: '#fff',
    logo: 'https://www.walmart.com.ar/favicon.ico',
    searchUrl: (q) => `https://www.walmart.com.ar/${encodeURIComponent(q)}?_q=${encodeURIComponent(q)}&map=ft`,
  },
  'Mercado Libre': {
    displayName: 'Mercado Libre',
    color: '#ffe600',
    textColor: '#333',
    logo: 'https://http2.mlstatic.com/frontend-assets/ml-web-navigation/ui-navigation/6.6.92/mercadolibre/favicon.svg',
    searchUrl: (q) => `https://listado.mercadolibre.com.ar/${encodeURIComponent(q)}`,
  },
  'Frávega': {
    displayName: 'Frávega',
    color: '#e2001a',
    textColor: '#fff',
    logo: 'https://www.fravega.com/favicon.ico',
    searchUrl: (q) => `https://www.fravega.com/l/?keyword=${encodeURIComponent(q)}`,
  },
  'Garbarino': {
    displayName: 'Garbarino',
    color: '#0033a0',
    textColor: '#fff',
    logo: 'https://www.garbarino.com/favicon.ico',
    searchUrl: (q) => `https://www.garbarino.com/search?q=${encodeURIComponent(q)}`,
  },
  'Musimundo': {
    displayName: 'Musimundo',
    color: '#ff0000',
    textColor: '#fff',
    logo: 'https://www.musimundo.com/favicon.ico',
    searchUrl: (q) => `https://www.musimundo.com/search?q=${encodeURIComponent(q)}`,
  },
  'Farmacity': {
    displayName: 'Farmacity',
    color: '#00a859',
    textColor: '#fff',
    logo: 'https://www.farmacity.com/favicon.ico',
    searchUrl: (q) => `https://www.farmacity.com/search?q=${encodeURIComponent(q)}`,
  },
  'Walmart': {
    displayName: 'Walmart',
    color: '#0071ce',
    textColor: '#fff',
    logo: 'https://www.walmart.com.ar/favicon.ico',
    searchUrl: (q) => `https://www.walmart.com.ar/${encodeURIComponent(q)}?_q=${encodeURIComponent(q)}&map=ft`,
  },
}

export function getStoreConfig(name: string): StoreConfig {
  return STORES[name] ?? {
    displayName: name,
    color: '#444',
    textColor: '#fff',
    logo: '',
    searchUrl: (q) => `https://www.google.com/search?q=${encodeURIComponent(name + ' ' + q)}`,
  }
}
