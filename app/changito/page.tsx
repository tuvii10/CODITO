'use client'

import Link from 'next/link'
import { useState } from 'react'

const PRODUCTOS = [
  { nombre: 'Leche entera 1L', precio: 1800, categoria: 'Lácteos', emoji: '🥛' },
  { nombre: 'Pan lactal', precio: 3200, categoria: 'Panadería', emoji: '🍞' },
  { nombre: 'Huevos x12', precio: 4500, categoria: 'Lácteos', emoji: '🥚' },
  { nombre: 'Aceite girasol 1.5L', precio: 3800, categoria: 'Almacén', emoji: '🫒' },
  { nombre: 'Arroz 1kg', precio: 1900, categoria: 'Almacén', emoji: '🍚' },
  { nombre: 'Fideos 500g', precio: 1200, categoria: 'Almacén', emoji: '🍝' },
  { nombre: 'Azúcar 1kg', precio: 1500, categoria: 'Almacén', emoji: '🍬' },
  { nombre: 'Yerba mate 1kg', precio: 5500, categoria: 'Almacén', emoji: '🧉' },
  { nombre: 'Harina 1kg', precio: 1100, categoria: 'Almacén', emoji: '🌾' },
  { nombre: 'Carne picada 1kg', precio: 7500, categoria: 'Carnes', emoji: '🥩' },
  { nombre: 'Pollo entero 1kg', precio: 4200, categoria: 'Carnes', emoji: '🍗' },
  { nombre: 'Papa 1kg', precio: 1800, categoria: 'Verduras', emoji: '🥔' },
  { nombre: 'Tomate 1kg', precio: 2500, categoria: 'Verduras', emoji: '🍅' },
  { nombre: 'Cebolla 1kg', precio: 1500, categoria: 'Verduras', emoji: '🧅' },
  { nombre: 'Banana 1kg', precio: 2200, categoria: 'Frutas', emoji: '🍌' },
  { nombre: 'Jabón en polvo 800g', precio: 4200, categoria: 'Limpieza', emoji: '🧼' },
  { nombre: 'Papel higiénico x4', precio: 3500, categoria: 'Limpieza', emoji: '🧻' },
  { nombre: 'Lavandina 1L', precio: 900, categoria: 'Limpieza', emoji: '🫧' },
  { nombre: 'Coca-Cola 2.25L', precio: 3200, categoria: 'Bebidas', emoji: '🥤' },
  { nombre: 'Agua mineral 2L', precio: 1200, categoria: 'Bebidas', emoji: '💧' },
]

const CATEGORIAS = ['Todos', 'Lácteos', 'Panadería', 'Almacén', 'Carnes', 'Verduras', 'Frutas', 'Limpieza', 'Bebidas']

const formatPrice = (n: number) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(n)

const canastaBasicaTotal = PRODUCTOS.reduce((sum, p) => sum + p.precio, 0)

