import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
import { api, ApiError } from '../../../shared/utils/api'
import type { AdminBooking } from '../../../types/api'

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1]

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(dateStr: string): string {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

// ── StatusBadge ──────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: 'Pending' | 'Completed' }) {
  const isPending = status === 'Pending'
  return (
    <span
      className="inline-flex items-center px-2.5 py-[3px] rounded-[2px] text-[0.625rem] font-medium tracking-[0.07em] uppercase"
      style={{
        backgroundColor: isPending ? 'var(--color-amber-pale)' : 'var(--color-rule)',
        color: isPending ? 'var(--color-amber-dark)' : 'var(--color-ink-3)',
      }}
    >
      {status}
    </span>
  )
}

// ── Skeleton ─────────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div
      className="rounded-[2px] p-5 animate-pulse"
      style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-rule)' }}
      aria-hidden="true"
    >
      <div className="flex justify-between gap-3 mb-4">
        <div className="h-4 rounded w-32" style={{ backgroundColor: 'var(--color-rule)' }} />
        <div className="h-4 rounded w-16" style={{ backgroundColor: 'var(--color-rule)' }} />
      </div>
      <div className="h-3 rounded w-48 mb-2" style={{ backgroundColor: 'var(--color-rule)' }} />
      <div className="h-3 rounded w-40" style={{ backgroundColor: 'var(--color-rule)' }} />
    </div>
  )
}

function SkeletonRow() {
  return (
    <tr aria-hidden="true">
      {[120, 140, 110, 70, 100, 160, 60, 80].map((w, i) => (
        <td key={i} className="px-5 py-4">
          <div
            className="h-3.5 rounded animate-pulse"
            style={{ backgroundColor: 'var(--color-rule)', width: `${w}px` }}
          />
        </td>
      ))}
    </tr>
  )
}

// ── Mobile card ──────────────────────────────────────────────────────────────

interface BookingCardProps {
  booking: AdminBooking
  completing: boolean
  onComplete: (id: number) => void
  index: number
  noAnim: boolean
}

function BookingCard({ booking, completing, onComplete, index, noAnim }: BookingCardProps) {
  const isCompleted = booking.status === 'Completed'

  return (
    <motion.article
      initial={noAnim ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: isCompleted ? 0.55 : 1, y: 0 }}
      transition={{ duration: 0.32, ease: EASE, delay: index * 0.05 }}
      className="rounded-[2px] p-5"
      style={{ border: '1px solid var(--color-rule)', backgroundColor: 'var(--color-surface)' }}
    >
      {/* Top row: name + badge */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <p className="text-[0.9375rem] font-medium" style={{ color: 'var(--color-ink)' }}>
            {booking.client_name}
          </p>
          <p className="text-[0.8125rem] mt-0.5" style={{ color: 'var(--color-ink-2)' }}>
            {booking.service_name}
          </p>
        </div>
        <StatusBadge status={booking.status} />
      </div>

      {/* Details */}
      <div className="text-[0.8125rem] flex flex-col gap-0.5" style={{ color: 'var(--color-ink-2)' }}>
        <p>{formatDate(booking.date)} · {booking.start_time}–{booking.end_time}</p>
        <p>{booking.client_email}</p>
        <p>{booking.client_phone}</p>
      </div>

      {/* Action */}
      {!isCompleted && (
        <button
          onClick={() => onComplete(booking.id)}
          disabled={completing}
          className="mt-4 text-[0.8125rem] font-medium transition-colors duration-150 disabled:opacity-50"
          style={{ color: 'var(--color-amber)' }}
          onMouseEnter={e => (e.currentTarget.style.color = 'var(--color-amber-dark)')}
          onMouseLeave={e => (e.currentTarget.style.color = 'var(--color-amber)')}
        >
          {completing ? 'Marking…' : 'Mark complete →'}
        </button>
      )}
    </motion.article>
  )
}

// ── Desktop table row ─────────────────────────────────────────────────────────

interface BookingRowProps {
  booking: AdminBooking
  completing: boolean
  onComplete: (id: number) => void
  index: number
  noAnim: boolean
}

