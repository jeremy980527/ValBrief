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
    // Any 4xx from Riot's private API = token issue (expired/invalid)
    if (status && status >= 400 && status < 500) {
      return res.status(401).json({ error: 'Riot token 已過期，請重新連結帳號', code: 'RIOT_TOKEN_EXPIRED' })
    }
    res.status(500).json({ error: 'Failed to fetch shop', detail: e.message })
  }
})

export default router
