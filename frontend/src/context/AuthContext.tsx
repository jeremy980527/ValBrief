import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { userApi, authApi } from '../lib/api'
import { User } from '../types'

interface AuthCtx {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<any>
  register: (email: string, username: string, password: string) => Promise<any>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
  linkViaUrl: (callbackUrl: string, regionOverride?: string) => Promise<any>
  unlinkRiot: () => Promise<void>
}

const Ctx = createContext<AuthCtx | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  const refreshUser = useCallback(async () => {
    try {
      const data = await userApi.me()
      setUser(data)
    } catch {
      setUser(null)
    }
  }, [])

  useEffect(() => {
    refreshUser().finally(() => setLoading(false))
  }, [refreshUser])

  const login = useCallback(async (email: string, password: string) => {
    const data = await userApi.login(email, password)
    if (data.success) setUser(data)
    return data
  }, [])

  const register = useCallback(async (email: string, username: string, password: string) => {
    const data = await userApi.register(email, username, password)
    if (data.success) setUser(data)
    return data
  }, [])

  const logout = useCallback(async () => {
    await userApi.logout()
    setUser(null)
  }, [])

  const linkViaUrl = useCallback(async (callbackUrl: string, regionOverride?: string) => {
    const data = await authApi.linkViaUrl(callbackUrl, regionOverride)
    if (data.success) await refreshUser()
    return data
  }, [refreshUser])

  const unlinkRiot = useCallback(async () => {
    await authApi.unlink()
    await refreshUser()
  }, [refreshUser])

  return (
    <Ctx.Provider value={{ user, loading, login, register, logout, refreshUser, linkViaUrl, unlinkRiot }}>
      {children}
    </Ctx.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useAuth must be inside AuthProvider')
  return ctx
}
