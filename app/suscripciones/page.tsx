'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

// ─── Tipos ────────────────────────────────────────────────────────────────────

type DolarRates = { blue: number | null; oficial: number | null; mep: number | null }

type Plan = {
  name: string
  usd?: number   // precio en USD (para servicios que cobran en dólares)
  ars?: number   // precio local en ARS (ya incluye IVA — es el precio final del sitio)
  highlight?: boolean
}

type Service = {
  id: string
  name: string
  icon: string
  category: string
  billing: 'ars' | 'usd'  // 'ars' = cobra en pesos directamente
  plans: Plan[]
  priceUrl: string          // URL de la página de precios oficial
  note?: string
}

// Condición fiscal del usuario ante AFIP
type FiscalProfile = 'consumidor_final' | 'monotributista' | 'responsable_inscripto'

// ─── Tasas impositivas vigentes (aprox. 2025, post-eliminación PAIS) ──────────
//
// Las percepciones se aplican sobre: USD × tipo_de_cambio_oficial
// Fuentes: RG AFIP 4815, normativa IIBB por provincia
// ⚠️ Estas tasas cambian con frecuencia. Verificar en afip.gob.ar.

const TAX_PROFILES: Record<FiscalProfile, { iva: number; afip: number; iibb: number; label: string; detail: string }> = {
  consumidor_final: {
    iva:  21,   // IVA: costo puro, no recuperable
    afip: 30,   // Percepción AFIP RG 4815: costo puro
    iibb: 3,    // Percepción IIBB (promedio, varía por provincia)
    label: 'Consumidor Final',
    detail: 'IVA 21% + Perc. AFIP ~30% + IIBB ~3% = costo total ~54% sobre el precio USD',
  },
  monotributista: {
    iva:  21,   // IVA: puede usarse como crédito fiscal en algunos casos
    afip: 35,   // Percepción AFIP: crédito fiscal (te lo devuelven en la declaración)
    iibb: 3,
    label: 'Monotributista',
    detail: 'IVA 21% + Perc. AFIP ~35% (crédito fiscal recuperable) + IIBB ~3%',
  },
  responsable_inscripto: {
    iva:  21,   // IVA: totalmente recuperable como crédito fiscal
    afip: 1,    // Percepción AFIP: nominal, recuperable
    iibb: 3,    // IIBB: depende del régimen
    label: 'Resp. Inscripto',
    detail: 'IVA 21% + Perc. AFIP ~1% + IIBB ~3%. La mayoría es crédito fiscal recuperable.',
  },
}

// ─── Datos: suscripciones ─────────────────────────────────────────────────────
//
// Precios ARS = precios locales APROXIMADOS tomados de los sitios oficiales.
// Verificar siempre en la URL indicada — cambian con la inflación.
// Precios USD = precio del plan en dólares según el sitio de cada servicio.

