import { NavLink, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ShoppingBag, Users, Target, Newspaper, LogOut, Home } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

const links = [
  { to: '/', icon: Home, label: '首頁' },
  { to: '/shop', icon: ShoppingBag, label: '每日商店' },
  { to: '/missions', icon: Target, label: '任務' },
  { to: '/team', icon: Users, label: '組隊' },
  { to: '/news', icon: Newspaper, label: '新聞' },
]

export default function Sidebar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <motion.aside
      className="w-64 h-screen bg-bg-card border-r border-border flex flex-col fixed left-0 top-0 z-40"
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* Logo */}
      <div className="p-6 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-green-primary/10 border border-green-primary/30 flex items-center justify-center">
            <span className="text-green-primary font-black text-sm">VB</span>
          </div>
          <div>
            <h1 className="font-black text-white tracking-tight text-lg leading-none">Val<span className="text-gradient">Brief</span></h1>
            <p className="text-white/30 text-xs mt-0.5">特戰英豪工具</p>
          </div>
        </div>
      </div>

      {/* User info */}
      {user && (
        <div className="mx-4 mb-4 p-3 rounded-xl bg-bg-secondary border border-border">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-green-primary/20 border border-green-primary/30 flex items-center justify-center flex-shrink-0">
              <span className="text-green-primary font-bold text-sm">{user.gameName[0]?.toUpperCase()}</span>
            </div>
            <div className="overflow-hidden">
              <p className="text-white text-sm font-semibold truncate">{user.gameName}</p>
              <p className="text-white/40 text-xs">#{user.tagLine}</p>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 px-3 space-y-1">
        {links.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group relative
              ${isActive
                ? 'bg-green-primary text-black'
                : 'text-white/50 hover:text-white hover:bg-bg-hover'
              }`
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <motion.div
                    className="absolute inset-0 rounded-xl"
                    layoutId="nav-active"
                    style={{ background: '#B4FF4D' }}
                    transition={{ type: 'spring', bounce: 0.2, duration: 0.5 }}
                  />
                )}
                <Icon size={18} className="relative z-10 flex-shrink-0" />
                <span className="relative z-10">{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-border">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-white/40 hover:text-val-red hover:bg-val-red/5 text-sm font-medium transition-all duration-200"
        >
          <LogOut size={18} />
          <span>登出</span>
        </button>
      </div>
    </motion.aside>
  )
}
