import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import { teamApi } from '../../lib/api'

const RANKS = ['Unranked','Iron 1','Iron 2','Iron 3','Bronze 1','Bronze 2','Bronze 3','Silver 1','Silver 2','Silver 3','Gold 1','Gold 2','Gold 3','Platinum 1','Platinum 2','Platinum 3','Diamond 1','Diamond 2','Diamond 3','Ascendant 1','Ascendant 2','Ascendant 3','Immortal 1','Immortal 2','Immortal 3','Radiant']
const RANK_COLORS: Record<string, string> = {
  Unranked:'#888',Iron:'#8B6652',Bronze:'#A0522D',Silver:'#C0C0C0',Gold:'#FFD700',Platinum:'#7B68EE',Diamond:'#00B4D8',Ascendant:'#00FF9F',Immortal:'#FF4655',Radiant:'#FFFDE7'
}
const ROLES = ['Duelist','Initiator','Controller','Sentinel','Flex']
const AGENTS = ['Jett','Reyna','Raze','Phoenix','Yoru','Neon','Iso','Sova','Fade','Breach','KAY/O','Skye','Gekko','Astra','Brimstone','Clove','Harbor','Omen','Viper','Cypher','Killjoy','Sage','Chamber','Deadlock']

function rankColor(rank: string) {
  const tier = RANKS.find(r => r === rank)?.split(' ')[0] || 'Unranked'
  return RANK_COLORS[tier] || '#888'
}

interface Props { onClose: () => void; onCreated: () => void }

export default function CreatePostModal({ onClose, onCreated }: Props) {
  const [form, setForm] = useState({
    rank: 'Unranked', roles: [] as string[], agents: [] as string[],
    language: '中文', description: '', discord: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function toggle<T>(arr: T[], item: T) {
    return arr.includes(item) ? arr.filter(x => x !== item) : [...arr, item]
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.description.trim()) { setError('請填寫描述'); return }
    setLoading(true); setError('')
    try {
      await teamApi.create({ ...form, rankColor: rankColor(form.rank) })
      onCreated()
    } catch { setError('發送失敗，請確認已登入') }
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
            <h2 className="text-white font-bold text-lg">發布組隊貼文</h2>
            <button onClick={onClose} className="text-white/30 hover:text-white transition-colors"><X size={20} /></button>
          </div>

          <form onSubmit={submit} className="p-6 space-y-5">
            <div>
              <label className="block text-white/60 text-sm mb-2">當前段位</label>
              <select
                className="input-field"
                value={form.rank}
                onChange={e => setForm(f => ({ ...f, rank: e.target.value }))}
              >
                {RANKS.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-white/60 text-sm mb-2">擅長位置</label>
              <div className="flex flex-wrap gap-2">
                {ROLES.map(r => (
                  <button
                    key={r} type="button"
                    onClick={() => setForm(f => ({ ...f, roles: toggle(f.roles, r) }))}
                    className={`tag transition-all duration-200 ${form.roles.includes(r) ? 'border-green-primary/60 text-green-primary bg-green-primary/10' : 'hover:border-white/20 text-white/50'}`}
                  >{r}</button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-white/60 text-sm mb-2">常用特務</label>
              <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto">
                {AGENTS.map(a => (
                  <button
                    key={a} type="button"
                    onClick={() => setForm(f => ({ ...f, agents: toggle(f.agents, a) }))}
                    className={`tag text-xs transition-all duration-200 ${form.agents.includes(a) ? 'border-green-primary/60 text-green-primary bg-green-primary/10' : 'hover:border-white/20 text-white/50'}`}
                  >{a}</button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-white/60 text-sm mb-2">使用語言</label>
              <input className="input-field" value={form.language} onChange={e => setForm(f => ({ ...f, language: e.target.value }))} placeholder="中文, English..." />
            </div>

            <div>
              <label className="block text-white/60 text-sm mb-2">描述 <span className="text-val-red">*</span></label>
              <textarea
                className="input-field resize-none"
                rows={3}
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="介紹自己、找隊需求..."
              />
            </div>

            <div>
              <label className="block text-white/60 text-sm mb-2">Discord (選填)</label>
              <input className="input-field" value={form.discord} onChange={e => setForm(f => ({ ...f, discord: e.target.value }))} placeholder="Username#0000" />
            </div>

            {error && <p className="text-val-red text-sm">{error}</p>}

            <div className="flex gap-3 pt-1">
              <button type="button" onClick={onClose} className="btn-ghost flex-1">取消</button>
              <button type="submit" disabled={loading} className="btn-primary flex-1">
                {loading ? '發送中...' : '發布'}
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
