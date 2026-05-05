import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Primary
        'primary': '#7e5700',
        'primary-light': '#F5DFA3',
        'primary-dark': '#9E6F0E',
        'primary-deep': '#7A5308',
        'primary-container': '#c28b1a',
        'primary-fixed': '#ffdeab',
        'primary-fixed-dim': '#fabc4b',
        'primary-faint': '#FDF3DC',
        'on-primary': '#ffffff',
        'on-primary-fixed': '#281900',
        'on-primary-fixed-variant': '#5f4100',
        'on-primary-container': '#3f2a00',
        'inverse-primary': '#fabc4b',

        // Secondary
        'secondary': '#2f6949',
        'secondary-container': '#b2f1c7',
        'secondary-fixed': '#b2f1c7',
        'secondary-fixed-dim': '#97d4ac',
        'on-secondary': '#ffffff',
        'on-secondary-container': '#35704f',
        'on-secondary-fixed': '#002111',
        'on-secondary-fixed-variant': '#125133',

        // Tertiary
        'tertiary': '#0062a1',
        'tertiary-container': '#5499dd',
        'tertiary-fixed': '#d1e4ff',
        'tertiary-fixed-dim': '#9dcaff',
        'on-tertiary': '#ffffff',
        'on-tertiary-container': '#002f52',
        'on-tertiary-fixed': '#001d35',
        'on-tertiary-fixed-variant': '#00497b',

        // Status Colors
        'error': '#C43B28',
        'error-container': '#ffdad6',
        'on-error': '#ffffff',
        'on-error-container': '#93000a',
        'success': '#2A7A50',
        'warning': '#C4900A',
        'info': '#3B6E9E',

        // Surface
        'surface': '#fff8f3',
        'surface-dim': '#e3d8cc',
        'surface-bright': '#fff8f3',
        'surface-container': '#f8ecdf',
        'surface-container-low': '#fef2e5',
        'surface-container-high': '#f2e6da',
        'surface-container-highest': '#ece1d4',
        'on-surface': '#201b13',
        'on-surface-variant': '#504535',
        'inverse-surface': '#352f27',
        'inverse-on-surface': '#fbefe2',
        'surface-tint': '#7e5700',
        'surface-variant': '#ece1d4',

        // Background
        'background': '#fff8f3',
        'on-background': '#201b13',
        'bg-page': '#FDF8F0',
        'bg-card': '#FEFCF8',
        'bg-raised': '#FAF5EC',
        'bg-sidebar': '#F5EFE3',
        'bg-overlay': '#F3EBD9',

        // Text
        'text-heading': '#2A2318',
        'text-body': '#4A3C2C',
        'text-muted': '#857060',
        'text-placeholder': '#B0A090',

        // Borders
        'border-default': '#E0D4C0',
        'border-strong': '#BEA888',

        // Outline
        'outline': '#827563',
        'outline-variant': '#d4c4af',

        // Action
        'action': '#2A6545',
        'action-light': '#D3EDE1',
        'action-dark': '#1F5035',
        'action-pressed': '#173D28',
      },

      spacing: {
        'space-1': '4px',
        'space-2': '8px',
        'space-3': '12px',
        'space-4': '16px',
        'space-5': '20px',
        'space-6': '24px',
        'space-8': '32px',
        'space-12': '48px',
        'space-16': '64px',
        'space-24': '96px',
        'base': '4px',
      },

      borderRadius: {
        'DEFAULT': '0.25rem',
        'lg': '0.5rem',
        'xl': '0.75rem',
        'full': '9999px',
      },

      fontFamily: {
        'body-default': ['var(--font-plus-jakarta-sans)', 'sans-serif'],
        'body-lg': ['var(--font-plus-jakarta-sans)', 'sans-serif'],
        'h1': ['var(--font-be-vietnam-pro)', 'sans-serif'],
        'h2': ['var(--font-be-vietnam-pro)', 'sans-serif'],
        'h3': ['var(--font-plus-jakarta-sans)', 'sans-serif'],
        'label': ['var(--font-plus-jakarta-sans)', 'sans-serif'],
        'overline': ['var(--font-plus-jakarta-sans)', 'sans-serif'],
        'display': ['var(--font-be-vietnam-pro)', 'sans-serif'],
      },

      fontSize: {
        'display': ['3.5rem', { lineHeight: '1.05', letterSpacing: '-0.03em', fontWeight: '800' }],
        'h1': ['2.5rem', { lineHeight: '1.10', letterSpacing: '-0.025em', fontWeight: '700' }],
        'h2': ['2rem', { lineHeight: '1.15', letterSpacing: '-0.02em', fontWeight: '700' }],
        'h3': ['1.5rem', { lineHeight: '1.20', letterSpacing: '-0.015em', fontWeight: '600' }],
        'body-lg': ['1.125rem', { lineHeight: '1.65', fontWeight: '400' }],
        'body-default': ['0.9375rem', { lineHeight: '1.65', fontWeight: '400' }],
        'label': ['0.8125rem', { lineHeight: '1.40', letterSpacing: '0.01em', fontWeight: '500' }],
        'overline': ['0.6875rem', { lineHeight: '1.50', letterSpacing: '0.10em', fontWeight: '600' }],
      },

      scale: {
        '97': '0.97',
      },

      boxShadow: {
        'sm': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
      },
    },
  },
  plugins: [require('@tailwindcss/forms')],
};

export default config;
