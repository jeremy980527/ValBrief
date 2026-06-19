import axios from 'axios'
import { wrapper } from 'axios-cookiejar-support'
import { CookieJar } from 'tough-cookie'
import { v4 as uuidv4 } from 'uuid'

const AUTH_URL = 'https://auth.riotgames.com/api/v1/authorization'
const ENTITLEMENT_URL = 'https://entitlements.auth.riotgames.com/api/token/v1'
const USERINFO_URL = 'https://auth.riotgames.com/userinfo'
const GEO_URL = 'https://riot-geo.pas.si/pas/v1/product/valorant'

const RIOT_HEADERS = {
  'User-Agent': 'RiotClient/43.0.1.4195386.4190634 rso-auth/1.0.0.0 riot (Windows;10;;Professional, x64)',
  'Accept-Language': 'en-US,en;q=0.9',
  'Accept': 'application/json, text/plain, */*',
}

const mfaSessions = new Map<string, { jar: CookieJar; expiresAt: number }>()
setInterval(() => {
  const now = Date.now()
  for (const [id, s] of mfaSessions) {
    if (s.expiresAt < now) mfaSessions.delete(id)
  }
}, 60000)

function createClient(jar: CookieJar) {
  return wrapper(axios.create({ jar, headers: RIOT_HEADERS, validateStatus: () => true }))
}

function extractToken(uri: string): string {
  const match = uri.match(/access_token=([^&]+)/)
  if (!match) throw new Error('Cannot extract access_token from URI')
  return decodeURIComponent(match[1])
}

async function getEntitlementToken(token: string): Promise<string> {
  const r = await axios.post(ENTITLEMENT_URL, {}, {
    headers: { ...RIOT_HEADERS, Authorization: `Bearer ${token}` },
  })
  return r.data.entitlements_token
}

async function getUserInfo(token: string) {
  const r = await axios.get(USERINFO_URL, {
    headers: { ...RIOT_HEADERS, Authorization: `Bearer ${token}` },
  })
  return {
    puuid: r.data.sub as string,
    gameName: (r.data.acct?.game_name || '') as string,
    tagLine: (r.data.acct?.tag_line || '') as string,
  }
}

async function getRegion(token: string): Promise<string> {
  try {
    const r = await axios.get(GEO_URL, {
      headers: { ...RIOT_HEADERS, Authorization: `Bearer ${token}` },
    })
    return r.data.affinities?.live || 'na'
  } catch { return 'na' }
}

export interface AuthResult {
  success: boolean
  requiresMFA?: boolean
  mfaSessionId?: string
  mfaEmail?: string
  error?: string
  tokens?: {
    accessToken: string
    entitlementToken: string
    puuid: string
    gameName: string
    tagLine: string
    region: string
  }
}

export async function login(username: string, password: string): Promise<AuthResult> {
  const jar = new CookieJar()
  const client = createClient(jar)
  try {
    await client.post(AUTH_URL, {
      client_id: 'play-valorant-web-prod',
      nonce: '1',
      redirect_uri: 'https://playvalorant.com/opt_in',
      response_type: 'token id_token',
      scope: 'account openid lol_region link ban',
    })

    const r = await client.put(AUTH_URL, {
      type: 'auth', username, password, remember: true, language: 'en_US',
    })

    const { type, response, multifactor, error } = r.data
    if (error) return { success: false, error: error === 'auth_failure' ? 'Invalid credentials' : error }

    if (type === 'multifactor') {
      const id = uuidv4()
      mfaSessions.set(id, { jar, expiresAt: Date.now() + 300000 })
      return { success: false, requiresMFA: true, mfaSessionId: id, mfaEmail: multifactor?.email }
    }

    if (type === 'response') {
      const accessToken = extractToken(response.parameters.uri)
      const [entitlementToken, userInfo, region] = await Promise.all([
        getEntitlementToken(accessToken),
        getUserInfo(accessToken),
        getRegion(accessToken),
      ])
      return { success: true, tokens: { accessToken, entitlementToken, ...userInfo, region } }
    }

    return { success: false, error: 'Unexpected auth response' }
  } catch (e: any) {
    return { success: false, error: e.message || 'Auth failed' }
  }
}

export async function completeMFA(sessionId: string, code: string): Promise<AuthResult> {
  const sess = mfaSessions.get(sessionId)
  if (!sess) return { success: false, error: 'MFA session expired. Please login again.' }
  const client = createClient(sess.jar)
  try {
    const r = await client.put(AUTH_URL, { type: 'multifactor', code, rememberDevice: false })
    const { type, response, error } = r.data
    if (error) return { success: false, error: 'Invalid MFA code' }
    if (type === 'response') {
      mfaSessions.delete(sessionId)
      const accessToken = extractToken(response.parameters.uri)
      const [entitlementToken, userInfo, region] = await Promise.all([
        getEntitlementToken(accessToken),
        getUserInfo(accessToken),
        getRegion(accessToken),
      ])
      return { success: true, tokens: { accessToken, entitlementToken, ...userInfo, region } }
    }
    return { success: false, error: 'MFA failed' }
  } catch (e: any) {
    return { success: false, error: e.message || 'MFA failed' }
  }
}
