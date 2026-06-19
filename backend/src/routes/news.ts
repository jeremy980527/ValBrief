import { Router } from 'express'
import axios from 'axios'

const router = Router()
let newsCache: { data: any; at: number } | null = null

async function fetchFromPlayvalorant(): Promise<any[]> {
  const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
  const r = await axios.get('https://playvalorant.com/page-data/en-us/news/page-data.json', {
    headers: { 'User-Agent': UA, Accept: 'application/json' },
    timeout: 12000,
  })
  const nodes: any[] = r.data?.result?.data?.allContentstackArticles?.nodes || []
  if (!nodes.length) throw new Error('empty nodes')
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

async function fetchFromRiotGames(): Promise<any[]> {
  const r = await axios.get('https://www.riotgames.com/en/news/game-updates/valorant', {
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
    timeout: 10000,
  })
  // Gatsby page-data on Riot Games website
  const nodes: any[] = r.data?.result?.data?.allContentstackArticles?.nodes || []
  return nodes.slice(0, 20).map((a: any) => ({
    id: a.uid || String(Math.random()),
    title: a.title || '',
    description: a.description || '',
    url: a.url?.url || 'https://playvalorant.com/en-us/news/',
    thumbnail: a.banner?.url || null,
    date: a.date || '',
    category: 'GAME UPDATES',
  }))
}

async function fetchNews() {
  try {
    return await fetchFromPlayvalorant()
  } catch (e1: any) {
    console.warn('[news] playvalorant.com failed:', e1.message, '— trying riotgames.com')
    try {
      return await fetchFromRiotGames()
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
