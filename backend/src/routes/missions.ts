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
    console.error('Missions error:', e.message)
    res.status(500).json({ error: 'Failed to fetch missions', detail: e.message })
  }
})

export default router
