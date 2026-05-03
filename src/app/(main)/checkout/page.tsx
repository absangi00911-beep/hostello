'use client'

import { useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Button from '@/components/Button'
import styles from './checkout.module.css'

// Mock hostel data (same as detail page)
const HOSTELS: Record<string, any> = {
  '1': {
    id: 1,
    name: 'Green Haven Hostel',
    location: 'Lahore',
    price: 2500,
    image: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=400&h=300&fit=crop',
  },
  '6': {
    id: 6,
    name: 'Premium Stay Lahore',
    location: 'Lahore',
    price: 4500,
    image: 'https://images.unsplash.com/photo-1611339555312-e607c90352fd?w=400&h=300&fit=crop',
  },
}

const PAYMENT_METHODS = [
  {
    id: 'jazzcash',
    name: 'JazzCash',
    icon: '💳',
    description: 'Pay using JazzCash mobile wallet',
  },
  {
    id: 'easypaisa',
    name: 'EasyPaisa',
    icon: '📱',
    description: 'Pay using EasyPaisa app or store',
  },
  {
    id: 'safepay',
    name: 'SafePay',
    icon: '🏦',
    description: 'Pay using credit/debit card',
  },
  {
    id: 'bank',
    name: 'Bank Transfer',
    icon: '🏛️',
    description: 'Direct bank transfer',
  },
]

function CheckoutContent() {
  const searchParams = useSearchParams()
  const hostelId = searchParams.get('hostelId')
  const checkIn = searchParams.get('checkIn')
  const checkOut = searchParams.get('checkOut')
  const guests = searchParams.get('guests') || '1'

  const hostel = hostelId ? HOSTELS[hostelId] : null

  const formatDate = (dateString: string) => {
    const date = new Date(dateString + 'T00:00:00Z')
    return date.toLocaleDateString('en-GB')
  }

  const [currentStep, setCurrentStep] = useState(1)
  const [guestDetails, setGuestDetails] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    specialRequests: '',
  })
  const [selectedPayment, setSelectedPayment] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)

  if (!hostel || !checkIn || !checkOut) {
    return (
      <div className={styles.container}>
        <div className={styles.errorState}>
          <h1>Invalid Booking</h1>
          <p>Please select a hostel and dates first.</p>
          <Button onClick={() => window.location.href = '/'}>Back to Home</Button>
        </div>
      </div>
    )
  }

  // Calculate nights
  const checkInDate = new Date(checkIn)
  const checkOutDate = new Date(checkOut)
  const nights = Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24))
  const totalPrice = nights * hostel.price

  const handleGuestDetailsChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setGuestDetails((prev) => ({ ...prev, [name]: value }))
  }

  const handleNextStep = () => {
    if (currentStep === 2) {
      // Validate guest details
      if (!guestDetails.firstName.trim() || !guestDetails.email.trim() || !guestDetails.phone.trim()) {
        alert('Please fill in all required fields')
        return
      }
    }
    if (currentStep === 3) {
      if (!selectedPayment) {
        alert('Please select a payment method')
        return
      }
    }
    setCurrentStep((prev) => Math.min(prev + 1, 4))
  }

  const handlePrevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1))
  }

  const handleConfirmBooking = async () => {
    setIsProcessing(true)
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500))
      alert(
        `Booking confirmed!\n\nHostel: ${hostel.name}\nCheck-in: ${checkIn}\nCheck-out: ${checkOut}\nGuests: ${guests}\nTotal: PKR ${totalPrice.toLocaleString()}\nPayment: ${PAYMENT_METHODS.find((m) => m.id === selectedPayment)?.name}`
      )
      window.location.href = '/'
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <div className={styles.mainGrid}>
          {/* Left Column - Booking Steps */}
          <div className={styles.steps}>
            {/* Step Indicator */}
            <div className={styles.stepIndicator}>
              {[1, 2, 3, 4].map((step) => (
                <div key={step} className={styles.stepDot}>
                  <div
                    className={`${styles.dot} ${
                      step < currentStep
                        ? styles.completed
                        : step === currentStep
                          ? styles.active
                          : styles.inactive
                    }`}
                  >
                    {step < currentStep ? '✓' : step}
                  </div>
                  <span className={styles.label}>
                    {step === 1 ? 'Review' : step === 2 ? 'Details' : step === 3 ? 'Payment' : 'Confirm'}
                  </span>
                </div>
              ))}
            </div>

            {/* Step 1: Review Booking */}
            {currentStep === 1 && (
              <div className={styles.step}>
                <h2 className={styles.stepTitle}>Review Your Booking</h2>

                <div className={styles.bookingDetails}>
                  <div className={styles.detailItem}>
                    <span className={styles.label}>Check In</span>
                    <span className={styles.value}>{formatDate(checkIn)}</span>
                  </div>
                  <div className={styles.detailItem}>
                    <span className={styles.label}>Check Out</span>
                    <span className={styles.value}>{formatDate(checkOut)}</span>
                  </div>
                  <div className={styles.detailItem}>
                    <span className={styles.label}>Guests</span>
                    <span className={styles.value}>{guests} {guests === '1' ? 'guest' : 'guests'}</span>
                  </div>
                  <div className={styles.detailItem}>
                    <span className={styles.label}>Number of Nights</span>
                    <span className={styles.value}>{nights} {nights === 1 ? 'night' : 'nights'}</span>
                  </div>
                </div>

                <div className={styles.buttonGroup}>
                  <Button onClick={() => window.location.href = `/hostels/${hostelId}`} variant="secondary">
                    Go Back
                  </Button>
                  <Button onClick={handleNextStep}>Continue</Button>
                </div>
              </div>
            )}

            {/* Step 2: Guest Details */}
            {currentStep === 2 && (
              <div className={styles.step}>
                <h2 className={styles.stepTitle}>Your Details</h2>

                <form className={styles.form}>
                  <div className={styles.formRow}>
                    <div className={styles.formGroup}>
                      <label htmlFor="firstName">First Name *</label>
                      <input
                        id="firstName"
                        type="text"
                        name="firstName"
                        value={guestDetails.firstName}
                        onChange={handleGuestDetailsChange}
                        className={styles.input}
                        placeholder="John"
                        required
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label htmlFor="lastName">Last Name</label>
                      <input
                        id="lastName"
                        type="text"
                        name="lastName"
                        value={guestDetails.lastName}
                        onChange={handleGuestDetailsChange}
                        className={styles.input}
                        placeholder="Doe"
                      />
                    </div>
                  </div>

                  <div className={styles.formGroup}>
                    <label htmlFor="email">Email Address *</label>
                    <input
                      id="email"
                      type="email"
                      name="email"
                      value={guestDetails.email}
                      onChange={handleGuestDetailsChange}
                      className={styles.input}
                      placeholder="john@example.com"
                      required
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label htmlFor="phone">Phone Number *</label>
                    <input
                      id="phone"
                      type="tel"
                      name="phone"
                      value={guestDetails.phone}
                      onChange={handleGuestDetailsChange}
                      className={styles.input}
                      placeholder="+923001234567"
                      required
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label htmlFor="specialRequests">Special Requests</label>
                    <textarea
                      id="specialRequests"
                      name="specialRequests"
                      value={guestDetails.specialRequests}
                      onChange={handleGuestDetailsChange}
                      className={styles.textarea}
                      placeholder="Any special requirements? (optional)"
                      rows={3}
                    />
                  </div>
                </form>

                <div className={styles.buttonGroup}>
                  <Button onClick={handlePrevStep} variant="secondary">
                    Back
                  </Button>
                  <Button onClick={handleNextStep}>Continue</Button>
                </div>
              </div>
            )}

            {/* Step 3: Payment Method */}
            {currentStep === 3 && (
              <div className={styles.step}>
                <h2 className={styles.stepTitle}>Choose Payment Method</h2>

                <div className={styles.paymentMethods}>
                  {PAYMENT_METHODS.map((method) => (
                    <button
                      key={method.id}
                      className={`${styles.paymentCard} ${selectedPayment === method.id ? styles.selected : ''}`}
                      onClick={() => setSelectedPayment(method.id)}
                    >
                      <div className={styles.paymentIcon}>{method.icon}</div>
                      <div className={styles.paymentInfo}>
                        <div className={styles.paymentName}>{method.name}</div>
                        <div className={styles.paymentDesc}>{method.description}</div>
                      </div>
                      <div className={styles.radioButton}>
                        {selectedPayment === method.id && <div className={styles.radioInner} />}
                      </div>
                    </button>
                  ))}
                </div>

                <div className={styles.buttonGroup}>
                  <Button onClick={handlePrevStep} variant="secondary">
                    Back
                  </Button>
                  <Button onClick={handleNextStep}>Continue</Button>
                </div>
              </div>
            )}

            {/* Step 4: Confirmation */}
            {currentStep === 4 && (
              <div className={styles.step}>
                <h2 className={styles.stepTitle}>Confirm Your Booking</h2>

                <div className={styles.confirmationDetails}>
                  <section className={styles.section}>
                    <h3>Hostel</h3>
                    <p className={styles.hostelName}>{hostel.name}</p>
                    <p className={styles.hostelLocation}>📍 {hostel.location}</p>
                  </section>

                  <section className={styles.section}>
                    <h3>Dates</h3>
                    <div className={styles.dateConfirm}>
                      <span>{formatDate(checkIn)}</span>
                      <span> → </span>
                      <span>{formatDate(checkOut)}</span>
                    </div>
                    <p className={styles.nightsCount}>{nights} {nights === 1 ? 'night' : 'nights'}</p>
                  </section>

                  <section className={styles.section}>
                    <h3>Guest</h3>
                    <p className={styles.guestName}>
                      {guestDetails.firstName} {guestDetails.lastName}
                    </p>
                    <p className={styles.guestContact}>{guestDetails.email}</p>
                  </section>

                  <section className={styles.section}>
                    <h3>Payment Method</h3>
                    <p className={styles.paymentSelected}>
                      {PAYMENT_METHODS.find((m) => m.id === selectedPayment)?.name}
                    </p>
                  </section>

                  <div className={styles.cancelationPolicy}>
                    <h3>Cancellation Policy</h3>
                    <p>Free cancellation up to 48 hours before check-in. After that, charges will apply.</p>
                  </div>
                </div>

                <div className={styles.buttonGroup}>
                  <Button onClick={handlePrevStep} variant="secondary">
                    Back
                  </Button>
                  <Button onClick={handleConfirmBooking} disabled={isProcessing}>
                    {isProcessing ? 'Processing...' : 'Confirm Booking'}
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Order Summary */}
          <aside className={styles.sidebar}>
            <div className={styles.orderSummary}>
              <h3>Order Summary</h3>

              <div className={styles.hostelCard}>
                <img src={hostel.image} alt={hostel.name} className={styles.hostelImage} />
                <div className={styles.hostelCardContent}>
                  <h4>{hostel.name}</h4>
                  <p>{hostel.location}</p>
                </div>
              </div>

              <div className={styles.summaryRow}>
                <span>PKR {hostel.price.toLocaleString()} × {nights} {nights === 1 ? 'night' : 'nights'}</span>
                <span>PKR {(hostel.price * nights).toLocaleString()}</span>
              </div>

              <div className={styles.summaryRow}>
                <span>Service Fee</span>
                <span>PKR 0</span>
              </div>

              <div className={styles.summaryRow}>
                <span>Tax</span>
                <span>PKR 0</span>
              </div>

              <div className={styles.summaryDivider} />

              <div className={styles.summaryTotal}>
                <span>Total</span>
                <span className={styles.totalAmount}>PKR {totalPrice.toLocaleString()}</span>
              </div>

              <div className={styles.trustBadges}>
                <div className={styles.badge}>✓ Secure Payment</div>
                <div className={styles.badge}>✓ No Hidden Charges</div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div style={{ padding: '2rem', textAlign: 'center' }}>Loading...</div>}>
      <CheckoutContent />
    </Suspense>
  )
}
