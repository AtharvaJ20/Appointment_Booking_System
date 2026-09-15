import * as React from 'react'
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion'
import { ArrowUpRight } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface InteractiveServiceCardProps {
  title: string
  subtitle: string
  imageUrl: string
  actionText: string
  href: string
  onActionClick: () => void
  className?: string
}

export const InteractiveServiceCard = React.forwardRef<
  HTMLDivElement,
  InteractiveServiceCardProps
>(({ title, subtitle, imageUrl, actionText, href, onActionClick, className }, ref) => {
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)

  const springConfig = { damping: 15, stiffness: 150 }
  const springX = useSpring(mouseX, springConfig)
  const springY = useSpring(mouseY, springConfig)

  const rotateX = useTransform(springY, [-0.5, 0.5], ['10.5deg', '-10.5deg'])
  const rotateY = useTransform(springX, [-0.5, 0.5], ['-10.5deg', '10.5deg'])

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const xPct = (e.clientX - rect.left) / rect.width - 0.5
    const yPct = (e.clientY - rect.top) / rect.height - 0.5
    mouseX.set(xPct)
    mouseY.set(yPct)
  }

  const handleMouseLeave = () => {
    mouseX.set(0)
    mouseY.set(0)
  }

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ rotateX, rotateY, transformStyle: 'preserve-3d' }}
      className={cn(
        'relative h-[26rem] w-full rounded-2xl bg-transparent shadow-2xl border border-white/10',
        className
      )}
    >
      <div
        style={{ transform: 'translateZ(50px)', transformStyle: 'preserve-3d' }}
        className="absolute inset-4 grid h-[calc(100%-2rem)] w-[calc(100%-2rem)] grid-rows-[1fr_auto] rounded-xl shadow-lg"
      >
        <img
          src={imageUrl}
          alt={title}
          className="absolute inset-0 h-full w-full rounded-xl object-cover object-top"
          loading="lazy"
          decoding="async"
        />
        <div className="absolute inset-0 h-full w-full rounded-xl bg-gradient-to-b from-black/20 via-transparent to-black/60" />

        <div className="relative flex flex-col justify-between rounded-xl p-4 text-white">
          <div className="flex items-start justify-between">
            <div>
              <motion.h3
                style={{ transform: 'translateZ(50px)' }}
                className="text-lg font-semibold leading-tight"
              >
                {title}
              </motion.h3>
              <motion.p
                style={{ transform: 'translateZ(40px)' }}
                className="text-xs font-light text-white/80 mt-0.5"
              >
                {subtitle}
              </motion.p>
            </div>
            <motion.a
              href={href}
              whileHover={{ scale: 1.1, rotate: '2.5deg' }}
              whileTap={{ scale: 0.9 }}
              aria-label={`Book ${title}`}
              style={{ transform: 'translateZ(60px)' }}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm ring-1 ring-inset ring-white/30 transition-colors hover:bg-white/30 shrink-0"
            >
              <ArrowUpRight className="h-4 w-4 text-white" />
            </motion.a>
          </div>

          <motion.button
            onClick={onActionClick}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            style={{ transform: 'translateZ(40px)' }}
            className="w-full rounded-lg py-2.5 text-center text-sm font-semibold text-white bg-white/10 backdrop-blur-md ring-1 ring-inset ring-white/20 hover:bg-white/20 transition-colors"
          >
            {actionText}
          </motion.button>
        </div>
      </div>
    </motion.div>
  )
})
InteractiveServiceCard.displayName = 'InteractiveServiceCard'
