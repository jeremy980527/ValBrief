import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Newspaper, RefreshCw, AlertCircle } from 'lucide-react'
import { newsApi } from '../lib/api'
import { NewsArticle } from '../types'
import PageTransition, { stagger, fadeUp } from '../components/ui/PageTransition'
import NewsCard from '../components/News/NewsCard'

const CATS = ['ALL', 'GAME_UPDATES', 'PATCH_NOTES', 'ESPORTS', 'NEWS']

export default function NewsPage() {
  const [articles, setArticles] = useState<NewsArticle[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState('ALL')

  async function fetchNews() {
    setLoading(true); setError('')
    try {
      const data = await newsApi.get()
      setArticles(data.articles || [])
    } catch (e: any) {
      setError(e?.response?.data?.error || 'Failed to load news')
    } finally { setLoading(false) }
  }

  useEffect(() => { fetchNews() }, [])

  const filtered = filter === 'ALL' ? articles : articles.filter(a => a.category === filter)

  return (
    <PageTransition>
      <div className="p-8 max-w-5xl mx-auto">
        {/* Header */}
        <motion.div variants={fadeUp} className="flex items-start justify-between mb-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
                <Newspaper size={16} className="text-orange-400" />
              </div>
              <p className="text-white/40 text-sm uppercase tracking-widest">最新資訊</p>
            </div>
            <h1 className="text-3xl font-black text-white">新聞</h1>
          </div>
          <button onClick={fetchNews} disabled={loading} className="btn-ghost flex items-center gap-2 text-sm py-2 px-4">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />刷新
          </button>
        </motion.div>

        {/* Category filter */}
        <motion.div variants={fadeUp} className="flex items-center gap-2 mb-8 overflow-x-auto pb-1">
          {CATS.map(cat => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`flex-shrink-0 text-xs font-semibold px-3.5 py-2 rounded-lg transition-all duration-200 ${
                filter === cat
                  ? 'bg-green-primary text-black'
                  : 'bg-bg-secondary border border-border text-white/50 hover:text-white hover:border-white/20'
              }`}
            >
              {cat === 'ALL' ? '全部' : cat.replace(/_/g, ' ')}
            </button>
          ))}
        </motion.div>

        {error ? (
          <motion.div variants={fadeUp} className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-full bg-val-red/10 border border-val-red/20 flex items-center justify-center mb-4">
              <AlertCircle size={24} className="text-val-red" />
            </div>
            <p className="text-white font-semibold mb-2">無法載入新聞</p>
            <p className="text-white/40 text-sm mb-6 max-w-xs">{error}</p>
            <button onClick={fetchNews} className="btn-primary">重試</button>
          </motion.div>
        ) : loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="card overflow-hidden">
                <div className="h-40 skeleton" />
                <div className="p-4 space-y-2">
                  <div className="h-3 skeleton rounded w-1/3" />
                  <div className="h-4 skeleton rounded w-full" />
                  <div className="h-4 skeleton rounded w-2/3" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <motion.div variants={stagger} animate="animate" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.length === 0 ? (
              <div className="col-span-3 text-center py-16 text-white/30">
                <Newspaper size={32} className="mx-auto mb-3 opacity-30" />
                <p>此分類暫無內容</p>
              </div>
            ) : filtered.map((article, i) => (
              <NewsCard key={article.id} article={article} featured={i === 0} />
            ))}
          </motion.div>
        )}
      </div>
    </PageTransition>
  )
}
