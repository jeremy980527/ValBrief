import { motion } from 'framer-motion'
import { MessageSquare, Globe, Trash2 } from 'lucide-react'
import { TeamPost } from '../../types'
import { fadeUp } from '../ui/PageTransition'
import { useAuth } from '../../context/AuthContext'

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return '剛剛'
  if (m < 60) return `${m} 分鐘前`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h} 小時前`
  return `${Math.floor(h / 24)} 天前`
}

interface Props {
  post: TeamPost
  onDelete?: (id: string) => void
}

export default function TeamCard({ post, onDelete }: Props) {
  const { user } = useAuth()
  const isOwn = user?.riotGameName === post.gameName && user?.riotTagLine === post.tagLine

  return (
    <motion.div variants={fadeUp} className="card p-5 group">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-sm border-2"
            style={{ borderColor: post.rankColor + '60', backgroundColor: post.rankColor + '15', color: post.rankColor }}
          >
            {post.gameName[0]?.toUpperCase()}
          </div>
          <div>
            <p className="text-white font-semibold text-sm">{post.gameName}<span className="text-white/30 text-xs ml-1">#{post.tagLine}</span></p>
            <span className="text-xs font-bold" style={{ color: post.rankColor }}>{post.rank}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-white/30 text-xs">{timeAgo(post.createdAt)}</span>
          {isOwn && onDelete && (
            <button
              onClick={() => onDelete(post.id)}
              className="opacity-0 group-hover:opacity-100 text-white/20 hover:text-val-red transition-all duration-200 p-1"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      </div>

      <p className="text-white/70 text-sm leading-relaxed mb-3 line-clamp-2">{post.description}</p>

      <div className="flex flex-wrap gap-1.5 mb-3">
        {post.roles.map(r => (
          <span key={r} className="tag text-white/60">{r}</span>
        ))}
        {post.agents.map(a => (
          <span key={a} className="tag text-green-primary/80">{a}</span>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1 text-white/30 text-xs">
          <Globe size={11} />
          <span>{post.language}</span>
        </div>
        {post.discord && (
          <div className="flex items-center gap-1 text-white/30 text-xs">
            <MessageSquare size={11} />
            <span className="font-mono">{post.discord}</span>
          </div>
        )}
      </div>
    </motion.div>
  )
}