export default function ChangitoPage() {
  const [cantidades, setCantidades] = useState<Record<number, number>>({})
  const [categoriaActiva, setCategoriaActiva] = useState('Todos')

  const setCantidad = (index: number, delta: number) => {
    setCantidades(prev => {
      const current = prev[index] || 0
      const next = Math.max(0, current + delta)
      return { ...prev, [index]: next }
    })
  }

  const productosFiltrados = categoriaActiva === 'Todos'
    ? PRODUCTOS
    : PRODUCTOS.filter(p => p.categoria === categoriaActiva)

  const totalProductos = Object.values(cantidades).reduce((sum, c) => sum + c, 0)
  const totalPrecio = PRODUCTOS.reduce((sum, p, i) => sum + p.precio * (cantidades[i] || 0), 0)

  return (
    <div style={{ minHeight: '100vh', background: '#fafafa' }}>
      <div style={{ maxWidth: 600, margin: '0 auto', padding: '18px 8px 120px 8px' }}>

        {/* Back button */}
        <Link href="/" style={{
          fontSize: 13,
          fontWeight: 700,
          background: '#f4f4f5',
          border: '1px solid #e4e4e7',
          borderRadius: 10,
          padding: '7px 14px',
          textDecoration: 'none',
          color: '#18181b',
          display: 'inline-block',
          marginBottom: 18,
        }}>
          ← Volver
        </Link>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{
            width: 64,
            height: 64,
            borderRadius: 18,
            background: 'linear-gradient(135deg, #f59e0b, #eab308)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 32,
            margin: '0 auto 12px auto',
            boxShadow: '0 4px 16px rgba(245,158,11,0.25)',
          }}>
            🛒
          </div>
          <h1 style={{
            fontSize: 'clamp(24px, 6vw, 36px)',
            fontWeight: 900,
            color: '#18181b',
            margin: '0 0 4px 0',
          }}>
            Changito
          </h1>
          <p style={{ color: '#71717a', fontSize: 14, margin: 0 }}>
            Armá tu canasta y calculá cuánto gastás
          </p>
        </div>

        {/* Canasta básica estimada */}
        <div style={{
          background: '#fff',
          borderRadius: 20,
          padding: 'clamp(16px,4vw,24px)',
          border: '1px solid #e4e4e7',
          boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
          marginBottom: 20,
        }}>
          <div style={{
            fontSize: 12,
            fontWeight: 700,
            color: '#71717a',
            textTransform: 'uppercase' as const,
            letterSpacing: '0.08em',
            marginBottom: 8,
          }}>
            Canasta básica estimada
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 'clamp(22px,5vw,30px)', fontWeight: 900, color: '#18181b' }}>
              {formatPrice(canastaBasicaTotal)}
            </span>
            <span style={{ fontSize: 13, color: '#a1a1aa' }}>
              ({PRODUCTOS.length} productos, 1 de cada uno)
            </span>
          </div>
          <p style={{ fontSize: 12, color: '#a1a1aa', margin: '10px 0 0 0', lineHeight: 1.5 }}>
            Precios estimados orientativos. Buscá el producto para ver el precio real.
          </p>
        </div>

        {/* Category tabs */}
        <div style={{
          display: 'flex',
          gap: 6,
          overflowX: 'auto',
          paddingBottom: 8,
          marginBottom: 16,
          WebkitOverflowScrolling: 'touch',
        }}>
          {CATEGORIAS.map(cat => (
            <button
              key={cat}
              onClick={() => setCategoriaActiva(cat)}
              style={{
                fontSize: 12,
                fontWeight: 700,
                padding: '7px 14px',
                borderRadius: 10,
                border: '1px solid #e4e4e7',
                background: categoriaActiva === cat ? '#18181b' : '#f4f4f5',
                color: categoriaActiva === cat ? '#fff' : '#71717a',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                flexShrink: 0,
                transition: 'all 0.15s ease',
              }}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Product list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {productosFiltrados.map(producto => {
            const realIndex = PRODUCTOS.indexOf(producto)
            const cantidad = cantidades[realIndex] || 0

            return (
              <div key={realIndex} style={{
                background: '#fff',
                borderRadius: 20,
                padding: 'clamp(16px,4vw,24px)',
                border: '1px solid #e4e4e7',
                boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  {/* Emoji */}
                  <div style={{
                    width: 44,
                    height: 44,
                    borderRadius: 12,
                    background: '#fef9c3',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 22,
                    flexShrink: 0,
                  }}>
                    {producto.emoji}
                  </div>

                  {/* Name + category + price */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 15, color: '#18181b' }}>
                      {producto.nombre}
                    </div>
                    <div style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: '#a1a1aa',
                      textTransform: 'uppercase' as const,
                      letterSpacing: '0.08em',
                      marginTop: 2,
                    }}>
                      {producto.categoria}
                    </div>
                    <div style={{ fontWeight: 900, fontSize: 17, color: '#f59e0b', marginTop: 4 }}>
                      {formatPrice(producto.precio)}
                    </div>
                  </div>

                  {/* Quantity selector */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                    <button
                      onClick={() => setCantidad(realIndex, -1)}
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 10,
                        border: '1px solid #e4e4e7',
                        background: '#f4f4f5',
                        fontSize: 18,
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#71717a',
                      }}
                    >
                      -
                    </button>
                    <span style={{
                      minWidth: 28,
                      textAlign: 'center',
                      fontWeight: 900,
                      fontSize: 16,
                      color: cantidad > 0 ? '#18181b' : '#a1a1aa',
                    }}>
                      {cantidad}
                    </span>
                    <button
                      onClick={() => setCantidad(realIndex, 1)}
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 10,
                        border: '1px solid #e4e4e7',
                        background: '#18181b',
                        fontSize: 18,
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#fff',
                      }}
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Search real price link */}
                <div style={{ marginTop: 10 }}>
                  <Link
                    href={`/?q=${encodeURIComponent(producto.nombre)}`}
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      color: '#f59e0b',
                      textDecoration: 'none',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                    }}
                  >
                    🔍 Buscar precio real
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Sticky bottom bar */}
      <div style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        background: '#18181b',
        borderTop: '1px solid #27272a',
        padding: '14px 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <div style={{ maxWidth: 600, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 20 }}>🛒</span>
            <span style={{ color: '#a1a1aa', fontSize: 14, fontWeight: 600 }}>
              Tu changito: <span style={{ color: '#fff', fontWeight: 900 }}>{totalProductos}</span> {totalProductos === 1 ? 'producto' : 'productos'}
            </span>
          </div>
          <span style={{ color: '#f59e0b', fontWeight: 900, fontSize: 'clamp(18px,4vw,22px)' }}>
            {formatPrice(totalPrecio)}
          </span>
        </div>
      </div>
    </div>
  )
}
