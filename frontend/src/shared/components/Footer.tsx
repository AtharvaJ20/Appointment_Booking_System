import { motion, useReducedMotion } from 'framer-motion'
import { Link } from 'react-router-dom'

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1]

const MotionLink = motion(Link)

const underlineVariants = {
  rest: { scaleX: 0 },
  hovered: { scaleX: 1, transition: { duration: 0.2, ease: EASE } },
} as const

export function Footer() {
  const year = new Date().getFullYear()
  const prefersReducedMotion = useReducedMotion()
  const noAnim = prefersReducedMotion === true

  return (
    <footer
      aria-label="Site footer"
      className="px-6 md:px-12 lg:px-20 py-16"
      style={{ backgroundColor: 'var(--color-ink)', color: 'var(--color-ink-3)' }}
    >
      <div className="mx-auto" style={{ maxWidth: '1280px' }}>
        {/* Top row */}
        <div
          className="flex flex-col md:flex-row md:justify-between gap-12 pb-12"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}
        >
          {/* Brand — fades in on scroll entry */}
          <div>
            <motion.div
              initial={noAnim ? false : { opacity: 0 }}
              whileInView={noAnim ? undefined : { opacity: 1 }}
              transition={{ duration: 0.6, ease: EASE }}
              viewport={{ once: false, amount: 0.3 }}
            >
              <Link
                to="/"
                className="font-display tracking-[0.04em] text-surface text-[1.125rem] block mb-3"
                aria-label="Solenne — home"
              >
                SOLENNE
              </Link>
            </motion.div>
            <motion.p
              initial={noAnim ? false : { opacity: 0 }}
              whileInView={noAnim ? undefined : { opacity: 1 }}
              transition={{ duration: 0.6, ease: EASE, delay: 0.15 }}
              viewport={{ once: false, amount: 0.3 }}
              className="text-[0.8125rem] font-light leading-[1.65]"
            >
              Unisex salon · Online booking
            </motion.p>
          </div>

          {/* Nav columns */}
          <div className="flex gap-16">
            <div>
              <p className="text-[0.6875rem] tracking-[0.08em] uppercase text-ink-3 mb-4 font-medium">
                Services
              </p>
              <ul className="flex flex-col gap-2 text-[0.875rem] font-light">
                {(['Haircut & Styling', 'Hair Coloring', 'Facial Treatment', 'Blow Dry'] as const).map((name) => (
                  <li key={name}>
                    <motion.a
                      href="#services"
                      initial="rest"
                      animate="rest"
                      whileHover={noAnim ? undefined : 'hovered'}
                      className="relative inline-block hover:text-surface transition-colors duration-150"
                    >
                      {name}
                      <motion.span
                        variants={underlineVariants}
                        className="absolute left-0 w-full h-[1px] origin-left"
                        style={{ bottom: '-2px', backgroundColor: 'var(--color-amber)' }}
                        aria-hidden="true"
                      />
                    </motion.a>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <p className="text-[0.6875rem] tracking-[0.08em] uppercase text-ink-3 mb-4 font-medium">
                Salon
              </p>
              <ul className="flex flex-col gap-2 text-[0.875rem] font-light">
                <li>
                  <motion.a
                    href="#about"
                    initial="rest"
                    animate="rest"
                    whileHover={noAnim ? undefined : 'hovered'}
                    className="relative inline-block hover:text-surface transition-colors duration-150"
                  >
                    About
                    <motion.span
                      variants={underlineVariants}
                      className="absolute left-0 w-full h-[1px] origin-left"
                      style={{ bottom: '-2px', backgroundColor: 'var(--color-amber)' }}
                      aria-hidden="true"
                    />
                  </motion.a>
                </li>
                <li>
                  <MotionLink
                    to="/book"
                    initial="rest"
                    animate="rest"
                    whileHover={noAnim ? undefined : 'hovered'}
                    className="relative inline-block hover:text-surface transition-colors duration-150"
                  >
                    Book
                    <motion.span
                      variants={underlineVariants}
                      className="absolute left-0 w-full h-[1px] origin-left"
                      style={{ bottom: '-2px', backgroundColor: 'var(--color-amber)' }}
                      aria-hidden="true"
                    />
                  </MotionLink>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom row */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pt-8 text-[0.8125rem] font-light">
          <p>© {year} Solenne. All rights reserved.</p>
          <p>Mon – Sat · 9:00 am – 7:00 pm</p>
        </div>
      </div>
    </footer>
  )
}
