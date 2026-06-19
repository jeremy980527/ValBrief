import { motion } from 'framer-motion'
import { ShopItem as ShopItemType } from '../../types'
import { fadeUp } from '../ui/PageTransition'

const VP_ICON = '//media.valorant-api.com/currencies/85ad13f7-3d1b-5128-9eb2-7cd8ee0b5741/displayicon.png'

export default function ShopItemCard({ item, index }: { item: ShopItemType; index: number }) {
  return (
    <motion.div
      variants={fadeUp}
      custom={index}
      whileHover={{ y: -4, scale: 1.02 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      className="card overflow-hidden cursor-pointer group"
    >
      {/* Skin image */}
      <div className="relative h-48 bg-bg-secondary overflow-hidden">
        {item.image ? (
          <motion.img
            src={item.image}
            alt={item.name}
            className="w-full h-full object-contain p-4 transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-white/10 text-5xl font-black">?</span>
          </div>
        )}

        {/* Tier badge */}
        <div
          className="absolute top-3 left-3 text-xs font-bold px-2.5 py-1 rounded-lg"
          style={{ backgroundColor: `${item.tierColor}22`, color: item.tierColor, border: `1px solid ${item.tierColor}44` }}
        >
          {item.tier}
        </div>

        {/* Hover glow */}
        <motion.div
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
          style={{ background: `radial-gradient(circle at center, ${item.tierColor}08 0%, transparent 70%)` }}
        />
      </div>

      {/* Info */}
      <div className="p-4">
        <h3 className="text-white font-semibold text-sm leading-tight mb-3 line-clamp-1">{item.name}</h3>
        <div className="flex items-center gap-1.5">
          <img src={VP_ICON} alt="VP" className="w-4 h-4" onError={e => { e.currentTarget.style.display = 'none' }} />
          <span className="text-green-primary font-bold text-base">{item.price.toLocaleString()}</span>
          <span className="text-white/30 text-xs ml-1">VP</span>
        </div>
      </div>
    </motion.div>
  )
}
