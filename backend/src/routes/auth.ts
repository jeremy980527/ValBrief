import { Router } from 'express'
import axios from 'axios'
import { saveRiotTokens, clearRiotTokens } from '../db/users'
import { requireInternalAuth } from '../middleware/auth'
import { login as riotLogin, completeMFA } from '../services/riotAuth'
import { createOtp, consumeOtp } from '../services/companionOtp'

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

// Generate and serve a pre-configured PowerShell companion script
router.get('/companion-script', requireInternalAuth, (req, res) => {
  const code = createOtp(req.session.userId!)
  const proto = (req.headers['x-forwarded-proto'] as string) || 'https'
  const host = (req.headers['x-forwarded-host'] as string) || req.headers.host || 'localhost'
  const serverUrl = `${proto}://${host}`

  const script = `# ValBrief Companion - Token 同步工具
# 此腳本由 ValBrief 自動產生，有效期 5 分鐘

$ServerUrl = "${serverUrl}"
$Code = "${code}"

Write-Host ""
Write-Host "ValBrief Companion - Riot Token 同步工具" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

$lockfilePath = "$env:LOCALAPPDATA\\Riot Games\\Riot Client\\Config\\lockfile"
if (-not (Test-Path $lockfilePath)) {
    Write-Host ""
    Write-Host "X  找不到 Riot Client lockfile" -ForegroundColor Red
    Write-Host "   請先開啟 Riot Client（不需要進遊戲），再重新執行此腳本" -ForegroundColor Yellow
    Write-Host ""; Read-Host "按 Enter 關閉"
    exit 1
}

Write-Host "OK 找到 Riot Client" -ForegroundColor Green

$lockfile = Get-Content $lockfilePath -Raw
$parts = $lockfile.Trim().Split(':')
$port = $parts[2]
$password = $parts[3]

# Riot Client 使用自簽憑證，需要略過驗證
if (-not ([System.Management.Automation.PSTypeName]'ValBriefTrustAll').Type) {
    Add-Type @"
using System.Net; using System.Security.Cryptography.X509Certificates;
public class ValBriefTrustAll : ICertificatePolicy {
    public bool CheckValidationResult(ServicePoint sp, X509Certificate cert, WebRequest req, int problem) { return true; }
}
"@
}
[System.Net.ServicePointManager]::CertificatePolicy = New-Object ValBriefTrustAll
[System.Net.ServicePointManager]::SecurityProtocol = [System.Net.SecurityProtocolType]::Tls12

Write-Host "正在從 Riot Client 取得 Token..." -ForegroundColor Yellow

$authBytes = [System.Text.Encoding]::ASCII.GetBytes("riot:$password")
$authHeader = "Basic " + [Convert]::ToBase64String($authBytes)
$localHeaders = @{ Authorization = $authHeader }

try {
    $tokenRes = Invoke-RestMethod -Uri "https://127.0.0.1:$port/entitlements/v1/token" -Headers $localHeaders -ErrorAction Stop
    $accessToken = $tokenRes.accessToken
    $entitlementToken = $tokenRes.entitlementsToken
    $puuid = $tokenRes.subject
    Write-Host "OK Token 取得成功" -ForegroundColor Green
} catch {
    Write-Host ""
    Write-Host "X  無法取得 Token: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "   請確認 Riot Client 正在執行中" -ForegroundColor Yellow
    Write-Host ""; Read-Host "按 Enter 關閉"
    exit 1
}

Write-Host "正在取得帳號資訊..." -ForegroundColor Yellow
$gameName = ""
$tagLine = ""
try {
    $userInfoRes = Invoke-RestMethod -Uri "https://auth.riotgames.com/userinfo" -Headers @{ Authorization = "Bearer $accessToken" } -ErrorAction Stop
    $gameName = $userInfoRes.acct.game_name
    $tagLine = $userInfoRes.acct.tag_line
    Write-Host "OK 帳號：$($gameName)#$($tagLine)" -ForegroundColor Green
} catch {
    Write-Host "警告：無法取得帳號名稱，將使用空白" -ForegroundColor Yellow
}

$region = "ap"
try {
    $pasRes = Invoke-RestMethod -Uri "https://riot-geo.pas.si.riotgames.com/pas/v1/service/chat" -Headers @{ Authorization = "Bearer $accessToken" } -ErrorAction Stop
    if ($pasRes.affinity) { $region = $pasRes.affinity }
    elseif ($pasRes.affinities -and $pasRes.affinities.live) { $region = $pasRes.affinities.live }
    Write-Host "OK 地區：$region" -ForegroundColor Green
} catch {
    Write-Host "警告：無法偵測地區，使用預設 ap" -ForegroundColor Yellow
}

Write-Host "正在同步至 ValBrief..." -ForegroundColor Yellow

try {
    $payload = [PSCustomObject]@{
        code = $Code
        accessToken = $accessToken
        entitlementToken = $entitlementToken
        puuid = $puuid
        gameName = $gameName
        tagLine = $tagLine
        region = $region
    }
    $body = $payload | ConvertTo-Json -Compress
    $result = Invoke-RestMethod -Uri "$ServerUrl/api/auth/link-from-companion" -Method POST -Body $body -ContentType "application/json" -ErrorAction Stop

    if ($result.success) {
        Write-Host ""
        Write-Host "OK 成功連結！$($result.gameName)#$($result.tagLine)" -ForegroundColor Green
        Write-Host "   請回到 ValBrief 網站重新整理頁面" -ForegroundColor Cyan
    } else {
        Write-Host "X  失敗：$($result.error)" -ForegroundColor Red
    }
} catch {
    Write-Host "X  連線失敗：$($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""; Read-Host "按 Enter 關閉"
`

  // Wrap PS1 in a .bat that bypasses execution policy — avoids the "script blocked" flash
  const encoded = Buffer.from(script, 'utf16le').toString('base64')
  const bat = `@echo off\r\nchcp 65001 > nul\r\npowershell.exe -NoProfile -ExecutionPolicy Bypass -EncodedCommand ${encoded}\r\n`

  res.setHeader('Content-Type', 'application/octet-stream')
  res.setHeader('Content-Disposition', 'attachment; filename="valbrief-companion.bat"')
  res.send(bat)
})

