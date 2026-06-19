import { Router } from 'express'
import axios from 'axios'
import { saveRiotTokens, clearRiotTokens } from '../db/users'
import { requireInternalAuth } from '../middleware/auth'

const router = Router()

// Link Riot account via OAuth redirect URL (user logs in on Riot's own page, pastes back the callback URL)
router.post('/link-via-url', requireInternalAuth, async (req, res) => {
  const { callbackUrl, regionOverride } = req.body
  const userId = req.session.userId!

  if (!callbackUrl) return res.json({ success: false, error: '請貼上網址' })

  // Extract fragment from URL
  const hashIdx = callbackUrl.indexOf('#')
  if (hashIdx === -1) return res.json({ success: false, error: '網址格式不正確，請複製登入後完整的網址（需包含 # 符號）' })

  const params = new URLSearchParams(callbackUrl.slice(hashIdx + 1))
  const accessToken = params.get('access_token')
  if (!accessToken) return res.json({ success: false, error: '找不到 access_token，請確認已複製登入後的完整網址' })

  try {
    // Get entitlement token
    const entRes = await axios.post(
      'https://entitlements.auth.riotgames.com/api/token/v1',
      {},
      { headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' } }
    )
    const entitlementToken: string = entRes.data.entitlements_token

    // Get user info (puuid, gameName, tagLine)
    const userInfoRes = await axios.get('https://auth.riotgames.com/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` }
    })
    const { sub: puuid, acct } = userInfoRes.data
    const gameName: string = acct?.game_name || ''
    const tagLine: string = acct?.tag_line || ''

    // Detect region via PAS service (falls back to regionOverride or 'ap')
    let region = regionOverride || 'ap'
    try {
      const pasRes = await axios.get('https://riot-geo.pas.si.riotgames.com/pas/v1/service/chat', {
        headers: { Authorization: `Bearer ${accessToken}` },
        timeout: 5000,
      })
      const affinity: string = pasRes.data?.affinity || ''
      if (affinity) region = affinity
    } catch {
      // PAS may be unreachable; use regionOverride or default
    }

    saveRiotTokens(userId, { accessToken, entitlementToken, puuid, region, gameName, tagLine })
    return res.json({ success: true, gameName, tagLine, region })
  } catch (e: any) {
    console.error('[link-via-url error]', e?.response?.status, e.message)
    if (e?.response?.status === 401) {
      return res.json({ success: false, error: 'Token 已過期，請重新前往 Riot 登入頁面取得新網址' })
    }
    return res.json({ success: false, error: '處理失敗，請確認已複製正確的網址' })
  }
})

// Unlink Riot account
router.delete('/link', requireInternalAuth, (req, res) => {
  clearRiotTokens(req.session.userId!)
  res.json({ success: true })
})

export default router
