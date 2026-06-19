import { Router } from 'express'
import { requireAuth } from '../middleware/auth'
import { getStorefront } from '../services/valorantApi'

const router = Router()

router.get('/', requireAuth, async (req, res) => {
  try {
    const { accessToken, entitlementToken, puuid, region } = req.session as any
    const data = await getStorefront(accessToken, entitlementToken, puuid, region)
    res.json(data)
  } catch (e: any) {
    console.error('Shop error:', e.message)
    res.status(500).json({ error: 'Failed to fetch shop', detail: e.message })
  }
})

export default router
