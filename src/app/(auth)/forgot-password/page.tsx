'use client'

import { useState } from 'react'
import Link from 'next/link'
import Button from '@/components/Button'
import styles from './forgotPassword.module.css'

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [email, setEmail] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      if (!email) {
        throw new Error('Please enter your email address')
      }

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        throw new Error('Please enter a valid email')
      }

      // Call forgot-password API
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Something went wrong. Please try again.')
      }
      
      setSuccess(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  if (success) {
    return (
      <div className={styles.container}>
        <div className={styles.successCard}>
          <div className={styles.successIcon}>✓</div>
          <h2 className={styles.successTitle}>Email Sent</h2>
          <p className={styles.successText}>
            We've sent a password reset link to <strong>{email}</strong>. Check your email and click the link to reset your password.
          </p>
          <p className={styles.successSubtext}>
            Didn't receive it? Check your spam folder or{' '}
            <button
              onClick={() => {
                setSuccess(false)
                setEmail('')
              }}
              className={styles.retryButton}
            >
              try again
            </button>
          </p>
          <Link href="/login" className={styles.backLink}>
            <Button variant="secondary" fullWidth>
              Back to Sign In
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Reset Password</h1>
        <p className={styles.subtitle}>
          Enter your email address and we'll send you a link to reset your password
        </p>
      </div>

      <form onSubmit={handleSubmit} className={styles.form}>
        {error && <div className={styles.error}>{error}</div>}

        <div className={styles.formGroup}>
          <label htmlFor="email" className={styles.label}>
            Email Address
          </label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value)
              setError(null)
            }}
            placeholder="student@university.edu"
            className={styles.input}
            disabled={isLoading}
          />
        </div>

        <Button
          type="submit"
          disabled={isLoading}
          className={styles.submitButton}
        >
          {isLoading ? 'Sending...' : 'Send Reset Link'}
        </Button>
      </form>

      <div className={styles.footer}>
        <p className={styles.footerText}>
          Remember your password?{' '}
          <Link href="/login" className={styles.link}>
            Sign in here
          </Link>
        </p>
      </div>
    </div>
  )
}
