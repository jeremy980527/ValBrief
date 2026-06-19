import { motion } from 'framer-motion'
import { CheckCircle2, Zap } from 'lucide-react'
import { Mission } from '../../types'
import ProgressBar from '../ui/ProgressBar'
import { fadeUp } from '../ui/PageTransition'

export default function MissionCard({ mission }: { mission: Mission }) {
  const pct = mission.progressTotal > 0
    ? Math.min(100, Math.round((mission.progressCurrent / mission.progressTotal) * 100))
    : 0

  return (
    <motion.div
      variants={fadeUp}
      className={`card p-4 ${mission.complete ? 'opacity-50' : ''}`}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span
              className={`text-xs font-bold px-2 py-0.5 rounded-md ${
                mission.type === 'daily'
                  ? 'bg-green-primary/10 text-green-primary border border-green-primary/20'
                  : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
              }`}
            >
              {mission.type === 'daily' ? '每日' : '每週'}
            </span>
          </div>
          <h3 className="text-white font-semibold text-sm leading-snug line-clamp-2">{mission.title}</h3>
          {mission.description && mission.description !== mission.title && (
            <p className="text-white/40 text-xs mt-1 line-clamp-1">{mission.description}</p>
          )}
        </div>
        {mission.complete ? (
          <CheckCircle2 size={20} className="text-green-primary flex-shrink-0" />
        ) : (
          <div className="flex items-center gap-1 flex-shrink-0 bg-bg-secondary rounded-lg px-2 py-1">
            <Zap size={12} className="text-yellow-400" />
            <span className="text-yellow-400 text-xs font-bold">+{(mission.xpGrant / 1000).toFixed(0)}K</span>
          </div>
        )}
      </div>

      {!mission.complete && (
        <>
          <ProgressBar current={mission.progressCurrent} total={mission.progressTotal} height="h-1.5" />
          <div className="flex justify-between mt-1.5">
            <span className="text-white/30 text-xs">{mission.progressCurrent} / {mission.progressTotal}</span>
            <span className="text-white/30 text-xs">{pct}%</span>
          </div>
        </>
      )}
    </motion.div>
  )
}
