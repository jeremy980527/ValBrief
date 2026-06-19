import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Target, RefreshCw, AlertCircle, Zap, Link2 } from 'lucide-react'
import { missionsApi } from '../lib/api'
import { useAuth } from '../context/AuthContext'
import { Mission } from '../types'
import PageTransition, { stagger, fadeUp } from '../components/ui/PageTransition'
import MissionCard from '../components/Missions/MissionCard'
import LinkRiotModal from '../components/RiotLink/LinkRiotModal'

export default function MissionsPage() {
  const { refreshUser } = useAuth()
  const [missions, setMissions] = useState<Mission[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [tokenExpired, setTokenExpired] = useState(false)
  const [showRelink, setShowRelink] = useState(false)

  async function fetchMissions() {
    setLoading(true); setError(''); setTokenExpired(false)
    try {
      const data = await missionsApi.get()
      setMissions(data.missions || [])
    } catch (e: any) {
      const code = e?.response?.data?.code
      if (code === 'RIOT_TOKEN_EXPIRED') {
        setTokenExpired(true)
      } else {
        setError(e?.response?.data?.error || 'Failed to load missions')
      }
    } finally { setLoading(false) }
  }

  function handleRelinked() {
    setShowRelink(false)
    refreshUser()
    fetchMissions()
  }

  useEffect(() => { fetchMissions() }, [])

  const daily = missions.filter(m => m.type === 'daily')
  const weekly = missions.filter(m => m.type === 'weekly')
  const totalXp = missions.filter(m => !m.complete).reduce((s, m) => s + m.xpGrant, 0)

  return (
    <PageTransition>
      <div className="p-8 max-w-4xl mx-auto">
        {/* Header */}
        <motion.div variants={fadeUp} className="flex items-start justify-between mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-lg bg-green-primary/10 border border-green-primary/20 flex items-center justify-center">
                <Target size={16} className="text-green-primary" />
              </div>
              <p className="text-white/40 text-sm uppercase tracking-widest">任務中心</p>
            </div>
            <h1 className="text-3xl font-black text-white">任務</h1>
          </div>
          <button onClick={fetchMissions} disabled={loading} className="btn-ghost flex items-center gap-2 text-sm py-2 px-4">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />刷新
          </button>
        </motion.div>

        {/* XP summary */}
        {!loading && !error && missions.length > 0 && (
          <motion.div variants={fadeUp} className="card p-5 mb-6 flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-yellow-400/10 border border-yellow-400/20 flex items-center justify-center flex-shrink-0">
              <Zap size={18} className="text-yellow-400" />
            </div>
            <div>
              <p className="text-white/40 text-xs mb-0.5">待領取 XP</p>
              <p className="text-white font-bold text-xl">{(totalXp / 1000).toFixed(1)}K <span className="text-white/30 text-sm font-normal">XP</span></p>
            </div>
            <div className="ml-auto text-right">
              <p className="text-white/40 text-xs mb-0.5">完成進度</p>
              <p className="text-white font-semibold">{missions.filter(m => m.complete).length} / {missions.length}</p>
            </div>
          </motion.div>
        )}

        {tokenExpired ? (
          <motion.div variants={fadeUp} className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-full bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center mb-4">
              <Link2 size={24} className="text-yellow-400" />
            </div>
            <p className="text-white font-semibold mb-2">Riot Token 已過期</p>
            <p className="text-white/40 text-sm mb-6 max-w-xs">Riot 登入憑證每小時會過期，需要重新連結一次。</p>
            <button onClick={() => setShowRelink(true)} className="btn-primary flex items-center gap-2">
              <Link2 size={15} />
              重新連結 Riot 帳號
            </button>
          </motion.div>
        ) : error ? (
          <motion.div variants={fadeUp} className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-full bg-val-red/10 border border-val-red/20 flex items-center justify-center mb-4">
              <AlertCircle size={24} className="text-val-red" />
            </div>
            <p className="text-white font-semibold mb-2">無法載入任務</p>
            <p className="text-white/40 text-sm mb-6 max-w-xs">{error}</p>
            <button onClick={fetchMissions} className="btn-primary">重試</button>
          </motion.div>
        ) : loading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="card p-4">
                <div className="flex justify-between mb-3">
                  <div className="space-y-2 flex-1">
                    <div className="h-3 skeleton rounded w-16" />
                    <div className="h-4 skeleton rounded w-3/4" />
                  </div>
                  <div className="h-6 skeleton rounded w-16 ml-4" />
                </div>
                <div className="h-1.5 skeleton rounded-full" />
              </div>
            ))}
          </div>
        ) : (
          <motion.div variants={stagger} animate="animate" className="space-y-6">
            {daily.length > 0 && (
              <div>
                <h2 className="text-white/60 text-xs uppercase tracking-widest font-semibold mb-3 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-primary inline-block" />
                  每日任務
                </h2>
                <div className="space-y-2">
                  {daily.map(m => <MissionCard key={m.id} mission={m} />)}
                </div>
              </div>
            )}

            {weekly.length > 0 && (
              <div>
                <h2 className="text-white/60 text-xs uppercase tracking-widest font-semibold mb-3 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400 inline-block" />
                  每週任務
                </h2>
                <div className="space-y-2">
                  {weekly.map(m => <MissionCard key={m.id} mission={m} />)}
                </div>
              </div>
            )}

            {missions.length === 0 && (
              <div className="text-center py-16 text-white/30">
                <Target size={32} className="mx-auto mb-3 opacity-30" />
                <p>目前沒有任務資料</p>
              </div>
            )}
          </motion.div>
        )}
      </div>

      {showRelink && (
        <LinkRiotModal onClose={() => setShowRelink(false)} onLinked={handleRelinked} />
      )}
    </PageTransition>
  )
}
