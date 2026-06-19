import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Link2, ExternalLink, ClipboardPaste, CheckCircle, AlertCircle, ChevronDown } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

const RIOT_LOGIN_URL =
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
  const [step, setStep] = useState<'guide' | 'paste'>('guide')
  const [callbackUrl, setCallbackUrl] = useState('')
  const [regionOverride, setRegionOverride] = useState('ap')
  const [showRegion, setShowRegion] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function handleOpenRiot() {
    window.open(RIOT_LOGIN_URL, '_blank', 'noopener,noreferrer')
    setStep('paste')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!callbackUrl.trim()) return
    setLoading(true)
    setError('')
    try {
      const res = await linkViaUrl(callbackUrl.trim(), showRegion ? regionOverride : undefined)
      if (res.success) {
        onLinked()
      } else {
        setError(res.error || '連結失敗，請重試')
      }
    } catch {
      setError('連線失敗，請確認後端正在運行')
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
            <AnimatePresence mode="wait">
              {step === 'guide' && (
                <motion.div
                  key="guide"
                  initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}
                  className="space-y-5"
                >
                  <p className="text-white/50 text-sm">安全連結你的 Riot 帳號，只需 3 個步驟</p>

                  {/* Steps */}
                  <div className="space-y-3">
                    <Step num={1} title="點擊按鈕，前往 Riot 官方登入頁面" active />
                    <Step num={2} title="用你的帳號密碼正常登入（和官網完全相同）" />
                    <Step num={3} title="登入後把整個網址複製貼回這裡" />
                  </div>

                  {/* Info box */}
                  <div className="bg-green-primary/5 border border-green-primary/20 rounded-xl p-4 text-sm text-white/50 space-y-1">
                    <p className="text-green-primary font-semibold text-xs mb-1">安全說明</p>
                    <p>你的帳號密碼直接輸入在 Riot 官方網站，不經過我們的伺服器。</p>
                  </div>

                  <button
                    onClick={handleOpenRiot}
                    className="btn-primary w-full flex items-center justify-center gap-2"
                  >
                    前往 Riot 登入頁面
                    <ExternalLink size={15} />
                  </button>
                </motion.div>
              )}

              {step === 'paste' && (
                <motion.div
                  key="paste"
                  initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}
                >
                  <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Done steps */}
                    <div className="space-y-2">
                      <DoneStep num={1} title="已開啟 Riot 登入頁面" />
                      <DoneStep num={2} title="在 Riot 網站完成登入" />
                    </div>

                    {/* Active step */}
                    <div className="bg-bg-secondary border border-green-primary/30 rounded-xl p-4 space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-full bg-green-primary text-black text-sm font-bold flex items-center justify-center flex-shrink-0">3</div>
                        <p className="text-white font-semibold text-sm">複製網址，貼到下方</p>
                      </div>

                      {/* URL example */}
                      <div className="bg-black/40 rounded-lg px-3 py-2 font-mono text-xs text-white/30 break-all select-all">
                        https://playvalorant.com/opt_in<span className="text-green-primary/60">#access_token=...</span>
                      </div>
                      <p className="text-white/40 text-xs">登入後，瀏覽器網址列會顯示上面這種格式的長網址，全部複製貼到下面。</p>

                      <div className="relative">
                        <ClipboardPaste size={14} className="absolute left-3 top-3.5 text-white/20" />
                        <textarea
                          className="input-field pl-8 text-xs font-mono resize-none"
                          rows={3}
                          value={callbackUrl}
                          onChange={e => { setCallbackUrl(e.target.value); setError('') }}
                          placeholder="https://playvalorant.com/opt_in#access_token=eyJ..."
                          autoFocus
                        />
                      </div>
                    </div>

                    {/* Region override (collapsed by default) */}
                    <button
                      type="button"
                      onClick={() => setShowRegion(s => !s)}
                      className="flex items-center gap-1.5 text-white/30 hover:text-white/50 text-xs transition-colors"
                    >
                      <ChevronDown size={13} className={`transition-transform ${showRegion ? 'rotate-180' : ''}`} />
                      手動選擇地區（通常不需要）
                    </button>

                    {showRegion && (
                      <div>
                        <label className="text-white/50 text-xs block mb-1.5">你的 Valorant 地區</label>
                        <select
                          className="input-field text-sm"
                          value={regionOverride}
                          onChange={e => setRegionOverride(e.target.value)}
                        >
                          {REGIONS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                        </select>
                      </div>
                    )}

                    {error && (
                      <div className="flex items-start gap-2 bg-val-red/10 border border-val-red/30 rounded-xl px-4 py-3">
                        <AlertCircle size={14} className="text-val-red flex-shrink-0 mt-0.5" />
                        <p className="text-val-red text-sm">{error}</p>
                      </div>
                    )}

                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => { setStep('guide'); setCallbackUrl(''); setError('') }}
                        className="btn-ghost flex-1"
                      >
                        返回
                      </button>
                      <button
                        type="submit"
                        disabled={loading || !callbackUrl.trim()}
                        className="btn-primary flex-1 flex items-center justify-center gap-2"
                      >
                        {loading
                          ? <><div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />驗證中...</>
                          : '確認連結'}
                      </button>
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

function Step({ num, title, active }: { num: number; title: string; active?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <div className={`w-7 h-7 rounded-full text-sm font-bold flex items-center justify-center flex-shrink-0 ${active ? 'bg-green-primary text-black' : 'bg-white/10 text-white/40'}`}>
        {num}
      </div>
      <p className={`text-sm ${active ? 'text-white font-medium' : 'text-white/40'}`}>{title}</p>
    </div>
  )
}

function DoneStep({ num, title }: { num: number; title: string }) {
  return (
    <div className="flex items-center gap-3">
      <CheckCircle size={18} className="text-green-primary flex-shrink-0" />
      <p className="text-white/40 text-sm line-through">{num}. {title}</p>
    </div>
  )
}
