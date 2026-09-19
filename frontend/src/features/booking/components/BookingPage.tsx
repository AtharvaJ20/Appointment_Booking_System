import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { api, ApiError } from '../../../shared/utils/api'
import type { Service, TimeSlot, BookingRequest, BookingResponse } from '../../../types/api'

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/
const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1]

const STEP_VARIANTS = {
  enter: (dir: number) => ({ x: dir * 48, opacity: 0 }),
  center: { x: 0, opacity: 1, transition: { duration: 0.38, ease: EASE } },
  exit: (dir: number) => ({ x: dir * -40, opacity: 0, transition: { duration: 0.22, ease: EASE } }),
}

function todayStr(): string {
  return new Date().toISOString().slice(0, 10)
}

function maxDateStr(): string {
  const d = new Date()
  d.setDate(d.getDate() + 29)
  return d.toISOString().slice(0, 10)
}

function formatDateShort(dateStr: string): string {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  })
}

interface FormFields {
  client_name: string
  client_email: string
  client_phone: string
}

interface FormErrors {
  client_name?: string
  client_email?: string
  client_phone?: string
}

// ── Shared field component ───────────────────────────────────────────────────

interface BookingFieldProps {
  id: string
  label: string
  type?: string
  value: string
  error?: string
  onChange: (v: string) => void
  autoComplete?: string
}

function BookingField({ id, label, type = 'text', value, error, onChange, autoComplete }: BookingFieldProps) {
  const [focused, setFocused] = useState(false)

  const borderColor = error
    ? '#dc2626'
    : focused
      ? 'var(--color-amber)'
      : 'var(--color-rule)'

  return (
    <div>
      <label
        htmlFor={id}
        className="block text-[0.6875rem] font-medium tracking-[0.08em] uppercase mb-2"
        style={{ color: 'var(--color-ink-2)' }}
      >
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        autoComplete={autoComplete}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : undefined}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        className="w-full bg-transparent text-[0.9375rem] py-2 focus:outline-none transition-[border-color] duration-150"
        style={{
          color: 'var(--color-ink)',
          borderBottom: `1px solid ${borderColor}`,
          borderTop: 'none',
          borderLeft: 'none',
          borderRight: 'none',
          borderRadius: 0,
        }}
      />
      {error && (
        <p id={`${id}-error`} role="alert" className="mt-1.5 text-[0.8125rem] text-red-700">
          {error}
        </p>
      )}
    </div>
  )
}

// ── Step 0: Service + Date ───────────────────────────────────────────────────

interface Step0Props {
  services: Service[]
  servicesLoading: boolean
  selectedServiceId: number | null
  onSelectService: (id: number) => void
  selectedDate: string
  onSelectDate: (d: string) => void
  onNext: () => void
  today: string
  maxDate: string
}

function Step0({ services, servicesLoading, selectedServiceId, onSelectService, selectedDate, onSelectDate, onNext, today, maxDate }: Step0Props) {
  const canProceed = selectedServiceId !== null && selectedDate !== ''

  return (
    <div>
      <h1
        className="font-display font-light mb-2"
        style={{ fontSize: '2rem', letterSpacing: '-0.02em', lineHeight: 1.2, color: 'var(--color-ink)' }}
      >
        Book an Appointment
      </h1>
      <p className="text-[0.875rem] font-light mb-10" style={{ lineHeight: 1.6, color: 'var(--color-ink-2)' }}>
        Select a service and date to see available times.
      </p>

      <div className="flex flex-col gap-8">
        <div>
          <label
            htmlFor="service-select"
            className="block text-[0.6875rem] font-medium tracking-[0.08em] uppercase mb-3"
            style={{ color: 'var(--color-ink-2)' }}
          >
            Service
          </label>
          {servicesLoading ? (
            <div className="h-10 rounded animate-pulse" style={{ backgroundColor: 'var(--color-rule)' }} />
          ) : (
            <select
              id="service-select"
              value={selectedServiceId ?? ''}
              onChange={e => onSelectService(Number(e.target.value))}
              className="w-full bg-transparent text-[0.9375rem] py-2 focus:outline-none transition-[border-color] duration-150 cursor-pointer"
              style={{
                color: 'var(--color-ink)',
                borderBottom: '1px solid var(--color-rule)',
                borderTop: 'none',
                borderLeft: 'none',
                borderRight: 'none',
                borderRadius: 0,
                appearance: 'none',
              }}
            >
              {services.map(s => (
                <option key={s.id} value={s.id}>
                  {s.name} · {s.duration_minutes} min · ₹{s.price.toLocaleString('en-IN')}
                </option>
              ))}
            </select>
          )}
        </div>

        <div>
          <label
            htmlFor="date-picker"
            className="block text-[0.6875rem] font-medium tracking-[0.08em] uppercase mb-3"
            style={{ color: 'var(--color-ink-2)' }}
          >
            Date
          </label>
          <input
            id="date-picker"
            type="date"
            value={selectedDate}
            min={today}
            max={maxDate}
            onChange={e => onSelectDate(e.target.value)}
            className="w-full bg-transparent text-[0.9375rem] py-2 focus:outline-none transition-[border-color] duration-150"
            style={{
              color: 'var(--color-ink)',
              borderBottom: '1px solid var(--color-rule)',
              borderTop: 'none',
              borderLeft: 'none',
              borderRight: 'none',
              borderRadius: 0,
              colorScheme: 'light',
            }}
          />
        </div>

        <button
          onClick={onNext}
          disabled={!canProceed}
          className="mt-2 rounded-[2px] text-[0.875rem] font-medium tracking-[0.025em] px-8 py-[14px] transition-colors duration-[180ms] self-start disabled:cursor-not-allowed disabled:opacity-40"
          style={{ backgroundColor: 'var(--color-amber)', color: 'var(--color-surface)' }}
          onMouseEnter={e => { if (canProceed) (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'var(--color-amber-dark)' }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'var(--color-amber)' }}
        >
          See Available Times →
        </button>
      </div>
    </div>
  )
}

