import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Eye, EyeOff, ShieldCheck, AlertCircle } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

type Tab = 'login' | 'register'

export default function LoginPage() {
  const { login, register } = useAuth()
  const navigate = useNavigate()
  const [tab, setTab] = useState<Tab>('login')
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError('')
    try {
      const res = tab === 'login'
        ? await login(email, password)
        : await register(email, username, password)
      if (res.success) navigate('/')
      else setError(res.error || 'Failed')
    } catch (e: any) {
      setError(e?.response?.data?.error || 'Connection error')
    } finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen bg-bg-base flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full" style={{ background: 'radial-gradient(circle, rgba(180,255,77,0.04) 0%, transparent 70%)' }} />
        {[...Array(15)].map((_, i) => (
          <motion.div key={i} className="absolute w-px h-px bg-green-primary/30 rounded-full"
            style={{ left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%` }}
            animate={{ scale: [0, 1.5, 0], opacity: [0, 1, 0] }}
            transition={{ duration: 3 + Math.random() * 3, repeat: Infinity, delay: Math.random() * 5 }}
          />
        ))}
      </div>

      <motion.div className="w-full max-w-md relative z-10"
        initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <motion.div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl border border-green-primary/30 bg-green-primary/10 mb-4"
            animate={{ boxShadow: ['0 0 20px rgba(180,255,77,0.2)', '0 0 40px rgba(180,255,77,0.4)', '0 0 20px rgba(180,255,77,0.2)'] }}
            transition={{ duration: 2.5, repeat: Infinity }}
          >
            <span className="text-green-primary font-black text-2xl">VB</span>
          </motion.div>
          <h1 className="text-3xl font-black text-white tracking-tight">Val<span className="text-gradient">Brief</span></h1>
          <p className="text-white/40 text-sm mt-2">特戰英豪工具平台</p>
        </div>

        <div className="bg-bg-card border border-border rounded-2xl overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b border-border">
            {(['login', 'register'] as Tab[]).map(t => (
              <button key={t} onClick={() => { setTab(t); setError('') }}
                className={`flex-1 py-4 text-sm font-semibold transition-colors ${tab === t ? 'text-green-primary border-b-2 border-green-primary' : 'text-white/40 hover:text-white/60'}`}
              >
                {t === 'login' ? '登入' : '註冊帳號'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div>
              <label className="text-white/60 text-sm block mb-1.5">Email</label>
              <input className="input-field" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="your@email.com" required autoFocus />
            </div>

            {tab === 'register' && (
              <div>
                <label className="text-white/60 text-sm block mb-1.5">使用者名稱</label>
                <input className="input-field" value={username} onChange={e => setUsername(e.target.value)} placeholder="YourUsername" required />
              </div>
            )}

            <div>
              <label className="text-white/60 text-sm block mb-1.5">密碼{tab === 'register' && <span className="text-white/30 text-xs ml-1">（至少 6 字元）</span>}</label>
              <div className="relative">
                <input className="input-field pr-11" type={showPw ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required />
                <button type="button" onClick={() => setShowPw(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors">
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <motion.div className="flex items-center gap-2 bg-val-red/10 border border-val-red/30 rounded-xl px-4 py-3"
                initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
              >
                <AlertCircle size={15} className="text-val-red flex-shrink-0" />
                <p className="text-val-red text-sm">{error}</p>
              </motion.div>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2 mt-2">
              {loading ? <><div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />{tab === 'login' ? '登入中...' : '建立中...'}</> : <><ShieldCheck size={16} />{tab === 'login' ? '登入' : '建立帳號'}</>}
            </button>

            <p className="text-white/20 text-xs text-center">ValBrief 帳號與 Riot 帳號分開管理</p>
          </form>
        </div>
      </motion.div>
    </div>
  )
}
