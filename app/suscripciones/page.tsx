'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

// ─── Tipos ────────────────────────────────────────────────────────────────────

type DolarRates = { blue: number | null; oficial: number | null; mep: number | null }

type Plan = {
  name: string
  usd?: number
  ars?: number
  highlight?: boolean
}

type Service = {
  id: string
  name: string
  icon: string
  category: string
  billing: 'ars' | 'usd'
  plans: Plan[]
  priceUrl: string
  note?: string
}

type FiscalProfile = 'consumidor_final' | 'monotributista' | 'responsable_inscripto'

// ─── Impuestos ─────────────────────────────────────────────────────────────────

const TAX_PROFILES: Record<FiscalProfile, { iva: number; afip: number; label: string; detail: string }> = {
  consumidor_final: {
    iva: 21, afip: 30,
    label: 'Consumidor Final',
    detail: 'IVA 21% + Perc. AFIP 30% son costos directos (no recuperables)',
  },
  monotributista: {
    iva: 21, afip: 35,
    label: 'Monotributista',
    detail: 'Perc. AFIP 35% se puede recuperar como crédito fiscal en la declaración',
  },
  responsable_inscripto: {
    iva: 21, afip: 1,
    label: 'Resp. Inscripto',
    detail: 'IVA y AFIP son casi totalmente recuperables como crédito fiscal',
  },
}

const PROVINCIAS_IIBB: { nombre: string; tasa: number }[] = [
  { nombre: 'Buenos Aires (PBA)', tasa: 3 },
  { nombre: 'CABA',               tasa: 3 },
  { nombre: 'Catamarca',          tasa: 3 },
  { nombre: 'Chaco',              tasa: 3 },
  { nombre: 'Chubut',             tasa: 1.5 },
  { nombre: 'Córdoba',            tasa: 3 },
  { nombre: 'Corrientes',         tasa: 3 },
  { nombre: 'Entre Ríos',         tasa: 3 },
  { nombre: 'Formosa',            tasa: 3 },
  { nombre: 'Jujuy',              tasa: 3 },
  { nombre: 'La Pampa',           tasa: 3 },
  { nombre: 'La Rioja',           tasa: 3 },
  { nombre: 'Mendoza',            tasa: 4 },
  { nombre: 'Misiones',           tasa: 3 },
  { nombre: 'Neuquén',            tasa: 3 },
  { nombre: 'Río Negro',          tasa: 3 },
  { nombre: 'Salta',              tasa: 3.5 },
  { nombre: 'San Juan',           tasa: 3 },
  { nombre: 'San Luis',           tasa: 3 },
  { nombre: 'Santa Cruz',         tasa: 3 },
  { nombre: 'Santa Fe',           tasa: 3 },
  { nombre: 'Santiago del Estero',tasa: 3 },
  { nombre: 'Tierra del Fuego',   tasa: 0 },
  { nombre: 'Tucumán',            tasa: 3 },
]

// ─── Catálogo de servicios ─────────────────────────────────────────────────────

