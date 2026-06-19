import { Router } from 'express'
import axios from 'axios'

const router = Router()
let newsCache: { data: any; at: number } | null = null

async function fetchNews() {
  const r = await axios.get('https://playvalorant.com/page-data/en-us/news/page-data.json', {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      Accept: 'application/json',
    },
    timeout: 10000,
  })
  const nodes: any[] = r.data?.result?.data?.allContentstackArticles?.nodes || []
  return nodes.slice(0, 20).map((a: any) => ({
    id: a.uid || a.url?.url || String(Math.random()),
    title: a.title || '',
    description: a.description || '',
    url: a.url?.url ? `https://playvalorant.com${a.url.url}` : 'https://playvalorant.com/en-us/news/',
    thumbnail: a.banner?.url || a.thumbnail?.url || null,
    date: a.date || '',
    category: a.category?.[0]?.title || 'NEWS',
  }))
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
