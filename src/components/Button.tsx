'use client'

import styles from './Button.module.css'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode
  variant?: 'primary' | 'secondary' | 'tertiary'
  disabled?: boolean
  fullWidth?: boolean
}

export default function Button({ 
  children, 
  variant = 'primary', 
  disabled = false,
  fullWidth = false,
  className,
  ...props 
}: ButtonProps) {
  const classes = `${styles.button} ${styles[variant]} ${disabled ? styles.disabled : ''} ${fullWidth ? styles.fullWidth : ''} ${className || ''}`
  
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
