'use client'

import Link from 'next/link'
import { useState, useEffect, useCallback } from 'react'

// ─── Productos de la canasta básica ─────────────────────────────────────────

type ProductoBase = {
  busqueda: string
  nombre: string
  emoji: string
  categoria: string
}

const CANASTA: ProductoBase[] = [
  { busqueda: 'leche entera 1 litro', nombre: 'Leche entera 1L', emoji: '🥛', categoria: 'Lácteos' },
  { busqueda: 'huevos docena', nombre: 'Huevos x12', emoji: '🥚', categoria: 'Lácteos' },
  { busqueda: 'pan lactal', nombre: 'Pan lactal', emoji: '🍞', categoria: 'Panadería' },
  { busqueda: 'aceite girasol 1.5 litros', nombre: 'Aceite girasol 1.5L', emoji: '🫒', categoria: 'Almacén' },
  { busqueda: 'arroz 1 kg', nombre: 'Arroz 1kg', emoji: '🍚', categoria: 'Almacén' },
  { busqueda: 'fideos spaghetti 500g', nombre: 'Fideos 500g', emoji: '🍝', categoria: 'Almacén' },
  { busqueda: 'azucar 1 kg', nombre: 'Azúcar 1kg', emoji: '🍬', categoria: 'Almacén' },
  { busqueda: 'yerba mate 1 kg', nombre: 'Yerba mate 1kg', emoji: '🧉', categoria: 'Almacén' },
  { busqueda: 'harina 000 1 kg', nombre: 'Harina 1kg', emoji: '🌾', categoria: 'Almacén' },
  { busqueda: 'carne picada comun', nombre: 'Carne picada 1kg', emoji: '🥩', categoria: 'Carnes' },
  { busqueda: 'pollo entero', nombre: 'Pollo entero 1kg', emoji: '🍗', categoria: 'Carnes' },
  { busqueda: 'papa kg', nombre: 'Papa 1kg', emoji: '🥔', categoria: 'Verduras' },
  { busqueda: 'tomate kg', nombre: 'Tomate 1kg', emoji: '🍅', categoria: 'Verduras' },
  { busqueda: 'cebolla kg', nombre: 'Cebolla 1kg', emoji: '🧅', categoria: 'Verduras' },
  { busqueda: 'banana kg', nombre: 'Banana 1kg', emoji: '🍌', categoria: 'Frutas' },
  { busqueda: 'jabon en polvo skip', nombre: 'Jabón en polvo', emoji: '🧼', categoria: 'Limpieza' },
  { busqueda: 'papel higienico 4 rollos', nombre: 'Papel higiénico x4', emoji: '🧻', categoria: 'Limpieza' },
  { busqueda: 'lavandina 1 litro', nombre: 'Lavandina 1L', emoji: '🫧', categoria: 'Limpieza' },
  { busqueda: 'coca cola 2.25', nombre: 'Coca-Cola 2.25L', emoji: '🥤', categoria: 'Bebidas' },
  { busqueda: 'agua mineral 2 litros', nombre: 'Agua mineral 2L', emoji: '💧', categoria: 'Bebidas' },
]

type ResultadoProducto = {
  nombre: string
  tienda: string
  tiendaLogo: string
  precio: number
  url: string | null
  image: string | null
}

type ProductoState = {
  loading: boolean
  resultado: ResultadoProducto | null
  error: boolean
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function fmt(n: number) {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency', currency: 'ARS', maximumFractionDigits: 0,
  }).format(n)
}

// ─── Componente ─────────────────────────────────────────────────────────────

