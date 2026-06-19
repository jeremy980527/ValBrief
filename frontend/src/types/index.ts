export interface User {
  gameName: string
  tagLine: string
  region: string
  puuid: string
}

export interface ShopItem {
  offerId: string
  name: string
  price: number
  image: string | null
  video: string | null
  tier: string
  tierColor: string
}

export interface DailyShop {
  items: ShopItem[]
  remainingSeconds: number
}

export interface Mission {
  id: string
  title: string
  description: string
  xpGrant: number
  progressCurrent: number
  progressTotal: number
  complete: boolean
  type: 'daily' | 'weekly'
  expiresAt: string | null
}

export interface NewsArticle {
  id: string
  title: string
  description: string
  url: string
  thumbnail: string | null
  date: string
  category: string
}

export interface TeamPost {
  id: string
  gameName: string
  tagLine: string
  rank: string
  rankColor: string
  roles: string[]
  agents: string[]
  language: string
  description: string
  discord?: string
  region: string
  createdAt: string
}
