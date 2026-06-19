import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { authApi } from '../lib/api'
import { User } from '../types'

interface AuthCtx {
  user: User | null
  loading: boolean
  login: (username: string, password: string) => Promise<{ success?: boolean; requiresMFA?: boolean; mfaEmail?: string; error?: string }>
  submitMFA: (code: string) => Promise<{ success?: boolean; error?: string }>
  logout: () => Promise<void>
}

const Ctx = createContext<AuthCtx | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    authApi.me()
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setLoading(false))
  }, [])

  const login = useCallback(async (username: string, password: string) => {
    const data = await authApi.login(username, password)
    if (data.success) {
      const me = await authApi.me()
      setUser(me)
    }
    return data
  }, [])

  const submitMFA = useCallback(async (code: string) => {
    const data = await authApi.mfa(code)
    if (data.success) {
      const me = await authApi.me()
      setUser(me)
    }
    return data
  }, [])

  const logout = useCallback(async () => {
    await authApi.logout()
    setUser(null)
  }, [])

  return <Ctx.Provider value={{ user, loading, login, submitMFA, logout }}>{children}</Ctx.Provider>
}

export function useAuth() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useAuth must be inside AuthProvider')
  return ctx
}
