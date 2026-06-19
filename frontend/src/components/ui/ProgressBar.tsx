import { motion } from 'framer-motion'

interface Props {
  current: number
  total: number
  color?: string
  height?: string
  showLabel?: boolean
}

export default function ProgressBar({ current, total, color = '#B4FF4D', height = 'h-1.5', showLabel = false }: Props) {
  const pct = total > 0 ? Math.min(100, (current / total) * 100) : 0

  return (
    <div className="w-full">
      <div className={`w-full bg-bg-secondary rounded-full overflow-hidden ${height}`}>
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
        />
      </div>
      {showLabel && (
        <div className="flex justify-between mt-1">
          <span className="text-xs text-white/40">{current.toLocaleString()}</span>
          <span className="text-xs text-white/40">{total.toLocaleString()}</span>
        </div>
      )}
    </div>
  )
}
