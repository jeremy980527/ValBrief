import { Router } from 'express'
import axios from 'axios'

const router = Router()
let newsCache: { data: any; at: number } | null = null

const HENRIK_BASE = 'https://api.henrikdev.xyz'

// Map HenrikDev category slugs to frontend display categories
const CAT_MAP: Record<string, string> = {
  'patch-notes': 'PATCH NOTES',
  'game-updates': 'GAME UPDATES',
  'esports': 'ESPORTS',
  'dev': 'GAME UPDATES',
  'community': 'NEWS',
  'announcements': 'NEWS',
}

router.get('/', async (_req, res) => {
  try {
    if (newsCache && Date.now() - newsCache.at < 600000) {
      return res.json(newsCache.data)
    }

    const headers: Record<string, string> = {}
    if (process.env.HENRIK_API_KEY) {
      headers['Authorization'] = process.env.HENRIK_API_KEY
    }

    // Try zh-tw first (Traditional Chinese), fall back to en-us
    let rawArticles: any[] = []
    for (const locale of ['zh-tw', 'en-us']) {
      try {
        const r = await axios.get(`${HENRIK_BASE}/valorant/v1/website/${locale}`, {
          headers,
          timeout: 10000,
        })
        rawArticles = r.data?.data || []
        if (rawArticles.length) {
          console.log(`[news] HenrikDev OK locale=${locale} (${rawArticles.length} articles)`)
          break
        }
      } catch (e: any) {
        console.warn(`[news] HenrikDev ${locale} failed: ${e.message}`)
      }
    }

    if (!rawArticles.length) {
      throw new Error('HenrikDev returned no articles')
    }

    const articles = rawArticles.map((a: any) => ({
      id: a.url,
      title: a.title,
      description: '',
      url: a.external_link || a.url,
      thumbnail: a.banner_url || null,
      date: a.date,
      category: CAT_MAP[a.category] || 'NEWS',
    }))

    const payload = { articles }
    newsCache = { data: payload, at: Date.now() }
    return res.json(payload)
  } catch (e: any) {
    console.error('[news] error:', e.message)
    if (newsCache) return res.json(newsCache.data)
    return res.status(500).json({ error: 'Failed to fetch news' })
  }
})

export default router
