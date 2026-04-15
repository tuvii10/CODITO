/**
 * Codito — Content Script
 * Detecta el título/nombre del producto en la página actual
 * e inyecta un botón flotante para comparar en Codito.
 */

(function () {
  'use strict'

  // Evitar inyectar dos veces
  if (document.getElementById('codito-fab')) return

  // ── Detectar nombre del producto ──────────────────────────────────────────

  function detectProductName() {
    // MercadoLibre
    const ml = document.querySelector('h1.ui-pdp-title')
    if (ml) return ml.textContent?.trim()

    // Fallback: og:title (funciona en Frávega, Garbarino, etc.)
    const og = document.querySelector('meta[property="og:title"]')
    if (og) {
      const content = og.getAttribute('content')?.trim()
      // Filtrar títulos genéricos
      if (content && content.length > 10 && !content.toLowerCase().includes('página principal')) {
        return content
      }
    }

    // Fallback: primer h1 de la página
    const h1 = document.querySelector('h1')
    if (h1 && h1.textContent && h1.textContent.trim().length > 5) {
      return h1.textContent.trim()
    }

    return null
  }

  // ── Crear botón flotante ──────────────────────────────────────────────────

  const fab = document.createElement('div')
  fab.id = 'codito-fab'
  fab.innerHTML = `
    <div id="codito-fab-btn" title="Comparar en Codito">
      <span id="codito-fab-icon">🛒</span>
      <span id="codito-fab-label">Comparar</span>
    </div>
  `

  const style = document.createElement('style')
  style.textContent = `
    #codito-fab {
      position: fixed;
      bottom: 24px;
      right: 24px;
      z-index: 2147483647;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    }
    #codito-fab-btn {
      display: flex;
      align-items: center;
      gap: 7px;
      background: linear-gradient(135deg, #f97316 0%, #ef4444 100%);
      color: #fff;
      font-size: 14px;
      font-weight: 800;
      padding: 12px 18px;
      border-radius: 999px;
      cursor: pointer;
      box-shadow: 0 6px 24px rgba(249,115,22,0.55);
      transition: transform 0.15s, box-shadow 0.15s;
      user-select: none;
      white-space: nowrap;
      letter-spacing: -0.01em;
    }
    #codito-fab-btn:hover {
      transform: translateY(-2px) scale(1.03);
      box-shadow: 0 10px 32px rgba(249,115,22,0.65);
    }
    #codito-fab-btn:active {
      transform: scale(0.97);
    }
    #codito-panel {
      position: fixed;
      bottom: 80px;
      right: 24px;
      width: min(360px, calc(100vw - 48px));
      background: #fff;
      border: 1.5px solid #e4e4e7;
      border-radius: 20px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.18);
      z-index: 2147483646;
      overflow: hidden;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      animation: codito-slide-in 0.2s ease;
    }
    @keyframes codito-slide-in {
      from { opacity: 0; transform: translateY(16px) scale(0.97); }
      to   { opacity: 1; transform: translateY(0) scale(1); }
    }
    #codito-panel-header {
      background: linear-gradient(135deg, #f97316 0%, #ef4444 100%);
      padding: 12px 16px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
    }
    #codito-panel-title {
      color: #fff;
      font-size: 15px;
      font-weight: 800;
      letter-spacing: -0.02em;
    }
    #codito-panel-close {
      background: rgba(255,255,255,0.2);
      border: none;
      color: #fff;
      width: 26px;
      height: 26px;
      border-radius: 999px;
      cursor: pointer;
      font-size: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    #codito-search-bar {
      display: flex;
      gap: 8px;
      padding: 12px 16px;
      border-bottom: 1px solid #f4f4f5;
    }
    #codito-input {
      flex: 1;
      border: 1.5px solid #e4e4e7;
      border-radius: 10px;
      padding: 8px 12px;
      font-size: 13px;
      outline: none;
      color: #09090b;
    }
    #codito-input:focus {
      border-color: #0284c7;
    }
    #codito-search-btn {
      background: linear-gradient(135deg, #0284c7, #0ea5e9);
      color: #fff;
      border: none;
      border-radius: 10px;
      padding: 8px 14px;
      font-size: 13px;
      font-weight: 700;
      cursor: pointer;
    }
    #codito-results {
      max-height: 320px;
      overflow-y: auto;
      padding: 8px 0;
    }
    .codito-result-item {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px 16px;
      text-decoration: none;
      color: inherit;
      transition: background 0.1s;
      border-bottom: 1px solid #f4f4f5;
    }
    .codito-result-item:hover {
      background: #f8fafc;
    }
    .codito-result-rank {
      font-size: 11px;
      font-weight: 800;
      color: #94a3b8;
      width: 18px;
      flex-shrink: 0;
    }
    .codito-result-rank.best {
      color: #0284c7;
    }
    .codito-result-info {
      flex: 1;
      min-width: 0;
    }
    .codito-result-name {
      font-size: 12px;
      font-weight: 600;
      color: #09090b;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .codito-result-store {
      font-size: 11px;
      color: #71717a;
      margin-top: 1px;
    }
    .codito-result-price {
      font-size: 15px;
      font-weight: 800;
      color: #0284c7;
      white-space: nowrap;
      flex-shrink: 0;
    }
    .codito-result-price.best {
      background: linear-gradient(135deg, #0284c7, #0ea5e9);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    #codito-loading {
      padding: 24px 16px;
      text-align: center;
      color: #71717a;
      font-size: 13px;
    }
    #codito-empty {
      padding: 24px 16px;
      text-align: center;
      color: #71717a;
      font-size: 13px;
    }
    #codito-footer {
      padding: 8px 16px;
      text-align: center;
      font-size: 11px;
      color: #94a3b8;
      border-top: 1px solid #f4f4f5;
    }
    #codito-footer a {
      color: #0284c7;
      text-decoration: none;
      font-weight: 600;
    }
  `

  document.head.appendChild(style)
  document.body.appendChild(fab)

  let panelOpen = false
  let panel = null

  function fmt(n) {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency', currency: 'ARS', maximumFractionDigits: 0,
    }).format(n)
  }

  function openPanel() {
    if (panel) { panel.remove(); panel = null }
    panelOpen = true

    panel = document.createElement('div')
    panel.id = 'codito-panel'

    const productName = detectProductName() ?? ''

    panel.innerHTML = `
      <div id="codito-panel-header">
        <span id="codito-panel-title">🛒 Codito</span>
        <button id="codito-panel-close">×</button>
      </div>
      <div id="codito-search-bar">
        <input id="codito-input" type="text" placeholder="Buscar producto..." value="${productName.replace(/"/g, '&quot;')}" />
        <button id="codito-search-btn">Buscar</button>
      </div>
      <div id="codito-results">
        <div id="codito-loading" style="display:none">Buscando...</div>
        <div id="codito-empty" style="display:none">No se encontraron resultados.</div>
      </div>
      <div id="codito-footer">
        Powered by <a href="https://codito.com.ar" target="_blank">codito.com.ar</a>
      </div>
    `

    document.body.appendChild(panel)

    panel.querySelector('#codito-panel-close').addEventListener('click', closePanel)
    panel.querySelector('#codito-search-btn').addEventListener('click', doSearch)
    panel.querySelector('#codito-input').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') doSearch()
    })

    // Auto-buscar si hay nombre de producto detectado
    if (productName.length > 3) {
      doSearch()
    }
  }

  function closePanel() {
    panelOpen = false
    if (panel) { panel.remove(); panel = null }
  }

  async function doSearch() {
    const input = panel?.querySelector('#codito-input')
    if (!input) return
    const q = input.value.trim()
    if (!q || q.length < 2) return

    const resultsEl = panel.querySelector('#codito-results')
    const loadingEl = panel.querySelector('#codito-loading')
    const emptyEl = panel.querySelector('#codito-empty')

    resultsEl.innerHTML = ''
    resultsEl.appendChild(loadingEl)
    resultsEl.appendChild(emptyEl)
    loadingEl.style.display = 'block'
    emptyEl.style.display = 'none'

    try {
      const res = await fetch(`https://codito.com.ar/api/search?q=${encodeURIComponent(q)}`)
      const data = await res.json()
      const results = data.results ?? []

      loadingEl.style.display = 'none'

      if (results.length === 0) {
        emptyEl.style.display = 'block'
        return
      }

      results.slice(0, 8).forEach((r, i) => {
        const item = document.createElement('a')
        item.className = 'codito-result-item'
        item.href = r.url ?? `https://codito.com.ar/?q=${encodeURIComponent(q)}`
        item.target = '_blank'
        item.rel = 'noopener noreferrer'
        item.innerHTML = `
          <span class="codito-result-rank ${i === 0 ? 'best' : ''}">#${i + 1}</span>
          <div class="codito-result-info">
            <div class="codito-result-name">${escHtml(r.name)}</div>
            <div class="codito-result-store">${escHtml(r.store_name)}</div>
          </div>
          <span class="codito-result-price ${i === 0 ? 'best' : ''}">${fmt(r.price)}</span>
        `
        resultsEl.appendChild(item)
      })
    } catch {
      loadingEl.style.display = 'none'
      emptyEl.textContent = 'Error al conectar con Codito.'
      emptyEl.style.display = 'block'
    }
  }

  function escHtml(str) {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
  }

  document.getElementById('codito-fab-btn').addEventListener('click', () => {
    if (panelOpen) {
      closePanel()
    } else {
      openPanel()
    }
  })

  // Cerrar panel al hacer clic fuera
  document.addEventListener('click', (e) => {
    if (panelOpen && panel && !panel.contains(e.target) && !fab.contains(e.target)) {
      closePanel()
    }
  })
})()
