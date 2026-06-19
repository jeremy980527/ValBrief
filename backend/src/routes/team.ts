import { Router } from 'express'
import { v4 as uuidv4 } from 'uuid'
import { requireInternalAuth } from '../middleware/auth'
import { getUserById } from '../db/users'

const router = Router()

interface TeamPost {
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

const posts: TeamPost[] = [
  {
    id: '1', gameName: 'PhoenixRise', tagLine: 'NA1', rank: 'Diamond 2', rankColor: '#00b4d8',
    roles: ['Duelist', 'Initiator'], agents: ['Jett', 'Sova'], language: '中文/English',
    description: '找2位排位夥伴，上分為主，需要溝通能力。', region: 'ap', createdAt: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: '2', gameName: 'SageGuard', tagLine: 'TW1', rank: 'Platinum 3', rankColor: '#7b68ee',
    roles: ['Controller', 'Sentinel'], agents: ['Sage', 'Killjoy'], language: '中文',
    description: '尋找穩定的固定隊友，歡迎有麥克風的玩家。', discord: 'SageGuard#1234', region: 'ap', createdAt: new Date(Date.now() - 7200000).toISOString(),
  },
  {
    id: '3', gameName: 'VoidWalker', tagLine: 'KR1', rank: 'Immortal 1', rankColor: '#ff4655',
    roles: ['Duelist'], agents: ['Reyna', 'Neon'], language: 'English',
    description: 'Looking for IGL and support main for ranked grind.', region: 'ap', createdAt: new Date(Date.now() - 1800000).toISOString(),
  },
]

router.get('/', (_req, res) => {
  res.json({ posts: posts.slice().reverse() })
})

router.post('/', requireInternalAuth, (req, res) => {
  const { rank, rankColor, roles, agents, language, description, discord } = req.body
  const user = getUserById(req.session.userId!)
  const gameName = user?.riotTokens?.gameName || user?.username || 'Anonymous'
  const tagLine = user?.riotTokens?.tagLine || '0000'
  const region = user?.riotTokens?.region || 'ap'
  const post: TeamPost = {
    id: uuidv4(),
    gameName,
    tagLine,
    rank: rank || 'Unranked',
    rankColor: rankColor || '#888',
    roles: roles || [],
    agents: agents || [],
    language: language || 'Any',
    description: description || '',
    discord,
    region,
    createdAt: new Date().toISOString(),
  }
  posts.push(post)
  res.json({ success: true, post })
})

router.delete('/:id', requireInternalAuth, (req, res) => {
  const idx = posts.findIndex(p => p.id === req.params.id)
  if (idx === -1) return res.status(404).json({ error: 'Not found' })
  posts.splice(idx, 1)
  res.json({ success: true })
})

export default router
