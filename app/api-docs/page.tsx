import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'API Pública',
  description: 'Documentación de la API pública de Codito para comparar precios en Argentina.',
}

const BASE = 'https://codito.com.ar'

export default function ApiDocsPage() {
  return (
    <div style={{ maxWidth: 760, margin: '0 auto' }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 'clamp(22px, 5vw, 32px)', fontWeight: 900, color: '#09090b', marginBottom: 8, letterSpacing: '-0.03em' }}>
          API Pública de Codito
        </h1>
        <p style={{ fontSize: 15, color: '#52525b', lineHeight: 1.6 }}>
          Acceso libre y gratuito a la búsqueda de precios. Podés integrar Codito en tu app, bot o proyecto.
          Sin API key, sin registro.
        </p>
      </div>

      {/* Endpoint: búsqueda */}
      <Section title="Buscar precios" method="GET" path="/api/search?q={query}">
        <p style={{ fontSize: 14, color: '#52525b', marginBottom: 16, lineHeight: 1.6 }}>
          Devuelve resultados de precios para una búsqueda, ordenados de menor a mayor precio.
          Fuentes: tiendas oficiales, supermercados y marketplaces argentinos.
        </p>

        <Param name="q" type="string" required description="Término de búsqueda (2–100 caracteres)" />

        <h4 style={{ fontSize: 13, fontWeight: 700, color: '#09090b', marginTop: 20, marginBottom: 8 }}>Ejemplo de request</h4>
        <CodeBlock>{`GET ${BASE}/api/search?q=leche+descremada`}</CodeBlock>

        <h4 style={{ fontSize: 13, fontWeight: 700, color: '#09090b', marginTop: 20, marginBottom: 8 }}>Respuesta</h4>
        <CodeBlock>{`{
  "results": [
    {
      "id": "...",
      "name": "Leche La Serenísima Descremada 1L",
      "price": 1250,
      "original_price": 1490,
      "store_name": "Coto",
      "store_logo": "https://...",
      "url": "https://...",
      "image": "https://...",
      "source": "vtex",
      "promo_label": "20% OFF banco Nación",
      "price_per_unit": 1250,
      "unit": "L"
    }
  ],
  "total": 12,
  "query": "leche descremada",
  "sources": {
    "tiendas_vtex": 5,
    "coto": 3,
    "superprecio": 2,
    "web": 2
  }
}`}</CodeBlock>

        <h4 style={{ fontSize: 13, fontWeight: 700, color: '#09090b', marginTop: 20, marginBottom: 8 }}>Campos de cada resultado</h4>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #e4e4e7' }}>
              <th style={{ textAlign: 'left', padding: '6px 10px', color: '#09090b' }}>Campo</th>
              <th style={{ textAlign: 'left', padding: '6px 10px', color: '#09090b' }}>Tipo</th>
              <th style={{ textAlign: 'left', padding: '6px 10px', color: '#09090b' }}>Descripción</th>
            </tr>
          </thead>
          <tbody>
            {[
              ['id', 'string', 'ID único del resultado'],
              ['name', 'string', 'Nombre del producto'],
              ['price', 'number', 'Precio final en ARS'],
              ['original_price', 'number | null', 'Precio sin descuento (si aplica)'],
              ['store_name', 'string', 'Nombre de la tienda'],
              ['url', 'string | null', 'URL del producto en la tienda'],
              ['image', 'string | null', 'URL de la imagen del producto'],
              ['source', 'string', '"vtex" | "mercadolibre" | "searxng"'],
              ['promo_label', 'string | null', 'Etiqueta de promoción (ej: "20% OFF")'],
              ['price_per_unit', 'number | null', 'Precio por unidad de medida'],
              ['unit', 'string | null', 'Unidad de medida (ej: "kg", "L")'],
            ].map(([f, t, d]) => (
              <tr key={f} style={{ borderBottom: '1px solid #f4f4f5' }}>
                <td style={{ padding: '7px 10px', fontWeight: 700, fontFamily: 'monospace', color: '#0284c7' }}>{f}</td>
                <td style={{ padding: '7px 10px', color: '#71717a', fontFamily: 'monospace' }}>{t}</td>
                <td style={{ padding: '7px 10px', color: '#52525b' }}>{d}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Section>

      {/* Endpoint: dólar */}
      <Section title="Cotización del dólar" method="GET" path="/api/dolares">
        <p style={{ fontSize: 14, color: '#52525b', marginBottom: 16, lineHeight: 1.6 }}>
          Devuelve la cotización actual del dólar blue, oficial y MEP. Actualizado cada 30 minutos.
        </p>
        <h4 style={{ fontSize: 13, fontWeight: 700, color: '#09090b', marginBottom: 8 }}>Respuesta</h4>
        <CodeBlock>{`{
  "blue": 1340,
  "oficial": 1080,
  "mep": 1310
}`}</CodeBlock>
      </Section>

      {/* Uso con fetch */}
      <Section title="Ejemplo de uso" method="" path="">
        <p style={{ fontSize: 14, color: '#52525b', marginBottom: 12 }}>JavaScript / TypeScript:</p>
        <CodeBlock>{`const res = await fetch('${BASE}/api/search?q=coca+cola+2.25l')
const { results } = await res.json()
const cheapest = results[0]
console.log(\`Más barato: \${cheapest.store_name} — $\${cheapest.price}\`)`}</CodeBlock>

        <p style={{ fontSize: 14, color: '#52525b', marginTop: 20, marginBottom: 12 }}>Python:</p>
        <CodeBlock>{[
          'import requests',
          `r = requests.get('${BASE}/api/search', params={'q': 'coca cola 2.25l'})`,
          "results = r.json()['results']",
          "print(f\"Más barato: {results[0]['store_name']} — ${results[0]['price']}\")",
        ].join('\n')}</CodeBlock>
      </Section>

      {/* Rate limits */}
      <div style={{
        background: '#fef9c3',
        border: '1px solid #fde047',
        borderRadius: 12,
        padding: '14px 18px',
        marginTop: 32,
        fontSize: 13,
        color: '#713f12',
        lineHeight: 1.6,
      }}>
        <strong>Uso responsable:</strong> La API es gratuita y sin autenticación. Te pedimos que no hagas más de
        30 requests por minuto. Si tenés un proyecto a gran escala, avisanos a{' '}
        <a href="mailto:hola@codito.com.ar" style={{ color: '#92400e' }}>hola@codito.com.ar</a>.
      </div>
    </div>
  )
}

function Section({ title, method, path, children }: {
  title: string
  method: string
  path: string
  children: React.ReactNode
}) {
  return (
    <div style={{
      background: '#ffffff',
      border: '1.5px solid #e4e4e7',
      borderRadius: 16,
      padding: '20px 24px',
      marginBottom: 20,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
        <h2 style={{ fontSize: 17, fontWeight: 800, color: '#09090b', letterSpacing: '-0.02em', margin: 0 }}>{title}</h2>
        {method && (
          <span style={{
            background: method === 'GET' ? '#dcfce7' : '#fef9c3',
            color: method === 'GET' ? '#15803d' : '#713f12',
            fontWeight: 800,
            fontSize: 11,
            padding: '2px 10px',
            borderRadius: 999,
            fontFamily: 'monospace',
          }}>{method}</span>
        )}
        {path && (
          <code style={{ fontSize: 13, color: '#52525b', background: '#f4f4f5', padding: '3px 10px', borderRadius: 8 }}>
            {path}
          </code>
        )}
      </div>
      {children}
    </div>
  )
}

function Param({ name, type, required, description }: {
  name: string; type: string; required?: boolean; description: string
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 8, fontSize: 13 }}>
      <code style={{ color: '#0284c7', fontWeight: 700, flexShrink: 0, background: '#f0f9ff', padding: '2px 8px', borderRadius: 6 }}>{name}</code>
      <span style={{ color: '#71717a', fontFamily: 'monospace', flexShrink: 0 }}>{type}</span>
      {required && <span style={{ color: '#ef4444', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>requerido</span>}
      <span style={{ color: '#52525b' }}>{description}</span>
    </div>
  )
}

function CodeBlock({ children }: { children: string }) {
  return (
    <pre style={{
      background: '#0c1a2e',
      color: '#e2e8f0',
      borderRadius: 12,
      padding: '16px 18px',
      fontSize: 13,
      lineHeight: 1.7,
      overflowX: 'auto',
      fontFamily: '"JetBrains Mono", "Fira Code", monospace',
      margin: 0,
    }}>
      {children}
    </pre>
  )
}
