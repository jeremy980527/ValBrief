import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Users, Plus, RefreshCw } from 'lucide-react'
import { teamApi } from '../lib/api'
import { TeamPost } from '../types'
import PageTransition, { stagger, fadeUp } from '../components/ui/PageTransition'
import TeamCard from '../components/Team/TeamCard'
import CreatePostModal from '../components/Team/CreatePostModal'

export default function TeamPage() {
  const [posts, setPosts] = useState<TeamPost[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)

  async function fetchPosts() {
    setLoading(true)
    try {
      const data = await teamApi.list()
      setPosts(data.posts || [])
    } finally { setLoading(false) }
  }

  useEffect(() => { fetchPosts() }, [])

  async function handleDelete(id: string) {
    try {
      await teamApi.delete(id)
      setPosts(p => p.filter(x => x.id !== id))
    } catch {}
  }

  return (
    <PageTransition>
      <div className="p-8 max-w-4xl mx-auto">
        {/* Header */}
        <motion.div variants={fadeUp} className="flex items-start justify-between mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
                <Users size={16} className="text-cyan-400" />
              </div>
              <p className="text-white/40 text-sm uppercase tracking-widest">尋找隊友</p>
            </div>
            <h1 className="text-3xl font-black text-white">組隊大廳</h1>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={fetchPosts} disabled={loading} className="btn-ghost flex items-center gap-2 text-sm py-2 px-4">
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            </button>
            <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2 text-sm py-2.5 px-5">
              <Plus size={16} />
              發布組隊
            </button>
          </div>
        </motion.div>

        {/* Posts */}
        {loading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="card p-5 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 skeleton rounded-full" />
                  <div className="space-y-2 flex-1">
                    <div className="h-4 skeleton rounded w-1/2" />
                    <div className="h-3 skeleton rounded w-1/4" />
                  </div>
                </div>
                <div className="h-4 skeleton rounded w-full" />
                <div className="h-4 skeleton rounded w-3/4" />
                <div className="flex gap-2">
                  {[...Array(3)].map((_, j) => <div key={j} className="h-6 skeleton rounded-lg w-16" />)}
                </div>
              </div>
            ))}
          </div>
        ) : posts.length === 0 ? (
          <motion.div variants={fadeUp} className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-full bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center mb-4">
              <Users size={24} className="text-cyan-400" />
            </div>
            <p className="text-white font-semibold mb-2">目前沒有組隊貼文</p>
            <p className="text-white/40 text-sm mb-6">成為第一個發布的人！</p>
            <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
              <Plus size={16} />發布組隊
            </button>
          </motion.div>
        ) : (
          <motion.div
            variants={stagger}
            animate="animate"
            className="grid grid-cols-1 lg:grid-cols-2 gap-4"
          >
            {posts.map(post => (
              <TeamCard key={post.id} post={post} onDelete={handleDelete} />
            ))}
          </motion.div>
        )}

        {showModal && (
          <CreatePostModal
            onClose={() => setShowModal(false)}
            onCreated={() => { setShowModal(false); fetchPosts() }}
          />
        )}
      </div>
    </PageTransition>
  )
}
