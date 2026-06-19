import { useEffect, useState } from 'react'
import { Clock } from 'lucide-react'

function fmt(n: number) { return String(n).padStart(2, '0') }

export default function CountdownTimer({ seconds }: { seconds: number }) {
  const [remaining, setRemaining] = useState(seconds)

  useEffect(() => {
    setRemaining(seconds)
    const id = setInterval(() => setRemaining(r => Math.max(0, r - 1)), 1000)
    return () => clearInterval(id)
  }, [seconds])

  const h = Math.floor(remaining / 3600)
  const m = Math.floor((remaining % 3600) / 60)
  const s = remaining % 60

  return (
    <div className="flex items-center gap-2 text-white/60">
      <Clock size={14} className="text-green-primary" />
      <span className="text-sm font-mono">
        <span className="text-white font-semibold">{fmt(h)}</span>
        <span className="text-white/30 mx-0.5">:</span>
        <span className="text-white font-semibold">{fmt(m)}</span>
        <span className="text-white/30 mx-0.5">:</span>
        <span className="text-white font-semibold">{fmt(s)}</span>
      </span>
      <span className="text-xs">後重置</span>
    </div>
  )
}