const SERVICES: Service[] = [
  // ── Streaming video ─────────────────────────────────────────────────────────
  {
    id: 'netflix', name: 'Netflix', icon: '🎬', category: 'Streaming', billing: 'ars',
    priceUrl: 'https://www.netflix.com/ar/signup/planform',
    plans: [
      { name: 'Básico con anuncios', ars: 4899 },
      { name: 'Estándar',            ars: 9499, highlight: true },
      { name: 'Premium',             ars: 14999 },
    ],
    note: 'Cobra directamente en pesos. El precio del sitio ya incluye IVA.',
  },
  {
    id: 'disney', name: 'Disney+', icon: '🏰', category: 'Streaming', billing: 'ars',
    priceUrl: 'https://www.disneyplus.com/es-ar/sign-up',
    plans: [
      { name: 'Estándar', ars: 6299, highlight: true },
      { name: 'Premium',  ars: 9999 },
    ],
    note: 'Cobra en pesos. Precio incluye IVA.',
  },
  {
    id: 'max', name: 'Max (HBO)', icon: '📺', category: 'Streaming', billing: 'ars',
    priceUrl: 'https://www.max.com/ar/es',
    plans: [
      { name: 'Con anuncios',  ars: 5699 },
      { name: 'Sin anuncios',  ars: 9199, highlight: true },
      { name: 'Ultimate',      ars: 12499 },
    ],
    note: 'Cobra en pesos. Precio incluye IVA.',
  },
  {
    id: 'prime', name: 'Amazon Prime', icon: '📦', category: 'Streaming', billing: 'ars',
    priceUrl: 'https://www.amazon.com.ar/prime',
    plans: [
      { name: 'Prime (video + envíos + music)', ars: 3999, highlight: true },
    ],
    note: 'Incluye Prime Video, Music y envíos gratis. Cobra en pesos.',
  },
  {
    id: 'appletv', name: 'Apple TV+', icon: '🍎', category: 'Streaming', billing: 'ars',
    priceUrl: 'https://www.apple.com/ar/apple-tv-plus/',
    plans: [
      { name: 'Individual', ars: 4999, highlight: true },
    ],
    note: 'Apple cobra en pesos a través de la App Store Argentina.',
  },
  {
    id: 'youtube', name: 'YouTube Premium', icon: '▶️', category: 'Streaming', billing: 'ars',
    priceUrl: 'https://www.youtube.com/premium',
    plans: [
      { name: 'Individual', ars: 2299, highlight: true },
      { name: 'Familiar',   ars: 3899 },
    ],
    note: 'Incluye YouTube Music. Cobra en pesos.',
  },
  {
    id: 'paramount', name: 'Paramount+', icon: '⭐', category: 'Streaming', billing: 'usd',
    priceUrl: 'https://www.paramountplus.com/ar/',
    plans: [
      { name: 'Essential',    usd: 7.99, highlight: true },
      { name: 'Con Showtime', usd: 12.99 },
    ],
    note: 'Cobra en USD. Se aplican impuestos argentinos.',
  },
  {
    id: 'crunchyroll', name: 'Crunchyroll', icon: '🎌', category: 'Streaming', billing: 'usd',
    priceUrl: 'https://www.crunchyroll.com/welcome/ar',
    plans: [
      { name: 'Fan',      usd: 7.99, highlight: true },
      { name: 'Mega Fan', usd: 9.99 },
    ],
    note: 'Cobra en USD. Se aplican impuestos argentinos.',
  },
  {
    id: 'mubi', name: 'MUBI', icon: '🎞️', category: 'Streaming', billing: 'usd',
    priceUrl: 'https://mubi.com/ar',
    plans: [{ name: 'Individual', usd: 10.99, highlight: true }],
    note: 'Cine de autor y festivales. Cobra en USD.',
  },
  {
    id: 'vix', name: 'ViX Premium', icon: '🌎', category: 'Streaming', billing: 'usd',
    priceUrl: 'https://www.vix.com/',
    plans: [{ name: 'Premium', usd: 6.99, highlight: true }],
    note: 'Contenido en español. Cobra en USD.',
  },
  {
    id: 'starzplay', name: 'Star+', icon: '🌟', category: 'Streaming', billing: 'ars',
    priceUrl: 'https://www.disneyplus.com/es-ar',
    plans: [{ name: 'Incluido en Disney+', ars: 0, highlight: true }],
    note: 'Fusionado con Disney+. Ya no se vende por separado en Argentina.',
  },

  // ── Música ───────────────────────────────────────────────────────────────────
  {
    id: 'spotify', name: 'Spotify', icon: '🟢', category: 'Música', billing: 'ars',
    priceUrl: 'https://www.spotify.com/ar/premium/',
    plans: [
      { name: 'Individual', ars: 3999,  highlight: true },
      { name: 'Duo',        ars: 4999 },
      { name: 'Familiar',   ars: 6299 },
    ],
    note: 'Cobra en pesos. Precio incluye IVA.',
  },
  {
    id: 'applemusic', name: 'Apple Music', icon: '🎵', category: 'Música', billing: 'ars',
    priceUrl: 'https://www.apple.com/ar/apple-music/',
    plans: [
      { name: 'Individual', ars: 3999, highlight: true },
      { name: 'Familiar',   ars: 5999 },
    ],
    note: 'Cobra en pesos a través de la App Store Argentina.',
  },
  {
    id: 'ytmusic', name: 'YouTube Music', icon: '🎶', category: 'Música', billing: 'ars',
    priceUrl: 'https://music.youtube.com/',
    plans: [
      { name: 'Individual', ars: 2299, highlight: true },
    ],
    note: 'Incluido con YouTube Premium.',
  },
  {
    id: 'tidal', name: 'Tidal', icon: '🌊', category: 'Música', billing: 'usd',
    priceUrl: 'https://tidal.com/pricing',
    plans: [
      { name: 'Individual', usd: 10.99, highlight: true },
      { name: 'HiFi Plus',  usd: 19.99 },
    ],
    note: 'Cobra en USD. Se aplican impuestos argentinos.',
  },
  {
    id: 'deezer', name: 'Deezer', icon: '🎧', category: 'Música', billing: 'usd',
    priceUrl: 'https://www.deezer.com/ar/offers/',
    plans: [
      { name: 'Individual', usd: 10.99, highlight: true },
      { name: 'Familiar',   usd: 16.99 },
    ],
    note: 'Cobra en USD. Se aplican impuestos argentinos.',
  },

  // ── Gaming ───────────────────────────────────────────────────────────────────
  {
    id: 'gamepass', name: 'Xbox Game Pass', icon: '🎮', category: 'Gaming', billing: 'ars',
    priceUrl: 'https://www.xbox.com/es-AR/xbox-game-pass',
    plans: [
      { name: 'PC Game Pass', ars: 3499 },
      { name: 'Ultimate',     ars: 5699, highlight: true },
    ],
    note: 'Microsoft cobra directamente en pesos en la tienda Argentina.',
  },
  {
    id: 'ps', name: 'PlayStation Plus', icon: '🕹️', category: 'Gaming', billing: 'usd',
    priceUrl: 'https://www.playstation.com/es-ar/ps-plus/',
    plans: [
      { name: 'Essential', usd: 9.99, highlight: true },
      { name: 'Extra',     usd: 14.99 },
      { name: 'Premium',   usd: 17.99 },
    ],
    note: 'Sony cobra en USD. Se aplican impuestos argentinos.',
  },
  {
    id: 'eaplay', name: 'EA Play', icon: '⚽', category: 'Gaming', billing: 'usd',
    priceUrl: 'https://www.ea.com/ea-play',
    plans: [
      { name: 'Individual', usd: 4.99, highlight: true },
      { name: 'Pro',        usd: 14.99 },
    ],
    note: 'Cobra en USD. Se aplican impuestos argentinos.',
  },
  {
    id: 'nintendo', name: 'Nintendo Online', icon: '🔴', category: 'Gaming', billing: 'usd',
    priceUrl: 'https://www.nintendo.com/es-ar/Nintendo-Switch/Nintendo-Switch-Online/Nintendo-Switch-Online-1369614.html',
    plans: [
      { name: 'Individual (mensualizado)', usd: 3.99, highlight: true },
      { name: 'Familiar (mensualizado)',   usd: 7.99 },
    ],
    note: 'Precio mensualizado del plan anual. Cobra en USD.',
  },
  {
    id: 'apparcade', name: 'Apple Arcade', icon: '🕹️', category: 'Gaming', billing: 'ars',
    priceUrl: 'https://www.apple.com/ar/apple-arcade/',
    plans: [{ name: 'Individual', ars: 2999, highlight: true }],
    note: 'Apple cobra en pesos a través de la App Store Argentina.',
  },
  {
    id: 'ubisoft', name: 'Ubisoft+', icon: '🎯', category: 'Gaming', billing: 'usd',
    priceUrl: 'https://www.ubisoft.com/es-ar/ubisoft-plus',
    plans: [
      { name: 'Classics', usd: 7.99, highlight: true },
      { name: 'Premium',  usd: 17.99 },
    ],
    note: 'Cobra en USD. Se aplican impuestos argentinos.',
  },
  {
    id: 'geforcenow', name: 'GeForce Now', icon: '☁️', category: 'Gaming', billing: 'usd',
    priceUrl: 'https://www.nvidia.com/es-la/geforce-now/plans/',
    plans: [
      { name: 'Priority',  usd: 9.99, highlight: true },
      { name: 'Ultimate',  usd: 19.99 },
    ],
    note: 'Cloud gaming. Cobra en USD. Se aplican impuestos argentinos.',
  },
  {
    id: 'chess', name: 'Chess.com', icon: '♟️', category: 'Gaming', billing: 'usd',
    priceUrl: 'https://www.chess.com/membership',
    plans: [
      { name: 'Gold',     usd: 6.99, highlight: true },
      { name: 'Platinum', usd: 15.99 },
    ],
    note: 'Cobra en USD. Se aplican impuestos argentinos.',
  },

  // ── Deportes ─────────────────────────────────────────────────────────────────
  {
    id: 'f1tv', name: 'F1 TV', icon: '🏎️', category: 'Deportes', billing: 'usd',
    priceUrl: 'https://f1tv.formula1.com/',
    plans: [
      { name: 'Access', usd: 2.99, highlight: true },
      { name: 'Pro',    usd: 9.99 },
    ],
    note: 'Carreras en vivo (Pro) o diferidas (Access). Cobra en USD.',
  },
  {
    id: 'nba', name: 'NBA League Pass', icon: '🏀', category: 'Deportes', billing: 'usd',
    priceUrl: 'https://www.nba.com/watch/league-pass-stream',
    plans: [
      { name: 'Individual', usd: 14.99, highlight: true },
      { name: 'Team',       usd: 9.99 },
    ],
    note: 'Cobra en USD. Se aplican impuestos argentinos.',
  },
  {
    id: 'ufc', name: 'UFC Fight Pass', icon: '🥊', category: 'Deportes', billing: 'usd',
    priceUrl: 'https://ufcfightpass.com/',
    plans: [{ name: 'Mensual', usd: 10.99, highlight: true }],
    note: 'Cobra en USD. Se aplican impuestos argentinos.',
  },
  {
    id: 'wwe', name: 'WWE Network', icon: '💪', category: 'Deportes', billing: 'usd',
    priceUrl: 'https://peacocktv.com/',
    plans: [{ name: 'Peacock Premium', usd: 7.99, highlight: true }],
    note: 'Disponible vía Peacock en USD. Se aplican impuestos argentinos.',
  },

  // ── IA ───────────────────────────────────────────────────────────────────────
  {
    id: 'claude', name: 'Claude Pro', icon: '🤖', category: 'IA', billing: 'usd',
    priceUrl: 'https://claude.ai/upgrade',
    plans: [
      { name: 'Pro', usd: 20, highlight: true },
      { name: 'Max (5x)', usd: 100 },
    ],
    note: 'Anthropic cobra en USD. Se aplican impuestos argentinos.',
  },
  {
    id: 'chatgpt', name: 'ChatGPT Plus', icon: '💬', category: 'IA', billing: 'usd',
    priceUrl: 'https://openai.com/chatgpt/pricing/',
    plans: [
      { name: 'Plus', usd: 20, highlight: true },
      { name: 'Pro',  usd: 200 },
    ],
    note: 'OpenAI cobra en USD. Se aplican impuestos argentinos.',
  },
  {
    id: 'perplexity', name: 'Perplexity', icon: '🔍', category: 'IA', billing: 'usd',
    priceUrl: 'https://www.perplexity.ai/pro',
    plans: [{ name: 'Pro', usd: 20, highlight: true }],
    note: 'Cobra en USD. Se aplican impuestos argentinos.',
  },
  {
    id: 'gemini', name: 'Gemini Advanced', icon: '✨', category: 'IA', billing: 'usd',
    priceUrl: 'https://one.google.com/about/ai-premium',
    plans: [{ name: 'Google One AI Premium', usd: 19.99, highlight: true }],
    note: 'Incluye Gemini Advanced + 2TB Google One. Cobra en USD.',
  },
  {
    id: 'copilot', name: 'Microsoft Copilot Pro', icon: '🪟', category: 'IA', billing: 'usd',
    priceUrl: 'https://www.microsoft.com/es-ar/microsoft-365/copilot/copilot-for-work',
    plans: [{ name: 'Pro', usd: 20, highlight: true }],
    note: 'Copilot en apps de Microsoft 365. Cobra en USD.',
  },
  {
    id: 'cursor', name: 'Cursor', icon: '⌨️', category: 'IA', billing: 'usd',
    priceUrl: 'https://www.cursor.com/pricing',
    plans: [
      { name: 'Pro',      usd: 20, highlight: true },
      { name: 'Business', usd: 40 },
    ],
    note: 'Editor con IA para programadores. Cobra en USD.',
  },
  {
    id: 'midjourney', name: 'Midjourney', icon: '🎨', category: 'IA', billing: 'usd',
    priceUrl: 'https://www.midjourney.com/account',
    plans: [
      { name: 'Basic',    usd: 10, highlight: true },
      { name: 'Standard', usd: 30 },
      { name: 'Pro',      usd: 60 },
    ],
    note: 'Generación de imágenes con IA. Cobra en USD.',
  },
  {
    id: 'grok', name: 'Grok (X Premium)', icon: '𝕏', category: 'IA', billing: 'usd',
    priceUrl: 'https://x.com/i/premium_sign_up',
    plans: [
      { name: 'Basic',   usd: 3, highlight: true },
      { name: 'Premium', usd: 8 },
      { name: 'Premium+',usd: 16 },
    ],
    note: 'Acceso a Grok incluido en planes Premium de X. Cobra en USD.',
  },

  // ── Productividad ─────────────────────────────────────────────────────────────
  {
    id: 'microsoft365', name: 'Microsoft 365', icon: '📊', category: 'Productividad', billing: 'usd',
    priceUrl: 'https://www.microsoft.com/es-ar/microsoft-365/personal-and-family',
    plans: [
      { name: 'Personal', usd: 6.99, highlight: true },
      { name: 'Familiar', usd: 9.99 },
    ],
    note: 'Word, Excel, PowerPoint, 1TB OneDrive. Cobra en USD.',
  },
  {
    id: 'gworkspace', name: 'Google Workspace', icon: '🔵', category: 'Productividad', billing: 'usd',
    priceUrl: 'https://workspace.google.com/intl/es-419/pricing/',
    plans: [
      { name: 'Starter (30GB)', usd: 6, highlight: true },
      { name: 'Standard (2TB)', usd: 12 },
    ],
    note: 'Gmail, Drive, Meet y más para equipos. Cobra en USD.',
  },
  {
    id: 'notion', name: 'Notion', icon: '📝', category: 'Productividad', billing: 'usd',
    priceUrl: 'https://www.notion.com/pricing',
    plans: [{ name: 'Plus', usd: 10, highlight: true }],
    note: 'Cobra en USD. Se aplican impuestos argentinos.',
  },
  {
    id: 'zoom', name: 'Zoom Pro', icon: '📹', category: 'Productividad', billing: 'usd',
    priceUrl: 'https://zoom.us/pricing',
    plans: [
      { name: 'Pro',      usd: 13.32, highlight: true },
      { name: 'Business', usd: 18.32 },
    ],
    note: 'Reuniones sin límite de tiempo. Cobra en USD.',
  },
  {
    id: 'slack', name: 'Slack Pro', icon: '💼', category: 'Productividad', billing: 'usd',
    priceUrl: 'https://slack.com/intl/es-la/pricing',
    plans: [
      { name: 'Pro',      usd: 7.25, highlight: true },
      { name: 'Business+', usd: 12.50 },
    ],
    note: 'Cobra en USD. Se aplican impuestos argentinos.',
  },
  {
    id: 'canva', name: 'Canva Pro', icon: '🖌️', category: 'Productividad', billing: 'usd',
    priceUrl: 'https://www.canva.com/pricing/',
    plans: [{ name: 'Pro', usd: 14.99, highlight: true }],
    note: 'Cobra en USD. Se aplican impuestos argentinos.',
  },
  {
    id: 'obsidian', name: 'Obsidian Sync', icon: '🔮', category: 'Productividad', billing: 'usd',
    priceUrl: 'https://obsidian.md/pricing',
    plans: [
      { name: 'Sync',       usd: 5, highlight: true },
      { name: 'Sync + Publish', usd: 21 },
    ],
    note: 'Add-on de sincronización para Obsidian (la app base es gratis). Cobra en USD.',
  },

  // ── Diseño y Dev ─────────────────────────────────────────────────────────────
  {
    id: 'adobe', name: 'Adobe CC', icon: '🅰️', category: 'Diseño & Dev', billing: 'usd',
    priceUrl: 'https://www.adobe.com/ar/creativecloud/plans.html',
    plans: [
      { name: 'Plan individual (app única)', usd: 29.99, highlight: true },
      { name: 'All Apps',                    usd: 54.99 },
    ],
    note: 'Cobra en USD. Precio varía según plan. Se aplican impuestos argentinos.',
  },
  {
    id: 'figma', name: 'Figma', icon: '🖼️', category: 'Diseño & Dev', billing: 'usd',
    priceUrl: 'https://www.figma.com/pricing/',
    plans: [
      { name: 'Professional', usd: 12, highlight: true },
      { name: 'Organization', usd: 45 },
    ],
    note: 'Cobra en USD. Se aplican impuestos argentinos.',
  },
  {
    id: 'github', name: 'GitHub Copilot', icon: '🐙', category: 'Diseño & Dev', billing: 'usd',
    priceUrl: 'https://github.com/features/copilot#pricing',
    plans: [
      { name: 'Pro',  usd: 10, highlight: true },
      { name: 'Pro+', usd: 39 },
    ],
    note: 'Cobra en USD. Se aplican impuestos argentinos.',
  },
  {
    id: 'jetbrains', name: 'JetBrains All Products', icon: '🧠', category: 'Diseño & Dev', billing: 'usd',
    priceUrl: 'https://www.jetbrains.com/store/',
    plans: [
      { name: 'All Products', usd: 24.90, highlight: true },
      { name: 'IDE individual', usd: 8.90 },
    ],
    note: 'Primer año. Cobra en USD. Se aplican impuestos argentinos.',
  },
  {
    id: 'vercel', name: 'Vercel Pro', icon: '▲', category: 'Diseño & Dev', billing: 'usd',
    priceUrl: 'https://vercel.com/pricing',
    plans: [{ name: 'Pro', usd: 20, highlight: true }],
    note: 'Hosting y deploy para frontend. Cobra en USD.',
  },
  {
    id: 'framer', name: 'Framer', icon: '🎯', category: 'Diseño & Dev', billing: 'usd',
    priceUrl: 'https://www.framer.com/pricing/',
    plans: [
      { name: 'Basic', usd: 5, highlight: true },
      { name: 'Pro',   usd: 15 },
    ],
    note: 'Diseño y publicación de sitios. Cobra en USD.',
  },

  // ── Almacenamiento ────────────────────────────────────────────────────────────
  {
    id: 'googleone', name: 'Google One', icon: '💾', category: 'Almacenamiento', billing: 'usd',
    priceUrl: 'https://one.google.com/about',
    plans: [
      { name: '100 GB',   usd: 1.99, highlight: true },
      { name: '200 GB',   usd: 2.99 },
      { name: '2 TB',     usd: 9.99 },
    ],
    note: 'Almacenamiento para Drive, Gmail y Fotos. Cobra en USD.',
  },
  {
    id: 'icloud', name: 'iCloud+', icon: '☁️', category: 'Almacenamiento', billing: 'ars',
    priceUrl: 'https://www.apple.com/ar/icloud/',
    plans: [
      { name: '50 GB',   ars: 699, highlight: true },
      { name: '200 GB',  ars: 1399 },
      { name: '2 TB',    ars: 4399 },
    ],
    note: 'Apple cobra en pesos a través de la App Store Argentina.',
  },
  {
    id: 'dropbox', name: 'Dropbox Plus', icon: '📦', category: 'Almacenamiento', billing: 'usd',
    priceUrl: 'https://www.dropbox.com/plans',
    plans: [{ name: 'Plus (2 TB)', usd: 9.99, highlight: true }],
    note: 'Cobra en USD. Se aplican impuestos argentinos.',
  },
  {
    id: 'onedrive', name: 'OneDrive', icon: '🗂️', category: 'Almacenamiento', billing: 'usd',
    priceUrl: 'https://www.microsoft.com/es-ar/microsoft-365/onedrive/compare-onedrive-plans',
    plans: [
      { name: '100 GB', usd: 1.99, highlight: true },
      { name: 'Microsoft 365 Personal (1TB)', usd: 6.99 },
    ],
    note: 'Cobra en USD. Se aplican impuestos argentinos.',
  },

  // ── Seguridad y Privacidad ─────────────────────────────────────────────────────
  {
    id: 'nordvpn', name: 'NordVPN', icon: '🛡️', category: 'Seguridad', billing: 'usd',
    priceUrl: 'https://nordvpn.com/es/pricing/',
    plans: [
      { name: 'Basic mensual',    usd: 12.99, highlight: true },
      { name: 'Complete mensual', usd: 14.99 },
    ],
    note: 'Con plan anual baja ~70%. Cobra en USD.',
  },
  {
    id: 'expressvpn', name: 'ExpressVPN', icon: '⚡', category: 'Seguridad', billing: 'usd',
    priceUrl: 'https://www.expressvpn.com/order',
    plans: [{ name: 'Mensual', usd: 12.95, highlight: true }],
    note: 'Con plan anual baja a ~$6.67/mes. Cobra en USD.',
  },
  {
    id: '1password', name: '1Password', icon: '🔑', category: 'Seguridad', billing: 'usd',
    priceUrl: 'https://1password.com/sign-up/',
    plans: [
      { name: 'Individual', usd: 2.99, highlight: true },
      { name: 'Familiar',   usd: 4.99 },
    ],
    note: 'Cobra en USD. Se aplican impuestos argentinos.',
  },
  {
    id: 'bitwarden', name: 'Bitwarden Premium', icon: '🔓', category: 'Seguridad', billing: 'usd',
    priceUrl: 'https://bitwarden.com/pricing/',
    plans: [{ name: 'Premium ($10/año)', usd: 0.83, highlight: true }],
    note: 'La versión gratis es muy completa. Premium = $10/año ≈ $0.83/mes. Cobra en USD.',
  },
  {
    id: 'proton', name: 'Proton Pass Plus', icon: '🔒', category: 'Seguridad', billing: 'usd',
    priceUrl: 'https://proton.me/pricing',
    plans: [
      { name: 'Pass Plus',     usd: 4.99, highlight: true },
      { name: 'Proton Unlimited', usd: 9.99 },
    ],
    note: 'Email, VPN, Drive y contraseñas cifradas. Cobra en USD.',
  },

  // ── Redes y Comunidad ─────────────────────────────────────────────────────────
  {
    id: 'discord', name: 'Discord Nitro', icon: '🎮', category: 'Redes & Comunidad', billing: 'usd',
    priceUrl: 'https://discord.com/nitro',
    plans: [
      { name: 'Basic', usd: 2.99, highlight: true },
      { name: 'Nitro', usd: 9.99 },
    ],
    note: 'Emoji custom, mejor calidad de video, etc. Cobra en USD.',
  },
  {
    id: 'telegram', name: 'Telegram Premium', icon: '✈️', category: 'Redes & Comunidad', billing: 'usd',
    priceUrl: 'https://t.me/premiumbot',
    plans: [{ name: 'Premium', usd: 4.99, highlight: true }],
    note: 'Sin límites de subida, stickers exclusivos. Cobra en USD.',
  },
  {
    id: 'linkedin', name: 'LinkedIn Premium', icon: '💼', category: 'Redes & Comunidad', billing: 'usd',
    priceUrl: 'https://www.linkedin.com/premium/products/',
    plans: [
      { name: 'Career',   usd: 29.99, highlight: true },
      { name: 'Business', usd: 59.99 },
    ],
    note: 'Cobra en USD. Se aplican impuestos argentinos.',
  },
  {
    id: 'twitch', name: 'Twitch Turbo', icon: '🟣', category: 'Redes & Comunidad', billing: 'usd',
    priceUrl: 'https://www.twitch.tv/turbo',
    plans: [{ name: 'Turbo', usd: 8.99, highlight: true }],
    note: 'Sin ads en toda la plataforma. Cobra en USD.',
  },

  // ── Educación ─────────────────────────────────────────────────────────────────
  {
    id: 'duolingo', name: 'Duolingo Super', icon: '🦉', category: 'Educación', billing: 'usd',
    priceUrl: 'https://www.duolingo.com/subscribe',
    plans: [
      { name: 'Super',  usd: 6.99, highlight: true },
      { name: 'Max',    usd: 13.99 },
    ],
    note: 'Sin ads, vidas ilimitadas. Cobra en USD.',
  },
  {
    id: 'kindle', name: 'Kindle Unlimited', icon: '📚', category: 'Educación', billing: 'usd',
    priceUrl: 'https://www.amazon.com.ar/kindle-dbs/ku/kuSignUp',
    plans: [{ name: 'Mensual', usd: 11.99, highlight: true }],
    note: 'Acceso a millones de libros. Cobra en USD.',
  },
  {
    id: 'audible', name: 'Audible', icon: '🎙️', category: 'Educación', billing: 'usd',
    priceUrl: 'https://www.audible.com.ar/',
    plans: [{ name: 'Plus', usd: 7.95, highlight: true }],
    note: '1 crédito de audiolibro por mes. Cobra en USD.',
  },
  {
    id: 'brilliant', name: 'Brilliant', icon: '🧮', category: 'Educación', billing: 'usd',
    priceUrl: 'https://brilliant.org/premium/',
    plans: [{ name: 'Premium', usd: 24.99, highlight: true }],
    note: 'Matemáticas, ciencia y programación interactiva. Cobra en USD.',
  },
]

