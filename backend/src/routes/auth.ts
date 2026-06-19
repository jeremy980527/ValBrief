import { Router } from 'express'
import axios from 'axios'
import { saveRiotTokens, clearRiotTokens } from '../db/users'
import { requireInternalAuth } from '../middleware/auth'

const router = Router()

async function exchangeAccessToken(accessToken: string, regionOverride?: string) {
  const entRes = await axios.post(
    'https://entitlements.auth.riotgames.com/api/token/v1',
    {},
    { headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' } }
  )
  const entitlementToken: string = entRes.data.entitlements_token

  const userInfoRes = await axios.get('https://auth.riotgames.com/userinfo', {
    headers: { Authorization: `Bearer ${accessToken}` }
  })
  const { sub: puuid, acct } = userInfoRes.data
  const gameName: string = acct?.game_name || ''
  const tagLine: string = acct?.tag_line || ''

  let region = regionOverride || 'ap'
  try {
    const pasRes = await axios.get('https://riot-geo.pas.si.riotgames.com/pas/v1/service/chat', {
      headers: { Authorization: `Bearer ${accessToken}` },
      timeout: 5000,
    })
    if (pasRes.data?.affinity) region = pasRes.data.affinity
  } catch { /* PAS unreachable — use default */ }

  return { accessToken, entitlementToken, puuid, region, gameName, tagLine }
}

// Link via callback page (popup auto-extracts token, posts here)
router.post('/link-from-callback', requireInternalAuth, async (req, res) => {
  const { accessToken } = req.body
  if (!accessToken) return res.json({ success: false, error: '缺少 access_token' })
  try {
    const tokens = await exchangeAccessToken(accessToken)
    saveRiotTokens(req.session.userId!, tokens)
    return res.json({ success: true, gameName: tokens.gameName, tagLine: tokens.tagLine, region: tokens.region })
  } catch (e: any) {
    console.error('[link-from-callback error]', e?.response?.status, e.message)
    const err = e?.response?.status === 401 ? 'Token 已過期，請重新登入 Riot' : '連結失敗：' + e.message
    return res.json({ success: false, error: err })
  }
})

// Link via pasted callback URL (fallback when popup redirect is rejected)
router.post('/link-via-url', requireInternalAuth, async (req, res) => {
  const { callbackUrl, regionOverride } = req.body
  if (!callbackUrl) return res.json({ success: false, error: '請貼上網址' })

  const hashIdx = callbackUrl.indexOf('#')
  if (hashIdx === -1) return res.json({ success: false, error: '網址格式不正確，需包含 # 符號' })

  const accessToken = new URLSearchParams(callbackUrl.slice(hashIdx + 1)).get('access_token')
  if (!accessToken) return res.json({ success: false, error: '找不到 access_token，請確認已複製完整的網址' })

  try {
    const tokens = await exchangeAccessToken(accessToken, regionOverride)
    saveRiotTokens(req.session.userId!, tokens)
    return res.json({ success: true, gameName: tokens.gameName, tagLine: tokens.tagLine, region: tokens.region })
  } catch (e: any) {
    console.error('[link-via-url error]', e?.response?.status, e.message)
    const err = e?.response?.status === 401 ? 'Token 已過期，請重新前往 Riot 登入頁面' : '處理失敗，請確認已複製正確的網址'
    return res.json({ success: false, error: err })
  }
})

// Unlink Riot account
router.delete('/link', requireInternalAuth, (req, res) => {
  clearRiotTokens(req.session.userId!)
  res.json({ success: true })
})

export default router
