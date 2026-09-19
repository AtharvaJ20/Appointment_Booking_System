import { motion, useReducedMotion } from 'framer-motion'
import { Link } from 'react-router-dom'

const SERVICE_TAGS = ['Haircut & Styling', 'Hair Coloring', 'Facial', 'Blow Dry']

// Expo-out — snaps into place with premium feel (adapted from 21st.dev MinimalistHero)
const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1]

export function Hero() {
  const prefersReducedMotion = useReducedMotion()
  const noAnim = prefersReducedMotion === true

  return (
    <section
      aria-label="Welcome"
      className="flex flex-col md:grid md:min-h-[560px]"
      style={{ gridTemplateColumns: '45fr 55fr' }}
    >
      {/* Left — text column */}
      <div
        className="flex flex-col justify-center px-6 py-20 md:px-12 lg:px-20"
        style={{ backgroundColor: 'var(--color-surface)' }}
      >
        {/* Editorial reveal line — draws left-to-right before eyebrow */}
        <motion.span
          initial={noAnim ? false : { scaleX: 0, opacity: 0 }}
          animate={{ scaleX: 1, opacity: 1 }}
          transition={{ duration: 0.5, ease: EASE }}
          aria-hidden="true"
          style={{
            display: 'block',
            width: '1.5rem',
            height: '1px',
            backgroundColor: 'var(--color-amber)',
            transformOrigin: 'left center',
            marginBottom: '1.25rem',
          }}
        />

        <motion.p
          initial={noAnim ? false : { y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.7, ease: EASE, delay: 0.12 }}
          className="text-[0.6875rem] font-medium tracking-[0.1em] uppercase text-amber mb-5"
        >
          Unisex salon&nbsp;·&nbsp;Online booking
        </motion.p>

        <motion.h1
          initial={noAnim ? false : { y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.85, ease: EASE, delay: 0.22 }}
          className="font-display font-light text-ink mb-5"
          style={{
            fontSize: 'clamp(1.75rem, 8vw, 4.5rem)',
            lineHeight: 1.05,
            letterSpacing: '-0.03em',
            textWrap: 'balance',
          }}
        >
          For every<br />version of you.
        </motion.h1>

        <motion.p
          initial={noAnim ? false : { y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.7, ease: EASE, delay: 0.32 }}
          className="text-[0.9375rem] font-light text-ink-2 leading-[1.65] max-w-[36ch] mb-8"
        >
          Cut, colour, and care — for every person, every style.
          Book your appointment online in under a minute.
        </motion.p>

        {/* CTA wrapper: entrance + subtle x-nudge on hover */}
        <motion.div
          initial={noAnim ? false : { y: 16, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, ease: EASE, delay: 0.44 }}
          whileHover={noAnim ? undefined : { x: 3 }}
          style={{ display: 'inline-block', alignSelf: 'flex-start' }}
        >
          <Link
            to="/book"
            className="inline-block rounded-[2px] bg-amber hover:bg-amber-dark text-surface text-[0.875rem] font-medium tracking-[0.025em] px-8 py-[14px] transition-colors duration-[180ms]"
          >
            Book an Appointment
          </Link>
        </motion.div>

        {/* Service tags — individual stagger (21st.dev pattern) */}
        <div className="flex flex-wrap gap-2 mt-8">
          {SERVICE_TAGS.map((tag, i) => (
            <motion.span
              key={tag}
              initial={noAnim ? false : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: EASE, delay: 0.56 + i * 0.07 }}
              className="text-xs text-ink-2 px-3 py-[5px] border border-rule rounded-[1px] whitespace-nowrap"
            >
              {tag}
            </motion.span>
          ))}
        </div>
      </div>

      {/* Right — hero image: opacity on the container, scale+y on the image (WAAPI resilience) */}
      <motion.div
        className="relative aspect-[4/3] md:aspect-auto overflow-hidden"
        style={{ backgroundColor: 'var(--color-rule)' }}
        initial={noAnim ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, ease: EASE }}
      >
        <motion.img
          src="/images/salon/hero/Hero.png"
          alt="Stylist working with a client in the salon"
          className="absolute inset-0 w-full h-full object-cover object-center"
          loading="eager"
          decoding="async"
          initial={noAnim ? false : { scale: 1.06, y: '4%' }}
          animate={{ scale: 1, y: '0%' }}
          transition={{ duration: 1.3, ease: EASE }}
        />
        {/* Top scrim — ensures nav link legibility as image scrolls behind the fixed header */}
        <div
          aria-hidden="true"
          className="absolute inset-x-0 top-0 pointer-events-none"
          style={{
            height: '40%',
            background: 'linear-gradient(to bottom, rgba(26,24,21,0.30) 0%, rgba(26,24,21,0) 100%)',
          }}
        />
      </motion.div>
    </section>
  )
}
