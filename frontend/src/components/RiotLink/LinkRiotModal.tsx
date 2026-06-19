import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Eye, EyeOff, Link2, AlertCircle } from 'lucide-react'
import { authApi } from '../../lib/api'

const REGIONS = ['ap', 'na', 'eu', 'kr', 'latam', 'br']

interface Props { onClose: () => void; onLinked: () => void }

export default function LinkRiotModal({ onClose, onLinked }: Props) {
  const [tab, setTab] = useState<'auto' | 'manual'>('auto')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [mfaStage, setMfaStage] = useState(false)
  const [mfaEmail, setMfaEmail] = useState('')

  // Auto tab state
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [mfaCode, setMfaCode] = useState('')

  // Manual tab state
  const [accessToken, setAccessToken] = useState('')
  const [entitlementToken, setEntitlementToken] = useState('')
  const [region, setRegion] = useState('ap')
  const [gameName, setGameName] = useState('')
  const [tagLine, setTagLine] = useState('')
  const [puuid, setPuuid] = useState('')

  async function handleAutoLink(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError('')
    try {
      const res = await authApi.link(username, password)
      if (res.success) { onLinked() }
      else if (res.requiresMFA) { setMfaEmail(res.mfaEmail || ''); setMfaStage(true) }
      else setError(res.error || 'Link failed')
    } catch (e: any) { setError(e?.response?.data?.error || 'Link failed') }
    finally { setLoading(false) }
  }

  async function handleMFA(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError('')
    try {
      const res = await authApi.mfa(mfaCode)
      if (res.success) onLinked()
      else setError(res.error || 'Invalid code')
    } catch { setError('MFA failed') }
    finally { setLoading(false) }
  }

  async function handleManualLink(e: React.FormEvent) {
    e.preventDefault()
    if (!accessToken || !entitlementToken || !gameName || !tagLine || !puuid) {
      setError('All fields are required'); return
    }
    setLoading(true); setError('')
    try {
      const res = await authApi.linkManual({ accessToken, entitlementToken, region, gameName, tagLine, puuid })
      if (res.success) onLinked()
      else setError(res.error || 'Link failed')
    } catch { setError('Link failed') }
    finally { setLoading(false) }
  }

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={e => { if (e.target === e.currentTarget) onClose() }}
      >
        <motion.div
          className="bg-bg-card border border-border rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
          initial={{ scale: 0.92, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.92, opacity: 0, y: 20 }}
          transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
        >
          <div className="flex items-center justify-between p-6 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-green-primary/10 border border-green-primary/20 flex items-center justify-center">
                <Link2 size={16} className="text-green-primary" />
              </div>
              <h2 className="text-white font-bold text-lg">連結 Riot 帳號</h2>
            </div>
            <button onClick={onClose} className="text-white/30 hover:text-white transition-colors"><X size={20} /></button>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-border">
            {(['auto', 'manual'] as const).map(t => (
              <button
                key={t}
                onClick={() => { setTab(t); setError(''); setMfaStage(false) }}
                className={`flex-1 py-3 text-sm font-semibold transition-colors ${tab === t ? 'text-green-primary border-b-2 border-green-primary' : 'text-white/40 hover:text-white/60'}`}
              >
                {t === 'auto' ? '自動連結' : '手動輸入 Token'}
              </button>
            ))}
          </div>

          <div className="p-6">
            {tab === 'auto' && !mfaStage && (
              <form onSubmit={handleAutoLink} className="space-y-4">
                <p className="text-white/40 text-sm">輸入你的 Riot 帳號，我們會嘗試從伺服器驗證。</p>
                <div>
                  <label className="text-white/60 text-sm block mb-1.5">Riot 帳號 / Email</label>
                  <input className="input-field" value={username} onChange={e => setUsername(e.target.value)} placeholder="你的 Riot 帳號或 Email" required />
                </div>
                <div>
                  <label className="text-white/60 text-sm block mb-1.5">密碼</label>
                  <div className="relative">
                    <input className="input-field pr-11" type={showPw ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required />
                    <button type="button" onClick={() => setShowPw(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60">
                      {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
                {error && (
                  <div className="flex items-start gap-2 bg-val-red/10 border border-val-red/30 rounded-xl px-4 py-3">
                    <AlertCircle size={15} className="text-val-red flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-val-red text-sm">{error}</p>
                      {(error.includes('credentials') || error.includes('auth')) && (
                        <p className="text-white/40 text-xs mt-1">如果確定帳密正確，請改用「手動輸入 Token」方法。</p>
                      )}
                    </div>
                  </div>
                )}
                <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
                  {loading ? <><div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />連結中...</> : '連結帳號'}
                </button>
              </form>
            )}

            {tab === 'auto' && mfaStage && (
              <form onSubmit={handleMFA} className="space-y-4">
                <div className="text-center">
                  <p className="text-white font-semibold">雙重驗證</p>
                  {mfaEmail && <p className="text-white/40 text-sm mt-1">驗證碼已寄送至 {mfaEmail}</p>}
                </div>
                <input className="input-field text-center text-xl tracking-widest font-mono" type="text" value={mfaCode} onChange={e => setMfaCode(e.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="000000" maxLength={6} autoFocus required />
                {error && <p className="text-val-red text-sm">{error}</p>}
                <button type="submit" disabled={loading || mfaCode.length < 6} className="btn-primary w-full">{loading ? '驗證中...' : '確認'}</button>
                <button type="button" onClick={() => { setMfaStage(false); setMfaCode('') }} className="btn-ghost w-full">返回</button>
              </form>
            )}

            {tab === 'manual' && (
              <form onSubmit={handleManualLink} className="space-y-4">
                <div className="bg-bg-secondary border border-border rounded-xl p-4 text-sm text-white/50 space-y-1">
                  <p className="text-white/70 font-semibold mb-2">如何取得 Token：</p>
                  <p>1. 用 Valorant 客戶端登入遊戲</p>
                  <p>2. 在同台電腦開啟此工具：</p>
                  <a href="https://github.com/techchrism/valorant-api-docs" target="_blank" rel="noopener noreferrer" className="text-green-primary text-xs">查看取得 Token 的工具</a>
                  <p>3. 複製 Access Token 和 Entitlement Token 貼入下方</p>
                </div>

                <div>
                  <label className="text-white/60 text-sm block mb-1.5">Access Token <span className="text-val-red">*</span></label>
                  <textarea className="input-field text-xs font-mono resize-none" rows={3} value={accessToken} onChange={e => setAccessToken(e.target.value)} placeholder="eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..." required />
                </div>
                <div>
                  <label className="text-white/60 text-sm block mb-1.5">Entitlement Token <span className="text-val-red">*</span></label>
                  <input className="input-field text-xs font-mono" value={entitlementToken} onChange={e => setEntitlementToken(e.target.value)} placeholder="eyJ..." required />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-white/60 text-sm block mb-1.5">PUUID <span className="text-val-red">*</span></label>
                    <input className="input-field text-xs font-mono" value={puuid} onChange={e => setPuuid(e.target.value)} placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" required />
                  </div>
                  <div>
                    <label className="text-white/60 text-sm block mb-1.5">地區 <span className="text-val-red">*</span></label>
                    <select className="input-field" value={region} onChange={e => setRegion(e.target.value)}>
                      {REGIONS.map(r => <option key={r} value={r}>{r.toUpperCase()}</option>)}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-white/60 text-sm block mb-1.5">遊戲名稱 <span className="text-val-red">*</span></label>
                    <input className="input-field" value={gameName} onChange={e => setGameName(e.target.value)} placeholder="YourName" required />
                  </div>
                  <div>
                    <label className="text-white/60 text-sm block mb-1.5">Tag <span className="text-val-red">*</span></label>
                    <input className="input-field" value={tagLine} onChange={e => setTagLine(e.target.value)} placeholder="1234" required />
                  </div>
                </div>
                {error && <p className="text-val-red text-sm">{error}</p>}
                <button type="submit" disabled={loading} className="btn-primary w-full">{loading ? '連結中...' : '儲存 Token'}</button>
              </form>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
