'use client'

import styles from './Button.module.css'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode
  variant?: 'primary' | 'secondary' | 'tertiary'
  disabled?: boolean
}

export default function Button({ 
  children, 
  variant = 'primary', 
  disabled = false,
  className,
  ...props 
}: ButtonProps) {
  const classes = `${styles.button} ${styles[variant]} ${disabled ? styles.disabled : ''} ${className || ''}`
  
  return (
    <button 
      className={classes}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  )
}
