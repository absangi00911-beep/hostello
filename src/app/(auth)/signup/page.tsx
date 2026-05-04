'use client'

import { useState } from 'react'
import Link from 'next/link'
import Button from '@/components/Button'
import styles from './signup.module.css'

type SignupRole = 'STUDENT' | 'OWNER'

const roleOptions = [
  {
    mark: '👨‍🎓',
    label: 'Student',
    description: 'Book hostels, write reviews, manage bookings',
  },
  {
    mark: '🏠',
    label: 'Owner',
    description: 'List hostels, manage bookings, respond to reviews',
  },
]

const roleCopy: Record<SignupRole, {
  subtitle: string
  cta: string
  successBody: string
  nextSteps: string[]
}> = {
  STUDENT: {
    subtitle: 'Find and book your perfect hostel in seconds.',
    cta: 'Create Student Account',
    successBody: 'Your student account is ready. Start exploring verified hostels now.',
    nextSteps: [
      'Browse verified hostel listings',
      'Compare prices and read reviews',
      'Book your stay directly',
    ],
  },
  OWNER: {
    subtitle: 'List your hostel and start accepting bookings.',
    cta: 'Create Owner Account',
    successBody: 'Your owner account is ready. Set up your hostel listing next.',
    nextSteps: [
      'Verify your hostel details',
      'Add photos and set your pricing',
      'Start accepting bookings',
    ],
  },
}

export default function SignupPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [selectedRole, setSelectedRole] = useState<SignupRole>('STUDENT')
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    setError(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      // Validate form
      if (!formData.name || !formData.email || !formData.password || !formData.phone) {
        throw new Error('Please fill in all required fields')
      }

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        throw new Error('Please enter a valid email')
      }

      if (formData.password.length < 8) {
        throw new Error('Password must be at least 8 characters')
      }

      if (formData.password !== formData.confirmPassword) {
        throw new Error('Passwords do not match')
      }

      if (!/^[\d\s\-\+\(\)]{10,}$/.test(formData.phone.replace(/\s/g, ''))) {
        throw new Error('Enter a valid Pakistani phone number.')
      }

      // Call signup API
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          phone: formData.phone,
          role: selectedRole,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Signup failed. Please try again.')
      }

      setSuccess(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Signup failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  if (success) {
    return (
      <div className={styles.container}>
        <div className={styles.successCard}>
          <div className={styles.successIcon}>✓</div>
          <h2 className={styles.successTitle}>Account Created!</h2>
          <p className={styles.successText}>
            {roleCopy[selectedRole].successBody}
          </p>
          <div className={styles.nextStepsPanel}>
            <h3 className={styles.nextStepsTitle}>What happens next</h3>
            <ol className={styles.nextSteps}>
              {roleCopy[selectedRole].nextSteps.map((step, i) => (
                <li key={i} className={styles.nextStep}>
                  <span className={styles.nextStepNumber}>{i + 1}</span>
                  {step}
                </li>
              ))}
            </ol>
          </div>
          <Link href="/login">
            <Button fullWidth>
              Go to Sign In
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Create Account</h1>
        <p className={styles.subtitle}>{roleCopy[selectedRole].subtitle}</p>
      </div>

      <div className={styles.roleSection}>
        <div className={styles.roleHeader}>
          <span className={styles.roleTitle}>I am a...</span>
          <span className={styles.roleHint}>Select to get started</span>
        </div>
        <div className={styles.roleGrid}>
          {roleOptions.map(role => (
            <button
              key={role.label}
              type="button"
              className={`${styles.roleOption} ${selectedRole === (role.label === 'Student' ? 'STUDENT' : 'OWNER') ? styles.roleOptionSelected : ''}`}
              onClick={() => setSelectedRole(role.label === 'Student' ? 'STUDENT' : 'OWNER')}
              disabled={isLoading}
            >
              <span className={styles.roleMark}>{role.mark}</span>
              <div className={styles.roleText}>
                <span className={styles.roleLabel}>{role.label}</span>
                <span className={styles.roleDescription}>{role.description}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit} className={styles.form}>
        {error && <div className={styles.error}>{error}</div>}

        <div className={styles.formGroup}>
          <label htmlFor="name" className={styles.label}>
            Full Name *
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="John Doe"
            className={styles.input}
            disabled={isLoading}
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="email" className={styles.label}>
            Email Address *
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="student@university.edu"
            className={styles.input}
            disabled={isLoading}
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="phone" className={styles.label}>
            Phone Number *
          </label>
          <input
            type="tel"
            id="phone"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            placeholder="+92 300 1234567"
            className={styles.input}
            disabled={isLoading}
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="password" className={styles.label}>
            Password * (min 8 characters)
          </label>
          <input
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="••••••••"
            className={styles.input}
            disabled={isLoading}
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="confirmPassword" className={styles.label}>
            Confirm Password *
          </label>
          <input
            type="password"
            id="confirmPassword"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            placeholder="••••••••"
            className={styles.input}
            disabled={isLoading}
          />
        </div>

        <div className={styles.nextStepsPanel}>
          <h3 className={styles.nextStepsTitle}>What happens next</h3>
          <ol className={styles.nextSteps}>
            {roleCopy[selectedRole].nextSteps.map((step, i) => (
              <li key={i} className={styles.nextStep}>
                <span className={styles.nextStepNumber}>{i + 1}</span>
                {step}
              </li>
            ))}
          </ol>
        </div>

        <div className={styles.terms}>
          <p>
            By signing up, you agree to our{' '}
            <Link href="/terms" className={styles.link}>
              Terms of Service
            </Link>
            {' '}and{' '}
            <Link href="/privacy" className={styles.link}>
              Privacy Policy
            </Link>
          </p>
        </div>

        <Button
          type="submit"
          disabled={isLoading}
          className={styles.submitButton}
        >
          {isLoading ? 'Creating Account...' : roleCopy[selectedRole].cta}
        </Button>
      </form>

      <div className={styles.divider}>
        <span>Already have an account?</span>
      </div>

      <Link href="/login" className={styles.loginLink}>
        <Button variant="secondary" fullWidth>
          Sign In
        </Button>
      </Link>
    </div>
  )
}