const SERVICES: Service[] = [
  // ── Streaming ────────────────────────────────────────────────────────────────
  {
    id: 'netflix', name: 'Netflix', icon: '🎬', category: 'Streaming', billing: 'ars',
    priceUrl: 'https://www.netflix.com/ar/signup/planform',
    plans: [
      { name: 'Con anuncios', ars: 4899 },
      { name: 'Estándar',     ars: 9499, highlight: true },
      { name: 'Premium',      ars: 14999 },
    ],
    note: 'Cobra directamente en pesos. Precio incluye IVA.',
  },
  {
    id: 'disney', name: 'Disney+', icon: '🏰', category: 'Streaming', billing: 'ars',
    priceUrl: 'https://www.disneyplus.com/es-ar/sign-up',
    plans: [
      { name: 'Estándar', ars: 6299, highlight: true },
      { name: 'Premium',  ars: 9999 },
    ],
    note: 'Incluye contenido Star (series, películas adultas). Cobra en pesos.',
  },
  {
    id: 'max', name: 'Max (HBO)', icon: '📺', category: 'Streaming', billing: 'ars',
    priceUrl: 'https://www.max.com/ar/es',
    plans: [
      { name: 'Con anuncios', ars: 5699 },
      { name: 'Sin anuncios', ars: 9199, highlight: true },
      { name: 'Ultimate',     ars: 12499 },
    ],
    note: 'Cobra en pesos. Precio incluye IVA.',
  },
  {
    id: 'prime', name: 'Amazon Prime', icon: '📦', category: 'Streaming', billing: 'ars',
    priceUrl: 'https://www.amazon.com.ar/prime',
    plans: [
      { name: 'Prime (video + envíos + music)', ars: 3999, highlight: true },
    ],
    note: 'Incluye Prime Video, Music y envíos gratis en Amazon.com.ar.',
  },
  {
    id: 'appletv', name: 'Apple TV+', icon: '🍎', category: 'Streaming', billing: 'ars',
    priceUrl: 'https://www.apple.com/ar/apple-tv-plus/',
    plans: [
      { name: 'Individual', ars: 4999, highlight: true },
    ],
    note: 'Cobra en pesos via App Store Argentina.',
  },
  {
    id: 'youtube', name: 'YouTube Premium', icon: '▶️', category: 'Streaming', billing: 'ars',
    priceUrl: 'https://www.youtube.com/premium',
    plans: [
      { name: 'Individual', ars: 2299, highlight: true },
      { name: 'Familiar',   ars: 3899 },
    ],
    note: 'Incluye YouTube Music. Sin publicidad. Cobra en pesos.',
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
    note: 'Anime. Cobra en USD. Se aplican impuestos argentinos.',
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
    note: 'Contenido en español/latinoamericano. Cobra en USD.',
  },

  // ── Música ───────────────────────────────────────────────────────────────────
  {
    id: 'spotify', name: 'Spotify', icon: '🟢', category: 'Música', billing: 'ars',
    priceUrl: 'https://www.spotify.com/ar/premium/',
    plans: [
      { name: 'Individual', ars: 3999, highlight: true },
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
    note: 'Cobra en pesos via App Store Argentina.',
  },
  {
    id: 'ytmusic', name: 'YouTube Music', icon: '🎶', category: 'Música', billing: 'ars',
    priceUrl: 'https://music.youtube.com/',
    plans: [
      { name: 'Individual', ars: 2299, highlight: true },
    ],
    note: 'Incluido con YouTube Premium. También disponible por separado.',
  },
  {
    id: 'tidal', name: 'Tidal', icon: '🌊', category: 'Música', billing: 'usd',
    priceUrl: 'https://tidal.com/pricing',
    plans: [
      { name: 'Individual', usd: 10.99, highlight: true },
      { name: 'HiFi Plus',  usd: 19.99 },
    ],
    note: 'Audio lossless/HiFi. Cobra en USD.',
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
    note: 'Microsoft cobra en pesos. Ultimate incluye Xbox + PC + EA Play.',
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
    note: 'Acceso a biblioteca EA. Incluido en Xbox Game Pass Ultimate.',
  },
  {
    id: 'nintendo', name: 'Nintendo Online', icon: '🔴', category: 'Gaming', billing: 'usd',
    priceUrl: 'https://www.nintendo.com/es-ar/Nintendo-Switch/Nintendo-Switch-Online/Nintendo-Switch-Online-1369614.html',
    plans: [
      { name: 'Individual (mensualizado)',    usd: 3.99, highlight: true },
      { name: 'Familiar (mensualizado)',      usd: 7.99 },
      { name: 'Expansion Pack (mensualizado)',usd: 6.67 },
    ],
    note: 'Precio mensualizado del plan anual. Cobra en USD.',
  },
  {
    id: 'apparcade', name: 'Apple Arcade', icon: '🕹️', category: 'Gaming', billing: 'ars',
    priceUrl: 'https://www.apple.com/ar/apple-arcade/',
    plans: [{ name: 'Individual', ars: 2999, highlight: true }],
    note: 'Juegos sin compras in-app ni publicidad. Cobra en pesos via App Store.',
  },
  {
    id: 'ubisoft', name: 'Ubisoft+', icon: '🎯', category: 'Gaming', billing: 'usd',
    priceUrl: 'https://www.ubisoft.com/es-ar/ubisoft-plus',
    plans: [
      { name: 'Classics', usd: 7.99, highlight: true },
      { name: 'Premium',  usd: 17.99 },
    ],
    note: 'Acceso a catálogo Ubisoft. Cobra en USD.',
  },
  {
    id: 'geforcenow', name: 'GeForce Now', icon: '☁️', category: 'Gaming', billing: 'usd',
    priceUrl: 'https://www.nvidia.com/es-la/geforce-now/plans/',
    plans: [
      { name: 'Priority',  usd: 9.99, highlight: true },
      { name: 'Ultimate',  usd: 19.99 },
    ],
    note: 'Cloud gaming en streaming. No requiere PC gamer. Cobra en USD.',
  },
  {
    id: 'chess', name: 'Chess.com', icon: '♟️', category: 'Gaming', billing: 'usd',
    priceUrl: 'https://www.chess.com/membership',
    plans: [
      { name: 'Gold',     usd: 6.99, highlight: true },
      { name: 'Platinum', usd: 15.99 },
    ],
    note: 'Plataforma de ajedrez online. Cobra en USD.',
  },

  // ── Deportes ─────────────────────────────────────────────────────────────────
  {
    id: 'f1tv', name: 'F1 TV', icon: '🏎️', category: 'Deportes', billing: 'usd',
    priceUrl: 'https://f1tv.formula1.com/',
    plans: [
      { name: 'Access', usd: 2.99, highlight: true },
      { name: 'Pro',    usd: 9.99 },
    ],
    note: 'Pro = carreras en vivo. Access = diferidas. Cobra en USD.',
  },
  {
    id: 'nba', name: 'NBA League Pass', icon: '🏀', category: 'Deportes', billing: 'usd',
    priceUrl: 'https://www.nba.com/watch/league-pass-stream',
    plans: [
      { name: 'Team',       usd: 9.99 },
      { name: 'Individual', usd: 14.99, highlight: true },
    ],
    note: 'Todos los partidos de la NBA. Cobra en USD.',
  },
  {
    id: 'ufc', name: 'UFC Fight Pass', icon: '🥊', category: 'Deportes', billing: 'usd',
    priceUrl: 'https://ufcfightpass.com/',
    plans: [{ name: 'Mensual', usd: 10.99, highlight: true }],
    note: 'Eventos y archivo completo UFC. Cobra en USD.',
  },
  {
    id: 'wwe', name: 'WWE Network', icon: '💪', category: 'Deportes', billing: 'usd',
    priceUrl: 'https://peacocktv.com/',
    plans: [{ name: 'Peacock Premium', usd: 7.99, highlight: true }],
    note: 'Disponible vía Peacock (EE.UU.). Cobra en USD.',
  },

  // ── IA ───────────────────────────────────────────────────────────────────────
  {
    id: 'chatgpt', name: 'ChatGPT Plus', icon: '💬', category: 'IA', billing: 'usd',
    priceUrl: 'https://openai.com/chatgpt/pricing/',
    plans: [
      { name: 'Plus', usd: 20, highlight: true },
      { name: 'Pro',  usd: 200 },
    ],
    note: 'GPT-4o, DALL·E, generación de código. Cobra en USD.',
  },
  {
    id: 'claude', name: 'Claude Pro', icon: '🤖', category: 'IA', billing: 'usd',
    priceUrl: 'https://claude.ai/upgrade',
    plans: [
      { name: 'Pro',     usd: 20, highlight: true },
      { name: 'Max (5x)',usd: 100 },
    ],
    note: 'Claude Sonnet/Opus. Cobra en USD.',
  },
  {
    id: 'gemini', name: 'Gemini Advanced', icon: '✨', category: 'IA', billing: 'usd',
    priceUrl: 'https://one.google.com/about/ai-premium',
    plans: [{ name: 'Google One AI Premium', usd: 19.99, highlight: true }],
    note: 'Incluye Gemini 1.5 Pro + 2 TB Google One. Cobra en USD.',
  },
  {
    id: 'perplexity', name: 'Perplexity', icon: '🔍', category: 'IA', billing: 'usd',
    priceUrl: 'https://www.perplexity.ai/pro',
    plans: [{ name: 'Pro', usd: 20, highlight: true }],
    note: 'Búsqueda con IA, fuentes verificadas. Cobra en USD.',
  },
  {
    id: 'copilot', name: 'Microsoft Copilot Pro', icon: '🪟', category: 'IA', billing: 'usd',
    priceUrl: 'https://www.microsoft.com/es-ar/microsoft-365/copilot/copilot-for-work',
    plans: [{ name: 'Pro', usd: 20, highlight: true }],
    note: 'Copilot integrado en Word, Excel, PowerPoint. Cobra en USD.',
  },
  {
    id: 'cursor', name: 'Cursor', icon: '⌨️', category: 'IA', billing: 'usd',
    priceUrl: 'https://www.cursor.com/pricing',
    plans: [
      { name: 'Pro',      usd: 20, highlight: true },
      { name: 'Business', usd: 40 },
    ],
    note: 'Editor de código con IA. Muy usado por programadores. Cobra en USD.',
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
      { name: 'Basic',    usd: 3, highlight: true },
      { name: 'Premium',  usd: 8 },
      { name: 'Premium+', usd: 16 },
    ],
    note: 'Acceso a Grok incluido en planes Premium de X (Twitter). Cobra en USD.',
  },

  // ── Productividad ─────────────────────────────────────────────────────────────
  {
    id: 'microsoft365', name: 'Microsoft 365', icon: '📊', category: 'Productividad', billing: 'usd',
    priceUrl: 'https://www.microsoft.com/es-ar/microsoft-365/personal-and-family',
    plans: [
      { name: 'Personal (1 persona, 1 TB)', usd: 6.99, highlight: true },
      { name: 'Familiar (6 personas, 6 TB)',usd: 9.99 },
    ],
    note: 'Word, Excel, PowerPoint + OneDrive 1 TB. Cobra en USD.',
  },
  {
    id: 'gworkspace', name: 'Google Workspace', icon: '🔵', category: 'Productividad', billing: 'usd',
    priceUrl: 'https://workspace.google.com/intl/es-419/pricing/',
    plans: [
      { name: 'Starter (30 GB)', usd: 6,  highlight: true },
      { name: 'Standard (2 TB)', usd: 12 },
    ],
    note: 'Gmail, Drive, Meet y más para equipos/profesionales. Cobra en USD.',
  },
  {
    id: 'notion', name: 'Notion', icon: '📝', category: 'Productividad', billing: 'usd',
    priceUrl: 'https://www.notion.com/pricing',
    plans: [{ name: 'Plus', usd: 10, highlight: true }],
    note: 'Notas, base de datos, wikis. Cobra en USD.',
  },
  {
    id: 'zoom', name: 'Zoom Pro', icon: '📹', category: 'Productividad', billing: 'usd',
    priceUrl: 'https://zoom.us/pricing',
    plans: [
      { name: 'Pro',      usd: 13.32, highlight: true },
      { name: 'Business', usd: 18.32 },
    ],
    note: 'Reuniones sin límite de 40 min. Cobra en USD.',
  },
  {
    id: 'slack', name: 'Slack Pro', icon: '💼', category: 'Productividad', billing: 'usd',
    priceUrl: 'https://slack.com/intl/es-la/pricing',
    plans: [
      { name: 'Pro',       usd: 7.25, highlight: true },
      { name: 'Business+', usd: 12.50 },
    ],
    note: 'Mensajería para equipos. Historial ilimitado en Pro. Cobra en USD.',
  },
  {
    id: 'canva', name: 'Canva Pro', icon: '🖌️', category: 'Productividad', billing: 'usd',
    priceUrl: 'https://www.canva.com/pricing/',
    plans: [{ name: 'Pro', usd: 14.99, highlight: true }],
    note: 'Diseño gráfico fácil. Cobra en USD.',
  },
  {
    id: 'obsidian', name: 'Obsidian Sync', icon: '🔮', category: 'Productividad', billing: 'usd',
    priceUrl: 'https://obsidian.md/pricing',
    plans: [
      { name: 'Sync',            usd: 5, highlight: true },
      { name: 'Sync + Publish',  usd: 21 },
    ],
    note: 'Sincronización para Obsidian (app base gratuita). Cobra en USD.',
  },

  // ── Diseño & Dev ─────────────────────────────────────────────────────────────
  {
    id: 'adobe', name: 'Adobe CC', icon: '🅰️', category: 'Diseño & Dev', billing: 'usd',
    priceUrl: 'https://www.adobe.com/ar/creativecloud/plans.html',
    plans: [
      { name: 'App única',  usd: 29.99, highlight: true },
      { name: 'All Apps',   usd: 54.99 },
    ],
    note: 'Photoshop, Illustrator, Premiere, etc. Cobra en USD.',
  },
  {
    id: 'figma', name: 'Figma', icon: '🖼️', category: 'Diseño & Dev', billing: 'usd',
    priceUrl: 'https://www.figma.com/pricing/',
    plans: [
      { name: 'Professional', usd: 12, highlight: true },
      { name: 'Organization', usd: 45 },
    ],
    note: 'Diseño de interfaces y prototipado colaborativo. Cobra en USD.',
  },
  {
    id: 'github', name: 'GitHub Copilot', icon: '🐙', category: 'Diseño & Dev', billing: 'usd',
    priceUrl: 'https://github.com/features/copilot#pricing',
    plans: [
      { name: 'Pro',  usd: 10, highlight: true },
      { name: 'Pro+', usd: 39 },
    ],
    note: 'Autocompletado con IA en el editor. Cobra en USD.',
  },
  {
    id: 'jetbrains', name: 'JetBrains All Products', icon: '🧠', category: 'Diseño & Dev', billing: 'usd',
    priceUrl: 'https://www.jetbrains.com/store/',
    plans: [
      { name: 'All Products',  usd: 24.90, highlight: true },
      { name: 'IDE individual',usd: 8.90 },
    ],
    note: 'Precio del primer año. Baja al renovar. Cobra en USD.',
  },
  {
    id: 'vercel', name: 'Vercel Pro', icon: '▲', category: 'Diseño & Dev', billing: 'usd',
    priceUrl: 'https://vercel.com/pricing',
    plans: [{ name: 'Pro', usd: 20, highlight: true }],
    note: 'Hosting y deploy para frontend/Next.js. Cobra en USD.',
  },
  {
    id: 'framer', name: 'Framer', icon: '🎯', category: 'Diseño & Dev', billing: 'usd',
    priceUrl: 'https://www.framer.com/pricing/',
    plans: [
      { name: 'Basic', usd: 5, highlight: true },
      { name: 'Pro',   usd: 15 },
    ],
    note: 'Diseño y publicación de sitios sin código. Cobra en USD.',
  },

  // ── Almacenamiento ────────────────────────────────────────────────────────────
  {
    id: 'googleone', name: 'Google One', icon: '💾', category: 'Almacenamiento', billing: 'usd',
    priceUrl: 'https://one.google.com/about',
    plans: [
      { name: '100 GB', usd: 1.99, highlight: true },
      { name: '200 GB', usd: 2.99 },
      { name: '2 TB',   usd: 9.99 },
    ],
    note: 'Almacenamiento para Drive, Gmail y Fotos. Cobra en USD.',
  },
  {
    id: 'icloud', name: 'iCloud+', icon: '☁️', category: 'Almacenamiento', billing: 'ars',
    priceUrl: 'https://www.apple.com/ar/icloud/',
    plans: [
      { name: '50 GB',  ars: 699,  highlight: true },
      { name: '200 GB', ars: 1399 },
      { name: '2 TB',   ars: 4399 },
    ],
    note: 'Almacenamiento para fotos, backups y iCloud Drive. Cobra en pesos.',
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
      { name: '100 GB',                         usd: 1.99, highlight: true },
      { name: 'Microsoft 365 Personal (1 TB)',   usd: 6.99 },
    ],
    note: 'Cobra en USD. Incluido en Microsoft 365.',
  },

  // ── Seguridad ─────────────────────────────────────────────────────────────────
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
    id: 'surfshark', name: 'Surfshark', icon: '🦈', category: 'Seguridad', billing: 'usd',
    priceUrl: 'https://surfshark.com/pricing',
    plans: [
      { name: 'Starter mensual', usd: 15.45, highlight: true },
      { name: 'One mensual',     usd: 17.95 },
    ],
    note: 'Dispositivos ilimitados. Con plan 2 años baja mucho. Cobra en USD.',
  },
  {
    id: '1password', name: '1Password', icon: '🔑', category: 'Seguridad', billing: 'usd',
    priceUrl: 'https://1password.com/sign-up/',
    plans: [
      { name: 'Individual', usd: 2.99, highlight: true },
      { name: 'Familiar',   usd: 4.99 },
    ],
    note: 'Gestor de contraseñas. Cobra en USD.',
  },
  {
    id: 'bitwarden', name: 'Bitwarden Premium', icon: '🔓', category: 'Seguridad', billing: 'usd',
    priceUrl: 'https://bitwarden.com/pricing/',
    plans: [{ name: 'Premium ($10/año)', usd: 0.83, highlight: true }],
    note: 'La versión gratis ya es muy completa. Premium = $10/año ≈ $0.83/mes. Cobra en USD.',
  },
  {
    id: 'proton', name: 'Proton Unlimited', icon: '🔒', category: 'Seguridad', billing: 'usd',
    priceUrl: 'https://proton.me/pricing',
    plans: [
      { name: 'Pass Plus',      usd: 4.99, highlight: true },
      { name: 'Proton Unlimited',usd: 9.99 },
    ],
    note: 'Email cifrado (ProtonMail), VPN, Drive y contraseñas. Cobra en USD.',
  },

  // ── Redes & Comunidad ─────────────────────────────────────────────────────────
  {
    id: 'discord', name: 'Discord Nitro', icon: '🎮', category: 'Redes & Comunidad', billing: 'usd',
    priceUrl: 'https://discord.com/nitro',
    plans: [
      { name: 'Basic', usd: 2.99, highlight: true },
      { name: 'Nitro', usd: 9.99 },
    ],
    note: 'Emoji personalizado, mejor calidad de video, boosting de servidores. Cobra en USD.',
  },
  {
    id: 'telegram', name: 'Telegram Premium', icon: '✈️', category: 'Redes & Comunidad', billing: 'usd',
    priceUrl: 'https://t.me/premiumbot',
    plans: [{ name: 'Premium', usd: 4.99, highlight: true }],
    note: 'Sin límites de archivos (hasta 4 GB), stickers y reacciones exclusivas. Cobra en USD.',
  },
  {
    id: 'linkedin', name: 'LinkedIn Premium', icon: '💼', category: 'Redes & Comunidad', billing: 'usd',
    priceUrl: 'https://www.linkedin.com/premium/products/',
    plans: [
      { name: 'Career',   usd: 29.99, highlight: true },
      { name: 'Business', usd: 59.99 },
    ],
    note: 'Más visibilidad, InMail y acceso a cursos LinkedIn Learning. Cobra en USD.',
  },
  {
    id: 'twitch', name: 'Twitch Turbo', icon: '🟣', category: 'Redes & Comunidad', billing: 'usd',
    priceUrl: 'https://www.twitch.tv/turbo',
    plans: [{ name: 'Turbo', usd: 8.99, highlight: true }],
    note: 'Sin ads en toda la plataforma. Cobra en USD.',
  },
  {
    id: 'reddit', name: 'Reddit Premium', icon: '🟠', category: 'Redes & Comunidad', billing: 'usd',
    priceUrl: 'https://www.reddit.com/premium',
    plans: [{ name: 'Premium', usd: 5.99, highlight: true }],
    note: 'Sin ads, avatares exclusivos, 700 Reddit Coins/mes. Cobra en USD.',
  },

  // ── Educación ─────────────────────────────────────────────────────────────────
  {
    id: 'platzi', name: 'Platzi', icon: '🚀', category: 'Educación', billing: 'usd',
    priceUrl: 'https://platzi.com/precios/',
    plans: [
      { name: 'Individual', usd: 20, highlight: true },
      { name: 'Experto',    usd: 30 },
    ],
    note: 'Cursos de tecnología, programación y diseño en español. Muy popular en Argentina.',
  },
  {
    id: 'coursera', name: 'Coursera Plus', icon: '🎓', category: 'Educación', billing: 'usd',
    priceUrl: 'https://www.coursera.org/courseraplus',
    plans: [{ name: 'Plus', usd: 59, highlight: true }],
    note: 'Acceso ilimitado a miles de cursos de universidades. Cobra en USD.',
  },
  {
    id: 'masterclass', name: 'MasterClass', icon: '🎭', category: 'Educación', billing: 'usd',
    priceUrl: 'https://www.masterclass.com/checkout/plans',
    plans: [
      { name: 'Individual', usd: 10, highlight: true },
      { name: 'Duo',        usd: 15 },
    ],
    note: 'Clases de expertos mundiales (escritura, cocina, negocios). Precio mensualizado del anual. Cobra en USD.',
  },
  {
    id: 'duolingo', name: 'Duolingo Super', icon: '🦉', category: 'Educación', billing: 'usd',
    priceUrl: 'https://www.duolingo.com/subscribe',
    plans: [
      { name: 'Super', usd: 6.99,  highlight: true },
      { name: 'Max',   usd: 13.99 },
    ],
    note: 'Sin ads, vidas ilimitadas. Cobra en USD.',
  },
  {
    id: 'kindle', name: 'Kindle Unlimited', icon: '📚', category: 'Educación', billing: 'usd',
    priceUrl: 'https://www.amazon.com.ar/kindle-dbs/ku/kuSignUp',
    plans: [{ name: 'Mensual', usd: 11.99, highlight: true }],
    note: 'Acceso a millones de libros en Kindle. Cobra en USD.',
  },
  {
    id: 'audible', name: 'Audible', icon: '🎙️', category: 'Educación', billing: 'usd',
    priceUrl: 'https://www.audible.com.ar/',
    plans: [{ name: 'Plus', usd: 7.95, highlight: true }],
    note: '1 crédito de audiolibro por mes + biblioteca Plus. Cobra en USD.',
  },
  {
    id: 'brilliant', name: 'Brilliant', icon: '🧮', category: 'Educación', billing: 'usd',
    priceUrl: 'https://brilliant.org/premium/',
    plans: [{ name: 'Premium', usd: 24.99, highlight: true }],
    note: 'Matemáticas, ciencia y programación interactiva. Cobra en USD.',
  },
]

