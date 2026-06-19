import { Request, Response, NextFunction } from 'express'
import { getUserById } from '../db/users'

export function requireInternalAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.session.userId) return res.status(401).json({ error: 'Not authenticated' })
  next()
}

export function requireRiotAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.session.userId) return res.status(401).json({ error: 'Not authenticated' })
  const user = getUserById(req.session.userId)
  if (!user?.riotTokens) {
    return res.status(401).json({ error: 'Riot account not linked', code: 'RIOT_NOT_LINKED' })
  }
  ;(req as any).riotTokens = user.riotTokens
  next()
}
