import { Router } from 'express'
import axios from 'axios'
import { saveRiotTokens, clearRiotTokens } from '../db/users'
import { requireInternalAuth } from '../middleware/auth'
import { login as riotLogin, completeMFA } from '../services/riotAuth'

const router = Router()

const RIOT_UA = 'RiotClient/60.0.6.4875858.4789607 rso-auth/1.0.0.0 riot (Windows;10;;Professional, x64)'

async function exchangeAccessToken(accessToken: string, regionOverride?: string) {
  const entRes = await axios.post(
    'https://entitlements.auth.riotgames.com/api/token/v1',
    {},
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'User-Agent': RIOT_UA,
      },
    }
  )
  const entitlementToken: string = entRes.data.entitlements_token
  if (!entitlementToken) {
    console.error('[link] entitlement API response:', JSON.stringify(entRes.data))
    throw new Error('Riot entitlement token is empty — access token may lack required scope')
  }
  console.log(`[link] entToken obtained: ${entitlementToken.substring(0, 20)}...`)

  const userInfoRes = await axios.get('https://auth.riotgames.com/userinfo', {
    headers: { Authorization: `Bearer ${accessToken}`, 'User-Agent': RIOT_UA },
  })
  const { sub: puuid, acct } = userInfoRes.data
  const gameName: string = acct?.game_name || ''
  const tagLine: string = acct?.tag_line || ''
  console.log(`[link] puuid=${puuid?.substring(0, 8)}... gameName=${gameName}#${tagLine}`)

  let region = regionOverride || 'ap'
  try {
    const pasRes = await axios.get('https://riot-geo.pas.si.riotgames.com/pas/v1/service/chat', {
      headers: { Authorization: `Bearer ${accessToken}`, 'User-Agent': RIOT_UA },
      timeout: 5000,
    })
    const d = pasRes.data
    const detected = d?.affinity || d?.affinities?.live
    if (detected) { region = detected; console.log(`[link] PAS region: ${region}`) }
    else console.warn('[link] PAS response has no affinity:', JSON.stringify(d))
  } catch (e: any) { console.warn('[link] PAS failed:', e.message) }

  return { accessToken, entitlementToken, puuid, region, gameName, tagLine }
}

// Direct credential login — gives game-scope tokens that work with the private API
router.post('/link-credential', requireInternalAuth, async (req, res) => {
  const { username, password } = req.body
  if (!username || !password) return res.json({ success: false, error: '請輸入帳號和密碼' })
  try {
    const result = await riotLogin(username, password)
    if (result.success && result.tokens) {
      saveRiotTokens(req.session.userId!, result.tokens)
      return res.json({ success: true, gameName: result.tokens.gameName, tagLine: result.tokens.tagLine })
    }
    if (result.requiresMFA) {
      return res.json({
        success: false,
        requiresMFA: true,
        mfaSessionId: result.mfaSessionId,
        mfaEmail: result.mfaEmail,
      })
    }
    return res.json({ success: false, error: result.error || '登入失敗，請確認帳號密碼' })
  } catch (e: any) {
    console.error('[link-credential]', e.message)
    return res.json({ success: false, error: '連線失敗：' + e.message })
  }
})

// 2FA code verification for credential login
router.post('/link-credential-mfa', requireInternalAuth, async (req, res) => {
  const { mfaSessionId, code } = req.body
  if (!mfaSessionId || !code) return res.json({ success: false, error: '缺少必要參數' })
  try {
    const result = await completeMFA(mfaSessionId, code)
    if (result.success && result.tokens) {
      saveRiotTokens(req.session.userId!, result.tokens)
      return res.json({ success: true, gameName: result.tokens.gameName, tagLine: result.tokens.tagLine })
    }
    return res.json({ success: false, error: result.error || '驗證碼錯誤' })
  } catch (e: any) {
    console.error('[link-credential-mfa]', e.message)
    return res.json({ success: false, error: '驗證失敗：' + e.message })
  }
})

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

// Link via pasted callback URL
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
