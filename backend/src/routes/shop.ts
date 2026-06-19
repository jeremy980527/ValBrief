import { Router } from 'express'
import { requireRiotAuth } from '../middleware/auth'
import { getStorefront, getStorefrontViaHenrik } from '../services/valorantApi'

const router = Router()

router.get('/', requireRiotAuth, async (req, res) => {
  const { accessToken, entitlementToken, puuid, region, gameName, tagLine } = (req as any).riotTokens

  // Try HenrikDev first (works with web OAuth tokens that lack game scope)
  if (gameName && tagLine) {
    try {
      const data = await getStorefrontViaHenrik(accessToken, entitlementToken, gameName, tagLine, region)
      console.log('[shop] HenrikDev success')
      return res.json(data)
    } catch (e: any) {
      const status = e?.response?.status
      console.warn(`[shop] HenrikDev failed status=${status}: ${e.message}`)
      if (status === 401 || status === 403) {
        return res.status(401).json({ error: 'Riot token 已過期，請重新連結帳號', code: 'RIOT_TOKEN_EXPIRED' })
      }
    }
  }

  // Fallback: direct Riot private API
  try {
    const data = await getStorefront(accessToken, entitlementToken, puuid, region)
    console.log('[shop] direct Riot API success')
    return res.json(data)
  } catch (e: any) {
    const status = e?.response?.status
    console.error('Shop error:', status, JSON.stringify(e?.response?.data), e.message)
    if (status && status >= 400 && status < 500) {
      return res.status(401).json({ error: 'Riot token 已過期，請重新連結帳號', code: 'RIOT_TOKEN_EXPIRED' })
    }
    return res.status(500).json({ error: 'Failed to fetch shop', detail: e.message })
  }
})

export default router
