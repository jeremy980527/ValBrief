import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Link2, ExternalLink, AlertCircle, ChevronDown, ClipboardPaste, RefreshCw, CheckCircle } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

const RIOT_AUTH_URL =
  'https://auth.riotgames.com/authorize?' +
  'redirect_uri=https%3A%2F%2Fplayvalorant.com%2Fopt_in' +
  '&client_id=play-valorant-web-prod' +
  '&response_type=token%20id_token' +
  '&nonce=1' +
  '&scope=openid%20link%20ban%20lol_region%20account'

const REGIONS = [
  { value: 'ap', label: '亞太 (AP)' },
  { value: 'na', label: '北美 (NA)' },
  { value: 'eu', label: '歐洲 (EU)' },
  { value: 'kr', label: '韓國 (KR)' },
  { value: 'latam', label: '拉美 (LATAM)' },
  { value: 'br', label: '巴西 (BR)' },
]

interface Props { onClose: () => void; onLinked: () => void }

export default function LinkRiotModal({ onClose, onLinked }: Props) {
  const { linkViaUrl } = useAuth()
  const [opened, setOpened] = useState(false)
  const [callbackUrl, setCallbackUrl] = useState('')
  const [regionOverride, setRegionOverride] = useState('ap')
  const [showRegion, setShowRegion] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function openRiot() {
    window.open(RIOT_AUTH_URL, 'riot-login', 'width=520,height=720,left=200,top=80')
    setOpened(true)
    setError('')
  }

  async function submit(url: string) {
    const trimmed = url.trim()
    if (!trimmed) return
    setLoading(true); setError('')
    try {
      const res = await linkViaUrl(trimmed, showRegion ? regionOverride : undefined)
      if (res.success) onLinked()
      else setError(res.error || '連結失敗，請重試')
    } catch {
      setError('連線失敗，請確認後端正在運行')
    } finally {
      setLoading(false)
    }
  }

  function handlePaste(e: React.ClipboardEvent<HTMLTextAreaElement>) {
    const text = e.clipboardData.getData('text').trim()
    if (text.includes('#access_token=') || text.includes('access_token=')) {
      e.preventDefault()
      setCallbackUrl(text)
      submit(text)
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

          <div className="p-6 space-y-5">

            {/* Steps */}
            <div className="space-y-3">
              {/* Step 1 */}
              <div className="flex items-start gap-3">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold mt-0.5 transition-colors ${opened ? 'bg-green-primary/20 text-green-primary' : 'bg-white/10 text-white/50'}`}>
                  {opened ? <CheckCircle size={16} className="text-green-primary" /> : '1'}
                </div>
                <div className="flex-1">
                  <p className={`text-sm font-medium transition-colors ${opened ? 'text-white/40 line-through' : 'text-white'}`}>
                    點擊按鈕，在 Riot 官方視窗登入
                  </p>
                  {!opened && (
                    <button onClick={openRiot} className="btn-primary mt-3 flex items-center gap-2 text-sm px-4 py-2">
                      前往 Riot 登入
                      <ExternalLink size={14} />
                    </button>
                  )}
                  {opened && (
                    <button onClick={openRiot} className="btn-ghost mt-2 flex items-center gap-1.5 text-xs px-3 py-1.5">
                      <RefreshCw size={12} /> 重新開啟視窗
                    </button>
                  )}
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex items-start gap-3">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold mt-0.5 ${opened ? 'bg-green-primary text-black' : 'bg-white/10 text-white/30'}`}>
                  2
                </div>
                <div className="flex-1">
                  <p className={`text-sm font-medium ${opened ? 'text-white' : 'text-white/30'}`}>
                    登入後複製網址，貼到下方
                  </p>

                  <AnimatePresence>
                    {opened && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="mt-3 space-y-3"
                      >
                        {/* URL example callout */}
                        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-3 text-xs space-y-1.5">
                          <p className="text-yellow-400 font-semibold">重要：看網址列，不是頁面內容</p>
                          <p className="text-white/50">登入後你會看到 404 頁面，這是正常的。</p>
                          <p className="text-white/50">網址列的網址長這樣，全部複製貼到下面：</p>
                          <div className="bg-black/40 rounded-lg px-2.5 py-1.5 font-mono text-xs break-all">
                            <span className="text-white/30">playvalorant.com/opt_in</span>
                            <span className="text-green-primary">#access_token=eyJ...</span>
                          </div>
                        </div>

                        {/* Paste field */}
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

                        {/* Region override */}
                        <button
                          type="button"
                          onClick={() => setShowRegion(s => !s)}
                          className="flex items-center gap-1.5 text-white/25 hover:text-white/50 text-xs transition-colors"
                        >
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

                        <button
                          type="button"
                          onClick={() => submit(callbackUrl)}
                          disabled={loading || !callbackUrl.trim()}
                          className="btn-primary w-full flex items-center justify-center gap-2"
                        >
                          {loading
                            ? <><div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />驗證中...</>
                            : '確認連結'}
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>

          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
