import { motion, useReducedMotion } from 'framer-motion'
import { Link } from 'react-router-dom'

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1]

export function BookingCta() {
  const prefersReducedMotion = useReducedMotion()
  const noAnim = prefersReducedMotion === true

  return (
    <section
      aria-labelledby="booking-cta-heading"
      className="py-[120px] px-6 md:px-12 lg:px-20"
      style={{ backgroundColor: 'var(--color-surface)' }}
    >
      <div className="mx-auto" style={{ maxWidth: '1280px' }}>
        {/* Border line draws left→right on scroll entry */}
        <motion.div
          aria-hidden="true"
          initial={noAnim ? false : { scaleX: 0 }}
          whileInView={noAnim ? undefined : { scaleX: 1 }}
          transition={{ duration: 0.8, ease: EASE }}
          viewport={{ once: false, amount: 0.3 }}
          style={{
            height: '1px',
            backgroundColor: 'var(--color-rule)',
            transformOrigin: 'left center',
            marginBottom: '64px',
          }}
        />

        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-8">
          <div>
            <motion.p
              initial={noAnim ? false : { y: 16, opacity: 0 }}
              whileInView={noAnim ? undefined : { y: 0, opacity: 1 }}
              transition={{ duration: 0.7, ease: EASE, delay: 0.25 }}
              viewport={{ once: false, amount: 0.2 }}
              className="text-[0.6875rem] font-medium tracking-[0.1em] uppercase text-amber mb-4"
            >
              Book online
            </motion.p>
            <motion.h2
              id="booking-cta-heading"
              initial={noAnim ? false : { y: 20, opacity: 0 }}
              whileInView={noAnim ? undefined : { y: 0, opacity: 1 }}
              transition={{ duration: 0.8, ease: EASE, delay: 0.38 }}
              viewport={{ once: false, amount: 0.2 }}
              className="font-display font-light text-ink"
              style={{
                fontSize: 'clamp(2rem, 4vw, 3rem)',
                letterSpacing: '-0.025em',
                lineHeight: 1.1,
                textWrap: 'balance',
                maxWidth: '18ch',
              }}
            >
              Ready when you are.
            </motion.h2>
          </div>

          <div className="flex flex-col gap-3 md:items-end">
            <motion.p
              initial={noAnim ? false : { y: 16, opacity: 0 }}
              whileInView={noAnim ? undefined : { y: 0, opacity: 1 }}
              transition={{ duration: 0.7, ease: EASE, delay: 0.5 }}
              viewport={{ once: false, amount: 0.2 }}
              className="text-[0.875rem] font-light text-ink-2"
              style={{ maxWidth: '32ch', lineHeight: 1.6 }}
            >
              Pick a service, choose your time, and confirm — no account needed.
            </motion.p>

            {/* Spring entrance + hover glow */}
            <motion.div
              initial={noAnim ? false : { y: 16, opacity: 0 }}
              whileInView={noAnim ? undefined : { y: 0, opacity: 1 }}
              transition={
                noAnim
                  ? undefined
                  : { type: 'spring', stiffness: 200, damping: 18, delay: 0.62 }
              }
              viewport={{ once: false, amount: 0.2 }}
              whileHover={
                noAnim
                  ? undefined
                  : { scale: 1.03, boxShadow: '0 8px 24px rgba(140,104,64,0.28)' }
              }
              style={{ display: 'inline-block', alignSelf: 'flex-start' }}
              className="md:self-auto"
            >
              <Link
                to="/book"
                className="inline-block rounded-[2px] bg-amber hover:bg-amber-dark text-surface text-[0.875rem] font-medium tracking-[0.025em] px-8 py-[14px] transition-colors duration-[180ms]"
              >
                Book an Appointment
              </Link>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  )
}