const CATEGORIES = ['Todos', ...Array.from(new Set(SERVICES.map(s => s.category)))]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtARS(n: number) {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(n)
}

function fmtUSD(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(n)
}

// Cálculo real del costo con impuestos
function calcUsdToARS(usd: number, oficialRate: number, taxes: { iva: number; afip: number; iibb: number }) {
  const base = usd * oficialRate
  const iva  = base * (taxes.iva  / 100)
  const afip = base * (taxes.afip / 100)
  const iibb = base * (taxes.iibb / 100)
  return { base, iva, afip, iibb, total: base + iva + afip + iibb }
}

// ─── Página ───────────────────────────────────────────────────────────────────

export default function Suscripciones() {
  const [rates, setRates]       = useState<DolarRates>({ blue: null, oficial: null, mep: null })
  const [loadingRates, setLoadingRates] = useState(true)
  const [catFilter, setCatFilter]       = useState('Todos')
  const [fiscal, setFiscal]             = useState<FiscalProfile>('consumidor_final')
  const [customIIBB, setCustomIIBB]     = useState(3)

  useEffect(() => {
    fetch('/api/dolares')
      .then(r => r.json())
      .then((d: DolarRates) => { setRates(d); setLoadingRates(false) })
      .catch(() => setLoadingRates(false))
  }, [])

  const oficialRate = rates.oficial
  const profile     = TAX_PROFILES[fiscal]
  const taxes       = { iva: profile.iva, afip: profile.afip, iibb: customIIBB }
  const totalTaxPct = taxes.iva + taxes.afip + taxes.iibb

  const filteredServices = (catFilter === 'Todos' ? SERVICES : SERVICES.filter(s => s.category === catFilter))
  const arsServices      = filteredServices.filter(s => s.billing === 'ars')
  const usdServices      = filteredServices.filter(s => s.billing === 'usd')

  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      <div style={{ marginBottom: 20 }}>
        <Link href="/" style={{ fontSize: 13, color: '#71717a', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          ← Volver
        </Link>
      </div>

      {/* Hero */}
      <div style={{ marginBottom: 28, textAlign: 'center', padding: '0 8px' }}>
        <div style={{ fontSize: 48, marginBottom: 10 }}>💸</div>
        <h1 style={{ fontSize: 'clamp(24px, 6vw, 40px)', fontWeight: 900, color: '#09090b', letterSpacing: '-0.04em', lineHeight: 1.05, marginBottom: 8 }}>
          Lo que pagás sin darte cuenta
        </h1>
        <p style={{ fontSize: 14, color: '#71717a', maxWidth: 500, margin: '0 auto', lineHeight: 1.6 }}>
          Precios reales de todas las suscripciones en pesos, con el simulador de impuestos argentinos incluido.
        </p>
      </div>

      {/* Aviso general */}
      <div style={{
        background: '#fff7ed',
        border: '1.5px solid #fed7aa',
        borderRadius: 14,
        padding: '12px 16px',
        marginBottom: 20,
        fontSize: 12,
        color: '#92400e',
        lineHeight: 1.7,
        display: 'flex',
        gap: 10,
      }}>
        <span style={{ fontSize: 18, flexShrink: 0 }}>⚠️</span>
        <div>
          <strong>Precios orientativos — verificar antes de suscribirse.</strong><br />
          Los precios en pesos cambian con la inflación. Los servicios en USD incluyen impuestos argentinos
          (IVA, percepción AFIP, IIBB) que podés calcular abajo según tu condición fiscal.
          Siempre confirmar en el sitio oficial de cada servicio.
        </div>
      </div>

      {/* ── Panel: cotización + perfil fiscal ── */}
      <div style={{ background: '#fff', borderRadius: 20, border: '1px solid #e4e4e7', padding: '18px 20px', marginBottom: 16 }}>

        {/* Cotizaciones */}
        <p style={{ fontSize: 11, fontWeight: 700, color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
          💵 Cotización USD hoy
        </p>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
          {(['oficial', 'mep', 'blue'] as const).map(t => (
            <div key={t} style={{
              flex: 1, minWidth: 80, textAlign: 'center',
              background: t === 'oficial' ? '#eff6ff' : '#fafafa',
              border: `1.5px solid ${t === 'oficial' ? '#bfdbfe' : '#e4e4e7'}`,
              borderRadius: 12, padding: '10px 8px',
            }}>
              <p style={{ fontSize: 10, fontWeight: 700, color: t === 'oficial' ? '#1d4ed8' : '#71717a', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 4 }}>
                {t === 'oficial' ? 'Oficial ✓' : t === 'mep' ? 'MEP / bolsa' : 'Blue'}
              </p>
              <p style={{ fontSize: 17, fontWeight: 900, color: '#09090b', letterSpacing: '-0.03em', lineHeight: 1 }}>
                {loadingRates ? '—' : rates[t] ? fmtARS(rates[t]!) : '—'}
              </p>
            </div>
          ))}
        </div>

        {/* Perfil fiscal */}
        <p style={{ fontSize: 11, fontWeight: 700, color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
          🧾 Tu condición ante AFIP (para servicios en USD)
        </p>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
          {(Object.keys(TAX_PROFILES) as FiscalProfile[]).map(p => (
            <button key={p} onClick={() => setFiscal(p)} style={{
              flex: 1, minWidth: 120, padding: '8px 10px', borderRadius: 10,
              border: `1.5px solid ${fiscal === p ? '#0284c7' : '#e4e4e7'}`,
              background: fiscal === p ? '#eff6ff' : '#fafafa',
              color: fiscal === p ? '#0284c7' : '#71717a',
              fontSize: 12, fontWeight: 700, cursor: 'pointer', transition: 'all 0.15s',
            }}>
              {TAX_PROFILES[p].label}
            </button>
          ))}
        </div>

        {/* Desglose impuestos */}
        <div style={{ background: '#f8fafc', borderRadius: 12, padding: '12px 14px', fontSize: 12 }}>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 8 }}>
            <TaxBadge label="IVA" pct={taxes.iva} color="#0284c7" />
            <TaxBadge label="Perc. AFIP" pct={taxes.afip} color="#7c3aed"
              recoverable={fiscal !== 'consumidor_final'}
              recoverableNote={fiscal === 'monotributista' ? 'Crédito fiscal' : 'Crédito fiscal RI'} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <TaxBadge label="IIBB" pct={customIIBB} color="#b45309" />
              <span style={{ fontSize: 10, color: '#71717a' }}>prov.:</span>
              <input
                type="number"
                value={customIIBB}
                min={0} max={10} step={0.5}
                onChange={e => setCustomIIBB(parseFloat(e.target.value) || 0)}
                style={{ width: 44, border: '1px solid #e4e4e7', borderRadius: 6, padding: '2px 6px', fontSize: 12, outline: 'none' }}
              />
              <span style={{ fontSize: 10, color: '#71717a' }}>%</span>
            </div>
            <div style={{
              marginLeft: 'auto', background: '#09090b', color: '#fff',
              borderRadius: 8, padding: '4px 10px', fontSize: 12, fontWeight: 800,
              display: 'flex', alignItems: 'center', gap: 4,
            }}>
              Total: +{totalTaxPct}%
            </div>
          </div>
          <p style={{ fontSize: 10, color: '#71717a', lineHeight: 1.5 }}>
            {profile.detail}
            {' '}Las tasas son aprox. y pueden variar. Fuente: RG AFIP 4815 + normativas IIBB provinciales.
          </p>
        </div>
      </div>

      {/* Leyenda */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16, alignItems: 'center' }}>
        <span style={{ fontSize: 11, color: '#71717a', fontWeight: 600 }}>Referencias:</span>
        <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 999, background: '#f0fdf4', color: '#15803d', border: '1px solid #bbf7d0' }}>
          🏠 Precio local ARS
        </span>
        <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 999, background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe' }}>
          💵 Cobra en USD + impuestos
        </span>
        <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 999, background: '#fef9c3', color: '#854d0e', border: '1px solid #fde047' }}>
          ~ Precio aprox.
        </span>
      </div>

      {/* Filtro categorías */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 20 }}>
        {CATEGORIES.map(cat => (
          <button key={cat} onClick={() => setCatFilter(cat)} style={{
            padding: '6px 14px', borderRadius: 999,
            border: '1px solid #e4e4e7',
            background: catFilter === cat ? '#09090b' : '#fafafa',
            color: catFilter === cat ? '#fff' : '#71717a',
            fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s', whiteSpace: 'nowrap',
          }}>
            {cat}
          </button>
        ))}
      </div>

      {/* ── Servicios en ARS ── */}
      {arsServices.length > 0 && (
        <>
          <SectionDivider label="🏠 Cobran directamente en pesos argentinos" color="green" />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%,340px),1fr))', gap: 12, marginBottom: 28 }}>
            {arsServices.map(s => <ServiceCard key={s.id} service={s} oficialRate={oficialRate} taxes={taxes} />)}
          </div>
        </>
      )}

      {/* ── Servicios en USD ── */}
      {usdServices.length > 0 && (
        <>
          <SectionDivider label="💵 Cobran en USD — conversión oficial + impuestos" color="blue" />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%,340px),1fr))', gap: 12, marginBottom: 32 }}>
            {usdServices.map(s => <ServiceCard key={s.id} service={s} oficialRate={oficialRate} taxes={taxes} />)}
          </div>
        </>
      )}

      <p style={{ fontSize: 11, color: '#a1a1aa', textAlign: 'center', lineHeight: 1.6, marginBottom: 40 }}>
        Precios orientativos — última actualización aprox. abril 2025.<br />
        Los precios en ARS cambian con la inflación. Siempre verificar en el sitio oficial antes de suscribirse.
      </p>
    </div>
  )
}

