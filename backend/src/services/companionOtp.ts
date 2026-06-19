const store = new Map<string, { userId: string; expiresAt: number }>()

export function createOtp(userId: string): string {
  for (const [k, v] of store) {
    if (Date.now() > v.expiresAt) store.delete(k)
  }
  const code = Math.random().toString(36).slice(2, 8).toUpperCase()
  store.set(code, { userId, expiresAt: Date.now() + 300_000 }) // 5 min
  return code
}

export function consumeOtp(code: string): string | null {
  const entry = store.get(code.toUpperCase())
  if (!entry) return null
  if (Date.now() > entry.expiresAt) { store.delete(code); return null }
  store.delete(code)
  return entry.userId
}
