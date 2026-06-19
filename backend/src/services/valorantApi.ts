import axios from 'axios'

const VAPI = 'https://valorant-api.com/v1'
const CLIENT_PLATFORM = 'ew0KCSJwbGF0Zm9ybVR5cGUiOiAiUEMiLA0KCSJwbGF0Zm9ybU9TIjogIldpbmRvd3MiLA0KCSJwbGF0Zm9ybU9TVmVyc2lvbiI6ICIxMC4wLjE5MDQyLjEuMjU2LjY0Yml0IiwNCgkicGxhdGZvcm1DaGlwc2V0IjogIlVua25vd24iDQp9'

const TIER_NAMES: Record<string, string> = {
  '12683d76-48d7-84a3-4e09-6985794f0445': 'Select',
  '0cebb8be-46d7-c122-3a9c-1f38f5ebb45b': 'Deluxe',
  '60bca009-4182-7998-dee7-b8a2558dc369': 'Premium',
  'e046854e-406c-37f4-6607-19a9ba8426fc': 'Ultra',
  'bcef87d6-209b-46c6-8b19-fbe40bd95abc': 'Exclusive',
  '411e4a55-4e59-7757-41f0-86a53f101bb5': 'Melee',
}
const TIER_COLORS: Record<string, string> = {
  '12683d76-48d7-84a3-4e09-6985794f0445': '#009ef7',
  '0cebb8be-46d7-c122-3a9c-1f38f5ebb45b': '#00c9c3',
  '60bca009-4182-7998-dee7-b8a2558dc369': '#c975e2',
  'e046854e-406c-37f4-6607-19a9ba8426fc': '#f5a623',
  'bcef87d6-209b-46c6-8b19-fbe40bd95abc': '#ffffff',
  '411e4a55-4e59-7757-41f0-86a53f101bb5': '#ff4655',
}

let clientVersionCache: { value: string; at: number } | null = null
let skinLevelMap: Map<string, any> | null = null

export async function getClientVersion(): Promise<string> {
  // Refresh every 30 minutes so we always have the current version
  if (clientVersionCache && Date.now() - clientVersionCache.at < 1800000) {
    return clientVersionCache.value
  }
  try {
    const r = await axios.get(`${VAPI}/version`, { timeout: 8000 })
    const v: string = r.data.data.riotClientVersion
    console.log(`[shop] clientVersion fetched: ${v}`)
    clientVersionCache = { value: v, at: Date.now() }
    return v
  } catch (e: any) {
    console.warn(`[shop] version fetch failed: ${e.message}`)
    if (clientVersionCache) return clientVersionCache.value
    throw new Error('Cannot determine Riot client version')
  }
}

async function buildSkinMap(): Promise<Map<string, any>> {
  if (skinLevelMap) return skinLevelMap
  const r = await axios.get(`${VAPI}/weapons/skins?language=zh-TW`)
  skinLevelMap = new Map()
  for (const skin of r.data.data) {
    for (const level of skin.levels || []) {
      skinLevelMap.set(level.uuid, { skin, level })
    }
  }
  return skinLevelMap
}

function pdUrl(region: string) {
  return `https://pd.${region}.a.pvp.net`
}

function riotHeaders(accessToken: string, entitlementToken: string, version: string) {
  return {
    Authorization: `Bearer ${accessToken}`,
    'X-Riot-Entitlements-JWT': entitlementToken,
    'X-Riot-ClientVersion': version,
    'X-Riot-ClientPlatform': CLIENT_PLATFORM,
  }
}

async function fetchStorefrontRaw(accessToken: string, entitlementToken: string, puuid: string, region: string, version: string) {
  const headers = riotHeaders(accessToken, entitlementToken, version)
  console.log(`[shop] region=${region} puuid=${puuid.substring(0, 8)}... ver=${version.substring(0, 40)}`)
  console.log(`[shop] entToken=${entitlementToken ? entitlementToken.substring(0, 20) + '...' : 'MISSING'}`)

  const url = `${pdUrl(region)}/store/v2/storefront/${puuid}`
  console.log(`[shop] GET ${url}`)
  try {
    const r = await axios.get(url, { headers, timeout: 12000 })
    console.log(`[shop] success status=${r.status}`)
    return r.data
  } catch (e: any) {
    const status = e?.response?.status
    const body = e?.response?.data
    const raw = typeof body === 'string' ? body : JSON.stringify(body)
    console.error(`[shop] FAILED status=${status} body=${raw}`)
    throw e
  }
}

export async function getStorefront(accessToken: string, entitlementToken: string, puuid: string, region: string) {
  const [version, skins] = await Promise.all([getClientVersion(), buildSkinMap()])
  const data = await fetchStorefrontRaw(accessToken, entitlementToken, puuid, region, version)

  const panel = data.SkinsPanelLayout
  const offers: any[] = panel.SingleItemStoreOffers || []

  const items = await Promise.all(
    (panel.SingleItemOffers as string[]).map(async (uuid: string, i: number) => {
      const price = offers[i]?.Cost?.['85ad13f7-3d1b-5128-9eb2-7cd8ee0b5741'] || 0
      const entry = skins.get(uuid)
      if (!entry) return { offerId: uuid, name: 'Unknown Skin', price, image: null, video: null, tier: 'Select', tierColor: '#009ef7' }
      const { skin, level } = entry
      return {
        offerId: uuid,
        name: skin.displayName,
        price,
        image: level.displayIcon || skin.displayIcon,
        video: level.streamedVideo || null,
        tier: TIER_NAMES[skin.contentTierUuid] || 'Select',
        tierColor: TIER_COLORS[skin.contentTierUuid] || '#009ef7',
      }
    })
  )

  return { items, remainingSeconds: panel.SingleItemOffersRemainingDurationInSeconds }
}

export async function getMissions(accessToken: string, entitlementToken: string, puuid: string, region: string) {
  const version = await getClientVersion()
  const [contractsRes, defsRes] = await Promise.all([
    axios.get(`${pdUrl(region)}/contracts/v1/contracts/${puuid}`, {
      headers: riotHeaders(accessToken, entitlementToken, version),
    }),
    axios.get(`${VAPI}/missions?language=zh-TW`),
  ])

  const rawMissions: any[] = contractsRes.data.Missions || []
  const defs: any[] = defsRes.data.data || []

  return rawMissions
    .map((m: any) => {
      const def = defs.find((d: any) => d.uuid === m.ID)
      if (!def) return null
      const objUuid = def.objectives?.[0]?.objectiveUuid
      const progress = objUuid ? (m.Objectives?.[objUuid] || 0) : 0
      const total = def.objectives?.[0]?.value || 1
      return {
        id: m.ID,
        title: def.displayName || def.title || 'Mission',
        description: def.title || '',
        xpGrant: def.xpGrant || 0,
        progressCurrent: progress,
        progressTotal: total,
        complete: m.Complete || false,
        type: (def.type || '').toLowerCase().includes('daily') ? 'daily' : 'weekly',
        expiresAt: m.ExpirationTime || null,
      }
    })
    .filter(Boolean)
}
