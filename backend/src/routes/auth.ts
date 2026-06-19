import { Router } from 'express'
import { login, completeMFA } from '../services/riotAuth'
import { saveRiotTokens, clearRiotTokens } from '../db/users'
import { requireInternalAuth } from '../middleware/auth'

const router = Router()

// Link Riot account (auto auth from VPS)
router.post('/link', requireInternalAuth, async (req, res) => {
  const { username, password } = req.body
  if (!username || !password) return res.json({ success: false, error: 'Missing credentials' })
  try {
    const result = await login(username, password)
    if (result.success && result.tokens) {
      const t = result.tokens
      req.session.pendingMfaId = undefined
      saveRiotTokens(req.session.userId!, {
        accessToken: t.accessToken,
        entitlementToken: t.entitlementToken,
        puuid: t.puuid,
        region: t.region,
        gameName: t.gameName,
        tagLine: t.tagLine,
      })
      return res.json({ success: true, gameName: t.gameName, tagLine: t.tagLine, region: t.region })
    }
    if (result.requiresMFA) {
      req.session.pendingMfaId = result.mfaSessionId
      return res.json({ success: false, requiresMFA: true, mfaEmail: result.mfaEmail })
    }
    console.error('[Riot Link failed]', result.error)
    return res.json({ success: false, error: result.error || 'Link failed' })
  } catch (e: any) {
    console.error('[Riot Link exception]', e.message)
    return res.json({ success: false, error: e.message || 'Server error' })
  }
})

// Complete MFA for linking
router.post('/mfa', requireInternalAuth, async (req, res) => {
  const { code } = req.body
  const sessionId = req.session.pendingMfaId
  if (!sessionId || !code) return res.json({ success: false, error: 'Missing MFA info' })
  try {
    const result = await completeMFA(sessionId, code)
    if (result.success && result.tokens) {
      const t = result.tokens
      req.session.pendingMfaId = undefined
      saveRiotTokens(req.session.userId!, {
        accessToken: t.accessToken,
        entitlementToken: t.entitlementToken,
        puuid: t.puuid,
        region: t.region,
        gameName: t.gameName,
        tagLine: t.tagLine,
      })
      return res.json({ success: true, gameName: t.gameName, tagLine: t.tagLine, region: t.region })
    }
    return res.json({ success: false, error: result.error || 'MFA failed' })
  } catch (e: any) {
    return res.json({ success: false, error: e.message || 'Server error' })
  }
})

// Link with manual tokens
router.post('/link/manual', requireInternalAuth, (req, res) => {
  const { accessToken, entitlementToken, puuid, region, gameName, tagLine } = req.body
  if (!accessToken || !entitlementToken || !puuid || !gameName || !tagLine) {
    return res.json({ success: false, error: 'All fields required' })
  }
  try {
    saveRiotTokens(req.session.userId!, { accessToken, entitlementToken, puuid, region: region || 'ap', gameName, tagLine })
    return res.json({ success: true, gameName, tagLine, region: region || 'ap' })
  } catch (e: any) {
    return res.json({ success: false, error: e.message })
  }
})

// Unlink Riot account
router.delete('/link', requireInternalAuth, (req, res) => {
  clearRiotTokens(req.session.userId!)
  res.json({ success: true })
})

export default router