// Receive tokens from companion script (auth via OTP code, no session needed)
router.post('/link-from-companion', async (req, res) => {
  const { code, accessToken, entitlementToken, puuid, gameName, tagLine, region } = req.body
  if (!code || !accessToken) return res.status(400).json({ success: false, error: '缺少參數' })

  const userId = consumeOtp(code)
  if (!userId) return res.status(401).json({ success: false, error: '驗證碼無效或已過期，請重新下載腳本' })

  try {
    if (entitlementToken && puuid) {
      // Script provided all tokens — save directly, no VPS→Riot calls needed
      saveRiotTokens(userId, {
        accessToken,
        entitlementToken,
        puuid,
        region: region || 'ap',
        gameName: gameName || '',
        tagLine: tagLine || '',
      })
      console.log(`[companion] linked userId=${userId} gameName=${gameName}#${tagLine}`)
      return res.json({ success: true, gameName, tagLine })
    }

    // Fallback for old scripts: exchange via backend
    const tokens = await exchangeAccessToken(accessToken)
    saveRiotTokens(userId, tokens)
    console.log(`[companion] linked userId=${userId} gameName=${tokens.gameName}#${tokens.tagLine}`)
    return res.json({ success: true, gameName: tokens.gameName, tagLine: tokens.tagLine })
  } catch (e: any) {
    console.error('[companion] failed:', e.message)
    return res.status(500).json({ success: false, error: '處理 Token 失敗：' + e.message })
  }
})

export default router
