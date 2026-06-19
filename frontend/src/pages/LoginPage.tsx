import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Eye, EyeOff, ShieldCheck, AlertCircle } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

type Stage = 'login' | 'mfa'

export default function LoginPage() {
  const { login, submitMFA } = useAuth()
  const navigate = useNavigate()
  const [stage, setStage] = useState<Stage>('login')
  const [mfaEmail, setMfaEmail] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [code, setCode] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError('')
    try {
      const res = await login(username, password)
      if (res.success) { navigate('/') }
      else if (res.requiresMFA) { setMfaEmail(res.mfaEmail || ''); setStage('mfa') }
      else setError(res.error || 'Login failed')
    } catch { setError('Network error. Is the backend running?') }
    finally { setLoading(false) }
  }

  async function handleMFA(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError('')
    try {
      const res = await submitMFA(code)
      if (res.success) navigate('/')
      else setError(res.error || 'Invalid code')
    } catch { setError('MFA failed') }
    finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen bg-bg-base flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full" style={{ background: 'radial-gradient(circle, rgba(180,255,77,0.04) 0%, transparent 70%)' }} />
        <div className="absolute bottom-0 left-0 w-96 h-96 rounded-full" style={{ background: 'radial-gradient(circle, rgba(255,70,85,0.03) 0%, transparent 70%)' }} />
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-px h-px bg-green-primary/30 rounded-full"
            style={{ left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%` }}
            animate={{ scale: [0, 1.5, 0], opacity: [0, 1, 0] }}
            transition={{ duration: 3 + Math.random() * 3, repeat: Infinity, delay: Math.random() * 5 }}
          />
        ))}
      </div>

      <motion.div
        className="w-full max-w-md relative z-10"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        {/* Logo */}
        <div className="text-center mb-10">
          <motion.div
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl border border-green-primary/30 bg-green-primary/10 mb-4"
            animate={{ boxShadow: ['0 0 20px rgba(180,255,77,0.2)', '0 0 40px rgba(180,255,77,0.4)', '0 0 20px rgba(180,255,77,0.2)'] }}
            transition={{ duration: 2.5, repeat: Infinity }}
          >
            <span className="text-green-primary font-black text-2xl">VB</span>
          </motion.div>
          <h1 className="text-3xl font-black text-white tracking-tight">Val<span className="text-gradient">Brief</span></h1>
          <p className="text-white/40 text-sm mt-2">特戰英豪工具平台</p>
        </div>

        {/* Card */}
        <div className="bg-bg-card border border-border rounded-2xl p-8">
          {stage === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <p className="text-white/50 text-sm text-center mb-6">登入你的 Riot 帳號</p>
              </div>

              <div className="space-y-1">
                <label className="text-white/60 text-sm">Riot ID / Email</label>
                <input
                  className="input-field"
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder="你的 Riot 帳號"
                  autoFocus
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-white/60 text-sm">密碼</label>
                <div className="relative">
                  <input
                    className="input-field pr-11"
                    type={showPw ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(s => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                  >
                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {error && (
                <motion.div
                  className="flex items-center gap-2 bg-val-red/10 border border-val-red/30 rounded-xl px-4 py-3"
                  initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                >
                  <AlertCircle size={15} className="text-val-red flex-shrink-0" />
                  <p className="text-val-red text-sm">{error}</p>
                </motion.div>
              )}

              <button type="submit" disabled={loading} className="btn-primary w-full mt-2 flex items-center justify-center gap-2">
                {loading ? (
                  <><div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />登入中...</>
                ) : (
                  <><ShieldCheck size={16} />安全登入</>
                )}
              </button>

              <p className="text-white/20 text-xs text-center pt-1">你的憑證僅用於連線 Riot 伺服器，不會被儲存</p>
            </form>
          ) : (
            <form onSubmit={handleMFA} className="space-y-5">
              <div className="text-center mb-2">
                <div className="w-12 h-12 rounded-full bg-green-primary/10 border border-green-primary/30 flex items-center justify-center mx-auto mb-3">
                  <ShieldCheck size={20} className="text-green-primary" />
                </div>
                <p className="text-white font-semibold">雙重驗證</p>
                {mfaEmail && <p className="text-white/40 text-sm mt-1">驗證碼已寄送至 {mfaEmail}</p>}
              </div>

              <input
                className="input-field text-center text-xl tracking-widest font-mono"
                type="text"
                value={code}
                onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                maxLength={6}
                autoFocus
                required
              />

              {error && (
                <div className="flex items-center gap-2 bg-val-red/10 border border-val-red/30 rounded-xl px-4 py-3">
                  <AlertCircle size={15} className="text-val-red" />
                  <p className="text-val-red text-sm">{error}</p>
                </div>
              )}

              <button type="submit" disabled={loading || code.length < 6} className="btn-primary w-full">
                {loading ? '驗證中...' : '確認'}
              </button>
              <button type="button" onClick={() => { setStage('login'); setCode(''); setError('') }} className="btn-ghost w-full">
                返回
              </button>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  )
}
