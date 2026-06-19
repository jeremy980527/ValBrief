import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Link2, AlertCircle, Eye, EyeOff, Shield, ChevronDown, ClipboardPaste, CheckCircle, Monitor, Download, RefreshCw } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

interface Props { onClose: () => void; onLinked: () => void }

type Step = 'credential' | 'mfa' | 'url' | 'companion'

export default function LinkRiotModal({ onClose, onLinked }: Props) {
  const { linkWithCredential, linkWithCredentialMfa, linkViaUrl, refreshUser } = useAuth()

  const [step, setStep] = useState<Step>('companion')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [mfaSessionId, setMfaSessionId] = useState('')
  const [mfaEmail, setMfaEmail] = useState('')
  const [mfaCode, setMfaCode] = useState('')
  const [callbackUrl, setCallbackUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [companionDone, setCompanionDone] = useState(false)

  async function handleCredential(e: React.FormEvent) {
    e.preventDefault()
    if (!username.trim() || !password) return
    setLoading(true); setError('')
    try {
      const res = await linkWithCredential(username.trim(), password)
      if (res.success) { onLinked(); return }
      if (res.requiresMFA) {
        setMfaSessionId(res.mfaSessionId)
        setMfaEmail(res.mfaEmail || '')
        setStep('mfa')
        return
      }
      setError(res.error || '登入失敗，請確認帳號密碼')
    } catch {
      setError('連線失敗，請稍後再試')
    } finally {
      setLoading(false)
    }
  }

  async function handleMfa(e: React.FormEvent) {
    e.preventDefault()
    if (!mfaCode.trim()) return
    setLoading(true); setError('')
    try {
      const res = await linkWithCredentialMfa(mfaSessionId, mfaCode.trim())
      if (res.success) { onLinked(); return }
      setError(res.error || '驗證碼錯誤')
    } catch {
      setError('驗證失敗，請稍後再試')
    } finally {
      setLoading(false)
    }
  }

  async function handleUrl(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = callbackUrl.trim()
    if (!trimmed) return
    setLoading(true); setError('')
    try {
      const res = await linkViaUrl(trimmed)
      if (res.success) { onLinked(); return }
      setError(res.error || '連結失敗，請重試')
    } catch {
      setError('連線失敗，請稍後再試')
    } finally {
      setLoading(false)
    }
  }

  function handlePaste(e: React.ClipboardEvent<HTMLTextAreaElement>) {
    const text = e.clipboardData.getData('text').trim()
    if (text.includes('access_token=')) {
      e.preventDefault()
      setCallbackUrl(text)
    }
  }

  async function handleDownloadScript() {
    setLoading(true); setError('')
    try {
      const res = await fetch('/api/auth/companion-script', { credentials: 'include' })
      if (!res.ok) throw new Error('下載失敗')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'valbrief-companion.ps1'
      a.click()
      URL.revokeObjectURL(url)
      setCompanionDone(false)
    } catch {
      setError('下載失敗，請重試')
    } finally {
      setLoading(false)
    }
  }

  async function handleCompanionRefresh() {
    setLoading(true)
    try {
      await refreshUser()
      onLinked()
    } catch {
      setError('尚未偵測到連結，請先執行腳本再重試')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={e => { if (e.target === e.currentTarget) onClose() }}
      >
        <motion.div
          className="bg-bg-card border border-border rounded-2xl w-full max-w-md"
          initial={{ scale: 0.92, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.92, opacity: 0, y: 20 }}
          transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-green-primary/10 border border-green-primary/20 flex items-center justify-center">
                <Link2 size={16} className="text-green-primary" />
              </div>
              <h2 className="text-white font-bold text-lg">連結 Riot 帳號</h2>
            </div>
            <button onClick={onClose} className="text-white/30 hover:text-white transition-colors">
              <X size={20} />
            </button>
          </div>

          <div className="p-6">

            {/* Companion (primary) */}
            {step === 'companion' && (
              <div className="space-y-4">
                <div className="flex items-start gap-3 bg-green-primary/5 border border-green-primary/20 rounded-xl px-4 py-3">
                  <Monitor size={14} className="text-green-primary flex-shrink-0 mt-0.5" />
                  <p className="text-white/50 text-xs leading-relaxed">
                    下載並執行腳本，從你電腦上的 Riot Client 自動取得 Token，<strong className="text-white/70">不需要輸入帳號密碼</strong>。
                  </p>
                </div>

                <div className="space-y-2">
                  {[
                    '開啟 Riot Client（不需要進遊戲）',
                    '點下方按鈕下載腳本',
                    '右鍵點擊 .ps1 檔案 → 以 PowerShell 執行',
                    '腳本完成後點「確認連結」',
                  ].map((text, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <span className="w-5 h-5 rounded-full bg-green-primary/20 text-green-primary text-xs flex items-center justify-center flex-shrink-0 font-bold">{i + 1}</span>
                      <span className="text-white/60 text-sm">{text}</span>
                    </div>
                  ))}
                </div>

                {error && (
                  <div className="flex items-start gap-2 bg-val-red/10 border border-val-red/30 rounded-xl px-4 py-3">
                    <AlertCircle size={14} className="text-val-red flex-shrink-0 mt-0.5" />
                    <p className="text-val-red text-sm">{error}</p>
                  </div>
                )}

                <button
                  onClick={handleDownloadScript}
                  disabled={loading}
                  className="btn-primary w-full flex items-center justify-center gap-2"
                >
                  {loading
                    ? <><div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />產生中...</>
                    : <><Download size={15} />下載 Token 同步腳本</>}
                </button>

                <button
                  onClick={handleCompanionRefresh}
                  disabled={loading}
                  className="btn-ghost w-full flex items-center justify-center gap-2 text-sm"
                >
                  <RefreshCw size={13} />
                  執行完成後，點此確認連結
                </button>

                <div className="border-t border-border pt-3 flex gap-3 justify-center">
                  <button
                    type="button"
                    onClick={() => { setStep('credential'); setError('') }}
                    className="text-white/25 hover:text-white/50 text-xs transition-colors"
                  >
                    改用帳號密碼
                  </button>
                </div>
              </div>
            )}

            {/* Credential login */}
            {step === 'credential' && (
              <form onSubmit={handleCredential} className="space-y-4">
                <button
                  type="button"
                  onClick={() => { setStep('companion'); setError('') }}
                  className="flex items-center gap-1.5 text-white/40 hover:text-white text-xs transition-colors"
                >
                  ← 返回腳本方式
                </button>

                <div className="flex items-start gap-3 bg-green-primary/5 border border-green-primary/20 rounded-xl px-4 py-3">
                  <Shield size={14} className="text-green-primary flex-shrink-0 mt-0.5" />
                  <p className="text-white/50 text-xs leading-relaxed">
                    帳密僅傳送給 Riot 官方伺服器取得 Token，<strong className="text-white/70">不會被儲存</strong>。此為社群工具的標準做法。
                  </p>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-white/50 text-xs mb-1.5 block">Riot 帳號 (Email 或用戶名)</label>
                    <input
                      type="text"
                      className="input-field"
                      placeholder="example@gmail.com 或 GameName"
                      value={username}
                      onChange={e => { setUsername(e.target.value); setError('') }}
                      autoFocus
                      autoComplete="username"
                    />
                  </div>
                  <div>
                    <label className="text-white/50 text-xs mb-1.5 block">密碼</label>
                    <div className="relative">
                      <input
                        type={showPw ? 'text' : 'password'}
                        className="input-field pr-10"
                        placeholder="••••••••"
                        value={password}
                        onChange={e => { setPassword(e.target.value); setError('') }}
                        autoComplete="current-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPw(s => !s)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60"
                      >
                        {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                  </div>
                </div>

                {error && (
                  <div className="flex items-start gap-2 bg-val-red/10 border border-val-red/30 rounded-xl px-4 py-3">
                    <AlertCircle size={14} className="text-val-red flex-shrink-0 mt-0.5" />
                    <p className="text-val-red text-sm">{error}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || !username.trim() || !password}
                  className="btn-primary w-full flex items-center justify-center gap-2"
                >
                  {loading
                    ? <><div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />登入中...</>
                    : '連結 Riot 帳號'}
                </button>

                <button
                  type="button"
                  onClick={() => { setStep('url'); setError('') }}
                  className="w-full flex items-center justify-center gap-1.5 text-white/25 hover:text-white/50 text-xs transition-colors py-1"
                >
                  <ChevronDown size={12} />
                  改用「貼上網址」方式
                </button>
              </form>
            )}

            {/* 2FA */}
            {step === 'mfa' && (
              <form onSubmit={handleMfa} className="space-y-4">
                <div className="text-center space-y-2">
                  <div className="w-12 h-12 rounded-full bg-green-primary/10 border border-green-primary/20 flex items-center justify-center mx-auto">
                    <Shield size={20} className="text-green-primary" />
                  </div>
                  <p className="text-white font-semibold">雙重驗證</p>
                  {mfaEmail && <p className="text-white/40 text-sm">驗證碼已寄至 {mfaEmail}</p>}
                </div>

                <div>
                  <label className="text-white/50 text-xs mb-1.5 block">6 位數驗證碼</label>
                  <input
                    type="text"
                    className="input-field text-center text-2xl tracking-[0.5em] font-mono"
                    placeholder="000000"
                    maxLength={6}
                    value={mfaCode}
                    onChange={e => { setMfaCode(e.target.value.replace(/\D/g, '')); setError('') }}
                    autoFocus
                  />
                </div>

                {error && (
                  <div className="flex items-start gap-2 bg-val-red/10 border border-val-red/30 rounded-xl px-4 py-3">
                    <AlertCircle size={14} className="text-val-red flex-shrink-0 mt-0.5" />
                    <p className="text-val-red text-sm">{error}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || mfaCode.length < 6}
                  className="btn-primary w-full flex items-center justify-center gap-2"
                >
                  {loading
                    ? <><div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />驗證中...</>
                    : '確認驗證碼'}
                </button>
                <button type="button" onClick={() => { setStep('credential'); setError(''); setMfaCode('') }} className="btn-ghost w-full text-sm">
                  返回
                </button>
              </form>
            )}

            {/* URL paste fallback */}
            {step === 'url' && (
              <form onSubmit={handleUrl} className="space-y-4">
                <button
                  type="button"
                  onClick={() => { setStep('credential'); setError('') }}
                  className="flex items-center gap-1.5 text-white/40 hover:text-white text-xs transition-colors"
                >
                  ← 返回帳密登入
                </button>

                <div className="space-y-1.5">
                  <p className="text-white/50 text-xs">
                    前往 <span className="text-white/70 font-mono text-[11px]">playvalorant.com/opt_in</span>，登入後複製網址列的網址（包含 <span className="text-green-primary font-mono">#access_token=...</span> 的部分）
                  </p>
                </div>

                <div className="relative">
                  <ClipboardPaste size={13} className="absolute left-3 top-3.5 text-white/20" />
                  <textarea
                    className="input-field pl-8 text-xs font-mono resize-none"
                    rows={3}
                    value={callbackUrl}
                    onChange={e => { setCallbackUrl(e.target.value); setError('') }}
                    onPaste={handlePaste}
                    placeholder="https://playvalorant.com/opt_in#access_token=eyJ..."
                    autoFocus
                  />
                </div>

                {callbackUrl && callbackUrl.includes('access_token=') && (
                  <div className="flex items-center gap-2 text-green-primary text-xs">
                    <CheckCircle size={13} />
                    已偵測到 Token
                  </div>
                )}

                {error && (
                  <div className="flex items-start gap-2 bg-val-red/10 border border-val-red/30 rounded-xl px-4 py-3">
                    <AlertCircle size={14} className="text-val-red flex-shrink-0 mt-0.5" />
                    <p className="text-val-red text-sm">{error}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || !callbackUrl.trim()}
                  className="btn-primary w-full flex items-center justify-center gap-2"
                >
                  {loading
                    ? <><div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />驗證中...</>
                    : '確認連結'}
                </button>
              </form>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
