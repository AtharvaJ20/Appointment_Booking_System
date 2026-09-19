import { useEffect, useState } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { Link } from 'react-router-dom'

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1]

const MotionLink = motion(Link)

export function Nav() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const prefersReducedMotion = useReducedMotion()
  const noAnim = prefersReducedMotion === true

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 80)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    if (!menuOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [menuOpen])

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [menuOpen])

  return (
    <>
      <header
        className="fixed top-0 left-0 right-0 z-50 transition-[background-color,box-shadow] duration-200"
        style={{
          backgroundColor: scrolled ? 'var(--color-surface)' : 'transparent',
          boxShadow: scrolled ? '0 1px 0 0 var(--color-rule)' : 'none',
        }}
      >
        <div className="mx-auto max-w-[1280px] px-6 md:px-12 lg:px-20 h-[72px] flex items-center justify-between">
          {/* SOLENNE wordmark — slides in from left on page load */}
          <MotionLink
            to="/"
            initial={noAnim ? false : { x: -12, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.7, ease: EASE, delay: 0.6 }}
            className="font-display text-[1.125rem] tracking-[0.04em] text-ink"
            aria-label="Solenne — home"
          >
            SOLENNE
          </MotionLink>

          {/* Desktop nav — links drop in from top on page load */}
          <nav className="hidden md:flex items-center gap-8" aria-label="Primary navigation">
            <motion.a
              href="#services"
              initial={noAnim ? false : { y: -8, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5, ease: EASE, delay: 0.66 }}
              className="text-[0.875rem] transition-colors duration-200"
              style={{ color: scrolled ? 'var(--color-ink-2)' : 'var(--color-surface)' }}
            >
              Services
            </motion.a>
            <motion.a
              href="#about"
              initial={noAnim ? false : { y: -8, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5, ease: EASE, delay: 0.72 }}
              className="text-[0.875rem] transition-colors duration-200"
              style={{ color: scrolled ? 'var(--color-ink-2)' : 'var(--color-surface)' }}
            >
              About
            </motion.a>
            <MotionLink
              to="/book"
              initial={noAnim ? false : { y: -8, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5, ease: EASE, delay: 0.78 }}
              className="rounded-[2px] bg-amber hover:bg-amber-dark text-surface text-[0.8125rem] font-medium tracking-[0.02em] px-5 py-[10px] transition-colors duration-[180ms]"
            >
              Book an Appointment
            </MotionLink>
          </nav>

          {/* Mobile hamburger */}
          <button
            className="md:hidden p-2 -mr-2 text-ink"
            onClick={() => setMenuOpen(true)}
            aria-label="Open navigation menu"
            aria-expanded={menuOpen}
            aria-controls="mobile-nav"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
        </div>
      </header>

      {/* Mobile full-screen overlay — slides up on open, down on close */}
      {noAnim ? (
        menuOpen && (
          <div
            id="mobile-nav"
            role="dialog"
            aria-modal="true"
            aria-label="Navigation"
            className="fixed inset-0 z-50 flex flex-col"
            style={{ backgroundColor: 'var(--color-surface)' }}
          >
            <div className="flex items-center justify-between px-6 h-[72px] shrink-0">
              <Link to="/" className="font-display text-[1.125rem] tracking-[0.04em] text-ink" onClick={() => setMenuOpen(false)}>
                SOLENNE
              </Link>
              <button onClick={() => setMenuOpen(false)} className="p-2 -mr-2 text-ink" aria-label="Close navigation menu">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
                  <line x1="4" y1="4" x2="20" y2="20" />
                  <line x1="20" y1="4" x2="4" y2="20" />
                </svg>
              </button>
            </div>
            <nav className="flex flex-col items-center justify-center flex-1 gap-10" aria-label="Mobile navigation">
              <a href="#services" className="font-display text-[2rem] font-light text-ink hover:text-ink-2 transition-colors duration-150" onClick={() => setMenuOpen(false)}>Services</a>
              <a href="#about" className="font-display text-[2rem] font-light text-ink hover:text-ink-2 transition-colors duration-150" onClick={() => setMenuOpen(false)}>About</a>
              <Link to="/book" className="mt-4 rounded-[2px] bg-amber hover:bg-amber-dark text-surface text-[0.875rem] font-medium tracking-[0.025em] px-8 py-[14px] transition-colors duration-[180ms]" onClick={() => setMenuOpen(false)}>
                Book an Appointment
              </Link>
            </nav>
          </div>
        )
      ) : (
        <AnimatePresence>
          {menuOpen && (
            <motion.div
              id="mobile-nav"
              role="dialog"
              aria-modal="true"
              aria-label="Navigation"
              className="fixed inset-0 z-50 flex flex-col"
              style={{ backgroundColor: 'var(--color-surface)' }}
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ duration: 0.35, ease: EASE }}
            >
              {/* Top bar */}
              <div className="flex items-center justify-between px-6 h-[72px] shrink-0">
                <Link to="/" className="font-display text-[1.125rem] tracking-[0.04em] text-ink" onClick={() => setMenuOpen(false)}>
                  SOLENNE
                </Link>
                <button onClick={() => setMenuOpen(false)} className="p-2 -mr-2 text-ink" aria-label="Close navigation menu">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
                    <line x1="4" y1="4" x2="20" y2="20" />
                    <line x1="20" y1="4" x2="4" y2="20" />
                  </svg>
                </button>
              </div>

              {/* Nav links — stagger in after overlay settles */}
              <nav className="flex flex-col items-center justify-center flex-1 gap-10" aria-label="Mobile navigation">
                <motion.a
                  href="#services"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, ease: EASE, delay: 0.15 }}
                  className="font-display text-[2rem] font-light text-ink hover:text-ink-2 transition-colors duration-150"
                  onClick={() => setMenuOpen(false)}
                >
                  Services
                </motion.a>
                <motion.a
                  href="#about"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, ease: EASE, delay: 0.23 }}
                  className="font-display text-[2rem] font-light text-ink hover:text-ink-2 transition-colors duration-150"
                  onClick={() => setMenuOpen(false)}
                >
                  About
                </motion.a>
                <MotionLink
                  to="/book"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, ease: EASE, delay: 0.31 }}
                  className="mt-4 rounded-[2px] bg-amber hover:bg-amber-dark text-surface text-[0.875rem] font-medium tracking-[0.025em] px-8 py-[14px] transition-colors duration-[180ms]"
                  onClick={() => setMenuOpen(false)}
                >
                  Book an Appointment
                </MotionLink>
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </>
  )
}