// ── Step 1: Slot selection ───────────────────────────────────────────────────

interface Step1Props {
  service: Service | null
  date: string
  slots: TimeSlot[]
  loading: boolean
  error: string | null
  selectedSlot: TimeSlot | null
  onSelectSlot: (slot: TimeSlot) => void
  onBack: () => void
}

function BackButton({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1.5 text-[0.8125rem] transition-colors duration-150 mb-6 -ml-0.5"
      style={{ color: 'var(--color-ink-2)' }}
      onMouseEnter={e => (e.currentTarget.style.color = 'var(--color-ink)')}
      onMouseLeave={e => (e.currentTarget.style.color = 'var(--color-ink-2)')}
    >
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
        <path d="M10 3L5 8l5 5" />
      </svg>
      {children}
    </button>
  )
}

function Step1({ service, date, slots, loading, error, selectedSlot, onSelectSlot, onBack }: Step1Props) {
  return (
    <div>
      <BackButton onClick={onBack}>
        {service?.name} · {formatDateShort(date)}
      </BackButton>

      <h1
        className="font-display font-light mb-2"
        style={{ fontSize: '2rem', letterSpacing: '-0.02em', lineHeight: 1.2, color: 'var(--color-ink)' }}
      >
        Choose a time
      </h1>
      <p className="text-[0.875rem] font-light mb-8" style={{ lineHeight: 1.6, color: 'var(--color-ink-2)' }}>
        {formatDateShort(date)} · {service?.duration_minutes} min
      </p>

      {loading && (
        <div className="grid grid-cols-3 gap-3" aria-label="Loading available times" aria-busy="true">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="h-11 rounded-[2px] animate-pulse" style={{ backgroundColor: 'var(--color-rule)' }} />
          ))}
        </div>
      )}

      {!loading && error && (
        <p className="text-[0.875rem] text-red-700">{error}</p>
      )}

      {!loading && !error && slots.length === 0 && (
        <div className="py-8 text-center">
          <p className="text-[0.875rem] mb-4" style={{ color: 'var(--color-ink-2)' }}>
            No times available for this date.
          </p>
          <button
            onClick={onBack}
            className="text-[0.875rem] font-medium transition-colors duration-150"
            style={{ color: 'var(--color-amber)' }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--color-amber-dark)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--color-amber)')}
          >
            ← Choose another date
          </button>
        </div>
      )}

      {!loading && !error && slots.length > 0 && (
        <div
          className="grid grid-cols-3 gap-3"
          role="listbox"
          aria-label="Available time slots"
        >
          {slots.map(slot => {
            const isSelected = selectedSlot?.id === slot.id
            return (
              <button
                key={slot.id}
                role="option"
                aria-selected={isSelected}
                onClick={() => onSelectSlot(slot)}
                className="py-2.5 px-2 text-center text-[0.8125rem] font-medium rounded-[2px] border transition-colors duration-150"
                style={{
                  borderColor: isSelected ? 'var(--color-amber)' : 'var(--color-rule)',
                  backgroundColor: isSelected ? 'var(--color-amber)' : 'transparent',
                  color: isSelected ? 'var(--color-surface)' : 'var(--color-ink)',
                }}
              >
                {slot.start_time}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ── Step 2: Contact details ──────────────────────────────────────────────────

interface Step2Props {
  service: Service | null
  date: string
  slot: TimeSlot | null
  form: FormFields
  errors: FormErrors
  submitting: boolean
  submitError: string | null
  onChangeField: (field: keyof FormFields, value: string) => void
  onBack: () => void
  onSubmit: (e: React.FormEvent) => void
}

function Step2({ service, date, slot, form, errors, submitting, submitError, onChangeField, onBack, onSubmit }: Step2Props) {
  return (
    <div>
      <BackButton onClick={onBack}>
        {formatDateShort(date)} · {slot?.start_time}–{slot?.end_time}
      </BackButton>

      <h1
        className="font-display font-light mb-2"
        style={{ fontSize: '2rem', letterSpacing: '-0.02em', lineHeight: 1.2, color: 'var(--color-ink)' }}
      >
        Your details
      </h1>
      <p className="text-[0.875rem] font-light mb-8" style={{ lineHeight: 1.6, color: 'var(--color-ink-2)' }}>
        {service?.name} · {formatDateShort(date)} · {slot?.start_time}
      </p>

      <form onSubmit={onSubmit} noValidate>
        <fieldset className="flex flex-col gap-7 border-0 p-0 m-0">
          <legend className="sr-only">Contact information</legend>
          <BookingField
            id="client-name"
            label="Full name"
            value={form.client_name}
            error={errors.client_name}
            onChange={v => onChangeField('client_name', v)}
            autoComplete="name"
          />
          <BookingField
            id="client-email"
            label="Email address"
            type="email"
            value={form.client_email}
            error={errors.client_email}
            onChange={v => onChangeField('client_email', v)}
            autoComplete="email"
          />
          <BookingField
            id="client-phone"
            label="Phone number"
            type="tel"
            value={form.client_phone}
            error={errors.client_phone}
            onChange={v => onChangeField('client_phone', v)}
            autoComplete="tel"
          />
        </fieldset>

        {submitError && (
          <p role="alert" className="mt-6 text-[0.875rem] text-red-700">
            {submitError}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="mt-8 rounded-[2px] text-[0.875rem] font-medium tracking-[0.025em] px-8 py-[14px] w-full transition-colors duration-[180ms] disabled:cursor-wait disabled:opacity-60"
          style={{ backgroundColor: 'var(--color-amber)', color: 'var(--color-surface)' }}
          onMouseEnter={e => { if (!submitting) (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'var(--color-amber-dark)' }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'var(--color-amber)' }}
        >
          {submitting ? 'Confirming…' : 'Confirm Booking'}
        </button>
      </form>
    </div>
  )
}

// ── BookingPage ──────────────────────────────────────────────────────────────

const STEP_LABELS = ['Service & date', 'Choose a time', 'Your details']

export function BookingPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const prefersReducedMotion = useReducedMotion()
  const noAnim = prefersReducedMotion === true

  const [step, setStep] = useState(0)
  const [direction, setDirection] = useState(1)

  // Step 0
  const [services, setServices] = useState<Service[]>([])
  const [servicesLoading, setServicesLoading] = useState(true)
  const [selectedServiceId, setSelectedServiceId] = useState<number | null>(null)
  const [selectedDate, setSelectedDate] = useState(todayStr())

  // Step 1
  const [slots, setSlots] = useState<TimeSlot[]>([])
  const [slotsLoading, setSlotsLoading] = useState(false)
  const [slotsError, setSlotsError] = useState<string | null>(null)
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null)

  // Step 2
  const [form, setForm] = useState<FormFields>({ client_name: '', client_email: '', client_phone: '' })
  const [formErrors, setFormErrors] = useState<FormErrors>({})
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  // Fetch services on mount; honour ?service_id= param
  useEffect(() => {
    let cancelled = false
    api.get<Service[]>('/api/services')
      .then(data => {
        if (cancelled) return
        setServices(data)
        const urlId = Number(searchParams.get('service_id'))
        if (urlId && data.some(s => s.id === urlId)) {
          setSelectedServiceId(urlId)
        } else if (data.length > 0) {
          setSelectedServiceId(data[0]!.id)
        }
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setServicesLoading(false) })
    return () => { cancelled = true }
  }, [searchParams])

  // Pre-fetch slots whenever service + date are both known
  useEffect(() => {
    if (!selectedServiceId || !selectedDate) return
    let cancelled = false
    setSlotsLoading(true)
    setSlotsError(null)
    setSelectedSlot(null)
    api.get<TimeSlot[]>(`/api/slots?service_id=${selectedServiceId}&date=${selectedDate}`)
      .then(data => { if (!cancelled) setSlots(data) })
      .catch(err => {
        if (!cancelled) {
          setSlotsError(err instanceof ApiError ? err.message : 'Failed to load slots')
          setSlots([])
        }
      })
      .finally(() => { if (!cancelled) setSlotsLoading(false) })
    return () => { cancelled = true }
  }, [selectedServiceId, selectedDate])

  function advance() { setDirection(1); setStep(s => s + 1) }
  function retreat() { setDirection(-1); setStep(s => s - 1) }

  function validateForm(): boolean {
    const errors: FormErrors = {}
    if (!form.client_name.trim()) errors.client_name = 'Name is required'
    if (!form.client_email.trim()) {
      errors.client_email = 'Email is required'
    } else if (!EMAIL_RE.test(form.client_email.trim())) {
      errors.client_email = 'Enter a valid email address'
    }
    if (!form.client_phone.trim()) errors.client_phone = 'Phone number is required'
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validateForm() || !selectedServiceId || !selectedSlot) return
    setSubmitting(true)
    setSubmitError(null)
    try {
      const body: BookingRequest = {
        service_id: selectedServiceId,
        slot_id: selectedSlot.id,
        client_name: form.client_name.trim(),
        client_email: form.client_email.trim().toLowerCase(),
        client_phone: form.client_phone.trim(),
      }
      const { access_token } = await api.post<BookingResponse>('/api/book', body)
      navigate(`/confirm/${access_token}`)
    } catch (err) {
      setSubmitError(err instanceof ApiError ? err.message : 'Booking failed. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const selectedService = services.find(s => s.id === selectedServiceId) ?? null

  const animProps = noAnim
    ? {}
    : {
        custom: direction,
        variants: STEP_VARIANTS,
        initial: 'enter' as const,
        animate: 'center' as const,
        exit: 'exit' as const,
      }

  return (
    <main id="main-content" style={{ backgroundColor: 'var(--color-base)', paddingTop: '72px', minHeight: '100vh' }}>
      <section className="py-[80px] px-6 md:px-12 lg:px-20">
        <div className="mx-auto" style={{ maxWidth: '480px' }}>

          {/* Step progress bar */}
          <div
            className="flex gap-1.5 mb-10"
            role="progressbar"
            aria-valuemin={1}
            aria-valuemax={3}
            aria-valuenow={step + 1}
            aria-label={`Step ${step + 1} of 3: ${STEP_LABELS[step]}`}
          >
            {STEP_LABELS.map((label, i) => (
              <div
                key={label}
                aria-hidden="true"
                className="h-[2px] flex-1 transition-colors duration-300"
                style={{
                  backgroundColor: i <= step ? 'var(--color-amber)' : 'var(--color-rule)',
                  borderRadius: '1px',
                }}
              />
            ))}
          </div>

          <AnimatePresence custom={direction} mode="wait">
            <motion.div key={step} {...animProps}>
              {step === 0 && (
                <Step0
                  services={services}
                  servicesLoading={servicesLoading}
                  selectedServiceId={selectedServiceId}
                  onSelectService={setSelectedServiceId}
                  selectedDate={selectedDate}
                  onSelectDate={setSelectedDate}
                  onNext={advance}
                  today={todayStr()}
                  maxDate={maxDateStr()}
                />
              )}
              {step === 1 && (
                <Step1
                  service={selectedService}
                  date={selectedDate}
                  slots={slots}
                  loading={slotsLoading}
                  error={slotsError}
                  selectedSlot={selectedSlot}
                  onSelectSlot={slot => { setSelectedSlot(slot); advance() }}
                  onBack={retreat}
                />
              )}
              {step === 2 && (
                <Step2
                  service={selectedService}
                  date={selectedDate}
                  slot={selectedSlot}
                  form={form}
                  errors={formErrors}
                  submitting={submitting}
                  submitError={submitError}
                  onChangeField={(field, value) => {
                    setForm(f => ({ ...f, [field]: value }))
                    if (formErrors[field]) setFormErrors(fe => ({ ...fe, [field]: undefined }))
                  }}
                  onBack={retreat}
                  onSubmit={handleSubmit}
                />
              )}
            </motion.div>
          </AnimatePresence>

        </div>
      </section>
    </main>
  )
}
