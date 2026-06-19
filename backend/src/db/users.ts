import fs from 'fs'
import path from 'path'
import bcrypt from 'bcryptjs'
import { v4 as uuidv4 } from 'uuid'

const DB_FILE = path.join(process.cwd(), 'data', 'users.json')

export interface RiotTokens {
  accessToken: string
  entitlementToken: string
  puuid: string
  region: string
  gameName: string
  tagLine: string
  linkedAt: string
}

export interface User {
  id: string
  email: string
  username: string
  passwordHash: string
  riotTokens?: RiotTokens
  createdAt: string
}

function ensureDB() {
  const dir = path.dirname(DB_FILE)
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
  if (!fs.existsSync(DB_FILE)) fs.writeFileSync(DB_FILE, JSON.stringify({ users: [] }, null, 2))
}

function readDB(): { users: User[] } {
  ensureDB()
  return JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'))
}

function writeDB(db: { users: User[] }) {
  ensureDB()
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2))
}

export function getUserByEmail(email: string) {
  return readDB().users.find(u => u.email.toLowerCase() === email.toLowerCase())
}

export function getUserByUsername(username: string) {
  return readDB().users.find(u => u.username.toLowerCase() === username.toLowerCase())
}

export function getUserById(id: string) {
  return readDB().users.find(u => u.id === id)
}

export async function createUser(email: string, username: string, password: string): Promise<User> {
  const db = readDB()
  const user: User = {
    id: uuidv4(),
    email: email.toLowerCase().trim(),
    username: username.trim(),
    passwordHash: await bcrypt.hash(password, 12),
    createdAt: new Date().toISOString(),
  }
  db.users.push(user)
  writeDB(db)
  return user
}

export async function checkPassword(user: User, password: string): Promise<boolean> {
  return bcrypt.compare(password, user.passwordHash)
}

export function saveRiotTokens(userId: string, tokens: Omit<RiotTokens, 'linkedAt'>) {
  const db = readDB()
  const user = db.users.find(u => u.id === userId)
  if (!user) throw new Error('User not found')
  user.riotTokens = { ...tokens, linkedAt: new Date().toISOString() }
  writeDB(db)
}

export function clearRiotTokens(userId: string) {
  const db = readDB()
  const user = db.users.find(u => u.id === userId)
  if (user) { delete user.riotTokens; writeDB(db) }
}