// ─── ServiceCard ──────────────────────────────────────────────────────────────

function ServiceCard({ service, oficialRate, taxes }: {
  service: Service
  oficialRate: number | null
  taxes: { iva: number; afip: number; iibb: number }
}) {
  const [expanded, setExpanded] = useState(false)
  const [showBreakdown, setShowBreakdown] = useState(false)

  const mainPlan  = service.plans.find(p => p.highlight) ?? service.plans[0]
  const otherPlans = service.plans.filter(p => p !== mainPlan)
  const isARS     = service.billing === 'ars'

  function getDisplayPrice(plan: Plan): number | null {
    if (plan.ars !== undefined) return plan.ars
    if (plan.usd !== undefined && oficialRate) {
      return calcUsdToARS(plan.usd, oficialRate, taxes).total
    }
    return null
  }

  const mainPrice      = getDisplayPrice(mainPlan)
  const mainBreakdown  = (!isARS && mainPlan.usd && oficialRate)
    ? calcUsdToARS(mainPlan.usd, oficialRate, taxes)
    : null

  return (
    <div style={{
      background: '#fff',
      border: `1.5px solid ${isARS ? '#d1fae5' : '#dbeafe'}`,
      borderRadius: 18,
      overflow: 'hidden',
    }}>
      <div style={{ padding: '14px 16px' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 12 }}>
          <span style={{ fontSize: 24, flexShrink: 0, lineHeight: 1 }}>{service.icon}</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontWeight: 800, fontSize: 15, color: '#09090b', letterSpacing: '-0.01em' }}>{service.name}</p>
            <p style={{ fontSize: 11, color: '#71717a', marginTop: 1 }}>{service.category}</p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
            <span style={{
              fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 999,
              background: isARS ? '#f0fdf4' : '#eff6ff',
              color: isARS ? '#15803d' : '#1d4ed8',
              border: `1px solid ${isARS ? '#bbf7d0' : '#bfdbfe'}`,
            }}>
              {isARS ? '🏠 Local ARS' : '💵 USD'}
            </span>
            {isARS && (
              <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 999, background: '#fef9c3', color: '#854d0e', border: '1px solid #fde047' }}>
                ~ aprox.
              </span>
            )}
          </div>
        </div>

        {/* Precio principal */}
        <div style={{
          background: isARS ? '#f0fdf4' : '#f0f7ff',
          borderRadius: 12,
          padding: '12px 14px',
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 8 }}>
            <div style={{ minWidth: 0 }}>
              <p style={{ fontSize: 11, fontWeight: 600, color: '#71717a', marginBottom: 2 }}>{mainPlan.name}</p>
              {!isARS && mainPlan.usd !== undefined && (
                <p style={{ fontSize: 10, color: '#93c5fd', fontWeight: 600, marginBottom: 2 }}>
                  {fmtUSD(mainPlan.usd)} × oficial{oficialRate ? ` (${fmtARS(oficialRate)})` : ''} + {taxes.iva + taxes.afip + taxes.iibb}% impuestos
                </p>
              )}
              {isARS && (
                <p style={{ fontSize: 10, color: '#86efac', fontWeight: 600, marginBottom: 2 }}>
                  Precio local — sin conversión
                </p>
              )}
            </div>
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              {mainPrice !== null ? (
                <>
                  <p style={{ fontSize: 'clamp(20px,5vw,26px)', fontWeight: 900, color: '#09090b', letterSpacing: '-0.04em', lineHeight: 1 }}>
                    {fmtARS(mainPrice)}
                  </p>
                  <p style={{ fontSize: 9, color: '#a1a1aa', marginTop: 2 }}>/mes</p>
                </>
              ) : (
                <p style={{ fontSize: 13, color: '#a1a1aa', fontStyle: 'italic' }}>sin cotización</p>
              )}
            </div>
          </div>

          {/* Desglose impuestos (solo USD) */}
          {!isARS && mainBreakdown && (
            <>
              <button
                onClick={() => setShowBreakdown(v => !v)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 10, color: '#60a5fa', fontWeight: 600, marginTop: 8, padding: 0, display: 'flex', alignItems: 'center', gap: 3 }}
              >
                {showBreakdown ? '▲' : '▼'} Ver desglose de impuestos
              </button>
              {showBreakdown && (
                <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 3, fontSize: 11 }}>
                  <BreakdownRow label="Precio base (USD × oficial)" value={mainBreakdown.base} />
                  <BreakdownRow label={`IVA ${taxes.iva}%`} value={mainBreakdown.iva} />
                  <BreakdownRow label={`Perc. AFIP ${taxes.afip}%`} value={mainBreakdown.afip} />
                  <BreakdownRow label={`IIBB ${taxes.iibb}%`} value={mainBreakdown.iibb} />
                  <div style={{ borderTop: '1px solid #bfdbfe', paddingTop: 4, display: 'flex', justifyContent: 'space-between', fontWeight: 800, color: '#09090b' }}>
                    <span>Total estimado</span>
                    <span>{fmtARS(mainBreakdown.total)}</span>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Otros planes */}
      {otherPlans.length > 0 && (
        <>
          <button onClick={() => setExpanded(!expanded)} style={{
            width: '100%', padding: '8px 16px', background: '#fafafa', border: 'none',
            borderTop: '1px solid #f4f4f5', cursor: 'pointer', fontSize: 11, fontWeight: 600,
            color: '#71717a', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 4,
          }}>
            {expanded ? '▲' : '▼'} Ver {otherPlans.length} plan{otherPlans.length > 1 ? 'es' : ''} más
          </button>
          {expanded && (
            <div style={{ borderTop: '1px solid #f4f4f5' }}>
              {otherPlans.map(plan => {
                const price = getDisplayPrice(plan)
                return (
                  <div key={plan.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', borderBottom: '1px solid #f9f9f9', gap: 8 }}>
                    <div style={{ minWidth: 0 }}>
                      <p style={{ fontSize: 12, fontWeight: 600, color: '#09090b' }}>{plan.name}</p>
                      {!isARS && plan.usd !== undefined && (
                        <p style={{ fontSize: 10, color: '#a1a1aa', marginTop: 1 }}>{fmtUSD(plan.usd)}/mes base</p>
                      )}
                    </div>
                    {price !== null ? (
                      <p style={{ fontSize: 15, fontWeight: 800, color: '#09090b', letterSpacing: '-0.02em', whiteSpace: 'nowrap', flexShrink: 0 }}>
                        {fmtARS(price)}
                      </p>
                    ) : <p style={{ color: '#a1a1aa', fontSize: 13 }}>—</p>}
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}

      {/* Footer: nota + link */}
      <div style={{ padding: '8px 16px 12px', borderTop: '1px solid #f4f4f5', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
        {service.note && (
          <p style={{ fontSize: 10, color: '#a1a1aa', flex: 1, lineHeight: 1.5 }}>ℹ️ {service.note}</p>
        )}
        <a
          href={service.priceUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            fontSize: 10, fontWeight: 700, color: '#0284c7', textDecoration: 'none',
            background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 8,
            padding: '3px 10px', whiteSpace: 'nowrap', flexShrink: 0,
          }}
        >
          Ver precio oficial →
        </a>
      </div>
    </div>
  )
}

// ─── Subcomponentes ───────────────────────────────────────────────────────────

function TaxBadge({ label, pct, color, recoverable, recoverableNote }: {
  label: string; pct: number; color: string; recoverable?: boolean; recoverableNote?: string
}) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 999, background: `${color}15`, color, border: `1px solid ${color}40` }}>
      {label} {pct}%
      {recoverable && (
        <span style={{ fontSize: 9, background: '#f0fdf4', color: '#15803d', borderRadius: 999, padding: '1px 5px', fontWeight: 600 }}>
          {recoverableNote}
        </span>
      )}
    </span>
  )
}

function BreakdownRow({ label, value }: { label: string; value: number }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#52525b' }}>
      <span>{label}</span>
      <span style={{ fontWeight: 600 }}>{new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(value)}</span>
    </div>
  )
}

function SectionDivider({ label, color }: { label: string; color: 'green' | 'blue' }) {
  const c = color === 'green'
    ? { bg: '#f0fdf4', text: '#15803d', border: '#bbf7d0' }
    : { bg: '#eff6ff', text: '#1d4ed8', border: '#bfdbfe' }
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
      <div style={{ height: 1, flex: 1, background: '#e4e4e7' }} />
      <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 12px', borderRadius: 999, background: c.bg, color: c.text, border: `1px solid ${c.border}`, whiteSpace: 'nowrap' }}>
        {label}
      </span>
      <div style={{ height: 1, flex: 1, background: '#e4e4e7' }} />
    </div>
  )
}
