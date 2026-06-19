import { motion } from 'framer-motion'

export default function LoadingScreen() {
  return (
    <div className="fixed inset-0 bg-bg-base flex items-center justify-center z-50">
      <motion.div
        className="flex flex-col items-center gap-6"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
      >
        <div className="relative w-16 h-16">
          <motion.div
            className="absolute inset-0 rounded-full border-2 border-green-primary/20"
          />
          <motion.div
            className="absolute inset-0 rounded-full border-2 border-t-green-primary border-r-transparent border-b-transparent border-l-transparent"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          />
          <div className="absolute inset-3 rounded-full bg-green-primary/10 flex items-center justify-center">
            <div className="w-3 h-3 rounded-full bg-green-primary animate-pulse" />
          </div>
        </div>
        <p className="text-white/40 text-sm tracking-widest uppercase">Loading</p>
      </motion.div>
    </div>
  )
}
