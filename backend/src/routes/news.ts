import { Router } from 'express'
import axios from 'axios'

const router = Router()
let newsCache: { data: any; at: number } | null = null

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'

// rss2json.com acts as a proxy so VPS IP is never exposed to source sites
async function fetchViaProxy(rssUrl: string): Promise<any[]> {
  const r = await axios.get(`https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(rssUrl)}&count=15`, {
    headers: { 'User-Agent': UA },
    timeout: 15000,
  })
  if (r.data.status !== 'ok') throw new Error(`rss2json: ${r.data.message || 'error'}`)
  const items: any[] = r.data.items || []
  if (!items.length) throw new Error('empty result')
  return items.slice(0, 12).map((item: any) => ({
    id: item.guid || item.link || String(Math.random()),
    title: item.title || '',
    description: (item.description || '').replace(/<[^>]+>/g, '').substring(0, 200),
    url: item.link || '',
    thumbnail: item.thumbnail || item.enclosure?.link || null,
    date: item.pubDate || '',
    category: item.categories?.[0] || 'NEWS',
  }))
}

const SOURCES = [
  // Official Valorant YouTube channel
  { url: 'https://www.youtube.com/feeds/videos.xml?channel_id=UCZdB5P0a9OHIiNmMplvhA', category: 'VIDEO' },
  // Dot Esports Valorant coverage
  { url: 'https://dotesports.com/valorant/feed', category: null },
  // PCGamer Valorant tag
  { url: 'https://www.pcgamer.com/rss/', category: 'NEWS' },
]

async function fetchNews(): Promise<any[]> {
  for (const src of SOURCES) {
    try {
      const items = await fetchViaProxy(src.url)
      console.log(`[news] success from ${src.url}`)
      if (src.category) return items.map(i => ({ ...i, category: src.category }))
      return items
    } catch (e: any) {
      console.warn(`[news] ${src.url} failed:`, e.message)
    }
  }
  throw new Error('all news sources failed')
}

router.get('/', async (_req, res) => {
  try {
    if (newsCache && Date.now() - newsCache.at < 600000) {
      return res.json(newsCache.data)
    }
    const articles = await fetchNews()
    const payload = { articles }
    newsCache = { data: payload, at: Date.now() }
    return res.json(payload)
  } catch (e: any) {
    console.error('News error:', e.message)
    if (newsCache) return res.json(newsCache.data)
    return res.status(500).json({ error: 'Failed to fetch news' })
  }
})

export default router
