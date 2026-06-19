import { Router } from 'express'
import { requireRiotAuth } from '../middleware/auth'
import { getMissions } from '../services/valorantApi'

const router = Router()

router.get('/', requireRiotAuth, async (req, res) => {
  try {
    const { accessToken, entitlementToken, puuid, region } = (req as any).riotTokens
    const missions = await getMissions(accessToken, entitlementToken, puuid, region)
    res.json({ missions })
  } catch (e: any) {
    const status = e?.response?.status
    console.error('Missions error:', status, JSON.stringify(e?.response?.data), e.message)
    if (status && status >= 400 && status < 500) {
      return res.status(401).json({ error: 'Riot token 已過期，請重新連結帳號', code: 'RIOT_TOKEN_EXPIRED' })
    }
    res.status(500).json({ error: 'Failed to fetch missions', detail: e.message })
  }
})

export default router
