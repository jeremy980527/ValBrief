import { Router } from 'express'
import { getUserByEmail, getUserByUsername, getUserById, createUser, checkPassword } from '../db/users'

const router = Router()

router.post('/register', async (req, res) => {
  const { email, username, password } = req.body
  if (!email || !username || !password) return res.json({ success: false, error: 'All fields are required' })
  if (password.length < 6) return res.json({ success: false, error: 'Password must be at least 6 characters' })
  if (getUserByEmail(email)) return res.json({ success: false, error: 'Email already registered' })
  if (getUserByUsername(username)) return res.json({ success: false, error: 'Username already taken' })
  try {
    const user = await createUser(email, username, password)
    req.session.userId = user.id
    return res.json({ success: true, username: user.username, email: user.email, riotLinked: false })
  } catch (e: any) {
    return res.json({ success: false, error: e.message })
  }
})

router.post('/login', async (req, res) => {
  const { email, password } = req.body
  if (!email || !password) return res.json({ success: false, error: 'Missing credentials' })
  const user = getUserByEmail(email)
  if (!user) return res.json({ success: false, error: 'Account not found' })
  const ok = await checkPassword(user, password)
  if (!ok) return res.json({ success: false, error: 'Invalid password' })
  req.session.userId = user.id
  return res.json({
    success: true,
    username: user.username,
    email: user.email,
    riotLinked: !!user.riotTokens,
    riotGameName: user.riotTokens?.gameName,
    riotTagLine: user.riotTokens?.tagLine,
    riotRegion: user.riotTokens?.region,
  })
})

router.post('/logout', (req, res) => {
  req.session.destroy(() => res.json({ success: true }))
})

router.get('/me', (req, res) => {
  if (!req.session.userId) return res.status(401).json({ error: 'Not authenticated' })
  const user = getUserById(req.session.userId)
  if (!user) return res.status(401).json({ error: 'User not found' })
  res.json({
    id: user.id,
    username: user.username,
    email: user.email,
    riotLinked: !!user.riotTokens,
    riotGameName: user.riotTokens?.gameName,
    riotTagLine: user.riotTokens?.tagLine,
    riotRegion: user.riotTokens?.region,
  })
})

export default router
