import express from 'express'
import cors from 'cors'
import session from 'express-session'
import authRouter from './routes/auth'
import shopRouter from './routes/shop'
import missionsRouter from './routes/missions'
import newsRouter from './routes/news'
import teamRouter from './routes/team'

declare module 'express-session' {
  interface SessionData {
    accessToken?: string
    entitlementToken?: string
    puuid?: string
    region?: string
    gameName?: string
    tagLine?: string
    pendingMfaId?: string
  }
}

const app = express()
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3001

app.use(cors({ origin: true, credentials: true }))
app.use(express.json())
app.use(session({
  secret: 'valbrief-secret-2024',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false, httpOnly: true, maxAge: 86400000 },
}))

app.use('/api/auth', authRouter)
app.use('/api/shop', shopRouter)
app.use('/api/missions', missionsRouter)
app.use('/api/news', newsRouter)
app.use('/api/team', teamRouter)
app.get('/api/health', (_req, res) => res.json({ status: 'ok' }))

app.listen(PORT, () => console.log(`ValBrief backend → http://localhost:${PORT}`))
