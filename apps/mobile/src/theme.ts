/**
 * HostelLo Design System — Mobile
 *
 * All values are derived from DESIGN_MOBILE.md.
 * Import from this file; never hard-code colors or sizes directly in screens.
 *
 * Color strategy:
 *   - Amber gold (#C28B1A)  →  brand identity, active states
 *   - Forest green (#2A6545) →  primary actions (Book Now, Confirm, Pay)
 *   - Warm off-whites        →  backgrounds
 *   - Warm dark browns       →  text
 */

// ---------------------------------------------------------------------------
// Colors
// ---------------------------------------------------------------------------

export const colors = {
  // Brand
  primary: '#C28B1A',
  primaryDark: '#9E6F0E',
  primaryDeep: '#7A5308',
  primaryLight: '#F5DFA3',
  primaryFaint: '#FDF3DC',

  // CTA / action — forest green (complementary to amber on the hue wheel)
  action: '#2A6545',
  actionDark: '#1F5035',
  actionPressed: '#173D28',
  actionLight: '#D3EDE1',

  // Backgrounds
  bgPage: '#FDF8F0',
  bgCard: '#FEFCF8',
  bgTabBar: '#FEFCF8',
  bgRaised: '#FAF5EC',
  bgOverlay: '#F3EBD9',

  // Text
  textHeading: '#2A2318',
  textBody: '#4A3C2C',
  textMuted: '#857060',
  textPlaceholder: '#B0A090',
  textDisabled: '#CABFB0',
  textInverse: '#F9F5EE',
  textLink: '#7A5308',

  // Borders & dividers
  borderDefault: '#E0D4C0',
  borderStrong: '#BEA888',
  borderSubtle: '#EDE6D9',

  // Semantic
  success: '#2A7A50',
  successBg: '#E8F5EF',
  successText: '#1A5C38',
  warning: '#C4900A',
  warningBg: '#FEF6E0',
  warningText: '#8A6000',
  error: '#C43B28',
  errorBg: '#FEEEED',
  errorText: '#8C2A1A',
  info: '#3B6E9E',
  infoBg: '#EEF3FB',
  infoText: '#284E70',
} as const;

// Dark mode equivalents (apply via useColorScheme if you add dark-mode support)
export const darkColors = {
  primary: '#D4A030',
  action: '#38885E',
  bgPage: '#1C1710',
  bgCard: '#241E14',
  bgTabBar: '#1A1510',
  bgRaised: '#2C2519',
  textHeading: '#EDE5D8',
  textBody: '#C8BAA8',
  textMuted: '#8A7B6A',
  borderDefault: '#3A3025',
} as const;

// ---------------------------------------------------------------------------
// Typography
// ---------------------------------------------------------------------------

/**
 * Font families — loaded by useFonts() in src/hooks/useFonts.ts.
 * React Native falls back to the system font if a family hasn't loaded yet,
 * so components remain crash-free during the first render.
 *
 *   Bricolage Grotesque  →  all headings, screen titles, hostel names
 *   DM Sans              →  body copy, labels, form text
 *   JetBrains Mono       →  booking reference IDs and OTP codes only
 */
export const fontFamily = {
  heading: 'BricolageGrotesque_700Bold',
  headingSemi: 'BricolageGrotesque_600SemiBold',
  body: 'DMSans_400Regular',
  bodyMedium: 'DMSans_500Medium',
  bodyBold: 'DMSans_700Bold',
  mono: 'JetBrainsMono_400Regular',
} as const;

/** Type scale in sp (Android) / pt (iOS). Base: 16 = 1rem equivalent. */
export const fontSize = {
  display: 36,
  h1: 28,
  h2: 22,
  h3: 18,
  h4: 16,
  h5: 15,
  bodyLg: 16,
  body: 14,
  bodySm: 13,
  caption: 12,
} as const;

export const fontWeight = {
  regular: '400' as const,
  medium: '500' as const,
  semiBold: '600' as const,
  bold: '700' as const,
  extraBold: '800' as const,
};

export const lineHeight = {
  tight: 1.05,
  snug: 1.15,
  normal: 1.30,
  relaxed: 1.65,
} as const;

// ---------------------------------------------------------------------------
// Spacing
// ---------------------------------------------------------------------------

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  xxxxl: 48,
} as const;

// ---------------------------------------------------------------------------
// Border radius
// ---------------------------------------------------------------------------

export const radius = {
  sm: 6,
  md: 10,
  lg: 14,
  xl: 20,
  full: 9999,
} as const;

// ---------------------------------------------------------------------------
// Shadows
// ---------------------------------------------------------------------------

export const shadow = {
  card: {
    shadowColor: '#2A2318',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  elevated: {
    shadowColor: '#2A2318',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  tabBar: {
    shadowColor: '#2A2318',
    shadowOffset: { width: 0, height: -1 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 8,
  },
} as const;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Format a number as PKR currency: Rs. 12,500 */
export function formatPKR(amount: number): string {
  return `Rs. ${amount.toLocaleString('en-PK')}`;
}
