import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { ShoppingBag, RefreshCw, AlertCircle, Link2 } from 'lucide-react'
import { shopApi } from '../lib/api'
import { useAuth } from '../context/AuthContext'
import { DailyShop } from '../types'
import PageTransition, { stagger, fadeUp } from '../components/ui/PageTransition'
import ShopItemCard from '../components/Shop/ShopItem'
import CountdownTimer from '../components/ui/CountdownTimer'
import LinkRiotModal from '../components/RiotLink/LinkRiotModal'

export default function ShopPage() {
  const { refreshUser } = useAuth()
  const [shop, setShop] = useState<DailyShop | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [tokenExpired, setTokenExpired] = useState(false)
  const [showRelink, setShowRelink] = useState(false)

  async function fetchShop() {
    setLoading(true); setError(''); setTokenExpired(false)
    try {
      const data = await shopApi.get()
      setShop(data)
    } catch (e: any) {
      const code = e?.response?.data?.code
      if (code === 'RIOT_TOKEN_EXPIRED') {
        setTokenExpired(true)
      } else {
        setError(e?.response?.data?.error || 'Failed to load shop')
      }
    } finally { setLoading(false) }
  }

  function handleRelinked() {
    setShowRelink(false)
    refreshUser()
    fetchShop()
  }

  useEffect(() => { fetchShop() }, [])

  return (
    <PageTransition>
      <div className="p-8 max-w-5xl mx-auto">
        {/* Header */}
        <motion.div variants={fadeUp} className="flex items-start justify-between mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
                <ShoppingBag size={16} className="text-purple-400" />
              </div>
              <p className="text-white/40 text-sm uppercase tracking-widest">每日商店</p>
            </div>
            <h1 className="text-3xl font-black text-white">今日特賣</h1>
          </div>
          <div className="flex items-center gap-4">
            {shop && <CountdownTimer seconds={shop.remainingSeconds} />}
            <button
              onClick={fetchShop}
              disabled={loading}
              className="btn-ghost flex items-center gap-2 text-sm py-2 px-4"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              刷新
            </button>
          </div>
        </motion.div>

        {tokenExpired ? (
          <motion.div variants={fadeUp} className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-full bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center mb-4">
              <Link2 size={24} className="text-yellow-400" />
            </div>
            <p className="text-white font-semibold mb-2">Riot Token 已過期</p>
            <p className="text-white/40 text-sm mb-6 max-w-xs">Riot 登入憑證每小時會過期，需要重新連結一次以取得最新資料。</p>
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
            <p className="text-white font-semibold mb-2">無法載入商店</p>
            <p className="text-white/40 text-sm mb-6 max-w-xs">{error}</p>
            <button onClick={fetchShop} className="btn-primary">重試</button>
          </motion.div>
        ) : loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="card overflow-hidden">
                <div className="h-48 skeleton" />
                <div className="p-4 space-y-2">
                  <div className="h-4 skeleton rounded-lg w-3/4" />
                  <div className="h-5 skeleton rounded-lg w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : shop ? (
          <>
            <motion.div
              variants={stagger}
              animate="animate"
              className="grid grid-cols-2 lg:grid-cols-4 gap-4"
            >
              {shop.items.map((item, i) => (
                <ShopItemCard key={item.offerId} item={item} index={i} />
              ))}
            </motion.div>

            <motion.div variants={fadeUp} className="mt-8 p-4 rounded-xl bg-bg-secondary border border-border flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-green-primary animate-pulse flex-shrink-0" />
              <p className="text-white/40 text-sm">每日商店每 24 小時重置一次，把握時機購買你喜歡的皮膚！</p>
            </motion.div>
          </>
        ) : null}
      </div>

      {showRelink && (
        <LinkRiotModal onClose={() => setShowRelink(false)} onLinked={handleRelinked} />
      )}
    </PageTransition>
  )
}
