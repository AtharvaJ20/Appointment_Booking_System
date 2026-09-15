import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
import { api, ApiError } from '../../../shared/utils/api'

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1]

// ── AdminField ───────────────────────────────────────────────────────────────

interface AdminFieldProps {
  id: string
  label: string
  type?: string
  value: string
  error?: string
  onChange: (v: string) => void
  autoComplete?: string
}

function AdminField({ id, label, type = 'text', value, error, onChange, autoComplete }: AdminFieldProps) {
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
        autoComplete={autoComplete}
        onChange={e => onChange(e.target.value)}
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

// ── AdminLoginPage ───────────────────────────────────────────────────────────

export function AdminLoginPage() {
  const navigate = useNavigate()
  const prefersReducedMotion = useReducedMotion()
  const noAnim = prefersReducedMotion === true

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [emailError, setEmailError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [loginError, setLoginError] = useState('')

  function validate(): boolean {
    if (!email.trim()) {
      setEmailError('Email is required')
      return false
    }
    setEmailError('')
    return true
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return
    setSubmitting(true)
    setLoginError('')
    try {
      await api.post<{ ok: boolean }>('/api/admin/login', {
        email: email.trim(),
        password,
      })
      navigate('/admin', { replace: true })
    } catch (err) {
      setLoginError(
        err instanceof ApiError && err.status === 401
          ? 'Invalid credentials. Please try again.'
          : 'Login failed. Please try again.',
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main
      id="main-content"
      className="min-h-screen flex flex-col items-center justify-center px-6 py-12"
      style={{ backgroundColor: 'var(--color-base)' }}
    >
      <motion.div
        initial={noAnim ? false : { opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.48, ease: EASE }}
        className="w-full"
        style={{ maxWidth: '400px' }}
      >
        {/* Wordmark */}
        <Link
          to="/"
          className="block text-center font-display tracking-[0.06em] mb-10 transition-opacity duration-150 hover:opacity-60"
          style={{ fontSize: '1.0625rem', color: 'var(--color-amber-dark)' }}
          aria-label="Solenne — return to homepage"
        >
          SOLENNE
        </Link>

        {/* Heading */}
        <h1
          className="font-display font-light text-center mb-2"
          style={{
            fontSize: 'clamp(1.75rem, 5vw, 2.25rem)',
            letterSpacing: '-0.02em',
            lineHeight: 1.15,
            color: 'var(--color-ink)',
          }}
        >
          Admin Portal
        </h1>
        <p
          className="text-center text-[0.875rem] font-light mb-10"
          style={{ color: 'var(--color-ink-2)', lineHeight: 1.65 }}
        >
          Sign in to manage bookings.
        </p>

        {/* Form */}
        <form onSubmit={handleSubmit} noValidate>
          <fieldset className="flex flex-col gap-7 border-0 p-0 m-0">
            <legend className="sr-only">Admin credentials</legend>
            <AdminField
              id="admin-email"
              label="Email address"
              type="email"
              value={email}
              error={emailError}
              onChange={v => { setEmail(v); if (emailError) setEmailError('') }}
              autoComplete="email"
            />
            <AdminField
              id="admin-password"
              label="Password"
              type="password"
              value={password}
              onChange={setPassword}
              autoComplete="current-password"
            />
          </fieldset>

          {loginError && (
            <p role="alert" className="mt-6 text-[0.8125rem] text-red-700">
              {loginError}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="mt-8 w-full rounded-[2px] text-[0.875rem] font-medium tracking-[0.025em] px-8 py-[14px] transition-colors duration-[180ms] disabled:cursor-wait disabled:opacity-60"
            style={{ backgroundColor: 'var(--color-amber)', color: 'var(--color-surface)' }}
            onMouseEnter={e => {
              if (!submitting) (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'var(--color-amber-dark)'
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'var(--color-amber)'
            }}
          >
            {submitting ? 'Signing in…' : 'Sign in →'}
          </button>
        </form>
      </motion.div>
    </main>
  )
}
