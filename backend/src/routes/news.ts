import { Router } from 'express'
import axios from 'axios'

const router = Router()
let newsCache: { data: any; at: number } | null = null

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'

function extractNextData(html: string): any[] {
  const m = html.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/)
  if (!m) return []
  try {
    const data = JSON.parse(m[1])
    const props = data?.props?.pageProps
    return props?.articles || props?.data?.articles || props?.entries || []
  } catch { return [] }
}

async function fetchFromPlayvalorant(): Promise<any[]> {
  const r = await axios.get('https://playvalorant.com/en-us/news/', {
    headers: { 'User-Agent': UA, Accept: 'text/html' },
    timeout: 15000,
  })
  const articles = extractNextData(r.data as string)
  if (!articles.length) throw new Error('no articles in __NEXT_DATA__')
  return articles.slice(0, 20).map((a: any) => ({
    id: a.uid || a.id || String(Math.random()),
    title: a.title || a.heading || '',
    description: a.description || a.summary || '',
    url: a.url?.url ? `https://playvalorant.com${a.url.url}` : (a.externalLink || 'https://playvalorant.com/en-us/news/'),
    thumbnail: a.banner?.url || a.image?.url || null,
    date: a.date || a.publishedAt || '',
    category: a.category?.[0]?.title || 'NEWS',
  }))
}

async function fetchFromReddit(): Promise<any[]> {
  const r = await axios.get('https://www.reddit.com/r/VALORANT/hot.json?limit=20&raw_json=1', {
    headers: { 'User-Agent': 'ValBrief/1.0' },
    timeout: 10000,
  })
  const posts: any[] = (r.data?.data?.children || [])
    .filter((p: any) => !p.data.stickied)
    .slice(0, 12)
  return posts.map((p: any) => ({
    id: p.data.id,
    title: p.data.title,
    description: '',
    url: p.data.url?.startsWith('http') ? p.data.url : `https://www.reddit.com${p.data.permalink}`,
    thumbnail: (p.data.thumbnail?.startsWith('http')) ? p.data.thumbnail : null,
    date: new Date(p.data.created_utc * 1000).toISOString(),
    category: p.data.link_flair_text || 'COMMUNITY',
  }))
}

async function fetchNews() {
  try {
    return await fetchFromPlayvalorant()
  } catch (e1: any) {
    console.warn('[news] playvalorant.com failed:', e1.message, '— trying reddit')
    try {
      return await fetchFromReddit()
    } catch (e2: any) {
      console.error('[news] all sources failed:', e2.message)
      throw e2
    }
  }
}

router.get('/', async (_req, res) => {
  try {
    if (newsCache && Date.now() - newsCache.at < 300000) {
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
