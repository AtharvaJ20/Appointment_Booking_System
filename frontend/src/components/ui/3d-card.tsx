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

// 3D tilt is a mouse-hover effect — disable on touch-only devices.
// preserve-3d + translateZ children render distorted on iOS Safari and
// narrow viewports where there's no pointer to drive the motion values.
function useIsTouchDevice() {
  const [isTouch, setIsTouch] = React.useState(false)
  React.useEffect(() => {
    setIsTouch(window.matchMedia('(hover: none) and (pointer: coarse)').matches)
  }, [])
  return isTouch
}

export const InteractiveServiceCard = React.forwardRef<
  HTMLDivElement,
  InteractiveServiceCardProps
>(({ title, subtitle, imageUrl, actionText, href, onActionClick, className }, ref) => {
  const isTouch = useIsTouchDevice()

  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)
  const springConfig = { damping: 15, stiffness: 150 }
  const springX = useSpring(mouseX, springConfig)
  const springY = useSpring(mouseY, springConfig)
  const rotateX = useTransform(springY, [-0.5, 0.5], ['10.5deg', '-10.5deg'])
  const rotateY = useTransform(springX, [-0.5, 0.5], ['-10.5deg', '10.5deg'])

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    mouseX.set((e.clientX - rect.left) / rect.width - 0.5)
    mouseY.set((e.clientY - rect.top) / rect.height - 0.5)
  }

  const handleMouseLeave = () => {
    mouseX.set(0)
    mouseY.set(0)
  }

  return (
    <motion.div
      ref={ref}
      onMouseMove={isTouch ? undefined : handleMouseMove}
      onMouseLeave={isTouch ? undefined : handleMouseLeave}
      style={isTouch ? undefined : { rotateX, rotateY, transformStyle: 'preserve-3d' }}
      className={cn(
        'relative h-[14rem] sm:h-[20rem] lg:h-[26rem] w-full rounded-2xl bg-transparent shadow-2xl border border-white/10',
        className
      )}
    >
      <div
        style={isTouch ? undefined : { transform: 'translateZ(50px)', transformStyle: 'preserve-3d' }}
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

        <div className="relative flex flex-col justify-between rounded-xl p-2.5 sm:p-3 md:p-4 text-white">
          <div className="flex items-start justify-between gap-1">
            <div className="min-w-0">
              <h3
                style={isTouch ? undefined : { transform: 'translateZ(50px)' }}
                className="text-xs sm:text-sm md:text-base lg:text-lg font-semibold leading-tight truncate"
              >
                {title}
              </h3>
              <p
                style={isTouch ? undefined : { transform: 'translateZ(40px)' }}
                className="text-[0.5625rem] sm:text-[0.625rem] md:text-xs font-light text-white/80 mt-0.5"
              >
                {subtitle}
              </p>
            </div>
            <motion.a
              href={href}
              whileHover={{ scale: 1.1, rotate: '2.5deg' }}
              whileTap={{ scale: 0.9 }}
              aria-label={`Book ${title}`}
              style={isTouch ? undefined : { transform: 'translateZ(60px)' }}
              className="flex h-6 w-6 sm:h-7 sm:w-7 md:h-9 md:w-9 shrink-0 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm ring-1 ring-inset ring-white/30 transition-colors hover:bg-white/30"
            >
              <ArrowUpRight className="h-3 w-3 md:h-4 md:w-4 text-white" />
            </motion.a>
          </div>

          <motion.button
            onClick={onActionClick}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            style={isTouch ? undefined : { transform: 'translateZ(40px)' }}
            className="w-full rounded-lg py-1.5 sm:py-2 md:py-2.5 text-center text-[0.625rem] sm:text-xs md:text-sm font-semibold text-white bg-white/10 backdrop-blur-md ring-1 ring-inset ring-white/20 hover:bg-white/20 transition-colors"
          >
            {actionText}
          </motion.button>
        </div>
      </div>
    </motion.div>
  )
})
InteractiveServiceCard.displayName = 'InteractiveServiceCard'
