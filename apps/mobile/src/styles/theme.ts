export const colors = {
  // Background
  background: '#FAFAFA',
  foreground: '#1A1A1A',

  // Card
  card: '#FFFFFF',
  cardForeground: '#1A1A1A',

  // Popover
  popover: '#FFFFFF',
  popoverForeground: '#1A1A1A',

  // Primary
  primary: '#C8E77A',
  primaryForeground: '#1A1A1A',

  // Secondary
  secondary: '#56B280',
  secondaryForeground: '#FFFFFF',

  // Muted
  muted: '#F3F4F6',
  mutedForeground: '#6B7280',

  // Accent
  accent: '#C8E77A',
  accentForeground: '#1A1A1A',

  // Destructive
  destructive: '#EF4444',
  destructiveForeground: '#FFFFFF',

  // Border & Input
  border: 'rgba(0, 0, 0, 0.06)',
  input: 'rgba(0, 0, 0, 0.08)',
  inputBackground: '#FFFFFF',
  switchBackground: '#E5E7EB',

  // Ring (Focus)
  ring: '#C8E77A',

  // Charts
  chart1: '#C8E77A',
  chart2: '#56B280',
  chart3: '#6B7280',
  chart4: '#FFFFFF',
  chart5: '#F3F4F6',
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