function BookingRow({ booking, completing, onComplete, index, noAnim }: BookingRowProps) {
  const isCompleted = booking.status === 'Completed'

  return (
    <motion.tr
      initial={noAnim ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: isCompleted ? 0.55 : 1, y: 0 }}
      transition={{ duration: 0.28, ease: EASE, delay: index * 0.04 }}
      style={{ borderBottom: '1px solid var(--color-rule)' }}
    >
      <td className="px-5 py-[14px] text-[0.875rem] font-medium whitespace-nowrap" style={{ color: 'var(--color-ink)' }}>
        {booking.client_name}
      </td>
      <td className="px-5 py-[14px] text-[0.875rem] whitespace-nowrap" style={{ color: 'var(--color-ink-2)' }}>
        {booking.service_name}
      </td>
      <td className="px-5 py-[14px] text-[0.875rem] whitespace-nowrap" style={{ color: 'var(--color-ink-2)' }}>
        {formatDate(booking.date)}
      </td>
      <td className="px-5 py-[14px] text-[0.875rem] whitespace-nowrap" style={{ color: 'var(--color-ink-2)' }}>
        {booking.start_time}–{booking.end_time}
      </td>
      <td className="px-5 py-[14px] text-[0.875rem] whitespace-nowrap" style={{ color: 'var(--color-ink-2)' }}>
        {booking.client_phone}
      </td>
      <td className="px-5 py-[14px] text-[0.875rem]" style={{ color: 'var(--color-ink-2)' }}>
        {booking.client_email}
      </td>
      <td className="px-5 py-[14px] whitespace-nowrap">
        <StatusBadge status={booking.status} />
      </td>
      <td className="px-5 py-[14px] whitespace-nowrap">
        {!isCompleted && (
          <button
            onClick={() => onComplete(booking.id)}
            disabled={completing}
            className="text-[0.8125rem] font-medium transition-colors duration-150 disabled:opacity-50"
            style={{ color: 'var(--color-amber)' }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--color-amber-dark)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--color-amber)')}
          >
            {completing ? 'Marking…' : 'Mark complete →'}
          </button>
        )}
      </td>
    </motion.tr>
  )
}

// ── AdminDashboardPage ───────────────────────────────────────────────────────

