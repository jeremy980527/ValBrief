import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Link2, ExternalLink, AlertCircle, ChevronDown, ClipboardPaste, RefreshCw } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

// Primary: try our own callback (seamless if Riot accepts it)
const VPS_CALLBACK = window.location.origin + '/riot-callback'
// Fallback: playvalorant.com redirect (always accepted by Riot)
const PLAYVAL_CALLBACK = 'https://playvalorant.com/opt_in'

function riotAuthUrl(redirectUri: string) {
  return (
    'https://auth.riotgames.com/authorize?' +
    'redirect_uri=' + encodeURIComponent(redirectUri) +
    '&client_id=play-valorant-web-prod' +
    '&response_type=token%20id_token' +
    '&nonce=' + Math.random().toString(36).slice(2) +
    '&scope=openid%20link%20ban%20lol_region%20account'
  )
}

const REGIONS = [
  { value: 'ap', label: '亞太 (AP)' },
  { value: 'na', label: '北美 (NA)' },
  { value: 'eu', label: '歐洲 (EU)' },
  { value: 'kr', label: '韓國 (KR)' },
  { value: 'latam', label: '拉美 (LATAM)' },
  { value: 'br', label: '巴西 (BR)' },
]

interface Props { onClose: () => void; onLinked: () => void }
type Step = 'intro' | 'waiting' | 'paste'

