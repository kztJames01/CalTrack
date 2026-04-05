export const colors = {
  // Background
  background: '#F6F2E8',
  foreground: '#253238',

  // Card
  card: '#FFFCF5',
  cardForeground: '#253238',

  // Popover
  popover: '#FFFCF5',
  popoverForeground: '#253238',

  // Primary
  primary: '#D9A36A',
  primaryForeground: '#FFFFFF',

  // Secondary
  secondary: '#0C6A73',
  secondaryForeground: '#FFFFFF',

  // Muted
  muted: '#EFE7D8',
  mutedForeground: '#6F7A80',

  // Accent
  accent: '#E7C29A',
  accentForeground: '#253238',

  // Destructive
  destructive: '#EF4444',
  destructiveForeground: '#FFFFFF',

  // Border & Input
  border: 'rgba(37, 50, 56, 0.14)',
  input: 'rgba(12, 106, 115, 0.14)',
  inputBackground: '#FFFCF5',
  switchBackground: '#DFD3BE',

  // Ring (Focus)
  ring: '#0C6A73',

  // Charts
  chart1: '#0C6A73',
  chart2: '#D9A36A',
  chart3: '#6F7A80',
  chart4: '#FFFCF5',
  chart5: '#EFE7D8',
} as const;

export const typography = {
  fontSize: {
    base: 16,
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
  },
  fontWeight: {
    normal: '400' as const,
    medium: '600' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  '2xl': 48,
} as const;

export const borderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 9999,
} as const;

export const theme = {
  colors,
  typography,
  spacing,
  borderRadius,
} as const;

export type Theme = typeof theme;