export function AdminDashboardPage() {
  const navigate = useNavigate()
  const prefersReducedMotion = useReducedMotion()
  const noAnim = prefersReducedMotion === true

  const [bookings, setBookings] = useState<AdminBooking[]>([])
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [dateFilter, setDateFilter] = useState('')
  const [completing, setCompleting] = useState<Set<number>>(new Set())
  const [completeError, setCompleteError] = useState<string | null>(null)

  // Fetch bookings — doubles as the auth guard (401 → redirect to login)
  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setFetchError(null)
    const url = dateFilter ? `/api/admin/bookings?date=${dateFilter}` : '/api/admin/bookings'
    api.get<AdminBooking[]>(url)
      .then(data => { if (!cancelled) setBookings(data) })
      .catch(err => {
        if (cancelled) return
        if (err instanceof ApiError && err.status === 401) {
          navigate('/admin/login', { replace: true })
        } else {
          setFetchError('Failed to load bookings. Please refresh.')
        }
      })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [dateFilter, navigate])

  async function handleComplete(id: number) {
    setCompleteError(null)
    setCompleting(prev => new Set(prev).add(id))
    // Optimistic update
    setBookings(prev => prev.map(b => b.id === id ? { ...b, status: 'Completed' as const } : b))
    try {
      await api.post<{ ok: boolean }>(`/api/admin/complete/${id}`, {})
    } catch {
      // Revert
      setBookings(prev => prev.map(b => b.id === id ? { ...b, status: 'Pending' as const } : b))
      setCompleteError('Failed to mark as complete. Please try again.')
    } finally {
      setCompleting(prev => {
        const next = new Set(prev)
        next.delete(id)
        return next
      })
    }
  }

  async function handleLogout() {
    try {
      await api.post<{ ok: boolean }>('/api/admin/logout', {})
    } catch {
      // proceed regardless
    }
    navigate('/admin/login', { replace: true })
  }

  const pendingCount = bookings.filter(b => b.status === 'Pending').length

  const TABLE_HEADERS = ['Client', 'Service', 'Date', 'Time', 'Phone', 'Email', 'Status', '']

  const emptyState = (
    <div className="py-20 text-center">
      <p
        className="font-display font-light mb-2"
        style={{ fontSize: '1.25rem', color: 'var(--color-ink-2)' }}
      >
        No bookings yet
      </p>
      <p className="text-[0.875rem]" style={{ color: 'var(--color-ink-3)' }}>
        {dateFilter ? 'No bookings match this date.' : 'New bookings will appear here.'}
      </p>
    </div>
  )

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--color-base)' }}>

      {/* ── Admin nav bar ── */}
      <header
        className="sticky top-0 z-40"
        style={{
          backgroundColor: 'var(--color-surface)',
          borderBottom: '1px solid var(--color-rule)',
        }}
      >
        <div className="mx-auto max-w-[1280px] px-6 md:px-10 h-[64px] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="font-display tracking-[0.04em] transition-opacity duration-150 hover:opacity-60"
              style={{ fontSize: '1rem', color: 'var(--color-amber)' }}
              aria-label="Solenne — return to homepage"
            >
              SOLENNE
            </Link>
            <span
              className="text-[0.625rem] font-medium tracking-[0.08em] uppercase px-2 py-0.5 rounded-[2px]"
              style={{ color: 'var(--color-ink-3)', backgroundColor: 'var(--color-rule)' }}
            >
              Admin
            </span>
          </div>

          <button
            onClick={() => void handleLogout()}
            className="text-[0.8125rem] transition-colors duration-150"
            style={{ color: 'var(--color-ink-2)' }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--color-ink)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--color-ink-2)')}
          >
            Sign out
          </button>
        </div>
      </header>

      {/* ── Main content ── */}
      <main id="main-content">
        <div className="mx-auto max-w-[1280px] px-6 md:px-10 py-10">

          {/* Page header */}
          <motion.div
            initial={noAnim ? false : { opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.42, ease: EASE }}
            className="mb-8"
          >
            <h1
              className="font-display font-light mb-1"
              style={{
                fontSize: 'clamp(1.75rem, 4vw, 2.5rem)',
                letterSpacing: '-0.02em',
                lineHeight: 1.15,
                color: 'var(--color-ink)',
              }}
            >
              Bookings
            </h1>
            {!loading && (
              <p className="text-[0.875rem]" style={{ color: 'var(--color-ink-2)' }}>
                {pendingCount > 0
                  ? `${pendingCount} pending appointment${pendingCount !== 1 ? 's' : ''}`
                  : 'No pending appointments'}
              </p>
            )}
          </motion.div>

          {/* Date filter */}
          <motion.div
            initial={noAnim ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.38, ease: EASE, delay: 0.08 }}
            className="flex flex-wrap items-end gap-5 mb-8"
          >
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="date-filter"
                className="text-[0.6875rem] font-medium tracking-[0.08em] uppercase"
                style={{ color: 'var(--color-ink-2)' }}
              >
                Filter by date
              </label>
              <input
                id="date-filter"
                type="date"
                value={dateFilter}
                onChange={e => setDateFilter(e.target.value)}
                className="bg-transparent text-[0.875rem] py-1.5 focus:outline-none transition-[border-color] duration-150"
                style={{
                  color: 'var(--color-ink)',
                  borderBottom: '1px solid var(--color-rule)',
                  borderTop: 'none',
                  borderLeft: 'none',
                  borderRight: 'none',
                  borderRadius: 0,
                  colorScheme: 'light',
                  minWidth: '160px',
                }}
                onFocus={e => (e.currentTarget.style.borderBottomColor = 'var(--color-amber)')}
                onBlur={e => (e.currentTarget.style.borderBottomColor = 'var(--color-rule)')}
              />
            </div>

            {dateFilter && (
              <button
                onClick={() => setDateFilter('')}
                className="text-[0.8125rem] transition-colors duration-150 mb-1.5"
                style={{ color: 'var(--color-ink-2)' }}
                onMouseEnter={e => (e.currentTarget.style.color = 'var(--color-ink)')}
                onMouseLeave={e => (e.currentTarget.style.color = 'var(--color-ink-2)')}
              >
                × Clear filter
              </button>
            )}
          </motion.div>

          {/* Error banners */}
          {fetchError && (
            <p role="alert" className="mb-6 text-[0.875rem] text-red-700">{fetchError}</p>
          )}
          {completeError && (
            <p role="alert" className="mb-4 text-[0.875rem] text-red-700">{completeError}</p>
          )}

          {/* ── Mobile: card list ── */}
          <div className="flex flex-col gap-3 md:hidden" aria-label="Bookings list">
            {loading
              ? Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)
              : bookings.length === 0
                ? emptyState
                : bookings.map((b, i) => (
                    <BookingCard
                      key={b.id}
                      booking={b}
                      completing={completing.has(b.id)}
                      onComplete={handleComplete}
                      index={i}
                      noAnim={noAnim}
                    />
                  ))
            }
          </div>

          {/* ── Desktop: table ── */}
          <div
            className="hidden md:block overflow-x-auto rounded-[2px]"
            style={{ border: '1px solid var(--color-rule)' }}
          >
            <table
              className="w-full"
              style={{ backgroundColor: 'var(--color-surface)', borderCollapse: 'collapse' }}
              aria-label="Bookings"
            >
              <thead>
                <tr style={{ borderBottom: '1px solid var(--color-rule)' }}>
                  {TABLE_HEADERS.map((col, i) => (
                    <th
                      key={i}
                      scope="col"
                      className="px-5 py-3 text-left text-[0.6875rem] font-medium tracking-[0.08em] uppercase whitespace-nowrap"
                      style={{ color: 'var(--color-ink-3)' }}
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading
                  ? Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} />)
                  : bookings.length === 0
                    ? (
                        <tr>
                          <td colSpan={8}>{emptyState}</td>
                        </tr>
                      )
                    : bookings.map((b, i) => (
                        <BookingRow
                          key={b.id}
                          booking={b}
                          completing={completing.has(b.id)}
                          onComplete={handleComplete}
                          index={i}
                          noAnim={noAnim}
                        />
                      ))
                }
              </tbody>
            </table>
          </div>

        </div>
      </main>
    </div>
  )
}
