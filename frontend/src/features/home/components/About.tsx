import { useEffect, useRef } from 'react'
import { motion, useReducedMotion, useScroll, useTransform, useAnimation, useInView } from 'framer-motion'

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1]

export function About() {
  const prefersReducedMotion = useReducedMotion()
  const noAnim = prefersReducedMotion === true

  const sectionRef = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start end', 'end start'],
  })
  const imgY = useTransform(scrollYProgress, [0, 1], ['-8%', '8%'])

  // Direction-aware curtain: wipes on entry from below; resets only when
  // the section exits from the bottom of the viewport (user scrolling UP),
  // so the curtain never re-covers the image while it is still visible.
  const curtainControls = useAnimation()
  const isSectionInView = useInView(sectionRef, { amount: 0.15 })

  useEffect(() => {
    if (noAnim) return
    if (isSectionInView) {
      void curtainControls.start({ x: '-101%', transition: { duration: 1.0, ease: EASE } })
    } else {
      const rect = sectionRef.current?.getBoundingClientRect()
      if (rect && rect.top > window.innerHeight * 0.9) {
        // Section is below the viewport — reset instantly (user can't see it)
        curtainControls.set({ x: '0%' })
      }
      // Section exited from the top (scrolled past) — keep revealed
    }
  }, [isSectionInView, noAnim, curtainControls])

  return (
    <section
      ref={sectionRef}
      id="about"
      aria-labelledby="about-heading"
      style={{ backgroundColor: 'var(--color-amber-pale)' }}
    >
      <div
        className="mx-auto flex flex-col md:grid"
        style={{ maxWidth: '1280px', gridTemplateColumns: '55fr 45fr' }}
      >
        {/* Image column — overflow-hidden container for curtain wipe + parallax */}
        <div
          className="relative aspect-[4/3] md:aspect-auto overflow-hidden"
          style={{ backgroundColor: 'var(--color-rule)', minHeight: '420px' }}
        >
          <motion.img
            src="/images/salon/about/interior.png"
            alt="The Solenne salon interior — warm lighting, natural materials, clean lines"
            className="absolute inset-0 w-full h-full object-cover object-center"
            loading="lazy"
            decoding="async"
            style={noAnim ? undefined : { y: imgY }}
          />
          {/* Curtain wipe: amber-pale cover sweeps left on scroll entry */}
          <motion.div
            aria-hidden="true"
            initial={noAnim ? false : { x: '0%' }}
            animate={noAnim ? undefined : curtainControls}
            style={{
              position: 'absolute',
              inset: 0,
              backgroundColor: 'var(--color-amber-pale)',
              zIndex: 1,
            }}
          />
        </div>

        {/* Text column */}
        <div className="flex flex-col justify-center px-6 py-16 md:px-12 lg:px-16">
          <motion.p
            initial={noAnim ? false : { y: 16, opacity: 0 }}
            whileInView={noAnim ? undefined : { y: 0, opacity: 1 }}
            transition={{ duration: 0.7, ease: EASE, delay: 0.2 }}
            viewport={{ once: false, amount: 0.2 }}
            className="text-[0.6875rem] font-medium tracking-[0.1em] uppercase text-amber-dark mb-6"
          >
            Our story
          </motion.p>

          <motion.h2
            id="about-heading"
            initial={noAnim ? false : { y: 20, opacity: 0 }}
            whileInView={noAnim ? undefined : { y: 0, opacity: 1 }}
            transition={{ duration: 0.8, ease: EASE, delay: 0.35 }}
            viewport={{ once: false, amount: 0.2 }}
            className="font-display font-light text-ink mb-6"
            style={{ fontSize: '2rem', letterSpacing: '-0.02em', lineHeight: 1.2, textWrap: 'balance' }}
          >
            A space made for every kind of person.
          </motion.h2>

          <motion.p
            initial={noAnim ? false : { y: 16, opacity: 0 }}
            whileInView={noAnim ? undefined : { y: 0, opacity: 1 }}
            transition={{ duration: 0.7, ease: EASE, delay: 0.48 }}
            viewport={{ once: false, amount: 0.2 }}
            className="text-[0.9375rem] font-light text-ink-2 leading-[1.7] mb-4"
            style={{ maxWidth: '38ch' }}
          >
            Solenne was built on a simple idea: great hair care shouldn't be gendered. We welcome every person, every texture, every style — and we take the time to understand what you actually want.
          </motion.p>

          <motion.p
            initial={noAnim ? false : { y: 16, opacity: 0 }}
            whileInView={noAnim ? undefined : { y: 0, opacity: 1 }}
            transition={{ duration: 0.7, ease: EASE, delay: 0.58 }}
            viewport={{ once: false, amount: 0.2 }}
            className="text-[0.9375rem] font-light text-ink-2 leading-[1.7]"
            style={{ maxWidth: '38ch' }}
          >
            Our stylists bring years of training across cut, colour, and treatment. Book online in under a minute, and let us handle the rest.
          </motion.p>
        </div>
      </div>
    </section>
  )
}
