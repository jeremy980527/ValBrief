import { Request, Response, NextFunction } from 'express'

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.session.accessToken || !req.session.puuid) {
    return res.status(401).json({ error: 'Not authenticated' })
  }
  next()
}
