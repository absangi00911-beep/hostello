/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./apps/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Brand
        primary:        'var(--color-primary)',
        'primary-dark': 'var(--color-primary-dark)',
        'primary-deep': 'var(--color-primary-deep)',
        'primary-light':'var(--color-primary-light)',
        'primary-faint':'var(--color-primary-faint)',
        action:         'var(--color-action)',
        'action-dark':    'var(--color-action-dark)',
        'action-pressed': 'var(--color-action-pressed)',
        'action-light':   'var(--color-action-light)',

        // Backgrounds
        'bg-page':    'var(--color-bg-page)',
        'bg-card':    'var(--color-bg-card)',
        'bg-overlay': 'var(--color-bg-overlay)',

        // Text
        'text-heading':     'var(--color-text-heading)',
        'text-body':        'var(--color-text-body)',
        'text-muted':       'var(--color-text-muted)',
        'text-placeholder': 'var(--color-text-placeholder)',
        'text-inverse':     'var(--color-text-inverse)',

        // Borders
        'border-default': 'var(--color-border-default)',
        'border-subtle':  'var(--color-border-subtle)',
        'border-strong':  'var(--color-border-strong)',

        // Semantic
        error:          'var(--color-error)',
        'error-bg':     'var(--color-error-bg)',
        'error-text':   'var(--color-error-text)',
        success:        'var(--color-success)',
        'success-bg':   'var(--color-success-bg)',
        'success-text': 'var(--color-success-text)',
        warning:        'var(--color-warning)',
        'warning-bg':   'var(--color-warning-bg)',
        'warning-text': 'var(--color-warning-text)',
      },
      borderRadius: {
        sm:   'var(--radius-sm)',
        md:   'var(--radius-md)',
        lg:   'var(--radius-lg)',
        xl:   'var(--radius-xl)',
        full: 'var(--radius-full)',
      },
      fontFamily: {
        heading: ['var(--font-heading)', 'serif'],
        body:    ['var(--font-body)', 'sans-serif'],
      },
      boxShadow: {
        xs:       'var(--shadow-xs)',
        sm:       'var(--shadow-sm)',
        md:       'var(--shadow-md)',
        lg:       'var(--shadow-lg)',
        xl:       'var(--shadow-xl)',
      },
    },
  },
  plugins: [],
}