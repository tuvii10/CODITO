'use strict'

const input = document.getElementById('search-input')
const btn = document.getElementById('search-btn')
const resultsEl = document.getElementById('results')
const loadingEl = document.getElementById('loading')
const emptyEl = document.getElementById('empty')
const errorEl = document.getElementById('error')

function fmt(n) {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency', currency: 'ARS', maximumFractionDigits: 0,
  }).format(n)
}

function escHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

async function doSearch() {
  const q = input.value.trim()
  if (!q || q.length < 2) return

  // Reset
  const items = resultsEl.querySelectorAll('.result-item')
  items.forEach(el => el.remove())
  loadingEl.style.display = 'block'
  emptyEl.style.display = 'none'
  errorEl.style.display = 'none'

  try {
    const res = await fetch(`https://codito.com.ar/api/search?q=${encodeURIComponent(q)}`)
    const data = await res.json()
    const results = data.results ?? []

    loadingEl.style.display = 'none'

    if (results.length === 0) {
      emptyEl.style.display = 'block'
      return
    }

    results.slice(0, 10).forEach((r, i) => {
      const item = document.createElement('a')
      item.className = 'result-item'
      item.href = r.url ?? `https://codito.com.ar/?q=${encodeURIComponent(q)}`
      item.target = '_blank'
      item.rel = 'noopener noreferrer'
      item.innerHTML = `
        <span class="rank ${i === 0 ? 'best' : ''}">#${i + 1}</span>
        <div class="info">
          <div class="name">${escHtml(r.name)}</div>
          <div class="store">${escHtml(r.store_name)}</div>
        </div>
        <span class="price">${fmt(r.price)}</span>
      `
      resultsEl.appendChild(item)
    })
  } catch {
    loadingEl.style.display = 'none'
    errorEl.style.display = 'block'
  }
}

btn.addEventListener('click', doSearch)
input.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') doSearch()
})

// Intentar autocompletar con la pestaña activa
chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
  const tab = tabs[0]
  if (!tab?.id) return

  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: () => {
      const ml = document.querySelector('h1.ui-pdp-title')
      if (ml) return ml.textContent?.trim()
      const og = document.querySelector('meta[property="og:title"]')
      if (og) {
        const c = og.getAttribute('content')?.trim()
        if (c && c.length > 10) return c
      }
      const h1 = document.querySelector('h1')
      if (h1?.textContent?.trim().length > 5) return h1.textContent.trim()
      return null
    },
  }).then((results) => {
    const name = results?.[0]?.result
    if (name) {
      input.value = name
      doSearch()
    }
  }).catch(() => {})
})
