import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
import { api } from '../../../shared/utils/api'
import type { Service } from '../../../types/api'
import { InteractiveServiceCard } from '@/components/ui/3d-card'

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1]

const STATIC_SERVICES: Service[] = [
  { id: 1, name: 'Haircut & Styling',  duration_minutes: 45, price: 800,  image_filename: 'Haircut.png' },
  { id: 2, name: 'Hair Coloring',      duration_minutes: 90, price: 2500, image_filename: 'Hair coloring.png' },
  { id: 3, name: 'Facial Treatment',   duration_minutes: 60, price: 1500, image_filename: 'facial.png' },
  { id: 4, name: 'Blow Dry & Styling', duration_minutes: 45, price: 600,  image_filename: 'styling.png' },
]

function serviceImageUrl(filename: string | null): string {
  if (!filename) return ''
  return `/images/salon/services/${encodeURIComponent(filename)}`
}

function useServices() {
  const [services, setServices] = useState<Service[]>(STATIC_SERVICES)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    api
      .get<Service[]>('/api/services')
      .then((data) => { if (!cancelled) setServices(data) })
      .catch(() => { /* keep static fallback */ })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  return { services, loading }
}

function SkeletonCard() {
  return (
    <div className="h-[26rem] w-full rounded-2xl animate-pulse" style={{ backgroundColor: 'var(--color-rule)' }} />
  )
}

export function Services() {
  const { services, loading } = useServices()
  const navigate = useNavigate()
  const prefersReducedMotion = useReducedMotion()
  const noAnim = prefersReducedMotion === true

  return (
    <section
      id="services"
      aria-labelledby="services-heading"
      className="py-16 md:py-[120px] px-6 md:px-12 lg:px-20"
      style={{ maxWidth: '1280px', margin: '0 auto' }}
    >
      <motion.h2
        id="services-heading"
        initial={noAnim ? false : { y: 20, opacity: 0 }}
        whileInView={noAnim ? undefined : { y: 0, opacity: 1 }}
        transition={{ duration: 0.7, ease: EASE }}
        viewport={{ once: false, amount: 0.3 }}
        className="font-display font-light text-ink mb-12"
        style={{ fontSize: '2.25rem', letterSpacing: '-0.02em', lineHeight: 1.15 }}
      >
        Our services
      </motion.h2>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
          : services.map((service, i) => (
              <motion.div
                key={service.id}
                initial={noAnim ? false : { y: 32, opacity: 0, scale: 0.97 }}
                whileInView={noAnim ? undefined : { y: 0, opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, ease: EASE, delay: 0.2 + i * 0.08 }}
                viewport={{ once: false, amount: 0.1 }}
                style={{ perspective: '1000px' }}
              >
                <InteractiveServiceCard
                  title={service.name}
                  subtitle={`${service.duration_minutes} min · ₹${service.price.toLocaleString('en-IN')}`}
                  imageUrl={serviceImageUrl(service.image_filename)}
                  actionText="Book now"
                  href={`/book?service_id=${service.id}`}
                  onActionClick={() => navigate(`/book?service_id=${service.id}`)}
                />
              </motion.div>
            ))}
      </div>
    </section>
  )
}