// ─── Categorías con íconos ─────────────────────────────────────────────────────

const CAT_ICONS: Record<string, string> = {
  'Streaming':       '🎬',
  'Música':          '🎵',
  'Gaming':          '🎮',
  'Deportes':        '🏆',
  'IA':              '🤖',
  'Productividad':   '📋',
  'Diseño & Dev':    '🎨',
  'Almacenamiento':  '💾',
  'Seguridad':       '🔒',
  'Redes & Comunidad':'💬',
  'Educación':       '📚',
}

const CATEGORIES = ['Todos', ...Array.from(new Set(SERVICES.map(s => s.category)))]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtARS(n: number) {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(n)
}

function fmtUSD(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(n)
}

function calcUsdToARS(usd: number, oficialRate: number, taxes: { iva: number; afip: number; iibb: number }) {
  const base = usd * oficialRate
  const iva  = base * (taxes.iva  / 100)
  const afip = base * (taxes.afip / 100)
  const iibb = base * (taxes.iibb / 100)
  return { base, iva, afip, iibb, total: base + iva + afip + iibb }
}

// ─── Página ───────────────────────────────────────────────────────────────────

export default function Suscripciones() {
  const [rates, setRates]               = useState<DolarRates>({ blue: null, oficial: null, mep: null })
  const [loadingRates, setLoadingRates] = useState(true)
  const [catFilter, setCatFilter]       = useState('Todos')
  const [fiscal, setFiscal]             = useState<FiscalProfile>('consumidor_final')
  const [provincia, setProvincia]       = useState('Buenos Aires (PBA)')
  const [showTaxPanel, setShowTaxPanel] = useState(false)

  useEffect(() => {
    fetch('/api/dolares')
      .then(r => r.json())
      .then((d: DolarRates) => { setRates(d); setLoadingRates(false) })
      .catch(() => setLoadingRates(false))
  }, [])

  const oficialRate    = rates.oficial
  const profile        = TAX_PROFILES[fiscal]
  const iibbTasa       = PROVINCIAS_IIBB.find(p => p.nombre === provincia)?.tasa ?? 3
  const taxes          = { iva: profile.iva, afip: profile.afip, iibb: iibbTasa }
  const totalTaxPct    = taxes.iva + taxes.afip + taxes.iibb
  const filteredServices = catFilter === 'Todos' ? SERVICES : SERVICES.filter(s => s.category === catFilter)

  return (
    <div style={{ maxWidth: 860, margin: '0 auto' }}>
      {/* Nav */}
      <div style={{ marginBottom: 20 }}>
        <Link href="/" style={{ fontSize: 13, fontWeight: 700, color: '#09090b', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6, background: '#f4f4f5', border: '1px solid #e4e4e7', borderRadius: 10, padding: '7px 14px' }}>
          ← Inicio
        </Link>
      </div>

      {/* Hero */}
      <div style={{ marginBottom: 24, textAlign: 'center', padding: '0 8px' }}>
        <div style={{ fontSize: 44, marginBottom: 8 }}>💸</div>
        <h1 style={{ fontSize: 'clamp(22px, 6vw, 38px)', fontWeight: 900, color: '#09090b', letterSpacing: '-0.04em', lineHeight: 1.05, marginBottom: 8 }}>
          Lo que pagás sin darte cuenta
        </h1>
        <p style={{ fontSize: 14, color: '#71717a', maxWidth: 500, margin: '0 auto', lineHeight: 1.6 }}>
          Precios reales de {SERVICES.length} suscripciones en pesos argentinos,
          con impuestos AFIP e IIBB incluidos para servicios en USD.
        </p>
      </div>

      {/* ── Panel de cotización (siempre visible) ── */}
      <div style={{ background: '#fff', borderRadius: 18, border: '1px solid #e4e4e7', padding: '14px 18px', marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, marginBottom: 12 }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            💵 Cotización USD hoy
          </p>
          <button
            onClick={() => setShowTaxPanel(v => !v)}
            style={{
              background: showTaxPanel ? '#09090b' : '#f4f4f5',
              color: showTaxPanel ? '#fff' : '#71717a',
              border: '1px solid #e4e4e7', borderRadius: 8,
              padding: '5px 12px', fontSize: 11, fontWeight: 700, cursor: 'pointer',
            }}
          >
            {showTaxPanel ? '▲ Ocultar impuestos' : '⚙️ Configurar impuestos'}
          </button>
        </div>

        {/* Cotizaciones */}
        <div style={{ display: 'flex', gap: 8, marginBottom: showTaxPanel ? 16 : 0 }}>
          {(['oficial', 'mep', 'blue'] as const).map(t => (
            <div key={t} style={{
              flex: 1, textAlign: 'center',
              background: t === 'oficial' ? '#eff6ff' : '#fafafa',
              border: `1.5px solid ${t === 'oficial' ? '#bfdbfe' : '#e4e4e7'}`,
              borderRadius: 12, padding: '10px 6px',
            }}>
              <p style={{ fontSize: 10, fontWeight: 700, color: t === 'oficial' ? '#1d4ed8' : '#71717a', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 4 }}>
                {t === 'oficial' ? '✓ Oficial' : t === 'mep' ? 'MEP/Bolsa' : 'Blue'}
              </p>
              <p style={{ fontSize: 18, fontWeight: 900, color: '#09090b', letterSpacing: '-0.03em', lineHeight: 1 }}>
                {loadingRates ? '···' : rates[t] ? fmtARS(rates[t]!) : '—'}
              </p>
              {t === 'oficial' && (
                <p style={{ fontSize: 9, color: '#93c5fd', marginTop: 2 }}>usado en el cálculo</p>
              )}
            </div>
          ))}
        </div>

        {/* Panel expandible de impuestos */}
        {showTaxPanel && (
          <div style={{ borderTop: '1px solid #f4f4f5', paddingTop: 14 }}>
            {/* Perfil fiscal */}
            <p style={{ fontSize: 11, fontWeight: 700, color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
              🧾 Condición ante AFIP
            </p>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
              {(Object.keys(TAX_PROFILES) as FiscalProfile[]).map(p => (
                <button key={p} onClick={() => setFiscal(p)} style={{
                  flex: 1, minWidth: 110, padding: '8px 10px', borderRadius: 10,
                  border: `1.5px solid ${fiscal === p ? '#0284c7' : '#e4e4e7'}`,
                  background: fiscal === p ? '#eff6ff' : '#fafafa',
                  color: fiscal === p ? '#0284c7' : '#71717a',
                  fontSize: 12, fontWeight: 700, cursor: 'pointer', transition: 'all 0.15s',
                }}>
                  {TAX_PROFILES[p].label}
                </button>
              ))}
            </div>
            <p style={{ fontSize: 11, color: '#71717a', marginBottom: 14, lineHeight: 1.5 }}>
              {profile.detail}
            </p>

            {/* Provincia IIBB */}
            <p style={{ fontSize: 11, fontWeight: 700, color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
              📍 Provincia (IIBB)
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 12 }}>
              <select
                value={provincia}
                onChange={e => setProvincia(e.target.value)}
                style={{
                  border: '1.5px solid #e4e4e7', borderRadius: 10, padding: '8px 12px',
                  fontSize: 13, color: '#09090b', background: '#fafafa', outline: 'none', cursor: 'pointer',
                }}
              >
                {PROVINCIAS_IIBB.map(p => (
                  <option key={p.nombre} value={p.nombre}>
                    {p.nombre} — IIBB {p.tasa}%
                  </option>
                ))}
              </select>
            </div>

            {/* Resumen de impuestos */}
            <div style={{ background: '#f8fafc', borderRadius: 12, padding: '12px 14px', display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
              <TaxBadge label="IVA" pct={taxes.iva} color="#0284c7" />
              <span style={{ color: '#d4d4d8', fontSize: 13 }}>+</span>
              <TaxBadge
                label="Perc. AFIP"
                pct={taxes.afip}
                color="#7c3aed"
                recoverable={fiscal !== 'consumidor_final'}
                recoverableNote="recuperable"
              />
              <span style={{ color: '#d4d4d8', fontSize: 13 }}>+</span>
              <TaxBadge label={`IIBB ${iibbTasa}%`} pct={iibbTasa} color="#b45309" />
              <span style={{ color: '#d4d4d8', fontSize: 13 }}>=</span>
              <span style={{
                background: '#09090b', color: '#fff',
                borderRadius: 8, padding: '4px 12px', fontSize: 13, fontWeight: 800,
              }}>
                +{totalTaxPct}% sobre base
              </span>
            </div>
            <p style={{ fontSize: 10, color: '#a1a1aa', marginTop: 8, lineHeight: 1.5 }}>
              Las percepciones se calculan sobre: precio USD × cotización oficial.
              Tasas aproximadas — verificar en afip.gob.ar y el organismo IIBB de tu provincia.
            </p>
          </div>
        )}
      </div>

      {/* ── Filtro de categorías ── */}
      <div style={{ overflowX: 'auto', paddingBottom: 4, marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 6, minWidth: 'max-content' }}>
          {CATEGORIES.map(cat => {
            const icon = cat === 'Todos' ? '✦' : (CAT_ICONS[cat] ?? '')
            const active = catFilter === cat
            return (
              <button key={cat} onClick={() => setCatFilter(cat)} style={{
                display: 'flex', alignItems: 'center', gap: 5,
                padding: '7px 14px', borderRadius: 999,
                border: `1.5px solid ${active ? '#09090b' : '#e4e4e7'}`,
                background: active ? '#09090b' : '#fafafa',
                color: active ? '#fff' : '#52525b',
                fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s',
                whiteSpace: 'nowrap',
              }}>
                <span>{icon}</span>
                {cat}
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Contador ── */}
      <p style={{ fontSize: 12, color: '#71717a', marginBottom: 14, fontWeight: 600 }}>
        {filteredServices.length} servicio{filteredServices.length !== 1 ? 's' : ''}
        {catFilter !== 'Todos' && ` en ${catFilter}`}
        {oficialRate
          ? ` · USD oficial ${fmtARS(oficialRate)}`
          : loadingRates ? ' · cargando cotización...' : ' · cotización no disponible'}
      </p>

      {/* ── Grid de servicios ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 320px), 1fr))', gap: 12, marginBottom: 32 }}>
        {filteredServices.map(s => (
          <ServiceCard key={s.id} service={s} oficialRate={oficialRate} taxes={taxes} />
        ))}
      </div>

      <p style={{ fontSize: 11, color: '#a1a1aa', textAlign: 'center', lineHeight: 1.7, marginBottom: 40 }}>
        Precios orientativos — última verificación aprox. abril 2026.<br />
        Los precios en ARS cambian con la inflación. Los precios en USD varían según el servicio.<br />
        Siempre confirmá el precio final en el sitio oficial antes de suscribirte.
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
  const [showBreakdown, setShowBreakdown] = useState(false)
  const isARS     = service.billing === 'ars'
  const mainPlan  = service.plans.find(p => p.highlight) ?? service.plans[0]
  const otherPlans = service.plans.filter(p => p !== mainPlan)

  function getPrice(plan: Plan): number | null {
    if (plan.ars !== undefined) return plan.ars
    if (plan.usd !== undefined && oficialRate) {
      return calcUsdToARS(plan.usd, oficialRate, taxes).total
    }
    return null
  }

  const mainPrice     = getPrice(mainPlan)
  const mainBreakdown = (!isARS && mainPlan.usd && oficialRate)
    ? calcUsdToARS(mainPlan.usd, oficialRate, taxes) : null

  return (
    <div style={{
      background: '#fff',
      border: '1.5px solid #e4e4e7',
      borderRadius: 18,
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      transition: 'border-color 0.15s',
    }}>
      {/* Cuerpo */}
      <div style={{ padding: '16px 18px', flex: 1 }}>

        {/* Header: icono + nombre + badge */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14, gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 28, lineHeight: 1 }}>{service.icon}</span>
            <div>
              <p style={{ fontWeight: 800, fontSize: 15, color: '#09090b', letterSpacing: '-0.01em' }}>
                {service.name}
              </p>
              <p style={{ fontSize: 11, color: '#a1a1aa', marginTop: 1 }}>
                {service.category}
              </p>
            </div>
          </div>
          <span style={{
            fontSize: 10, fontWeight: 700, padding: '3px 9px', borderRadius: 999, flexShrink: 0, marginTop: 2,
            background: isARS ? '#f0fdf4' : '#eff6ff',
            color: isARS ? '#15803d' : '#1d4ed8',
            border: `1px solid ${isARS ? '#bbf7d0' : '#bfdbfe'}`,
          }}>
            {isARS ? '🏠 ARS' : '💵 USD'}
          </span>
        </div>

        {/* Precio principal */}
        {mainPrice !== null ? (
          <div style={{ marginBottom: otherPlans.length > 0 ? 14 : 0 }}>
            <p style={{ fontSize: 'clamp(22px, 5vw, 28px)', fontWeight: 900, color: '#09090b', letterSpacing: '-0.04em', lineHeight: 1 }}>
              {fmtARS(mainPrice)}
            </p>
            <p style={{ fontSize: 11, color: '#71717a', marginTop: 4, lineHeight: 1.4 }}>
              {mainPlan.name} · por mes
              {!isARS && mainPlan.usd !== undefined && (
                <> · <span style={{ color: '#60a5fa', fontWeight: 600 }}>{fmtUSD(mainPlan.usd)} USD</span></>
              )}
            </p>
          </div>
        ) : (
          <div style={{ marginBottom: otherPlans.length > 0 ? 14 : 0 }}>
            <p style={{ fontSize: 15, color: '#a1a1aa', fontStyle: 'italic' }}>
              Sin cotización disponible
            </p>
            {!isARS && mainPlan.usd !== undefined && (
              <p style={{ fontSize: 11, color: '#71717a', marginTop: 2 }}>
                {fmtUSD(mainPlan.usd)} USD + impuestos
              </p>
            )}
          </div>
        )}

        {/* Otros planes */}
        {otherPlans.length > 0 && (
          <div style={{ borderTop: '1px solid #f4f4f5', paddingTop: 10, display: 'flex', flexDirection: 'column', gap: 7 }}>
            {otherPlans.map(plan => {
              const price = getPrice(plan)
              return (
                <div key={plan.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 12, color: '#71717a', minWidth: 0 }}>{plan.name}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#52525b', whiteSpace: 'nowrap' }}>
                    {price !== null ? fmtARS(price) : (!isARS && plan.usd ? `${fmtUSD(plan.usd)} USD` : '—')}
                  </span>
                </div>
              )
            })}
          </div>
        )}

        {/* Desglose de impuestos (solo USD) */}
        {!isARS && mainBreakdown && mainPrice !== null && (
          <div style={{ marginTop: 12 }}>
            <button
              onClick={() => setShowBreakdown(v => !v)}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                fontSize: 11, color: '#60a5fa', fontWeight: 600,
                padding: 0, display: 'flex', alignItems: 'center', gap: 4,
              }}
            >
              {showBreakdown ? '▲' : '▼'} Desglose de impuestos
            </button>
            {showBreakdown && (
              <div style={{ marginTop: 8, background: '#f8fafc', borderRadius: 10, padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 4, fontSize: 11 }}>
                <BreakdownRow label={`Base (${fmtUSD(mainPlan.usd!)} × oficial)`} value={mainBreakdown.base} />
                <BreakdownRow label={`IVA ${taxes.iva}%`} value={mainBreakdown.iva} />
                <BreakdownRow label={`Perc. AFIP ${taxes.afip}%`} value={mainBreakdown.afip} />
                <BreakdownRow label={`IIBB ${taxes.iibb}%`} value={mainBreakdown.iibb} />
                <div style={{ borderTop: '1px solid #e4e4e7', paddingTop: 4, display: 'flex', justifyContent: 'space-between', fontWeight: 800, color: '#09090b', fontSize: 12 }}>
                  <span>Total estimado</span>
                  <span>{fmtARS(mainBreakdown.total)}</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer: nota + link */}
      <div style={{ borderTop: '1px solid #f4f4f5', padding: '10px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, background: '#fafafa' }}>
        {service.note ? (
          <p style={{ fontSize: 10, color: '#a1a1aa', flex: 1, lineHeight: 1.5, minWidth: 0 }}>
            {service.note}
          </p>
        ) : <span />}
        <a
          href={service.priceUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            fontSize: 11, fontWeight: 700, color: '#0284c7', textDecoration: 'none',
            background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 8,
            padding: '5px 12px', whiteSpace: 'nowrap', flexShrink: 0,
          }}
        >
          Ver precios →
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
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 700, padding: '4px 10px', borderRadius: 999, background: `${color}15`, color, border: `1px solid ${color}40` }}>
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
      <span style={{ fontWeight: 600 }}>
        {new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(value)}
      </span>
    </div>
  )
}
