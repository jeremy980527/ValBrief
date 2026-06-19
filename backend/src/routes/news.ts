import { Router } from 'express'
import axios from 'axios'

const router = Router()
let newsCache: { data: any; at: number } | null = null

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'

// Parse RSS XML without external libraries
function parseRssXml(xml: string, defaultCategory: string): any[] {
  const items: any[] = []
  const itemRe = /<item[^>]*>([\s\S]*?)<\/item>/gi
  let m: RegExpExecArray | null
  while ((m = itemRe.exec(xml)) !== null && items.length < 12) {
    const b = m[1]
    const get = (tag: string) => {
      const r = b.match(new RegExp(`<${tag}[^>]*>(?:<!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?<\\/${tag}>`, 'i'))
      return (r?.[1] ?? '').trim()
    }
    const title = get('title')
    const link = get('link') || get('guid')
    if (!title || !link) continue
    const desc = get('description').replace(/<[^>]+>/g, '').substring(0, 200)
    const date = get('pubDate')
    const cat = get('category') || defaultCategory
    const thumb = b.match(/url="([^"]+\.(?:jpg|jpeg|png|gif|webp)[^"]*)"/i)?.[1]
      || b.match(/<media:thumbnail[^>]+url="([^"]+)"/i)?.[1]
      || null
    items.push({ id: link, title, description: desc, url: link, thumbnail: thumb, date, category: cat })
  }
  return items
}

// allorigins.win: public CORS proxy — doesn't block VPS IPs and most news sites allow it
async function fetchViaAllOrigins(rssUrl: string, defaultCategory: string): Promise<any[]> {
  const r = await axios.get(`https://api.allorigins.win/raw?url=${encodeURIComponent(rssUrl)}`, {
    headers: { 'User-Agent': UA },
    timeout: 18000,
  })
  const xml = typeof r.data === 'string' ? r.data : String(r.data)
  if (!xml.includes('<item')) throw new Error('no <item> in response')
  const items = parseRssXml(xml, defaultCategory)
  if (!items.length) throw new Error('parsed 0 items')
  return items
}

// Direct fetch — works for sites that don't block datacenter IPs
async function fetchDirect(rssUrl: string, defaultCategory: string): Promise<any[]> {
  const r = await axios.get(rssUrl, {
    headers: { 'User-Agent': UA, Accept: 'application/rss+xml, application/xml, text/xml, */*' },
    timeout: 12000,
  })
  const xml = typeof r.data === 'string' ? r.data : String(r.data)
  if (!xml.includes('<item')) throw new Error('no <item> in response')
  const items = parseRssXml(xml, defaultCategory)
  if (!items.length) throw new Error('parsed 0 items')
  return items
}

const SOURCES = [
  { url: 'https://dotesports.com/valorant/feed', category: 'NEWS', label: 'Dot Esports' },
  { url: 'https://www.pcgamer.com/rss/', category: 'NEWS', label: 'PC Gamer' },
  { url: 'https://www.youtube.com/feeds/videos.xml?channel_id=UCZdB5P0a9OHIiNmMplvhA', category: 'VIDEO', label: 'YouTube' },
]

async function fetchNews(): Promise<any[]> {
  for (const src of SOURCES) {
    try {
      const items = await fetchViaAllOrigins(src.url, src.category)
      console.log(`[news] allorigins OK: ${src.label} (${items.length} items)`)
      return items
    } catch (e: any) {
      console.warn(`[news] allorigins ${src.label}: ${e.message}`)
    }
  }
  for (const src of SOURCES) {
    try {
      const items = await fetchDirect(src.url, src.category)
      console.log(`[news] direct OK: ${src.label}`)
      return items
    } catch (e: any) {
      console.warn(`[news] direct ${src.label}: ${e.message}`)
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
