import { Router } from 'express'
import axios from 'axios'

const router = Router()
let newsCache: { data: any; at: number } | null = null

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'

function parseRssXml(xml: string, defaultCategory: string): any[] {
  const items: any[] = []
  // Support both RSS <item> and Atom <entry>
  const isAtom = xml.includes('<feed') && xml.includes('<entry')
  const tagName = isAtom ? 'entry' : 'item'
  const itemRe = new RegExp(`<${tagName}[^>]*>([\\s\\S]*?)<\\/${tagName}>`, 'gi')
  let m: RegExpExecArray | null
  while ((m = itemRe.exec(xml)) !== null && items.length < 12) {
    const b = m[1]
    const get = (tag: string) => {
      const r = b.match(new RegExp(`<${tag}[^>]*>(?:<!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?<\\/${tag}>`, 'i'))
      return (r?.[1] ?? '').trim()
    }
    const getAttr = (tag: string, attr: string) => {
      const r = b.match(new RegExp(`<${tag}[^>]+${attr}="([^"]+)"`, 'i'))
      return r?.[1] ?? ''
    }
    const title = get('title')
    const link = isAtom ? (getAttr('link', 'href') || get('id')) : (get('link') || get('guid'))
    if (!title || !link) continue
    const desc = get('description').replace(/<[^>]+>/g, '').substring(0, 200)
    const date = get('pubDate') || get('published') || get('updated')
    const cat = get('category') || defaultCategory
    const thumb = b.match(/url="([^"]+\.(?:jpg|jpeg|png|gif|webp)[^"]*)"/i)?.[1]
      || b.match(/<media:thumbnail[^>]+url="([^"]+)"/i)?.[1]
      || getAttr('media:thumbnail', 'url')
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
  if (!xml.includes('<item') && !xml.includes('<entry')) throw new Error('no feed entries in response')
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
  if (!xml.includes('<item') && !xml.includes('<entry')) throw new Error('no feed entries in response')
  const items = parseRssXml(xml, defaultCategory)
  if (!items.length) throw new Error('parsed 0 items')
  return items
}

const SOURCES = [
  { url: 'https://dotesports.com/valorant/feed', category: 'ESPORTS', label: 'Dot Esports Valorant' },
  { url: 'https://www.thespike.gg/rss', category: 'ESPORTS', label: 'The Spike' },
  { url: 'https://www.valorantzone.gg/feed/', category: 'NEWS', label: 'ValorantZone' },
  { url: 'https://playvalorant.com/en-us/news/feed.rss', category: 'GAME UPDATES', label: 'PlayValorant' },
  { url: 'https://www.youtube.com/feeds/videos.xml?channel_id=UC8Lq-bWy7VWQDK7vlsn3KPA', category: 'VIDEO', label: 'Valorant YouTube' },
]

async function tryFetch(src: typeof SOURCES[0]): Promise<any[]> {
  try {
    const items = await fetchViaAllOrigins(src.url, src.category)
    console.log(`[news] allorigins OK: ${src.label} (${items.length})`)
    return items
  } catch { /* ignore */ }
  try {
    const items = await fetchDirect(src.url, src.category)
    console.log(`[news] direct OK: ${src.label}`)
    return items
  } catch (e: any) {
    console.warn(`[news] ${src.label} failed: ${e.message}`)
    return []
  }
}

async function fetchNews(): Promise<any[]> {
  const results = await Promise.all(SOURCES.map(tryFetch))
  const seen = new Set<string>()
  const merged: any[] = []
  for (const items of results) {
    for (const item of items) {
      if (!seen.has(item.id)) {
        seen.add(item.id)
        merged.push(item)
      }
    }
  }
  if (!merged.length) throw new Error('all news sources failed')
  return merged
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
