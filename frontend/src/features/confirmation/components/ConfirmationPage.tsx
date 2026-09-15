import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
import { api, ApiError } from '../../../shared/utils/api'
import type { AppointmentConfirmation } from '../../../types/api'

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1]

function formatDateLong(dateStr: string): string {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-baseline gap-4">
      <dt
        className="text-[0.6875rem] font-medium tracking-[0.08em] uppercase shrink-0"
        style={{ color: 'var(--color-ink-2)' }}
      >
        {label}
      </dt>
      <dd className="text-[0.9375rem] text-right" style={{ color: 'var(--color-ink)' }}>
        {value}
      </dd>
    </div>
  )
}

export function ConfirmationPage() {
  const { id } = useParams<{ id: string }>()
  const [confirmation, setConfirmation] = useState<AppointmentConfirmation | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const prefersReducedMotion = useReducedMotion()
  const noAnim = prefersReducedMotion === true

  useEffect(() => {
    if (!id) return
    let cancelled = false
    api.get<AppointmentConfirmation>(`/api/confirm/${id}`)
      .then(data => { if (!cancelled) setConfirmation(data) })
      .catch(err => { if (!cancelled) setError(err instanceof ApiError ? err.message : 'Could not load confirmation') })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [id])

  return (
    <main id="main-content" style={{ backgroundColor: 'var(--color-base)', paddingTop: '72px' }}>
      <section className="py-[80px] px-6 md:px-12 lg:px-20">
        <div className="mx-auto" style={{ maxWidth: '480px' }}>

          {loading && (
            <div className="flex flex-col gap-4" aria-label="Loading confirmation" aria-busy="true">
              <div className="h-14 w-14 rounded-full animate-pulse" style={{ backgroundColor: 'var(--color-rule)' }} />
              <div className="mt-4 h-8 w-40 rounded animate-pulse" style={{ backgroundColor: 'var(--color-rule)' }} />
              <div className="h-4 w-full rounded animate-pulse" style={{ backgroundColor: 'var(--color-rule)' }} />
              <div className="h-4 w-3/4 rounded animate-pulse" style={{ backgroundColor: 'var(--color-rule)' }} />
            </div>
          )}

          {!loading && error && (
            <div>
              <p className="text-[0.875rem] text-red-700 mb-6">{error}</p>
              <Link
                to="/book"
                className="text-[0.875rem] font-medium transition-colors duration-150"
                style={{ color: 'var(--color-amber)' }}
              >
                ← Try booking again
              </Link>
            </div>
          )}

          {!loading && !error && confirmation && (
            <motion.div
              initial={noAnim ? false : { y: 24, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.55, ease: EASE }}
            >
              {/* Checkmark */}
              <motion.div
                initial={noAnim ? false : { scale: 0.55, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.45, ease: [0.34, 1.56, 0.64, 1] }}
                className="mb-8 w-14 h-14 rounded-full flex items-center justify-center"
                style={{ backgroundColor: 'var(--color-amber)' }}
                aria-hidden="true"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" stroke="var(--color-surface)">
                  <path d="M5 13l4 4L19 7" />
                </svg>
              </motion.div>

              <h1
                className="font-display font-light mb-2"
                style={{ fontSize: '2rem', letterSpacing: '-0.02em', lineHeight: 1.2, color: 'var(--color-ink)' }}
              >
                You're booked.
              </h1>
              <p className="text-[0.875rem] font-light mb-10" style={{ lineHeight: 1.6, color: 'var(--color-ink-2)' }}>
                A confirmation will be sent to {confirmation.client_email}.
              </p>

              {/* Summary card */}
              <dl
                className="rounded-[2px] p-6 flex flex-col gap-4"
                style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-rule)' }}
              >
                <SummaryRow label="Service" value={confirmation.service_name} />
                <div aria-hidden="true" style={{ height: '1px', backgroundColor: 'var(--color-rule)' }} />
                <SummaryRow label="Date" value={formatDateLong(confirmation.date)} />
                <SummaryRow label="Time" value={`${confirmation.start_time} – ${confirmation.end_time}`} />
                <div aria-hidden="true" style={{ height: '1px', backgroundColor: 'var(--color-rule)' }} />
                <SummaryRow label="Name" value={confirmation.client_name} />
                <SummaryRow label="Phone" value={confirmation.client_phone} />
              </dl>

              <Link
                to="/"
                className="mt-8 inline-block text-[0.875rem] transition-colors duration-150"
                style={{ color: 'var(--color-ink-2)' }}
                onMouseEnter={e => (e.currentTarget.style.color = 'var(--color-ink)')}
                onMouseLeave={e => (e.currentTarget.style.color = 'var(--color-ink-2)')}
              >
                ← Back to home
              </Link>
            </motion.div>
          )}

        </div>
      </section>
    </main>
  )
}
