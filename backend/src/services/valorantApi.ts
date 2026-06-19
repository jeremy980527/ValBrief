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

let clientVersion: string | null = null
let skinLevelMap: Map<string, any> | null = null

export async function getClientVersion(): Promise<string> {
  if (clientVersion) return clientVersion
  try {
    const r = await axios.get(`${VAPI}/version`)
    clientVersion = r.data.data.riotClientVersion
    return clientVersion!
  } catch { return 'release-08.08-shipping-7-2024063012' }
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
  try {
    const r = await axios.get(`${pdUrl(region)}/store/v3/storefront/${puuid}`, { headers })
    return r.data
  } catch (e1: any) {
    if (e1?.response?.status === 404) {
      console.log('[shop] v3 returned 404, falling back to v2')
      const r = await axios.get(`${pdUrl(region)}/store/v2/storefront/${puuid}`, { headers })
      return r.data
    }
    console.error('[shop] storefront error:', e1?.response?.status, JSON.stringify(e1?.response?.data))
    throw e1
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
