import { Router } from 'express'
import axios from 'axios'

const router = Router()
let newsCache: { data: any; at: number } | null = null

router.get('/', async (_req, res) => {
  try {
    if (newsCache && Date.now() - newsCache.at < 300000) {
      return res.json(newsCache.data)
    }
    const r = await axios.get('https://api.henrikdev.xyz/valorant/v1/website/en-us', {
      headers: { 'User-Agent': 'ValBrief/1.0' },
      timeout: 8000,
    })
    const articles = (r.data.data || []).slice(0, 20).map((a: any) => ({
      id: a.uid || a.url,
      title: a.title,
      description: a.description || '',
      url: a.url,
      thumbnail: a.banner_url || a.thumbnail_url || null,
      date: a.date,
      category: a.category || 'NEWS',
    }))
    const payload = { articles }
    newsCache = { data: payload, at: Date.now() }
    return res.json(payload)
  } catch (e: any) {
    console.error('News error:', e.message)
    return res.status(500).json({ error: 'Failed to fetch news' })
  }
})

export default router
