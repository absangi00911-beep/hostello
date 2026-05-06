'use client';

import React from 'react';
import { BUTTON_STYLES, FOCUS_RINGS, HOVER_EFFECTS } from '@/lib/styling-constants';

// ===== PRIMARY BUTTON =====
interface PrimaryButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  isLoading?: boolean;
}

export const PrimaryButton = React.forwardRef<HTMLButtonElement, PrimaryButtonProps>(
  ({ children, isLoading, disabled, className, ...props }, ref) => (
    <button
      ref={ref}
      disabled={disabled || isLoading}
      className={`${BUTTON_STYLES.primary} ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className || ''}`}
      {...props}
    >
      {isLoading ? <span className="opacity-50">Loading...</span> : children}
    </button>
  )
);
PrimaryButton.displayName = 'PrimaryButton';

// ===== SECONDARY BUTTON =====
interface SecondaryButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
}

export const SecondaryButton = React.forwardRef<HTMLButtonElement, SecondaryButtonProps>(
  ({ children, disabled, className, ...props }, ref) => (
    <button
      ref={ref}
      disabled={disabled}
      className={`${BUTTON_STYLES.secondary} ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className || ''}`}
      {...props}
    >
      {children}
    </button>
  )
);
SecondaryButton.displayName = 'SecondaryButton';

// ===== GHOST BUTTON =====
interface GhostButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
}

export const GhostButton = React.forwardRef<HTMLButtonElement, GhostButtonProps>(
  ({ children, disabled, className, ...props }, ref) => (
    <button
      ref={ref}
      disabled={disabled}
      className={`${BUTTON_STYLES.ghost} ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className || ''}`}
      {...props}
    >
      {children}
    </button>
  )
);
GhostButton.displayName = 'GhostButton';

// ===== ICON BUTTON =====
interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: React.ReactNode;
  label?: string;
}

export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ icon, label, disabled, className, ...props }, ref) => (
    <button
      ref={ref}
      aria-label={label}
      disabled={disabled}
      className={`${BUTTON_STYLES.icon} ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className || ''}`}
      {...props}
    >
      <span aria-hidden="true">{icon}</span>
    </button>
  )
);
IconButton.displayName = 'IconButton';

// ===== LINK BUTTON (tertiary style) =====
interface LinkButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  underline?: boolean;
}

export const LinkButton = React.forwardRef<HTMLButtonElement, LinkButtonProps>(
  ({ children, underline = true, disabled, className, ...props }, ref) => (
    <button
      ref={ref}
      disabled={disabled}
      className={`${BUTTON_STYLES.tertiary} ${underline ? 'underline underline-offset-2' : ''} ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className || ''}`}
      {...props}
    >
      {children}
    </button>
  )
);
LinkButton.displayName = 'LinkButton';

export default {
  PrimaryButton,
  SecondaryButton,
  GhostButton,
  IconButton,
  LinkButton,
};
