import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { ShoppingBag, Target, Users, Newspaper, ChevronRight, TrendingUp } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import PageTransition, { stagger, fadeUp } from '../components/ui/PageTransition'

const cards = [
  { to: '/shop', icon: ShoppingBag, label: '每日商店', desc: '今日特價武器皮膚', color: '#c975e2', bg: 'rgba(201,117,226,0.08)' },
  { to: '/missions', icon: Target, label: '任務', desc: '每日 & 每週任務進度', color: '#B4FF4D', bg: 'rgba(180,255,77,0.08)' },
  { to: '/team', icon: Users, label: '組隊', desc: '尋找隊友一起上分', color: '#00c9c3', bg: 'rgba(0,201,195,0.08)' },
  { to: '/news', icon: Newspaper, label: '新聞', desc: '最新更新與公告', color: '#f5a623', bg: 'rgba(245,166,35,0.08)' },
]

function greeting() {
  const h = new Date().getHours()
  if (h < 12) return '早安'
  if (h < 18) return '午安'
  return '晚安'
}

export default function HomePage() {
  const { user } = useAuth()
  const navigate = useNavigate()

  return (
    <PageTransition>
      <div className="p-8 max-w-5xl mx-auto">
        {/* Header */}
        <motion.div variants={fadeUp} className="mb-10">
          <p className="text-white/40 text-sm font-medium uppercase tracking-widest mb-2">{greeting()}，特工</p>
          <h1 className="text-4xl font-black text-white leading-tight">
            {user?.gameName
              ? <><span className="text-gradient">{user.gameName}</span><span className="text-white/30 text-2xl ml-2">#{user.tagLine}</span></>
              : <span className="text-gradient">Val<span className="text-white">Brief</span></span>
            }
          </h1>
          <p className="text-white/40 mt-2">你的 Valorant 任務控制中心</p>
        </motion.div>

        {/* Quick stat */}
        <motion.div variants={fadeUp} className="card p-5 mb-8 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-green-primary/10 border border-green-primary/20 flex items-center justify-center flex-shrink-0">
            <TrendingUp size={20} className="text-green-primary" />
          </div>
          <div className="flex-1">
            <p className="text-white/40 text-xs uppercase tracking-wider mb-1">狀態</p>
            <p className="text-white font-semibold">系統就緒</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-primary animate-pulse" />
            <span className="text-green-primary text-sm font-medium">線上</span>
          </div>
        </motion.div>

        {/* Feature grid */}
        <motion.div variants={stagger} animate="animate" className="grid grid-cols-2 gap-4">
          {cards.map(({ to, icon: Icon, label, desc, color, bg }) => (
            <motion.button
              key={to}
              variants={fadeUp}
              onClick={() => navigate(to)}
              whileHover={{ y: -4, scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              className="card p-6 text-left group"
            >
              <div className="flex items-start justify-between mb-4">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: bg, border: `1px solid ${color}30` }}
                >
                  <Icon size={22} style={{ color }} />
                </div>
                <ChevronRight size={16} className="text-white/20 group-hover:text-white/60 transition-colors mt-1" />
              </div>
              <h2 className="text-white font-bold text-lg mb-1">{label}</h2>
              <p className="text-white/40 text-sm">{desc}</p>
              <motion.div
                className="mt-4 h-0.5 rounded-full"
                style={{ backgroundColor: color, opacity: 0.3 }}
                whileHover={{ opacity: 0.7, scaleX: 1.05 }}
              />
            </motion.button>
          ))}
        </motion.div>
      </div>
    </PageTransition>
  )
}
