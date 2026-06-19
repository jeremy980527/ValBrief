import { Router } from 'express'
import { requireRiotAuth } from '../middleware/auth'
import { getStorefront } from '../services/valorantApi'

const router = Router()

router.get('/', requireRiotAuth, async (req, res) => {
  try {
    const { accessToken, entitlementToken, puuid, region } = (req as any).riotTokens
    const data = await getStorefront(accessToken, entitlementToken, puuid, region)
    res.json(data)
  } catch (e: any) {
    const status = e?.response?.status
    console.error('Shop error:', status, JSON.stringify(e?.response?.data), e.message)
    if (status === 401 || status === 403 || e.code === 'RIOT_TOKEN_EXPIRED') {
      return res.status(401).json({ error: 'Riot token 已過期，請重新連結帳號', code: 'RIOT_TOKEN_EXPIRED' })
    }
    // 404 from Riot private API also indicates invalid/expired token
    if (status === 404) {
      return res.status(401).json({ error: 'Riot token 已過期，請重新連結帳號', code: 'RIOT_TOKEN_EXPIRED' })
    }
    res.status(500).json({ error: 'Failed to fetch shop', detail: e.message })
  }
})

export default router