export default function LinkRiotModal({ onClose, onLinked }: Props) {
  const { linkViaUrl } = useAuth()
  const [step, setStep] = useState<Step>('intro')
  const [error, setError] = useState('')
  const [callbackUrl, setCallbackUrl] = useState('')
  const [regionOverride, setRegionOverride] = useState('ap')
  const [showRegion, setShowRegion] = useState(false)
  const [loading, setLoading] = useState(false)
  const [showManualHint, setShowManualHint] = useState(false)

  // BroadcastChannel: listen for result from /riot-callback page
  useEffect(() => {
    if (step !== 'waiting') return
    const bc = new BroadcastChannel('riot-auth')
    const timer = setTimeout(() => setShowManualHint(true), 12000)

    bc.onmessage = (e) => {
      bc.close()
      clearTimeout(timer)
      if (e.data?.success) {
        onLinked()
      } else if (e.data?.error === 'redirect_uri_rejected') {
        // Riot rejected our callback URL → show paste fallback immediately
        setStep('paste')
        setError('')
      } else {
        setError(e.data?.error || '連結失敗')
        setShowManualHint(true)
      }
    }

    return () => { bc.close(); clearTimeout(timer) }
  }, [step, onLinked])

  function openRiotPopup(useVpsCallback: boolean) {
    const url = riotAuthUrl(useVpsCallback ? VPS_CALLBACK : PLAYVAL_CALLBACK)
    window.open(url, 'riot-auth', 'width=520,height=720,left=200,top=80,noopener')
  }

  function handleStart() {
    setError('')
    setShowManualHint(false)
    openRiotPopup(true)
    setStep('waiting')
  }

  function handleRetry() {
    setError('')
    setShowManualHint(false)
    openRiotPopup(true)
  }

  function goToPaste() {
    openRiotPopup(false)   // open with playvalorant.com redirect
    setCallbackUrl('')
    setError('')
    setStep('paste')
  }

  async function handlePasteSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!callbackUrl.trim()) return
    setLoading(true); setError('')
    try {
      const res = await linkViaUrl(callbackUrl.trim(), showRegion ? regionOverride : undefined)
      if (res.success) onLinked()
      else setError(res.error || '連結失敗')
    } catch {
      setError('連線失敗，請確認後端正在運行')
    } finally {
      setLoading(false) }
  }

  // Auto-submit on paste if it looks like a valid URL
  function handleUrlPaste(e: React.ClipboardEvent<HTMLTextAreaElement>) {
    const pasted = e.clipboardData.getData('text').trim()
    if (pasted.includes('#access_token=')) {
      setCallbackUrl(pasted)
      // slight delay so state updates first
      setTimeout(async () => {
        setLoading(true); setError('')
        try {
          const res = await linkViaUrl(pasted, showRegion ? regionOverride : undefined)
          if (res.success) onLinked()
          else setError(res.error || '連結失敗')
        } catch {
          setError('連線失敗，請確認後端正在運行')
        } finally { setLoading(false) }
      }, 100)
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
            <AnimatePresence mode="wait">

              {/* ─── INTRO ─── */}
              {step === 'intro' && (
                <motion.div key="intro" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-5">
                  <p className="text-white/50 text-sm">點擊下方按鈕，在彈出的 Riot 官方頁面完成登入，成功後會自動連結。</p>
                  <div className="bg-green-primary/5 border border-green-primary/20 rounded-xl p-4 text-xs text-white/40 space-y-1">
                    <p className="text-green-primary font-semibold text-xs">安全說明</p>
                    <p>帳號密碼直接輸入在 Riot 官方網站，不經過我們的伺服器。</p>
                  </div>
                  <button onClick={handleStart} className="btn-primary w-full flex items-center justify-center gap-2">
                    前往 Riot 登入
                    <ExternalLink size={15} />
                  </button>
                </motion.div>
              )}

              {/* ─── WAITING ─── */}
              {step === 'waiting' && (
                <motion.div key="waiting" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-5">
                  <div className="flex flex-col items-center gap-4 py-4">
                    <div className="w-12 h-12 border-[3px] border-border border-t-green-primary rounded-full animate-spin" />
                    <div className="text-center">
                      <p className="text-white font-semibold">等待 Riot 登入...</p>
                      <p className="text-white/40 text-sm mt-1">請在彈出的視窗完成登入</p>
                    </div>
                  </div>

                  {error && (
                    <div className="flex items-start gap-2 bg-val-red/10 border border-val-red/30 rounded-xl px-4 py-3">
                      <AlertCircle size={14} className="text-val-red flex-shrink-0 mt-0.5" />
                      <p className="text-val-red text-sm">{error}</p>
                    </div>
                  )}

                  <div className="flex gap-3">
                    <button onClick={() => { setStep('intro'); setError('') }} className="btn-ghost flex-1 text-sm">返回</button>
                    <button onClick={handleRetry} className="btn-ghost flex-1 text-sm flex items-center justify-center gap-1.5">
                      <RefreshCw size={13} /> 重新開啟
                    </button>
                  </div>

                  {/* Show manual fallback hint */}
                  <AnimatePresence>
                    {showManualHint && (
                      <motion.div
                        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                        className="border-t border-border pt-4 space-y-3"
                      >
                        <p className="text-white/40 text-xs text-center">登入視窗顯示錯誤？改用貼上網址方式：</p>
                        <button onClick={goToPaste} className="btn-ghost w-full text-sm">改用網址貼上 →</button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )}

              {/* ─── PASTE FALLBACK ─── */}
              {step === 'paste' && (
                <motion.div key="paste" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <form onSubmit={handlePasteSubmit} className="space-y-4">
                    {/* Instruction box */}
                    <div className="bg-bg-secondary border border-border rounded-xl p-4 space-y-2.5 text-sm">
                      <p className="text-white/70 font-semibold text-xs">已為你開啟 Riot 登入頁面，登入後：</p>
                      <div className="space-y-2 text-white/50 text-xs">
                        <p>1. 你會看到一個 <span className="text-val-red font-semibold">404 頁面</span> — 這是正常的，不代表失敗</p>
                        <p>2. 看瀏覽器的 <span className="text-white/80">網址列</span>（不是頁面內容）</p>
                        <p>3. 網址以 <code className="text-green-primary bg-black/30 px-1 py-0.5 rounded text-xs">playvalorant.com/opt_in#</code> 開頭</p>
                        <p>4. 全部複製，貼到下方</p>
                      </div>
                      {/* Visual hint */}
                      <div className="bg-black/40 rounded-lg px-3 py-2 mt-1">
                        <p className="text-white/20 text-xs font-mono break-all">
                          <span className="text-white/40">🔗 </span>
                          playvalorant.com/opt_in
                          <span className="text-green-primary/70">#access_token=eyJ...</span>
                        </p>
                      </div>
                    </div>

                    <button type="button" onClick={() => openRiotPopup(false)} className="btn-ghost w-full text-sm flex items-center justify-center gap-2">
                      <RefreshCw size={13} /> 重新開啟 Riot 登入
                    </button>

                    <div className="relative">
                      <ClipboardPaste size={13} className="absolute left-3 top-3.5 text-white/20" />
                      <textarea
                        className="input-field pl-8 text-xs font-mono resize-none"
                        rows={3}
                        value={callbackUrl}
                        onChange={e => { setCallbackUrl(e.target.value); setError('') }}
                        onPaste={handleUrlPaste}
                        placeholder="https://playvalorant.com/opt_in#access_token=eyJ..."
                        autoFocus
                      />
                    </div>

                    {loading && (
                      <div className="flex items-center justify-center gap-2 text-green-primary text-sm">
                        <div className="w-4 h-4 border-2 border-green-primary/30 border-t-green-primary rounded-full animate-spin" />
                        驗證中...
                      </div>
                    )}

                    <button type="button" onClick={() => setShowRegion(s => !s)} className="flex items-center gap-1.5 text-white/30 hover:text-white/50 text-xs transition-colors">
                      <ChevronDown size={12} className={`transition-transform ${showRegion ? 'rotate-180' : ''}`} />
                      手動選擇地區（通常自動偵測）
                    </button>
                    {showRegion && (
                      <select className="input-field text-sm" value={regionOverride} onChange={e => setRegionOverride(e.target.value)}>
                        {REGIONS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                      </select>
                    )}

                    {error && (
                      <div className="flex items-start gap-2 bg-val-red/10 border border-val-red/30 rounded-xl px-4 py-3">
                        <AlertCircle size={14} className="text-val-red flex-shrink-0 mt-0.5" />
                        <p className="text-val-red text-sm">{error}</p>
                      </div>
                    )}

                    <div className="flex gap-3">
                      <button type="button" onClick={() => { setStep('waiting'); setError(''); setShowManualHint(true) }} className="btn-ghost flex-1 text-sm">返回</button>
                      <button type="submit" disabled={loading || !callbackUrl.trim()} className="btn-primary flex-1">確認連結</button>
                    </div>
                  </form>
                </motion.div>
              )}

            </AnimatePresence>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