export default function Changito() {
  const [estados, setEstados] = useState<Record<number, ProductoState>>({})
  const [buscando, setBuscando] = useState(false)
  const [progreso, setProgreso] = useState(0)
  const [terminado, setTerminado] = useState(false)

  const buscarProducto = useCallback(async (idx: number, busqueda: string): Promise<void> => {
    setEstados(prev => ({ ...prev, [idx]: { loading: true, resultado: null, error: false } }))

    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(busqueda)}`)
      const data = await res.json()
      const results = data.results || []

      // Tomar el más barato con precio > 0
      const validos = results.filter((r: { price: number }) => r.price > 0)

      if (validos.length > 0) {
        const mejor = validos[0] // ya vienen ordenados por precio
        setEstados(prev => ({
          ...prev,
          [idx]: {
            loading: false,
            error: false,
            resultado: {
              nombre: mejor.name,
              tienda: mejor.store_name,
              tiendaLogo: mejor.store_logo || '',
              precio: mejor.price,
              url: mejor.url,
              image: mejor.image,
            },
          },
        }))
      } else {
        setEstados(prev => ({ ...prev, [idx]: { loading: false, resultado: null, error: true } }))
      }
    } catch {
      setEstados(prev => ({ ...prev, [idx]: { loading: false, resultado: null, error: true } }))
    }
  }, [])

  const buscarTodos = useCallback(async () => {
    setBuscando(true)
    setTerminado(false)
    setProgreso(0)

    // Buscar de a 3 en paralelo para no sobrecargar
    for (let i = 0; i < CANASTA.length; i += 3) {
      const batch = CANASTA.slice(i, i + 3)
      await Promise.all(batch.map((p, j) => buscarProducto(i + j, p.busqueda)))
      setProgreso(Math.min(i + 3, CANASTA.length))
    }

    setBuscando(false)
    setTerminado(true)
  }, [buscarProducto])

  // Calcular total
  const productosEncontrados = Object.values(estados).filter(e => e.resultado)
  const totalCanasta = productosEncontrados.reduce((sum, e) => sum + (e.resultado?.precio || 0), 0)

  return (
    <div style={{ maxWidth: 680, margin: '0 auto' }}>

      {/* Back */}
      <div style={{ marginBottom: 20 }}>
        <Link href="/" style={{ fontSize: 13, fontWeight: 700, color: '#09090b', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6, background: '#f4f4f5', border: '1px solid #e4e4e7', borderRadius: 10, padding: '7px 14px' }}>
          ← Inicio
        </Link>
      </div>

      {/* Header */}
      <div style={{ marginBottom: 28, textAlign: 'center' }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          width: 64, height: 64, borderRadius: 20,
          background: 'linear-gradient(135deg, #f59e0b, #eab308)',
          fontSize: 30, marginBottom: 14,
          boxShadow: '0 8px 24px rgba(245,158,11,0.35)',
        }}>🛒</div>
        <h1 style={{ fontSize: 'clamp(24px, 6vw, 36px)', fontWeight: 900, color: '#09090b', letterSpacing: '-0.03em', marginBottom: 8 }}>
          Changito
        </h1>
        <p style={{ fontSize: 14, color: '#71717a', maxWidth: 440, margin: '0 auto', lineHeight: 1.5 }}>
          Tu canasta básica con precios reales. Buscamos el producto más barato en todas las tiendas.
        </p>
      </div>

      {/* Botón buscar */}
      {!terminado && (
        <div style={{
          background: '#fff', borderRadius: 20, padding: 'clamp(16px,4vw,24px)',
          border: '1px solid #e4e4e7', boxShadow: '0 2px 12px rgba(0,0,0,0.04)', marginBottom: 16,
          textAlign: 'center',
        }}>
          <p style={{ fontSize: 14, fontWeight: 700, color: '#09090b', marginBottom: 4 }}>
            {CANASTA.length} productos esenciales
          </p>
          <p style={{ fontSize: 12, color: '#71717a', marginBottom: 16 }}>
            Buscamos el precio más bajo de cada uno en tiempo real
          </p>

          {buscando ? (
            <div>
              <div style={{
                width: '100%', height: 8, borderRadius: 4, background: '#f4f4f5',
                overflow: 'hidden', marginBottom: 10,
              }}>
                <div style={{
                  height: '100%', borderRadius: 4,
                  background: 'linear-gradient(90deg, #f59e0b, #eab308)',
                  width: `${(progreso / CANASTA.length) * 100}%`,
                  transition: 'width 0.3s',
                }} />
              </div>
              <p style={{ fontSize: 13, color: '#71717a', fontWeight: 600 }}>
                Buscando precios... {progreso}/{CANASTA.length}
              </p>
            </div>
          ) : (
            <button onClick={buscarTodos} style={{
              padding: '14px 32px', borderRadius: 14,
              border: 'none',
              background: 'linear-gradient(135deg, #f59e0b, #eab308)',
              color: '#fff', fontSize: 16, fontWeight: 800,
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(245,158,11,0.4)',
              transition: 'transform 0.1s',
            }}>
              🔍 Buscar precios reales
            </button>
          )}
        </div>
      )}

      {/* Resumen total */}
      {terminado && productosEncontrados.length > 0 && (
        <div style={{
          background: 'linear-gradient(135deg, #fefce8, #fef9c3)',
          border: '2px solid #fde047',
          borderRadius: 20, padding: 'clamp(20px,5vw,28px)',
          marginBottom: 16, textAlign: 'center',
        }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
            Tu canasta básica más barata
          </p>
          <p style={{ fontSize: 'clamp(32px,8vw,48px)', fontWeight: 900, color: '#09090b', letterSpacing: '-0.03em', lineHeight: 1 }}>
            {fmt(totalCanasta)}
          </p>
          <p style={{ fontSize: 13, color: '#71717a', marginTop: 8 }}>
            {productosEncontrados.length} de {CANASTA.length} productos encontrados
          </p>
          <button onClick={buscarTodos} style={{
            marginTop: 12, padding: '10px 20px', borderRadius: 10,
            border: '1px solid #fde047', background: '#fff',
            fontSize: 13, fontWeight: 700, color: '#a16207', cursor: 'pointer',
          }}>
            🔄 Actualizar precios
          </button>
        </div>
      )}

      {/* Lista de productos */}
      {Object.keys(estados).length > 0 && (
        <div style={{ display: 'grid', gap: 10, marginBottom: 32 }}>
          {CANASTA.map((producto, idx) => {
            const estado = estados[idx]
            if (!estado) return null

            return (
              <div key={idx} style={{
                background: '#fff', borderRadius: 16,
                border: estado.resultado ? '1.5px solid #e4e4e7' : '1.5px solid #fecaca',
                padding: '14px 16px',
                boxShadow: '0 1px 4px rgba(0,0,0,0.03)',
              }}>
                {/* Loading */}
                {estado.loading && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontSize: 24 }}>{producto.emoji}</span>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: 14, fontWeight: 700, color: '#09090b', marginBottom: 2 }}>{producto.nombre}</p>
                      <p style={{ fontSize: 12, color: '#a1a1aa' }}>Buscando el más barato...</p>
                    </div>
                    <div style={{
                      width: 20, height: 20,
                      border: '3px solid #f4f4f5', borderTopColor: '#f59e0b',
                      borderRadius: '50%', animation: 'spin 0.8s linear infinite',
                    }} />
                    <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
                  </div>
                )}

                {/* Resultado encontrado */}
                {estado.resultado && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    {/* Imagen o emoji */}
                    <div style={{
                      width: 48, height: 48, borderRadius: 12, overflow: 'hidden',
                      background: '#fafafa', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0, border: '1px solid #f4f4f5',
                    }}>
                      {estado.resultado.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={estado.resultado.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <span style={{ fontSize: 24 }}>{producto.emoji}</span>
                      )}
                    </div>

                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{
                        fontSize: 13, fontWeight: 700, color: '#09090b', marginBottom: 2,
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}>
                        {estado.resultado.nombre}
                      </p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        {estado.resultado.tiendaLogo && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={estado.resultado.tiendaLogo} alt="" style={{ width: 14, height: 14, borderRadius: 3 }} />
                        )}
                        <span style={{
                          fontSize: 11, fontWeight: 700, color: '#fff',
                          background: '#16a34a', padding: '2px 8px', borderRadius: 6,
                        }}>
                          {estado.resultado.tienda}
                        </span>
                      </div>
                    </div>

                    {/* Precio + comprar */}
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <p style={{ fontSize: 18, fontWeight: 900, color: '#09090b', letterSpacing: '-0.02em', marginBottom: 4 }}>
                        {fmt(estado.resultado.precio)}
                      </p>
                      {estado.resultado.url && (
                        <a
                          href={estado.resultado.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            display: 'inline-block',
                            fontSize: 12, fontWeight: 800, color: '#fff',
                            background: 'linear-gradient(135deg, #f59e0b, #eab308)',
                            padding: '6px 14px', borderRadius: 8,
                            textDecoration: 'none',
                            boxShadow: '0 2px 8px rgba(245,158,11,0.3)',
                          }}
                        >
                          Comprar →
                        </a>
                      )}
                    </div>
                  </div>
                )}

                {/* Error */}
                {estado.error && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontSize: 24 }}>{producto.emoji}</span>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: 14, fontWeight: 700, color: '#09090b', marginBottom: 2 }}>{producto.nombre}</p>
                      <p style={{ fontSize: 12, color: '#dc2626' }}>No encontrado</p>
                    </div>
                    <Link
                      href={`/?q=${encodeURIComponent(producto.busqueda)}`}
                      style={{
                        fontSize: 12, fontWeight: 700, color: '#71717a',
                        background: '#f4f4f5', padding: '6px 12px', borderRadius: 8,
                        textDecoration: 'none', border: '1px solid #e4e4e7',
                      }}
                    >
                      Buscar manual
                    </Link>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Footer */}
      <p style={{ fontSize: 11, color: '#a1a1aa', textAlign: 'center', lineHeight: 1.6, marginBottom: 40 }}>
        Precios actualizados en tiempo real. Los precios pueden variar según disponibilidad y ubicación.
        Changito by Codito.
      </p>
    </div>
  )
}
