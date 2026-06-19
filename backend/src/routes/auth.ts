import { Router } from 'express'
import { login, completeMFA } from '../services/riotAuth'

const router = Router()

router.post('/login', async (req, res) => {
  const { username, password } = req.body
  if (!username || !password) return res.json({ success: false, error: 'Missing credentials' })
  try {
    const result = await login(username, password)
    if (result.success && result.tokens) {
      const t = result.tokens
      req.session.accessToken = t.accessToken
      req.session.entitlementToken = t.entitlementToken
      req.session.puuid = t.puuid
      req.session.region = t.region
      req.session.gameName = t.gameName
      req.session.tagLine = t.tagLine
      return res.json({ success: true, gameName: t.gameName, tagLine: t.tagLine, region: t.region })
    }
    if (result.requiresMFA) {
      req.session.pendingMfaId = result.mfaSessionId
      return res.json({ success: false, requiresMFA: true, mfaEmail: result.mfaEmail })
    }
    console.error('[Login failed]', result.error)
    return res.json({ success: false, error: result.error || 'Login failed' })
  } catch (e: any) {
    console.error('[Login exception]', e.message)
    return res.json({ success: false, error: e.message || 'Server error' })
  }
})

router.post('/mfa', async (req, res) => {
  const { code } = req.body
  const sessionId = req.session.pendingMfaId
  if (!sessionId || !code) return res.json({ success: false, error: 'Missing MFA info' })
  try {
    const result = await completeMFA(sessionId, code)
    if (result.success && result.tokens) {
      const t = result.tokens
      req.session.accessToken = t.accessToken
      req.session.entitlementToken = t.entitlementToken
      req.session.puuid = t.puuid
      req.session.region = t.region
      req.session.gameName = t.gameName
      req.session.tagLine = t.tagLine
      delete req.session.pendingMfaId
      return res.json({ success: true, gameName: t.gameName, tagLine: t.tagLine, region: t.region })
    }
    return res.json({ success: false, error: result.error || 'MFA failed' })
  } catch (e: any) {
    return res.json({ success: false, error: e.message || 'Server error' })
  }
})

router.post('/logout', (req, res) => {
  req.session.destroy(() => res.json({ success: true }))
})

router.get('/me', (req, res) => {
  if (!req.session.puuid) return res.status(401).json({ error: 'Not authenticated' })
  res.json({
    gameName: req.session.gameName,
    tagLine: req.session.tagLine,
    region: req.session.region,
    puuid: req.session.puuid,
  })
})

export default router
