import { Router } from 'express'
import { requireRiotAuth } from '../middleware/auth'
import { getStorefront, getStorefrontViaHenrik } from '../services/valorantApi'
import { getUserById } from '../db/users'

const router = Router()

router.get('/', requireRiotAuth, async (req, res) => {
  const userId = req.session.userId!
  const { accessToken, entitlementToken, puuid, region, gameName, tagLine } = (req as any).riotTokens

  // Serve cached snapshot from companion sync if it's still valid
  const user = getUserById(userId)
  if (user?.shopSnapshot) {
    const elapsed = (Date.now() - user.shopSnapshot.fetchedAt) / 1000
    const remaining = Math.floor(user.shopSnapshot.remainingSeconds - elapsed)
    if (remaining > 0) {
      console.log(`[shop] serving companion snapshot (${remaining}s remaining)`)
      return res.json({ items: user.shopSnapshot.items, remainingSeconds: remaining })
    }
    console.log('[shop] companion snapshot expired, falling back to API')
  }

  // Try HenrikDev proxy
  if (gameName && tagLine) {
    try {
      const data = await getStorefrontViaHenrik(accessToken, entitlementToken, gameName, tagLine, region)
      console.log('[shop] HenrikDev success')
      return res.json(data)
    } catch (e: any) {
      const status = e?.response?.status
      console.warn(`[shop] HenrikDev failed status=${status}: ${e.message}`)
      if (status === 401 || status === 403) {
        return res.status(401).json({ error: 'Riot token 已過期，請重新執行同步工具', code: 'RIOT_TOKEN_EXPIRED' })
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
      return res.status(401).json({ error: '商店資料已過期，請重新執行同步工具更新', code: 'RIOT_TOKEN_EXPIRED' })
    }
    return res.status(500).json({ error: 'Failed to fetch shop', detail: e.message })
  }
})

export default router
