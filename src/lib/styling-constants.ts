/**
 * Standardized styling constants for consistent UI patterns across components
 * These patterns ensure uniformity in button interactions, form inputs, and focus states
 */

// ===== BUTTON STYLES =====
export const BUTTON_STYLES = {
  // Primary action button (filled background)
  primary: 'bg-primary-container text-on-primary font-label text-label px-space-4 py-2 rounded transition-all duration-200 hover:scale-[0.98] active:scale-[0.95] focus:outline-none focus:ring-2 focus:ring-primary-light/50 shadow-sm',
  
  // Secondary button (outlined border)
  secondary: 'border border-border-strong text-text-heading font-label text-label px-space-4 py-2 rounded-md hover:bg-surface-container hover:border-outline transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary-light/50',
  
  // Tertiary button (minimal, text only)
  tertiary: 'text-text-muted hover:text-text-heading font-label text-label px-space-3 py-2 rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary-light/50',
  
  // Icon-only button (small, rounded)
  icon: 'text-text-muted hover:text-text-heading hover:bg-surface-container transition-colors duration-200 p-2 rounded-full focus:outline-none focus:ring-2 focus:ring-primary-light/50',
  
  // Ghost button (no background, minimal styling)
  ghost: 'text-text-body hover:bg-surface-variant transition-colors duration-200 px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-primary-light/50',
} as const;

// ===== INPUT STYLES =====
export const INPUT_STYLES = {
  // Standard text input
  text: 'w-full bg-bg-card border border-border-default rounded px-3 py-2 text-text-body font-body-default placeholder:text-text-placeholder focus:outline-none focus:ring-2 focus:ring-primary-container/50 focus:border-primary-container transition-colors duration-200',
  
  // Input with error state
  error: 'w-full bg-error-container border border-error rounded px-3 py-2 text-error font-body-default focus:outline-none focus:ring-2 focus:ring-error/50 transition-colors duration-200',
  
  // Number input (monetary values)
  number: 'w-full bg-bg-card border border-border-default rounded px-3 py-2 text-text-body font-body-default placeholder:text-text-placeholder focus:outline-none focus:ring-2 focus:ring-primary-container/50 focus:border-primary-container transition-colors duration-200',
  
  // Small search input
  search: 'w-full bg-transparent border-none focus:ring-0 text-text-body font-body-default px-3 h-full rounded-r-full outline-none placeholder:text-text-placeholder',
} as const;

// ===== FORM CONTROL STYLES =====
export const FORM_STYLES = {
  // Checkbox styling
  checkbox: 'w-4 h-4 text-primary-container border-border-strong rounded focus:ring-2 focus:ring-primary-container/50 bg-bg-card cursor-pointer',
  
  // Radio button styling
  radio: 'w-4 h-4 text-primary-container border-border-strong focus:ring-2 focus:ring-primary-container/50 bg-bg-card cursor-pointer',
  
  // Select/dropdown styling
  select: 'w-full bg-bg-card border border-border-default rounded px-3 py-2 text-text-body font-body-default focus:outline-none focus:ring-2 focus:ring-primary-container/50 focus:border-primary-container transition-colors duration-200 cursor-pointer',
  
  // Textarea styling
  textarea: 'w-full bg-bg-card border border-border-default rounded px-3 py-2 text-text-body font-body-default placeholder:text-text-placeholder focus:outline-none focus:ring-2 focus:ring-primary-container/50 focus:border-primary-container transition-colors duration-200 resize-none',
} as const;

// ===== FOCUS RING STYLES =====
export const FOCUS_RINGS = {
  // Standard focus ring (primary color)
  primary: 'focus:outline-none focus:ring-2 focus:ring-primary-container/50',
  
  // Minimal focus ring (subtle)
  subtle: 'focus:outline-none focus:ring-1 focus:ring-primary-container/30',
  
  // Prominent focus ring (high contrast)
  prominent: 'focus:outline-none focus:ring-2 focus:ring-2 focus:ring-offset-2 focus:ring-primary-container',
  
  // Error focus ring
  error: 'focus:outline-none focus:ring-2 focus:ring-error/50',
} as const;

// ===== TRANSITION STYLES =====
export const TRANSITIONS = {
  // Standard interaction transition
  standard: 'transition-all duration-200',
  
  // Quick transition
  quick: 'transition-all duration-100',
  
  // Smooth transition
  smooth: 'transition-all duration-300',
  
  // No transition
  none: 'transition-none',
} as const;

// ===== HOVER EFFECTS =====
export const HOVER_EFFECTS = {
  // Scale down effect (button press feel)
  scale: 'hover:scale-[0.98] active:scale-[0.95]',
  
  // Lift effect (translate up)
  lift: 'hover:-translate-y-1 active:translate-y-0',
  
  // Shadow increase
  shadow: 'hover:shadow-md active:shadow-sm',
  
  // Color change only
  color: 'hover:opacity-80',
} as const;

// ===== UTILITY CLASSES =====
export const UTILITY = {
  // Smooth scroll behavior
  smoothScroll: 'scroll-smooth',
  
  // Line clamping
  lineClamping: {
    single: 'line-clamp-1',
    double: 'line-clamp-2',
    triple: 'line-clamp-3',
  },
  
  // Disabled state
  disabled: 'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none',
} as const;

export default {
  BUTTON_STYLES,
  INPUT_STYLES,
  FORM_STYLES,
  FOCUS_RINGS,
  TRANSITIONS,
  HOVER_EFFECTS,
  UTILITY,
};
