import { motion } from 'framer-motion'
import { ExternalLink, Calendar } from 'lucide-react'
import { NewsArticle } from '../../types'
import { fadeUp } from '../ui/PageTransition'

function fmtDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString('zh-TW', { year: 'numeric', month: 'short', day: 'numeric' })
  } catch { return iso }
}

const CAT_COLORS: Record<string, string> = {
  'GAME_UPDATES': '#B4FF4D',
  'PATCH_NOTES': '#ff4655',
  'ESPORTS': '#c975e2',
  'NEWS': '#00c9c3',
  'ANNOUNCEMENTS': '#f5a623',
}

export default function NewsCard({ article, featured }: { article: NewsArticle; featured?: boolean }) {
  return (
    <motion.a
      variants={fadeUp}
      href={article.url}
      target="_blank"
      rel="noopener noreferrer"
      whileHover={{ y: -3 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      className={`card block overflow-hidden group cursor-pointer ${featured ? 'col-span-2' : ''}`}
    >
      {article.thumbnail && (
        <div className={`relative overflow-hidden bg-bg-secondary ${featured ? 'h-56' : 'h-40'}`}>
          <img
            src={article.thumbnail}
            alt={article.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <div
            className="absolute top-3 left-3 text-xs font-bold px-2.5 py-1 rounded-lg"
            style={{
              backgroundColor: (CAT_COLORS[article.category] || '#888') + '22',
              color: CAT_COLORS[article.category] || '#888',
              border: `1px solid ${(CAT_COLORS[article.category] || '#888')}44`,
            }}
          >
            {article.category.replace(/_/g, ' ')}
          </div>
        </div>
      )}
      <div className="p-4">
        {!article.thumbnail && (
          <div
            className="inline-block text-xs font-bold px-2.5 py-1 rounded-lg mb-3"
            style={{
              backgroundColor: (CAT_COLORS[article.category] || '#888') + '22',
              color: CAT_COLORS[article.category] || '#888',
              border: `1px solid ${(CAT_COLORS[article.category] || '#888')}44`,
            }}
          >
            {article.category.replace(/_/g, ' ')}
          </div>
        )}
        <h3 className={`text-white font-semibold leading-snug mb-2 group-hover:text-green-primary transition-colors line-clamp-2 ${featured ? 'text-lg' : 'text-sm'}`}>
          {article.title}
        </h3>
        {article.description && (
          <p className="text-white/40 text-xs leading-relaxed line-clamp-2 mb-3">{article.description}</p>
        )}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-white/30 text-xs">
            <Calendar size={11} />
            <span>{fmtDate(article.date)}</span>
          </div>
          <ExternalLink size={13} className="text-white/20 group-hover:text-green-primary transition-colors" />
        </div>
      </div>
    </motion.a>
  )
}
